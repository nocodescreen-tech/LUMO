const router=require('express').Router();
const {User,Organization,Branch,BudgetCenter,BudgetRevision}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {sendResponse}=require('../utils/response');
const {fail,money,round,currency}=require('../utils/transactionSafety');
const ledger=require('../utils/commercialLedger');
const svc=require('../utils/budgetService');
const {today}=require('../utils/lotService');
const {protect,authorize}=require('../middleware/authMiddleware');
const clean=(v,n)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>n)throw fail('Texte invalide');return v.trim()};
const paging=q=>({page:Math.max(1,Math.min(100000,parseInt(q.page)||1)),limit:Math.max(1,Math.min(50,parseInt(q.limit)||20))});
router.use(protect,authorize('admin'));
async function mutate(req,op,model,fn){if(!req.body.operationId||req.body.confirm!==true)throw fail('Clé et confirmation requises');
 return sequelize.transaction(async t=>{const owner=await User.findByPk(req.user.tenantId,{transaction:t,lock:t.LOCK.UPDATE});if(!owner||owner.role!=='admin'||owner.parentId||owner.isSuspended||owner.id!==req.user.id)throw fail('Propriétaire requis',403);
 const prior=await ledger.replay(req,op,t);if(prior){const row=await model.findOne({where:{id:prior.resourceId,userId:owner.id},transaction:t});if(!row)throw fail('Historique indisponible',409);return {row,replayed:true};}
 const row=await fn(owner,t);await ledger.remember(req,op,row.id,t);return {row,replayed:false};});}
router.get('/centers',async(req,res,next)=>{try{const uid=req.user.tenantId,{page,limit}=paging(req.query),where={userId:uid};if(typeof req.query.q==='string'&&req.query.q.trim())where.name={[Op.iLike]:'%'+req.query.q.trim().slice(0,120)+'%'};
 const [r,org,owner]=await Promise.all([BudgetCenter.findAndCountAll({where,order:[['name','ASC'],['id','ASC']],limit,offset:(page-1)*limit}),Organization.findOne({where:{ownerId:uid}}),User.findByPk(uid,{attributes:['entreprise']})]);const branches=org?await Branch.findAll({where:{organizationId:org.id,active:true},attributes:['id','name'],order:[['name','ASC']]}):[];
 return sendResponse(res,200,{rows:r.rows,total:r.count,page,limit,branches,currency:currency(owner.entreprise?.devise),today:today()},'Centres de coûts');}catch(e){next(e)}});
router.post('/centers',async(req,res,next)=>{try{const r=await mutate(req,'budget.center',BudgetCenter,async(owner,t)=>{const branchKey=req.body.branchKey;if(!Number.isSafeInteger(branchKey)||branchKey<0)throw fail('Succursale invalide');
 if(branchKey){const org=await Organization.findOne({where:{ownerId:owner.id},transaction:t});if(!org||!await Branch.findOne({where:{id:branchKey,organizationId:org.id,active:true},transaction:t}))throw fail('Succursale introuvable',404);}
 const department=clean(req.body.department,120),name=clean(req.body.name,120);
 if(await BudgetCenter.findOne({where:{userId:owner.id,branchKey,department:{[Op.iLike]:department.replace(/[\\%_]/g,'\\$&')},name:{[Op.iLike]:name.replace(/[\\%_]/g,'\\$&')}},transaction:t}))throw fail('Centre déjà créé',409);
 return BudgetCenter.create({userId:owner.id,actorId:owner.id,branchKey,department,name},{transaction:t});});return sendResponse(res,r.replayed?200:201,r.row,'Centre créé');}catch(e){next(e)}});
