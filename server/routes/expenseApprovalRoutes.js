const router=require('express').Router();
const {protect}=require('../middleware/authMiddleware');
const {User,ExpenseRequest,ExpenseRequestEvent,ExpensePolicy,Depense}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {fail,money,round,currency}=require('../utils/transactionSafety');
const {prepare,pay}=require('../utils/cashOutflow');
const ledger=require('../utils/commercialLedger');
const policy=require('../utils/expenseApproval');
const budgets=require('../utils/budgetService');
const {sendResponse}=require('../utils/response');
const text=(v,max)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw fail('Texte invalide');return v.trim()};
const amount=(v,c)=>{if(typeof v!=='number'&&typeof v!=='string')throw fail('Montant requis');const n=money(v);if(n<=0||n!==round(n,c))throw fail('Montant ou précision invalide');return n;};
const admin=u=>u.role==='admin'&&!u.parentId;
const requester=u=>!!u.parentId&&Array.isArray(u.permissions)&&u.permissions.includes('expenses.request');
const reviewer=u=>!!u.parentId&&Array.isArray(u.permissions)&&u.permissions.includes('expenses.review');
const allowed=u=>admin(u)||requester(u)||reviewer(u);
const scope=u=>admin(u)||reviewer(u)?{}:{requesterId:u.id};
async function dual(row,c,t){
 const p=await policy.current(row.userId,t);
 if(p?.dualThreshold!=null&&p.currency!==c)throw fail('Devise de la politique modifiée : révisez le seuil',409);
 return row.dualRequired||p?.dualThreshold!=null&&Number(row.amount)>=Number(p.dualThreshold);
}
const paging=q=>({page:Math.max(1,Math.min(100000,parseInt(q.page)||1)),limit:Math.max(1,Math.min(100,parseInt(q.limit)||20))});
router.use(protect,(req,res,next)=>{if(!allowed(req.user))return next(fail('Accès aux approbations de dépenses requis',403));next();});
async function mutate(req,operation,model,fn){if(!req.body.operationId)throw fail('Clé de transaction requise');return sequelize.transaction(async transaction=>{
 const uid=req.user.tenantId,owner=await User.findByPk(uid,{transaction,lock:transaction.LOCK.UPDATE});if(!owner||owner.role!=='admin'||owner.parentId||owner.isSuspended)throw fail('Entreprise indisponible',403);
 const actor=req.user.id===uid?owner:await User.findOne({where:{id:req.user.id,parentId:uid},transaction,lock:transaction.LOCK.UPDATE});if(!actor||actor.isSuspended||!allowed(actor))throw fail('Accès révoqué',403);
 const prior=await ledger.replay(req,operation,transaction);if(prior){const row=await model.findOne({where:{id:prior.resourceId,userId:uid},transaction});if(!row)throw fail('Historique indisponible',409);return {row,replayed:true};}
 const row=await fn(owner,actor,currency(owner.entreprise?.devise),transaction);await ledger.remember(req,operation,row.id,transaction);return {row,replayed:false};
 });}
