const ledger=require('../utils/commercialLedger');
const inventory=require('../utils/inventoryService');
const { Purchase, Product, Fournisseur, CashSession } = require('../models');
const { sequelize } = require('../config/database');
const { fail, pick, money, positiveQuantity, currency, round, rateFor } = require('../utils/transactionSafety');
const { invalidateCache } = require('../utils/cache');
const { validatePurchase } = require('../middleware/validators');
const { logActivite } = require('./activiteController');
const { getPagination, getPagingData } = require('../utils/pagination');
const { User } = require('../models');
const { convertCurrency } = require('../utils/currency');
const { sendResponse } = require('../utils/response');

exports.getPurchases = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const { page, limit } = req.query;
    const { limit: l, offset } = getPagination(page, limit);

    const data = await Purchase.findAndCountAll({ 
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: l,
      offset
    });

    const response = getPagingData(data, page, l);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, response, 'Achats récupérés');
  } catch (error) {
    next(error);
  }
};

exports.createPurchase = async (req,res,next)=>{
 const {error}=validatePurchase(req.body);if(error)return res.status(400).json({message:error.details[0].message});
 try{
  const userId=req.user.tenantId;
  const purchase=await sequelize.transaction(async transaction=>{
   const owner=await User.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);
   const prior=await ledger.replay(req,'purchase.create',transaction);if(prior){const existing=await Purchase.findOne({where:{id:prior.resourceId,userId},transaction});if(!existing)throw fail('Transaction historique indisponible',409);return existing;}
   if(req.body.warehouseId!=null&&req.user.role!=='admin')throw fail('Sélection d’entrepôt réservée au propriétaire',403);
   const wh=await inventory.warehouse(userId,req.body.warehouseId,transaction);
   const devise=currency(req.body.devise||owner.entreprise?.devise),shopCurrency=currency(owner.entreprise?.devise),rate=rateFor(owner);
   const fournisseurId=req.body.fournisseurId||null;
   if(fournisseurId&&!await Fournisseur.findOne({where:{id:fournisseurId,userId},transaction}))throw fail('Fournisseur introuvable',404);
   const ids=[...new Set(req.body.articles.filter(a=>a.id).map(a=>Number(a.id)))];
   const products=await Product.findAll({where:{id:ids,userId},transaction,lock:transaction.LOCK.UPDATE,order:[['id','ASC']]});
   if(products.length!==ids.length)throw fail('Produit introuvable dans cette entreprise',404);
   const map=new Map(products.map(x=>[Number(x.id),x]));
   const statut=req.body.statut||'Payé';if(!['Payé','Reçu','Expédié','En attente'].includes(statut))throw fail('Statut d’achat invalide');
   const received=['Payé','Reçu'].includes(statut);
   let total=0;const articles=[];
   for(const item of req.body.articles){
    const qty=positiveQuantity(item.quantite),cost=money(item.prixAchat);let product;
    if(item.id){product=map.get(Number(item.id));if(received){product.stockUpdateRaison='Achat Fournisseur';product.stock=Number(product.stock)+qty;product.prixAchat=convertCurrency(cost,devise,currency(product.devise),rate);await product.save({transaction});}}
    else {if(typeof item.nom!=='string'||!item.nom.trim())throw fail('Nom du produit obligatoire');if(received)product=await Product.create({userId,creatorId:req.user.id,nom:item.nom.trim(),prix:money(item.prix??cost),prixAchat:cost,stock:qty,devise},{transaction});}
    if(received)await inventory.change(product,wh,qty,transaction);
    articles.push({id:product?.id??null,nom:product?.nom??item.nom.trim(),quantite:qty,prixAchat:cost,received});total+=qty*cost;
   }
   total=round(total,devise);if(Math.abs(total-money(req.body.montantTotal))>0.01)throw fail('Total des achats incohérent',409);
   const result=await Purchase.create({userId,fournisseurId,numeroFacture:req.body.numeroFacture,description:req.body.description,montantTotal:total,statut,devise,articles,warehouseId:wh?.id??null,tauxChange:rate,accountingCurrency:shopCurrency},{transaction});
   const session=await CashSession.findOne({where:{userId,status:'OPEN'},transaction,lock:transaction.LOCK.UPDATE});
   ledger.assertSessionCurrency(session,shopCurrency);
   if(statut==='Payé'&&!session)throw fail('Ouvrez une caisse pour enregistrer le paiement',409);
   if(session&&statut==='Payé'){const amount=convertCurrency(total,devise,shopCurrency,rate);session.totalExpenses=Number(session.totalExpenses||0)+amount;session.expectedBalance=Number(session.expectedBalance||0)-amount;await session.save({transaction});}
   const base=convertCurrency(total,devise,shopCurrency,rate);
   if(received)await ledger.post(req,transaction,{event:'PURCHASE_RECEIPT',reference:result.id,debit:'INVENTORY',credit:'PAYABLE',amount:base,devise:shopCurrency,rate});
   if(statut==='Payé')await ledger.post(req,transaction,{event:'PURCHASE_PAYMENT',reference:result.id,debit:'PAYABLE',credit:'CASH',amount:base,devise:shopCurrency,rate,session});
   await ledger.remember(req,'purchase.create',result.id,transaction);
   return result;
  });
  await invalidateCache('stats');await invalidateCache('products');await logActivite(req.user.id,'ACHAT',`Nouvel achat: ${purchase.numeroFacture}`,'System',userId);
  return sendResponse(res,201,purchase,'Achat enregistré');
 }catch(error){next(error);}
};
exports.updatePurchase=async(req,res,next)=>{
 try{
  const userId=req.user.tenantId;
  const purchase=await sequelize.transaction(async transaction=>{
   const owner=await User.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);
   const row=await Purchase.findOne({where:{id:req.params.id,userId},transaction,lock:transaction.LOCK.UPDATE});
   if(!row)throw fail('Achat non trouvé',404);
   const fields=pick(req.body,['description','numeroFacture','statut']);
   if(!Object.keys(fields).length||Object.keys(req.body).some(k=>!['description','numeroFacture','statut'].includes(k)))throw fail('Les achats financiers exigent un workflow de correction dédié',409);
   if(fields.statut!==undefined&&fields.statut!==row.statut){
    const transitions={'En attente':['Expédié','Reçu','Payé'],'Expédié':['Reçu','Payé'],'Reçu':['Payé'],'Payé':[]};
    if(!(transitions[row.statut]||[]).includes(fields.statut))throw fail('Transition d’achat non autorisée',409);
    if(!Array.isArray(row.articles)||!row.articles.length||row.articles.some(a=>typeof a.received!=='boolean'))throw fail('Achat historique: rapprochement du stock nécessaire',409);
    const devise=currency(row.devise),shopCurrency=currency(owner.entreprise?.devise),rate=Number(row.tauxChange);
    if(row.accountingCurrency!==shopCurrency||!Number.isFinite(rate)||rate<=0)throw fail('Achat historique: rapprochement comptable nécessaire',409);
    if(['Reçu','Payé'].includes(fields.statut)){
     const wh=await inventory.warehouse(userId,row.warehouseId,transaction);
     const updated=[];
     for(const item of row.articles){
      if(item.received){updated.push(item);continue;}
      const qty=positiveQuantity(item.quantite),cost=money(item.prixAchat);let product;
      if(item.id){
       product=await Product.findOne({where:{id:item.id,userId},transaction,lock:transaction.LOCK.UPDATE});
       if(!product)throw fail('Produit introuvable',409);
       product.stockUpdateRaison='Réception Achat';product.stock=Number(product.stock)+qty;product.prixAchat=convertCurrency(cost,devise,currency(product.devise),rate);await product.save({transaction});
      }else{product=await Product.create({userId,creatorId:req.user.id,nom:item.nom,prix:cost,prixAchat:cost,stock:qty,devise},{transaction});}
      await inventory.change(product,wh,qty,transaction);
      updated.push({...item,id:product.id,received:true});
     }
     fields.articles=updated;
     if(row.articles.some(a=>!a.received))await ledger.post(req,transaction,{event:'PURCHASE_RECEIPT',reference:row.id,debit:'INVENTORY',credit:'PAYABLE',amount:convertCurrency(Number(row.montantTotal),devise,shopCurrency,rate),devise:shopCurrency,rate});
    }
    if(fields.statut==='Payé'){
     const session=await CashSession.findOne({where:{userId,status:'OPEN'},transaction,lock:transaction.LOCK.UPDATE});
     if(!session)throw fail('Ouvrez une caisse pour enregistrer le paiement',409);
     ledger.assertSessionCurrency(session,shopCurrency);
     const amount=convertCurrency(Number(row.montantTotal),devise,shopCurrency,rate);
     session.totalExpenses=Number(session.totalExpenses||0)+amount;session.expectedBalance=Number(session.expectedBalance||0)-amount;await session.save({transaction});
     await ledger.post(req,transaction,{event:'PURCHASE_PAYMENT',reference:row.id,debit:'PAYABLE',credit:'CASH',amount,devise:shopCurrency,rate,session});
    }
   }
   await row.update(fields,{transaction});return row;
  });
  await invalidateCache('stats');await invalidateCache('products');await logActivite(req.user.id,'ACHAT',`Mise à jour achat #${purchase.id}`,'Achats',userId);
  return sendResponse(res,200,purchase,'Achat mis à jour');
 }catch(error){next(error);}
};
exports.deletePurchase=async(req,res)=>res.status(409).json({message:"La suppression définitive des achats est désactivée. Un workflow d’annulation comptable est nécessaire."});
