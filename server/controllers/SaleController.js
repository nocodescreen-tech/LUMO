const { Sale, Product, Client, Notification } = require('../models');
const { validateSale } = require('../middleware/validators');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const { logActivite } = require('./activiteController');
const { convertCurrency } = require('../utils/currency');
const { getPagination, getPagingData } = require('../utils/pagination');
const { invalidateCache } = require('../utils/cache');
const ledger=require('../utils/commercialLedger');
const inventory=require('../utils/inventoryService');
const lots=require('../utils/lotService');
const serials=require('../utils/serialService');
const { fail, trustedLine, rateFor, isCash, isCredit: creditMethod, round, money } = require('../utils/transactionSafety');
const publicSale=(sale,user)=>{const row=sale.toJSON?sale.toJSON():{...sale};if(['admin','superadmin'].includes(user.role))return row;delete row.profitNet;row.articles=safeParseArticles(row.articles).map(({prixAchat,...item})=>item);return row;};
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
    if(req.user.parentId)where.warehouseId=(await require('../utils/staffScope').location(req.user))?.id??null;

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

    data.rows=data.rows.map(row=>publicSale(row,req.user));
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
    const prior=await ledger.replay(req,'sale.create',transaction);
    if(prior){const existing=await Sale.findOne({where:{id:prior.resourceId,userId},transaction});if(!existing)throw fail('Transaction historique indisponible',409);await transaction.commit();return require('../utils/response').sendResponse(res,200,publicSale(existing,req.user),'Vente déjà enregistrée');}
    if(!req.user.parentId&&req.body.warehouseId!=null&&req.user.role!=='admin')throw fail('Sélection d’entrepôt réservée au propriétaire',403);
    const quote=await require('../utils/documentService').validateQuoteSale(req,transaction);
    const wh=await require('../utils/staffScope').resolve(req.user,req.body.warehouseId,transaction);
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
    const lotAllocations=[];
    const serialAllocations=[];
    const serialLines=new Map();

    // Déduction du stock et notifications
    for (const item of items) {
      const product = productMap[item.id];
      if (product) {
        const trusted = trustedLine(product,item,saleCurrency,finalRate);
        const requestedQty = trusted.qty;
        if (requestedQty <= 0) {
          throw new Error(`Quantité invalide pour ${product.nom}`);
        }
        if (await inventory.available(product,wh,transaction) < requestedQty) {
          throw fail(`Stock insuffisant pour ${product.nom}`,409);
        }
        const units=await serials.consume(req,product,wh,requestedQty,item.serialNumbers,transaction);
        if(units.some(u=>serialAllocations.some(s=>s.id===u.id)))throw fail('Numéro de série répété dans le panier',409);
        serialAllocations.push(...units);serialLines.set(item,units.map(u=>({serial:u.serial,imei:u.imei})));
        lotAllocations.push(...await lots.consume(req,product,wh,requestedQty,transaction));
        await inventory.change(product,wh,-requestedQty,transaction);
        product.stockUpdateRaison = 'Vente';
        product.stock -= requestedQty;
        await product.save({ transaction });

        // Les notifications de stock sont gérées automatiquement par les hooks du modèle Product
      }
    }
    // owner et finalRate déjà définis plus haut

    // Normaliser montantTotal en CDF avant stockage
    const computedTotalSaleCurrency = Array.isArray(items) ? items.reduce((acc, it) => acc + (Number(it.prixUnitaire ?? it.prix ?? 0) * Number(it.quantite || 0)), 0) : 0;
    if(!Number.isFinite(computedTotalSaleCurrency)||computedTotalSaleCurrency<0)throw fail('Total de vente invalide');
    const safeMontantTotal = computedTotalSaleCurrency;

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
                      serialUnits:serialLines.get(item)||[],
                    };
        })
      : [];

    const remise = 0;
    profitNormalized -= remise;

    // Arrondi à 2 décimales — toutes les valeurs sont déjà en CDF
    let profitNet = shopCurrency==='USD' ? Math.round(profitNormalized/finalRate*100)/100 : Math.round(profitNormalized*100)/100;

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
    const baseAmount=round(convertCurrency(montantTotalNormalized,saleCurrency,shopCurrency,finalRate),shopCurrency);
    const depositRaw=round(money(req.body.acompte??0),saleCurrency);
    if((depositRaw>0||req.body.dueOn)&&!credit)throw fail('Acompte et échéance réservés aux ventes à crédit');
    if(credit&&depositRaw>0&&(depositRaw>=montantTotalNormalized||baseAmount<=0))throw fail('Acompte inférieur au total requis');
    const deposit=round(convertCurrency(depositRaw,saleCurrency,shopCurrency,finalRate),shopCurrency);
    if(depositRaw>0&&(deposit<=0||deposit>=baseAmount))throw fail('Acompte incompatible après conversion');
    if(credit&&baseAmount<=0)throw fail('Créance strictement positive requise');
    if(!credit && montantRecu!=null && money(montantRecu)<montantTotalNormalized)throw fail('Montant reçu insuffisant');
    if(!credit && devisePaiement && devisePaiement!==saleCurrency)throw fail('Le paiement doit utiliser la devise de vente pour le moment');
    const {CashSession}=require('../models');
    const activeSession=await CashSession.findOne({where:{userId,status:'OPEN'},transaction,lock:transaction.LOCK.UPDATE});
    if((!credit||deposit>0)&&!activeSession)throw fail('Ouvrez une caisse avant d’enregistrer une vente',409);
    ledger.assertSessionCurrency(activeSession,shopCurrency);
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
      montantRecu: credit ? depositRaw : (montantRecu ?? montantTotalNormalized),
      statut: credit ? 'Dette' : 'Complétée',
      sellerId: req.user.id, warehouseId:wh?.id??null, accountingCurrency:shopCurrency,cashSessionId:credit?null:activeSession?.id
    }, { transaction });

    await lots.recordSale(req,sale,lotAllocations,transaction);
    await serials.recordSale(req,sale,serialAllocations,transaction);
    if (resolvedClientId && credit) {
      const dbClient=await Client.findOne({where:{id:resolvedClientId,userId},transaction,lock:transaction.LOCK.UPDATE});
      if(!dbClient)throw fail('Client introuvable',404);
      await require('../utils/receivableService').openSale(req,sale,dbClient,baseAmount,deposit,activeSession,transaction);
    }
    const baseCost=articles.reduce((sum,item)=>sum+convertCurrency(item.prixAchat*item.quantite,item.deviseProduit,shopCurrency,finalRate),0);
    await ledger.post(req,transaction,{event:'SALE',reference:sale.id,debit:credit?'RECEIVABLE':'CASH',credit:'REVENUE',amount:baseAmount,devise:shopCurrency,rate:finalRate,session:credit?null:activeSession});
    await ledger.post(req,transaction,{event:'SALE_COST',reference:sale.id,debit:'COST_OF_GOODS',credit:'INVENTORY',amount:baseCost,devise:shopCurrency,rate:finalRate});
    await require('../utils/documentService').convert(req,quote,sale,transaction);
    await ledger.remember(req,'sale.create',sale.id,transaction);
    await transaction.commit();
    await invalidateCache('stats');
    await invalidateCache('products');
    await logActivite(req.user.id, 'VENTE', `Vente #${sale.id} (${sale.montantTotal} ${sale.devise})`, 'Ventes', userId);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 201, publicSale(sale,req.user), 'Vente enregistrée avec succès');
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(error);
  }
};

