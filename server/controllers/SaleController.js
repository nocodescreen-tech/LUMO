const { Sale, Product, Client, Notification } = require('../models');
const { validateSale } = require('../middleware/validators');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const { getPagination, getPagingData } = require('../utils/pagination');

exports.getSales = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const { page, limit, startDate, endDate, clientId, minMontant, maxMontant } = req.query;
    const { limit: l, offset } = getPagination(page, limit);

    const where = { userId };

    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    if (clientId) {
      where.clientId = clientId;
    }
    if (minMontant || maxMontant) {
      where.montantTotal = {};
      if (minMontant) where.montantTotal[Op.gte] = parseFloat(minMontant);
      if (maxMontant) where.montantTotal[Op.lte] = parseFloat(maxMontant);
    }

    const data = await Sale.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'client' },
        { model: require('../models').User, as: 'vendeur', attributes: ['nom'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: l,
      offset,
    });

    const response = getPagingData(data, page, l);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, response, 'Ventes récupérées');
  } catch (error) {
    next(error);
  }
};


exports.createSale = async (req, res, next) => {
  const { error } = validateSale(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  let transaction;
  try {
    const userId = req.user.tenantId;
    const { 
      items, 
      montantTotal, 
      methodePaiement, 
      clientId, 
      clientInfo,
      devise,
      tauxChange,
      devisePaiement,
      montantRecu
    } = req.body;

    transaction = await sequelize.transaction();

    // Mise à jour de la session de caisse active
    const { CashSession } = require('../models');
    const activeSession = await CashSession.findOne({ 
      where: { userId, status: 'OPEN' } 
    });

    if (activeSession) {
      activeSession.totalSales = Number(activeSession.totalSales || 0) + Number(montantTotal);
      activeSession.expectedBalance = Number(activeSession.expectedBalance || 0) + Number(montantTotal);
      await activeSession.save({ transaction });
    }

    // Optimisation N+1 : Récupérer tous les produits concernés en une seule requête
    const productIds = items.map(item => item.id);
    const products = await Product.findAll({ where: { id: productIds }, transaction });
    const productMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

    // Déduction du stock et notifications
    for (const item of items) {
      const product = productMap[item.id];
      if (product) {
        product.stockUpdateRaison = 'Vente';
        product.stock -= item.quantite;
        await product.save({ transaction });

        // Les notifications de stock sont gérées automatiquement par les hooks du modèle Product
      }
    }
    // ... (logic for profitNet and client resolution remains same)
    let profitNet = 0;
    const articles = Array.isArray(items)
      ? items.map((item) => {
          const quantite = item.quantite || 1;
          const prixUnitaire = item.prix || 0;
          const prixAchat = item.prixAchat || 0;
          profitNet += (prixUnitaire - prixAchat) * quantite;
          
          return {
            id: item.id,
            nom: item.nom,
            prixUnitaire,
            quantite,
            prixAchat,
          };
        })
      : [];
      
    const remise = req.body.remise || 0;
    profitNet -= remise;

    // (Client resolution logic omitted for brevity in this chunk but kept in file)
    let resolvedClientId = clientId || null;
    if (!resolvedClientId && clientInfo && clientInfo.nom && clientInfo.nom.trim() !== 'Client de passage') {
      const trimmedNom = clientInfo.nom.trim();
      const trimmedPhone = clientInfo.telephone?.trim();
      let existingClient = null;
      if (trimmedPhone) {
        existingClient = await Client.findOne({ where: { telephone: trimmedPhone, userId }, transaction });
      }
      if (!existingClient) {
        existingClient = await Client.findOne({ where: { nom: trimmedNom, userId }, transaction });
      }
      if (existingClient) {
        resolvedClientId = existingClient.id;
      } else {
        const newClient = await Client.create({
          nom: trimmedNom,
          telephone: trimmedPhone || '',
          email: clientInfo.email?.trim() || '',
          userId
        }, { transaction });
        resolvedClientId = newClient.id;
      }
    }

    const isCredit = (methodePaiement && (
      methodePaiement.toLowerCase().includes('crédit') || 
      methodePaiement.toLowerCase().includes('credit') ||
      methodePaiement.toLowerCase() === 'dette'
    )) || req.body.statut === 'Dette' || req.body.statut === 'Crédit';
    
    // M4 Fix: Normalize debt amount to the shop's base currency
    if (resolvedClientId && isCredit) {
      const dbClient = await Client.findByPk(resolvedClientId);
      const owner = await require('../models/User').findByPk(userId);
      const shopCurrency = owner?.entreprise?.devise || 'CDF';
      
      let amountToAdd = Number(montantTotal - remise);
      const effectiveDevise = devise || 'USD';
      
      // If sale currency differs from shop currency, convert it
      if (effectiveDevise !== shopCurrency) {
        const rate = Number(tauxChange || owner?.preferences?.exchangeRate || 2800);
        if (devise === 'USD' && shopCurrency === 'CDF') {
          amountToAdd = Math.round(amountToAdd * rate);
        } else if (devise === 'CDF' && shopCurrency === 'USD') {
          amountToAdd = Math.round((amountToAdd / rate) * 100) / 100;
        }
      }

      if (dbClient) {
        dbClient.detteTotale = Number(dbClient.detteTotale || 0) + amountToAdd;
        await dbClient.save({ transaction });
      }
    }

    const owner = await require('../models/User').findByPk(userId);
    const finalRate = Number(tauxChange || owner?.preferences?.exchangeRate || 2800);

    const sale = await Sale.create({
      userId,
      clientId: resolvedClientId,
      articles,
      montantTotal,
      remise,
      profitNet,
      methodePaiement: methodePaiement || 'Espèces',
      clientInfo: clientInfo || { nom: 'Client de passage', email: '' },
      devise: devise || 'USD',
      tauxChange: finalRate,
      devisePaiement: devisePaiement || devise || 'USD',
      montantRecu: montantRecu || montantTotal,
      sellerId: req.user.id
    }, { transaction });

    await transaction.commit();
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 201, sale, 'Vente enregistrée avec succès');
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

exports.deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: "Vente non trouvée" });
    }

    // Sécurité : seul le propriétaire (admin) ou le superadmin peut supprimer
    if (sale.userId !== req.user.tenantId && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Accès refusé : cette vente ne vous appartient pas' });
    }

    // Restitution du stock optimisée
    if (sale.statut !== 'Remboursée' && sale.articles && Array.isArray(sale.articles)) {
      const productIds = sale.articles.map(item => item.id);
      const products = await Product.findAll({ where: { id: productIds } });
      
      for (const item of sale.articles) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          product.stockUpdateRaison = 'Suppression Vente';
          product.stock += item.quantite;
          await product.save();
        }
      }
    }

    // Restitution de la dette client si applicable
    const isCredit = (sale.methodePaiement && (
      sale.methodePaiement.toLowerCase().includes('crédit') || 
      sale.methodePaiement.toLowerCase().includes('credit')
    )) || sale.statut === 'Dette';

    if (sale.clientId && isCredit && sale.statut !== 'Remboursée') {
        const client = await Client.findByPk(sale.clientId);
        if (client) {
            client.detteTotale = Math.max(0, Number(client.detteTotale || 0) - Number(sale.montantTotal - (sale.remise || 0)));
            await client.save();
        }
    }

    await sale.destroy();
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, null, 'Vente supprimée avec succès');
  } catch (error) {
    next(error);
  }
};