router.get('/',async(req,res,next)=>{try{const uid=req.user.tenantId,{page,limit}=paging(req.query),kind=req.query.kind||'MONTH',start=req.query.start||svc.periods()[kind];svc.bounds(kind,start);
 const owner=await User.findByPk(uid,{attributes:['entreprise']}),c=currency(req.query.currency||owner.entreprise?.devise);
 const result=await sequelize.transaction({isolationLevel:'REPEATABLE READ'},async t=>{
 const [latest]=await sequelize.query('SELECT DISTINCT ON ("centerId") * FROM "BudgetRevisions" WHERE "userId"= :uid AND currency= :c AND "periodKind"= :kind AND "periodStart"= :start ORDER BY "centerId",id DESC',{replacements:{uid,c,kind,start},transaction:t});
 const rows=[];for(const p of latest.slice((page-1)*limit,page*limit)){const center=await BudgetCenter.findOne({where:{id:p.centerId,userId:uid},transaction:t});rows.push({...p,center,...await svc.figures(p,t)});}
 const {end}=svc.bounds(kind,start);
 const [unallocated]=await sequelize.query(`SELECT COALESCE(SUM(CASE WHEN j.event='EXPENSE' THEN j.amount ELSE -j.amount END),0)::text AS amount FROM "JournalEntries" j JOIN "Depenses" e ON e."userId"=j."userId" AND e.id::text=j.reference WHERE j."userId"= :uid AND e."budgetCenterId" IS NULL AND j.currency= :c AND j.event IN ('EXPENSE','EXPENSE_REVERSAL') AND j."createdAt">=(CAST(:start AS date)::timestamp AT TIME ZONE 'Africa/Kinshasa') AND j."createdAt"<(CAST(:end AS date)::timestamp AT TIME ZONE 'Africa/Kinshasa')`,{replacements:{uid,c,start,end},transaction:t});
 return {rows,total:latest.length,page,limit,kind,start,currency:c,unallocated:unallocated[0].amount,coverage:'general-expense-journal-only',today:today()};});return sendResponse(res,200,result,'Budgets');}catch(e){next(e)}});
router.get('/history',async(req,res,next)=>{try{const uid=req.user.tenantId,centerId=Number(req.query.centerId),kind=req.query.kind,start=req.query.start,c=currency(req.query.currency),{page,limit}=paging(req.query);svc.bounds(kind,start);if(!Number.isSafeInteger(centerId)||centerId<=0)throw fail('Centre invalide');if(!await BudgetCenter.findOne({where:{userId:uid,id:centerId}}))throw fail('Centre introuvable',404);const r=await BudgetRevision.findAndCountAll({where:{userId:uid,centerId,currency:c,periodKind:kind,periodStart:start},order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{rows:r.rows,total:r.count,page,limit},'Historique budgétaire');}catch(e){next(e)}});
router.post('/revisions',async(req,res,next)=>{try{const r=await mutate(req,'budget.revision',BudgetRevision,async(owner,t)=>{const {centerId,periodKind,periodStart,mode,expectedRevisionId}=req.body,c=currency(owner.entreprise?.devise);const {end}=svc.bounds(periodKind,periodStart);
 if(end<=today())throw fail('Période passée : modification interdite',409);
 if(req.body.currency!==c||!['WARN','BLOCK'].includes(mode)||!Number.isSafeInteger(centerId)||centerId<=0)throw fail('Paramètres invalides');
 if(!await BudgetCenter.findOne({where:{id:centerId,userId:owner.id},transaction:t}))throw fail('Centre introuvable',404);
 const amount=money(req.body.amount);if(amount<=0||round(amount,c)!==amount)throw fail('Montant ou précision invalide');
 const where={userId:owner.id,centerId,currency:c,periodKind,periodStart},previous=await BudgetRevision.findOne({where,order:[['id','DESC']],transaction:t});
 if((previous?.id??null)!==expectedRevisionId)throw fail('Budget modifié : actualisez',409);
 const proposal={...where,amount,mode},f=await svc.figures(proposal,t);if(mode==='BLOCK'&&svc.minor(amount)<svc.minor(f.actual)+svc.minor(f.committed??'0'))throw fail('Le plafond est inférieur aux dépenses et engagements existants',409);
 return BudgetRevision.create({...proposal,actorId:owner.id,reason:clean(req.body.reason,250)},{transaction:t});});return sendResponse(res,r.replayed?200:201,r.row,'Révision enregistrée');}catch(e){next(e)}});
module.exports=router;