async function event(row,actor,kind,reason,t){await ExpenseRequestEvent.create({userId:row.userId,requestId:row.id,actorId:actor.id,kind,reason},{transaction:t});}
router.get('/policy',async(req,res,next)=>{try{const owner=await User.findByPk(req.user.tenantId,{attributes:['entreprise']}),row=await policy.current(req.user.tenantId);return sendResponse(res,200,{policy:row,currency:currency(owner.entreprise?.devise),canApprove:admin(req.user),canReview:reviewer(req.user),canSubmit:requester(req.user),actorId:req.user.id,budgetOptions:await budgets.options(req.user.tenantId,currency(owner.entreprise?.devise))},'Politique de dépenses');}catch(e){next(e)}});
router.get('/policy/history',async(req,res,next)=>{try{if(!admin(req.user))throw fail('Propriétaire requis',403);const {page,limit}=paging(req.query),r=await ExpensePolicy.findAndCountAll({where:{userId:req.user.tenantId},order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{rows:r.rows,total:r.count,page,limit},'Historique de politique');}catch(e){next(e)}});
router.post('/policy',async(req,res,next)=>{try{const r=await mutate(req,'expense.policy',ExpensePolicy,async(owner,actor,c,t)=>{if(!admin(actor)||req.body.confirm!==true)throw fail('Propriétaire et confirmation requis',403);const previous=await policy.current(owner.id,t);if((previous?.id??null)!==req.body.expectedPolicyId)throw fail('Politique modifiée : actualisez',409);
 if(req.body.currency!==c)throw fail('Devise comptable requise');
 const threshold=req.body.threshold===null?null:amount(req.body.threshold,c);
 const dualThreshold=req.body.dualThreshold===undefined?(previous?.dualThreshold==null?null:amount(previous.dualThreshold,c)):req.body.dualThreshold===null?null:amount(req.body.dualThreshold,c);
 if(dualThreshold!==null&&(threshold===null||dualThreshold<threshold))throw fail('Le seuil de double validation doit être supérieur ou égal au seuil d’approbation');
 if(req.body.dualThreshold===undefined&&previous?.dualThreshold!=null&&previous.currency!==c)throw fail('Reconfigurez explicitement le seuil de double validation');
 return ExpensePolicy.create({userId:owner.id,actorId:actor.id,currency:c,threshold,dualThreshold,reason:text(req.body.reason,250)},{transaction:t});});return sendResponse(res,r.replayed?200:201,r.row,'Politique enregistrée');}catch(e){next(e)}});
router.get('/',async(req,res,next)=>{try{const {page,limit}=paging(req.query),where={userId:req.user.tenantId,...scope(req.user)};if(['PENDING','APPROVED','REJECTED','CANCELLED','PAID'].includes(req.query.status))where.status=req.query.status;
 const result=await ExpenseRequest.findAndCountAll({where,order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{rows:result.rows,total:result.count,page,limit},'Demandes');}catch(e){next(e)}});
router.get('/:id/events',async(req,res,next)=>{try{const where={userId:req.user.tenantId,id:req.params.id,...scope(req.user)};const row=await ExpenseRequest.findOne({where});if(!row)throw fail('Demande introuvable',404);const {page,limit}=paging(req.query),events=await ExpenseRequestEvent.findAndCountAll({where:{userId:row.userId,requestId:row.id},order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{request:row,rows:events.rows,total:events.count,page,limit},'Historique');}catch(e){next(e)}});
router.post('/',async(req,res,next)=>{try{const result=await mutate(req,'expense.request',ExpenseRequest,async(owner,actor,c,t)=>{if(!requester(actor))throw fail('Demande réservée à un collaborateur autorisé',403);if(req.body.currency!==c)throw fail('Devise comptable requise');if(await ExpenseRequest.count({where:{userId:owner.id,requesterId:actor.id,status:{[Op.in]:['PENDING','APPROVED']}},transaction:t})>=30)throw fail('Limite de demandes en cours atteinte',409);
 const budgetCenterId=await budgets.selection(owner.id,c,req.body.budgetCenterId,t);
 const value=amount(req.body.amount,c),dualRequired=await dual({userId:owner.id,amount:value,dualRequired:false},c,t);
 const row=await ExpenseRequest.create({userId:owner.id,requesterId:actor.id,description:text(req.body.description,250),category:text(req.body.category,80),amount:value,currency:c,status:'PENDING',dualRequired,budgetCenterId},{transaction:t});await event(row,actor,'SUBMIT','Demande soumise',t);return row;});return sendResponse(res,result.replayed?200:201,result.row,'Demande enregistrée');}catch(e){next(e)}});
router.post('/:id/actions',async(req,res,next)=>{try{const action=req.body.action;if(!['REVIEW','APPROVE','REJECT','CANCEL','PAY'].includes(action))throw fail('Action invalide');const result=await mutate(req,'expense.request.'+action.toLowerCase(),ExpenseRequest,async(owner,actor,c,t)=>{
 const row=await ExpenseRequest.findOne({where:{id:req.params.id,userId:owner.id,...scope(actor)},transaction:t,lock:t.LOCK.UPDATE});if(!row)throw fail('Demande introuvable',404);if(row.status!==req.body.expectedStatus)throw fail('Demande modifiée : actualisez',409);
 const reason=text(req.body.reason,250);if(req.body.confirm!==true)throw fail('Confirmation requise');
 if(action==='CANCEL'){if(!['PENDING','APPROVED'].includes(row.status)||!admin(actor)&&(row.status!=='PENDING'||actor.id!==row.requesterId||!requester(actor)))throw fail('Annulation non autorisée',409);await row.update({status:'CANCELLED'},{transaction:t});}
 else if(action==='REVIEW'){
 if(!reviewer(actor)||actor.id===row.requesterId)throw fail('Contrôleur indépendant requis',403);
 if(row.status!=='PENDING'||row.reviewedBy!=null||row.currency!==c||!await dual(row,c,t))throw fail('Contrôle non applicable ou déjà enregistré',409);
 await row.update({reviewedBy:actor.id},{transaction:t});
 }
 else{if(!admin(actor)||actor.id===row.requesterId||actor.id===row.reviewedBy)throw fail('Approbateur indépendant requis',403);
 if(action==='APPROVE'||action==='REJECT'){if(row.status!=='PENDING')throw fail('Demande déjà traitée',409);if(action==='APPROVE'&&row.currency!==c)throw fail('Devise modifiée : nouvelle demande requise',409);if(action==='APPROVE'&&await dual(row,c,t)&&!row.reviewedBy)throw fail('Premier contrôle indépendant requis',409);if(action==='APPROVE')await budgets.guard(owner.id,c,row.budgetCenterId,row.amount,t);await row.update(action==='APPROVE'?{status:'APPROVED',approvedBy:actor.id}:{status:'REJECTED'},{transaction:t});}
 else{if(row.status!=='APPROVED'||row.currency!==c)throw fail('Demande approuvée dans la devise actuelle requise',409);if(await dual(row,c,t)&&!row.reviewedBy)throw fail('Nouveau seuil de double validation : annulez et soumettez une nouvelle demande',409);const ctx=await prepare(req,t,Number(row.amount),row.currency);await budgets.guard(owner.id,c,row.budgetCenterId,ctx.converted,t,row.id);const expense=await Depense.create({userId:owner.id,actorId:actor.id,description:row.description,categorie:row.category,montant:ctx.amount,devise:ctx.devise,accountingCurrency:ctx.base,tauxChange:ctx.rate,cashSessionId:ctx.session.id,budgetCenterId:row.budgetCenterId,reference:'APP-'+row.id},{transaction:t});await pay(req,t,ctx,'EXPENSE',expense.id,'OPERATING_EXPENSE');await row.update({status:'PAID',expenseId:expense.id},{transaction:t});}}
 await event(row,actor,action,reason,t);return row;
 });return sendResponse(res,result.replayed?200:201,result.row,'Action enregistrée');}catch(e){next(e)}});
module.exports=router;
