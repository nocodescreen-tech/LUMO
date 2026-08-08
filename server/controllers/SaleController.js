const { Sale, Product, Client, Notification } = require('../models');
const { validateSale } = require('../middleware/validators');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const { logActivite } = require('./activiteController');
const { convertCurrency } = require('../utils/currency');
const { getPagination, getPagingData } = require('../utils/pagination');
const { invalidateCache } = require('../utils/cache');
const REFUNDED_STATUSES = ['Remboursee', 'Remboursée'];
const isRefundedStatus = (status = '') =>
  REFUNDED_STATUSES.includes(String(status)) || String(status).toLowerCase().includes('rembours');
const normalizeCurrency = (currency) => {
  const normalized = String(currency || '').toUpperCase();
  if (normalized === 'FC') return 'CDF';
  return normalized === 'USD' ? 'USD' : 'CDF';
};

const safeParseArticles = (articles) => {
  if (Array.isArray(articles)) return articles;
  if (typeof articles === 'string') {
    try {
      const parsed = JSON.parse(articles);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
};


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
      devisePaiement,
      montantRecu
    } = req.body;

    transaction = await sequelize.transaction();

    // Récupérer le propriétaire pour la devise et le taux de change
    const ownerId = req.user.parentId || userId;
    const owner = await require('../models/User').findByPk(ownerId, { transaction });
    const shopCurrency = normalizeCurrency(owner?.entreprise?.devise);
    const saleCurrency = devise || 'USD';
    const finalRate = Number(owner?.preferences?.exchangeRate) || 2250;
    if (!Number.isFinite(finalRate) || finalRate <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Taux de change invalide. Configurez le taux dans Paramètres avant d'enregistrer une vente."
      });
    }

    // Mise à jour de la session de caisse active
    const { CashSession } = require('../models');
    const activeSession = await CashSession.findOne({ 
      where: { userId, status: 'OPEN' } 
    });

    if (activeSession) {
      // Normaliser le montant de la vente dans la devise de la caisse avant de l'accumuler
      let saleAmountInShopCurrency = Number(montantTotal);
      if (saleCurrency !== shopCurrency) {
        if (saleCurrency === 'USD' && shopCurrency === 'CDF') {
          saleAmountInShopCurrency = Math.round(saleAmountInShopCurrency * finalRate);
        } else if (saleCurrency === 'CDF' && shopCurrency === 'USD') {
          saleAmountInShopCurrency = Math.round((saleAmountInShopCurrency / finalRate) * 100) / 100;
        }
      }
      activeSession.totalSales = Number(activeSession.totalSales || 0) + saleAmountInShopCurrency;
      activeSession.expectedBalance = Number(activeSession.expectedBalance || 0) + saleAmountInShopCurrency;
      await activeSession.save({ transaction });
    }

    // Optimisation N+1 : Récupérer tous les produits concernés en une seule requête
    const productIds = items.map(item => item.id);
    const products = await Product.findAll({ where: { id: productIds }, transaction });
    const productMap = {};
    for (const p of products) {
      productMap[p.id] = p;
    }

    // Initialise profit normalisé en CDF — BUG FIX: variable non initialisée causait ReferenceError
    let profitNormalized = 0;

    // Déduction du stock et notifications
    for (const item of items) {
      const product = productMap[item.id];
      if (product) {
        const requestedQty = Number(item.quantite || 0);
        if (requestedQty <= 0) {
          throw new Error(`Quantité invalide pour ${product.nom}`);
        }
        if (Number(product.stock || 0) < requestedQty) {
          throw new Error(`Stock insuffisant pour ${product.nom}`);
        }
        product.stockUpdateRaison = 'Vente';
        product.stock -= requestedQty;
        await product.save({ transaction });

        // Les notifications de stock sont gérées automatiquement par les hooks du modèle Product
      }
    }
    // owner et finalRate déjà définis plus haut

    // Normaliser montantTotal en CDF avant stockage
    const computedTotalSaleCurrency = Array.isArray(items) ? items.reduce((acc, it) => acc + (Number(it.prixUnitaire ?? it.prix ?? 0) * Number(it.quantite || 0)), 0) : 0;
    const safeMontantTotal = Number.isFinite(computedTotalSaleCurrency) && computedTotalSaleCurrency > 0 ? computedTotalSaleCurrency : Number(montantTotal);

    const montantTotalNormalized = safeMontantTotal;

    // Normaliser prixUnitaire en CDF avant calcul du profitNet
    const articles = Array.isArray(items)
      ? items.map((item) => {
          const quantite = item.quantite || 1;
          const productRef = productMap[item.id];
          const prixUnitaire = Number(item.prixUnitaire ?? item.prix ?? 0);            // déjà en devise shop (CDF)
          let prixUnitaireCDF = prixUnitaire;
          if (saleCurrency === 'USD' && shopCurrency === 'CDF') {
            prixUnitaireCDF = Math.round(prixUnitaire * finalRate);
          } else if (saleCurrency === 'CDF' && shopCurrency === 'USD') {
            prixUnitaireCDF = Math.round((prixUnitaire / finalRate) * 100) / 100;
          }
          const productDevise = item.deviseProduit || productRef?.devise || saleCurrency || shopCurrency;
          const rawPrixAchat = Number(item.prixAchat || productRef?.prixAchat || 0);
          let prixAchatCDF = rawPrixAchat;
          if (productDevise !== shopCurrency) {
            if (productDevise === 'USD' && shopCurrency === 'CDF') {
              prixAchatCDF = Math.round(prixAchatCDF * finalRate * 100) / 100;
            } else if (productDevise === 'CDF' && shopCurrency === 'USD') {
              prixAchatCDF = Math.round((prixAchatCDF / finalRate) * 100) / 100;
            }
          }
          profitNormalized += (prixUnitaireCDF - prixAchatCDF) * quantite;

          return {
            id: item.id,
            nom: item.nom,
            prixUnitaire,
            quantite,
            prixAchat: rawPrixAchat,
            deviseOrigine: saleCurrency,
            tauxChange: finalRate,
            totalLigneOrigine: Math.round((prixUnitaire * quantite) * 100) / 100,
            totalLigneCDF: Math.round((prixUnitaireCDF * quantite) * 100) / 100,
            totalLigneUSD: Math.round(((prixUnitaireCDF * quantite) / finalRate) * 100) / 100,
            deviseProduit: productDevise,
            metadata: item.metadata || null,
          };
        })
      : [];

    const remise = 0;
    profitNormalized -= remise;

    // Arrondi à 2 décimales — toutes les valeurs sont déjà en CDF
    let profitNet = Math.round(profitNormalized * 100) / 100;

    // Résoudre le client avant création de la vente
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

    const sale = await Sale.create({
      userId,
      clientId: resolvedClientId,
      articles,
      montantTotal: montantTotalNormalized,
      remise,
      profitNet: profitNet,
      methodePaiement: methodePaiement || 'Espèces',
      clientInfo: clientInfo || { nom: 'Client de passage', email: '' },
      devise: saleCurrency,
      tauxChange: finalRate,
      devisePaiement: devisePaiement || saleCurrency,
      montantRecu: montantRecu || montantTotal,
      sellerId: req.user.id
    }, { transaction });

    const isCredit = (methodePaiement && (
      methodePaiement.toLowerCase().includes('crédit') || 
      methodePaiement.toLowerCase().includes('credit') ||
      methodePaiement.toLowerCase() === 'dette'
    )) || req.body.statut === 'Dette' || req.body.statut === 'Crédit';
    
    // M4 Fix: Normalize debt amount to the shop's base currency
    if (resolvedClientId && isCredit) {
      const dbClient = await Client.findByPk(resolvedClientId, { transaction });
      const owner = await require('../models/User').findByPk(userId);
      const shopCurrency = normalizeCurrency(owner?.entreprise?.devise);
      
      let amountToAdd = Number(montantTotal - remise);
      const effectiveDevise = devise || 'USD';
      
      // If sale currency differs from shop currency, convert it (authoritative server rate)
      if (effectiveDevise !== shopCurrency) {
        const rate = finalRate;
        if (!Number.isFinite(rate) || rate <= 0) {
          await transaction.rollback();
          return res.status(400).json({ message: "Taux de change invalide pour la gestion des dettes." });
        }
        amountToAdd = convertCurrency(amountToAdd, devise, shopCurrency, rate);
      }

      if (dbClient) {
        dbClient.detteTotale = Number(dbClient.detteTotale || 0) + amountToAdd;
        await dbClient.save({ transaction });
      }
    }

    await transaction.commit();
    await invalidateCache('stats');
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 201, sale, 'Vente enregistrée avec succès');
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