exports.deleteAllSales = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const transaction = await sequelize.transaction();

    try {
      const sales = await Sale.findAll({ where: { userId }, transaction });
      
      // Accumuler les mouvements de stock pour tous les produits
      const stockAdjustments = {}; // productId -> adjustmentAmount

      for (const sale of sales) {
        if (sale.statut !== 'Remboursée' && sale.articles && Array.isArray(sale.articles)) {
          for (const item of sale.articles) {
            stockAdjustments[item.id] = (stockAdjustments[item.id] || 0) + item.quantite;
          }
        }
      }

      // Appliquer les ajustements en masse
      const affectedProductIds = Object.keys(stockAdjustments);
      if (affectedProductIds.length > 0) {
        const products = await Product.findAll({ where: { id: affectedProductIds }, transaction });
        for (const product of products) {
          product.stockUpdateRaison = 'Suppression Masse';
          product.stock += stockAdjustments[product.id];
          await product.save({ transaction });
        }
      }

      await Sale.destroy({ where: { userId }, transaction });
      
      // Enregistrer l'activité globale
      const { Activite, User } = require('../models');
      if (Activite) {
          const user = await User.findByPk(userId, { transaction });
          await Activite.create({
              type: 'PURGE_HISTORIQUE',
              description: `Purge complète de l'historique des ventes par l'utilisateur.`,
              userNom: user ? user.nom : 'Utilisateur',
              module: 'Caisse',
              UserId: userId,
              shopId: userId
          }, { transaction });
      }

      await transaction.commit();
      const { sendResponse } = require('../utils/response');
      sendResponse(res, 200, null, 'Historique des ventes vidé et stocks restitués');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

exports.updateSale = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const sale = await Sale.findOne({ where: { id: req.params.id, userId } });
    if (!sale) return res.status(404).json({ message: 'Vente non trouvée' });
    
    // Pour une mise à jour simple sans recalcul de stock
    await sale.update(req.body);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, sale, 'Vente mise à jour');
  } catch (error) {
    next(error);
  }
};

exports.refundSale = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const sale = await Sale.findOne({ where: { id: req.params.id, userId } });
    if (!sale) return res.status(404).json({ message: 'Vente non trouvée' });
    
    if (sale.statut === 'Remboursée') {
      return res.status(400).json({ message: 'Vente déjà remboursée' });
    }
    
    // Restitution du stock
    if (sale.articles && Array.isArray(sale.articles)) {
      for (const item of sale.articles) {
        const product = await Product.findByPk(item.id);
        if (product) {
          product.stockUpdateRaison = 'Remboursement Vente';
          product.stock += item.quantite;
          await product.save();
        }
      }
    }
    
    // Restitution de la dette client si applicable
    const isCredit = (sale.methodePaiement && (
      sale.methodePaiement.toLowerCase().includes('crédit') || 
      sale.methodePaiement.toLowerCase().includes('credit')
    )) || sale.statut === 'Dette';

    if (sale.clientId && isCredit) {
        const client = await Client.findByPk(sale.clientId);
        if (client) {
            client.detteTotale = Math.max(0, Number(client.detteTotale || 0) - Number(sale.montantTotal - (sale.remise || 0)));
            await client.save();
        }
    }
    
    sale.statut = 'Remboursée';
    await sale.save();
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, sale, 'Vente remboursée et stock restitué');
  } catch (error) {
    next(error);
  }
};
