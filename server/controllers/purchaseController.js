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
   const devise=currency(req.body.devise||owner.entreprise?.devise),shopCurrency=currency(owner.entreprise?.devise),rate=rateFor(owner);
   const fournisseurId=req.body.fournisseurId||null;
   if(fournisseurId&&!await Fournisseur.findOne({where:{id:fournisseurId,userId},transaction}))throw fail('Fournisseur introuvable',404);
   const ids=[...new Set(req.body.articles.filter(a=>a.id).map(a=>Number(a.id)))];
   const products=await Product.findAll({where:{id:ids,userId},transaction,lock:transaction.LOCK.UPDATE,order:[['id','ASC']]});
   if(products.length!==ids.length)throw fail('Produit introuvable dans cette entreprise',404);
   const map=new Map(products.map(x=>[Number(x.id),x]));
   let total=0;const articles=[];
   for(const item of req.body.articles){
    const qty=positiveQuantity(item.quantite),cost=money(item.prixAchat);let product;
    if(item.id){product=map.get(Number(item.id));product.stockUpdateRaison='Achat Fournisseur';product.stock=Number(product.stock)+qty;product.prixAchat=convertCurrency(cost,devise,currency(product.devise),rate);await product.save({transaction});}
    else {if(typeof item.nom!=='string'||!item.nom.trim())throw fail('Nom du produit obligatoire');product=await Product.create({userId,creatorId:req.user.id,nom:item.nom.trim(),prix:money(item.prix??cost),prixAchat:cost,stock:qty,devise},{transaction});}
    articles.push({id:product.id,nom:product.nom,quantite:qty,prixAchat:cost});total+=qty*cost;
   }
   total=round(total,devise);if(Math.abs(total-money(req.body.montantTotal))>0.01)throw fail('Total des achats incohérent',409);
   const statut=req.body.statut||'Payé';if(!['Payé','En attente','Partiel','Impayé','Non payé'].includes(statut))throw fail('Statut d’achat invalide');
   const result=await Purchase.create({userId,fournisseurId,numeroFacture:req.body.numeroFacture,description:req.body.description,montantTotal:total,statut,devise,articles},{transaction});
   const session=await CashSession.findOne({where:{userId,status:'OPEN'},transaction,lock:transaction.LOCK.UPDATE});
   if(session&&statut==='Payé'){const amount=convertCurrency(total,devise,shopCurrency,rate);session.totalExpenses=Number(session.totalExpenses||0)+amount;session.expectedBalance=Number(session.expectedBalance||0)-amount;await session.save({transaction});}
   return result;
  });
  await invalidateCache('stats');await invalidateCache('products');await logActivite(req.user.id,'ACHAT',`Nouvel achat: ${purchase.numeroFacture}`,'System',userId);
  return sendResponse(res,201,purchase,'Achat enregistré');
 }catch(error){next(error);}
};
exports.updatePurchase=async(req,res,next)=>{
 try{
  const purchase=await Purchase.findOne({where:{id:req.params.id,userId:req.user.tenantId}});
  if(!purchase)throw fail('Achat non trouvé',404);
  const fields=pick(req.body,['description','numeroFacture']);
  if(!Object.keys(fields).length||Object.keys(req.body).some(k=>!['description','numeroFacture'].includes(k)))throw fail('Les achats financiers exigent un workflow de correction dédié',409);
  await purchase.update(fields);return sendResponse(res,200,purchase,'Achat mis à jour');
 }catch(error){next(error);}
};
exports.deletePurchase=async(req,res)=>res.status(409).json({message:"La suppression définitive des achats est désactivée. Un workflow d’annulation comptable est nécessaire."});