exports.deleteSale = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const sale = await Sale.findByPk(req.params.id, { transaction });
    if (!sale) {
      await transaction.rollback();
      return res.status(404).json({ message: "Vente non trouvée" });
    }

    // Sécurité : seul le propriétaire (admin) ou le superadmin peut supprimer
    if (sale.userId !== req.user.tenantId && req.user.role !== 'superadmin') {
      await transaction.rollback();
      return res.status(403).json({ message: 'Accès refusé : cette vente ne vous appartient pas' });
    }

    // Restitution du stock optimisée
    const saleArticles = safeParseArticles(sale.articles);
    if (!isRefundedStatus(sale.statut) && saleArticles.length > 0) {
      const productIds = saleArticles.map(item => item.id);
      const products = await Product.findAll({ where: { id: productIds }, transaction });
      
      for (const item of saleArticles) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          product.stockUpdateRaison = 'Suppression Vente';
          product.stock += item.quantite;
          await product.save({ transaction });
        }
      }
    }

    // Restitution de la dette client si applicable
    const isCredit = (sale.methodePaiement && (
      sale.methodePaiement.toLowerCase().includes('crédit') ||
      sale.methodePaiement.toLowerCase().includes('credit')
    )) || sale.statut === 'Dette';

    if (sale.clientId && isCredit && !isRefundedStatus(sale.statut)) {
        const client = await Client.findByPk(sale.clientId, { transaction });
        if (client) {
          // Réduire la dette du client en convertissant dans la devise de la boutique
          const ownerId = sale.userId; const owner = await require('../models/User').findByPk(ownerId, { transaction });
          const shopCurrency = normalizeCurrency(owner?.entreprise?.devise);
          const effectiveDevise = sale.devise || 'USD';
          const rate = Number(sale.tauxChange || owner?.preferences?.exchangeRate);
          if (!Number.isFinite(rate) || rate <= 0) {
            await transaction.rollback();
            return res.status(400).json({ message: "Taux de change invalide pour recalcul de dette." });
          }
          let debtToSubtract = Number(sale.montantTotal - (sale.remise || 0));
          if (effectiveDevise !== shopCurrency) {
            debtToSubtract = convertCurrency(debtToSubtract, effectiveDevise, shopCurrency, rate);
          }
            client.detteTotale = Math.max(0, Number(client.detteTotale || 0) - debtToSubtract);
            await client.save({ transaction });
        }
    }

    await sale.destroy({ transaction });
    await transaction.commit();
    await invalidateCache('stats');
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, null, 'Vente supprimée avec succès');
  } catch (error) {
    if (transaction) await transaction.rollback();
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
      await invalidateCache('stats');
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
    
    const allowedFields = ['statut', 'methodePaiement', 'clientInfo'];
    const payload = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) payload[key] = req.body[key];
    }
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'Aucune mise ? jour valide fournie.' });
    }
    await sale.update(payload);
    await invalidateCache('stats');
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, sale, 'Vente mise à jour');
  } catch (error) {
    next(error);
  }
};

