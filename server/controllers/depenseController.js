const {Depense,User,CashSession,JournalEntry}=require('../models');
const {sequelize}=require('../config/database');
const {fail}=require('../utils/transactionSafety');
const {prepare,pay}=require('../utils/cashOutflow');
const ledger=require('../utils/commercialLedger');
const {sendResponse}=require('../utils/response');
const {invalidateCache}=require('../utils/cache');
const {logActivite}=require('./activiteController');
const text=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
exports.list=async(req,res,next)=>{try{
 const page=Math.max(1,Math.min(100000,parseInt(req.query.page)||1)),limit=Math.max(1,Math.min(100,parseInt(req.query.limit)||30));
 const rows=await Depense.findAndCountAll({where:{userId:req.user.tenantId},order:[['createdAt','DESC'],['id','DESC']],limit,offset:(page-1)*limit});
 return sendResponse(res,200,{rows:rows.rows,total:rows.count,page,limit},'Dépenses récupérées');
}catch(e){next(e)}};
exports.create=async(req,res,next)=>{try{
 const {description,categorie,montant,devise,reference}=req.body;
 if(!text(description,250)||!text(categorie,80))throw fail('Description et catégorie obligatoires');
 const result=await sequelize.transaction(async transaction=>{
  const userId=req.user.tenantId;
  await User.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});
  const prior=await ledger.replay(req,'expense.create',transaction);
  if(prior){const expense=await Depense.findOne({where:{id:prior.resourceId,userId},transaction});if(!expense)throw fail('Dépense historique indisponible',409);return {expense,replayed:true};}
  const ctx=await prepare(req,transaction,montant,devise);
  const expense=await Depense.create({userId,actorId:req.user.id,description:text(description,250),categorie:text(categorie,80),montant:ctx.amount,devise:ctx.devise,accountingCurrency:ctx.base,tauxChange:ctx.rate,cashSessionId:ctx.session.id,reference:text(reference,100)||null},{transaction});
  await pay(req,transaction,ctx,'EXPENSE',expense.id,'OPERATING_EXPENSE');await ledger.remember(req,'expense.create',expense.id,transaction);return {expense,replayed:false};
 });
 if(!result.replayed)await logActivite(req.user.id,'DEPENSE','Dépense #'+result.expense.id,'Finance',req.user.tenantId);
 await invalidateCache('stats');return sendResponse(res,result.replayed?200:201,result.expense,'Dépense enregistrée');
}catch(e){next(e)}};
exports.reverse=async(req,res,next)=>{try{
 const userId=req.user.tenantId;
 const result=await sequelize.transaction(async transaction=>{
  const owner=await User.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});
  if(!owner)throw fail('Entreprise introuvable',404);
  const expense=await Depense.findOne({where:{userId,id:req.params.id},transaction,lock:transaction.LOCK.UPDATE});
  if(!expense)throw fail('Dépense introuvable',404);
  if(expense.status==='REVERSED')throw fail('Dépense déjà annulée',409);
  if(!text(req.body.reason,250))throw fail('Motif d’annulation requis');
  const session=await CashSession.findOne({where:{userId,id:expense.cashSessionId,branchKey:0,status:'OPEN'},transaction,lock:transaction.LOCK.UPDATE});
  if(!session||session.id!==expense.cashSessionId)throw fail('Annulation d’une caisse ancienne: rapprochement nécessaire',409);
  ledger.assertSessionCurrency(session,expense.accountingCurrency);
  const entry=await JournalEntry.findOne({where:{userId,event:'EXPENSE',reference:String(expense.id)},transaction});if(!entry)throw fail('Écriture originale manquante',409);
  const amount=Number(entry.amount);if(Number(session.totalExpenses)<amount)throw fail('Rapprochement nécessaire',409);
  session.totalExpenses=Number(session.totalExpenses)-amount;session.expectedBalance=Number(session.expectedBalance)+amount;await session.save({transaction});
  await ledger.post(req,transaction,{event:'EXPENSE_REVERSAL',reference:expense.id,debit:'CASH',credit:'OPERATING_EXPENSE',amount,devise:expense.accountingCurrency,rate:expense.tauxChange,session});
  expense.status='REVERSED';await expense.save({transaction});return expense;
 });
 await logActivite(req.user.id,'ANNULATION_DEPENSE','Dépense #'+result.id+' : '+text(req.body.reason,250),'Finance',userId);
 await invalidateCache('stats');return sendResponse(res,200,result,'Dépense annulée');
}catch(e){next(e)}};
