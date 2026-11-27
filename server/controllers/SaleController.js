const { Sale, Product, Client, Notification } = require('../models');
const { validateSale } = require('../middleware/validators');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const { logActivite } = require('./activiteController');
const { convertCurrency } = require('../utils/currency');
const { getPagination, getPagingData } = require('../utils/pagination');
const { invalidateCache } = require('../utils/cache');
const { fail, trustedLine, rateFor, isCash, isCredit: creditMethod, round } = require('../utils/transactionSafety');
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
    const owner = await require('../models/User').findByPk(ownerId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!owner) throw fail('Entreprise introuvable',404);
    const shopCurrency = normalizeCurrency(owner?.entreprise?.devise);
    const saleCurrency = devise || 'USD';
    const finalRate = rateFor(owner);
    if (!Number.isFinite(finalRate) || finalRate <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Taux de change invalide. Configurez le taux dans Paramètres avant d'enregistrer une vente."
      });
    }

    // Optimisation N+1 : Récupérer tous les produits concernés en une seule requête
    const productIds = items.map(item => item.id);
    const products = await Product.findAll({ where: { id: productIds, userId }, transaction, lock: transaction.LOCK.UPDATE, order: [['id','ASC']] });
    if (products.length !== new Set(productIds.map(Number)).size) throw fail('Produit introuvable dans cette entreprise',404);
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
        const trusted = trustedLine(product,item,saleCurrency,finalRate);
        const requestedQty = trusted.qty;
        if (requestedQty <= 0) {
          throw new Error(`Quantité invalide pour ${product.nom}`);
        }
        if (Number(product.stock || 0) < requestedQty) {
          throw fail(`Stock insuffisant pour ${product.nom}`,409);
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

    const montantTotalNormalized = round(safeMontantTotal,saleCurrency);
    if (Math.abs(Number(montantTotal)-montantTotalNormalized)>0.01) throw fail('Total du panier incohérent',409);

    // Normaliser prixUnitaire en CDF avant calcul du profitNet
    const articles = Array.isArray(items)
      ? items.map((item) => {
          const quantite = item.quantite || 1;
          const productRef = productMap[item.id];
          const prixUnitaire = Number(item.prixUnitaire ?? item.prix ?? 0);            // déjà en devise shop (CDF)
          const prixUnitaireCDF = convertCurrency(prixUnitaire,saleCurrency,'CDF',finalRate);
          const productDevise = normalizeCurrency(productRef?.devise);
          const rawPrixAchat = Number(productRef?.prixAchat ?? 0);
          const prixAchatCDF = convertCurrency(rawPrixAchat,productDevise,'CDF',finalRate);
          profitNormalized += (prixUnitaireCDF - prixAchatCDF) * quantite;

          return {
                      id: item.id,
                      nom: productRef.nom,
                      nomAffiche: item.nomAffiche || item.nom,
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
    if (resolvedClientId && !await Client.findOne({where:{id:resolvedClientId,userId},transaction,lock:transaction.LOCK.UPDATE})) throw fail('Client introuvable dans cette entreprise',404);
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

    const credit = creditMethod(methodePaiement);
    if (!credit && !isCash(methodePaiement)) throw fail('Moyen de paiement non pris en charge');
    if (credit && !resolvedClientId) throw fail('Un client est obligatoire pour une vente à crédit');
    const {CashSession}=require('../models');
    const activeSession=await CashSession.findOne({where:{userId,status:'OPEN'},transaction,lock:transaction.LOCK.UPDATE});
    if(activeSession && !credit){const amount=convertCurrency(montantTotalNormalized,saleCurrency,shopCurrency,finalRate);activeSession.totalSales=Number(activeSession.totalSales||0)+amount;activeSession.expectedBalance=Number(activeSession.expectedBalance||0)+amount;await activeSession.save({transaction});}
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
      montantRecu: credit ? 0 : (montantRecu ?? montantTotalNormalized),
      statut: credit ? 'Dette' : 'Complétée',
      sellerId: req.user.id
    }, { transaction });

    if (resolvedClientId && credit) {
      const dbClient=await Client.findOne({where:{id:resolvedClientId,userId},transaction,lock:transaction.LOCK.UPDATE});
      if(!dbClient)throw fail('Client introuvable',404);
      dbClient.detteTotale=Number(dbClient.detteTotale||0)+convertCurrency(montantTotalNormalized,saleCurrency,shopCurrency,finalRate);
      await dbClient.save({transaction});
    }
    await transaction.commit();
    await invalidateCache('stats');
    await logActivite(req.user.id, 'VENTE', `Vente #${sale.id} (${sale.montantTotal} ${sale.devise})`, 'Ventes', userId);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 201, sale, 'Vente enregistrée avec succès');
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(error);
  }
};

exports.deleteSale = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const sale = await Sale.findOne({where:{id:req.params.id,userId:req.user.tenantId},transaction,lock:transaction.LOCK.UPDATE});
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
      const products = await Product.findAll({ where: { id: productIds, userId: sale.userId }, transaction, lock: transaction.LOCK.UPDATE });
      
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
        const client = await Client.findOne({where:{id:sale.clientId,userId:sale.userId},transaction,lock:transaction.LOCK.UPDATE});
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
    if (transaction && !transaction.finished) await transaction.rollback();
    next(error);
  }
};


exports.deleteAllSales = async (req,res) => res.status(409).json({message:"La purge de l'historique financier est désactivée. Conservez les transactions pour la traçabilité."});

exports.updateSale = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const sale = await Sale.findOne({ where: { id: req.params.id, userId } });
    if (!sale) return res.status(404).json({ message: 'Vente non trouvée' });
    
    if (req.body.statut !== undefined || req.body.methodePaiement !== undefined) return res.status(409).json({message:'Utilisez un workflow de remboursement ou règlement pour modifier un paiement.'});
    const allowedFields = ['clientInfo'];
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
    const sale = await Sale.findOne({ where: { id: req.params.id, userId }, transaction, lock: transaction.LOCK.UPDATE });
    if (!sale) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    
    if (isRefundedStatus(sale.statut)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Vente déjà remboursée' });
    }
    
    // Restitution du stock
    if (sale.articles && Array.isArray(sale.articles)) {
      for (const item of sale.articles) {
        const product = await Product.findOne({where:{id:item.id,userId:sale.userId},transaction,lock:transaction.LOCK.UPDATE});
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
        const client = await Client.findOne({where:{id:sale.clientId,userId:sale.userId},transaction,lock:transaction.LOCK.UPDATE});
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
    await logActivite(req.user.id, 'REMBOURSEMENT', `Remboursement vente #${sale.id} (${sale.montantTotal} ${sale.devise})`, 'Ventes', userId);
    await transaction.commit();
    await invalidateCache('stats');
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, sale, 'Vente remboursée et stock restitué');
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(error);
  }
};