exports.refundSale = async (req, res, next) => {
  let transaction;
  try {
    const userId = req.user.tenantId;
    transaction = await sequelize.transaction();
    const sale = await Sale.findOne({ where: { id: req.params.id, userId }, transaction });
    if (!sale) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    
    if (sale.statut === 'Remboursée') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Vente déjà remboursée' });
    }
    
    // Restitution du stock
    if (sale.articles && Array.isArray(sale.articles)) {
      for (const item of sale.articles) {
        const product = await Product.findByPk(item.id, { transaction });
        if (product) {
          product.stockUpdateRaison = 'Remboursement Vente';
          product.stock += item.quantite;
          await product.save({ transaction });
        }
      }
    }
    
    // Restitution de la dette client si applicable
    const isCredit = (sale.methodePaiement && (
      sale.methodePaiement.toLowerCase().includes('crédit') ||
      sale.methodePaiement.toLowerCase().includes('credit')
    )) || sale.statut === 'Dette';

    if (sale.clientId && isCredit) {
        const client = await Client.findByPk(sale.clientId, { transaction });
        if (client) {
          // Convertir le montant dans la devise de la boutique avant de réduire la dette
          const ownerId = sale.userId; const owner = await require('../models/User').findByPk(ownerId, { transaction });
          const shopCurrency = normalizeCurrency(owner?.entreprise?.devise);
          const effectiveDevise = sale.devise || 'USD';
          const rate = Number(sale.tauxChange || owner?.preferences?.exchangeRate);
          if (!Number.isFinite(rate) || rate <= 0) {
            await transaction.rollback();
            return res.status(400).json({ message: "Taux de change invalide pour remboursement de dette." });
          }
          let debtToSubtract = Number(sale.montantTotal - (sale.remise || 0));
          if (effectiveDevise !== shopCurrency) {
            debtToSubtract = convertCurrency(debtToSubtract, effectiveDevise, shopCurrency, rate);
          }
            client.detteTotale = Math.max(0, Number(client.detteTotale || 0) - debtToSubtract);
            await client.save({ transaction });
        }
    }

    sale.statut = 'Remboursée';
    await sale.save({ transaction });

    // Log activité remboursement
    await logActivite(req.user.id, 'REMBOURSEMENT', , 'Ventes', userId);
    await transaction.commit();
    await invalidateCache('stats');
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, sale, 'Vente remboursée et stock restitué');
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};