exports.deleteSale=async(req,res)=>res.status(409).json({message:'La suppression définitive est désactivée. Utilisez un remboursement autorisé.'});

exports.deleteAllSales = async (req,res) => res.status(409).json({message:"La purge de l'historique financier est désactivée. Conservez les transactions pour la traçabilité."});

exports.updateSale = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const sale = await Sale.findOne({ where: { id: req.params.id, userId } });
    if (!sale) return res.status(404).json({ message: 'Vente non trouvée' });
    if(req.user.parentId)throw fail('Modification administrative réservée au propriétaire',403);
    
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
    sendResponse(res, 200, publicSale(sale,req.user), 'Vente mise à jour');
  } catch (error) {
    next(error);
  }
};

exports.refundSale=async(req,res,next)=>{
 try{
 const userId=req.user.tenantId;
 const sale=await sequelize.transaction(async transaction=>{
  const {User,CashSession}=require('../models');
  const owner=await User.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);
  const row=await Sale.findOne({where:{id:req.params.id,userId},transaction,lock:transaction.LOCK.UPDATE});if(!row)throw fail('Vente introuvable',404);
  if(req.user.parentId)await require('../utils/staffScope').resolve(req.user,row.warehouseId,transaction);
  if(isRefundedStatus(row.statut))throw fail('Vente déjà remboursée',409);
  const rate=Number(row.tauxChange);if(!Number.isFinite(rate)||rate<=0)throw fail('Taux historique manquant; rapprochement nécessaire',409);
  const amount=convertCurrency(Number(row.montantTotal)-Number(row.remise||0),normalizeCurrency(row.devise),normalizeCurrency(owner.entreprise?.devise),rate);
  if(creditMethod(row.methodePaiement)||row.statut==='Dette')throw fail('Remboursement crédit indisponible avant rapprochement des créances',409);
  if(!isCash(row.methodePaiement))throw fail('Moyen de paiement non pris en charge',409);
  const session=await CashSession.findOne({where:{userId,status:'OPEN'},transaction,lock:transaction.LOCK.UPDATE});
  if(!row.accountingCurrency||row.accountingCurrency!==normalizeCurrency(owner.entreprise?.devise))throw fail('Vente historique: rapprochement comptable nécessaire',409);
  ledger.assertSessionCurrency(session,row.accountingCurrency);
  if(!session||row.cashSessionId!==session.id||new Date(row.createdAt)<new Date(session.openingTime))throw fail('Le remboursement d’une vente d’une ancienne caisse nécessite un mouvement comptable dédié',409);
  if(Number(session.expectedBalance)<amount||Number(session.totalSales)<amount)throw fail('Rapprochement de caisse nécessaire avant remboursement',409);
  const articles=safeParseArticles(row.articles);if(!articles.length)throw fail('Articles historiques indisponibles',409);
  const wh=await inventory.warehouse(userId,row.warehouseId,transaction);
  for(const item of articles){const product=await Product.findOne({where:{id:item.id,userId},transaction,lock:transaction.LOCK.UPDATE});if(!product)throw fail('Produit historique introuvable',409);product.stockUpdateRaison='Remboursement Vente';product.stock=Number(product.stock)+Number(item.quantite);await product.save({transaction});await inventory.change(product,wh,Number(item.quantite),transaction);}
  await lots.refund(req,row,transaction);
  const activeRepair=await require('../models').RepairOrder.findOne({where:{userId,saleId:row.id,status:{[require('sequelize').Op.notIn]:['DELIVERED','CANCELLED']}},transaction});if(activeRepair)throw fail('Un dossier SAV actif doit être clôturé avant remboursement',409);
  await serials.refund(req,row,transaction);
  session.totalSales=Number(session.totalSales)-amount;session.expectedBalance=Number(session.expectedBalance)-amount;await session.save({transaction});
  const original=await require('../models').JournalEntry.findAll({where:{userId,reference:String(row.id),event:{[Op.in]:['SALE','SALE_COST']}},transaction});
  if(!original.some(e=>e.event==='SALE')&&amount>0)throw fail('Écriture originale manquante',409);
  for(const entry of original)await ledger.post(req,transaction,{event:'REFUND_'+entry.event,reference:row.id,debit:entry.creditAccount,credit:entry.debitAccount,amount:Number(entry.amount),devise:entry.currency,rate,session:entry.event==='SALE'?session:null});
  row.statut='Remboursée';await row.save({transaction});return row;
 });
 await invalidateCache('stats');await invalidateCache('products');await logActivite(req.user.id,'REMBOURSEMENT',`Remboursement vente #${sale.id}`,'Ventes',userId);
 return require('../utils/response').sendResponse(res,200,publicSale(sale,req.user),'Vente remboursée et stock restitué');
 }catch(e){next(e)}
};
