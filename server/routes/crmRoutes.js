const router=require('express').Router();
const {User,Client,Opportunity,OpportunityEvent,SalesTarget}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {protect}=require('../middleware/authMiddleware');
const {sendResponse}=require('../utils/response');
const {fail,money,currency,round}=require('../utils/transactionSafety');
const ledger=require('../utils/commercialLedger');
const {today}=require('../utils/lotService');
const rights=require('../utils/planEntitlements');
const stages=['NEW','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST'];
const active=stages.slice(0,4);
const owner=u=>u.role==='admin'&&!u.parentId;
const member=u=>!!u.parentId&&!['admin','superadmin'].includes(u.role)&&u.permissions?.includes('crm.manage');
const allowed=u=>owner(u)||member(u);
const scope=u=>({userId:u.tenantId,...(owner(u)?{}:{assigneeId:u.id})});
const clean=(v,n,optional=false)=>{if(optional&&(v===null||v===undefined||v===''))return null;if(typeof v!=='string'||!v.trim()||v.trim().length>n)throw fail('Texte invalide');return v.trim()};
const id=v=>{if(!Number.isSafeInteger(v)||v<=0)throw fail('Identifiant invalide');return v};
const day=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw fail('Date invalide');return v};
const month=v=>{day(v);if(!v.endsWith('-01'))throw fail('Début de mois requis');return v};
const amount=(v,c,zero=false)=>{const n=money(v);if((!zero&&n<=0)||round(n,c)!==n)throw fail('Montant invalide');return n};
const paging=q=>({page:Math.max(1,Math.min(100000,parseInt(q.page)||1)),limit:Math.max(1,Math.min(100,parseInt(q.limit)||20))});
router.use(protect,(req,res,next)=>allowed(req.user)?next():next(fail('Accès CRM refusé',403)));
async function mutate(req,op,model,fn){if(!req.body.operationId)throw fail('Clé de transaction requise');return sequelize.transaction(async t=>{
 const uid=req.user.tenantId,org=await User.findByPk(uid,{transaction:t,lock:t.LOCK.UPDATE});if(!org||!owner(org)||org.isSuspended)throw fail('Entreprise indisponible',403);
 const actor=req.user.id===uid?org:await User.findOne({where:{id:req.user.id,parentId:uid},transaction:t,lock:t.LOCK.UPDATE});
 if(!actor||actor.isSuspended||!allowed(actor))throw fail('Accès révoqué',403);
 const prior=await ledger.replay(req,op,t);if(prior){const row=await model.findOne({where:{id:prior.resourceId,userId:uid,...(model===Opportunity&&!owner(actor)?{assigneeId:actor.id}:{})},transaction:t});if(!row)throw fail('Historique indisponible',409);return {row,replayed:true};}
 if(op==='crm.create')await rights.check(uid,'crmCreate',t);
 const row=await fn(org,actor,t);await ledger.remember(req,op,row.id,t);return {row,replayed:false};
 });}
async function assign(org,actor,value,t){const assignee=id(value??actor.id);if(!owner(actor)&&assignee!==actor.id)throw fail('Attribution réservée au propriétaire',403);if(assignee===org.id)return assignee;
 const u=await User.findOne({where:{id:assignee,parentId:org.id,isSuspended:false},transaction:t});if(!u||!member(u))throw fail('Commercial non habilité',404);return assignee;}
async function fields(org,actor,b,t){const c=currency(org.entreprise?.devise);if(b.currency!==c)throw fail('Devise comptable requise');const clientId=b.clientId==null?null:id(b.clientId);if(clientId&&!await Client.findOne({where:{id:clientId,userId:org.id},transaction:t}))throw fail('Client introuvable',404);
 const contactEmail=clean(b.contactEmail,254,true);if(contactEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))throw fail('Email invalide');
 return {assigneeId:await assign(org,actor,b.assigneeId,t),clientId,title:clean(b.title,160),contactName:clean(b.contactName,160),contactPhone:clean(b.contactPhone,50,true),contactEmail,amount:amount(b.amount,c,true),currency:c,followUpOn:b.followUpOn?day(b.followUpOn):null};}
async function event(row,actor,kind,note,t){const {stage,assigneeId,version,followUpOn,amount,currency,clientId}=row;await OpportunityEvent.create({userId:row.userId,opportunityId:row.id,actorId:actor.id,kind,note,snapshot:{stage,assigneeId,version,followUpOn,amount,currency,clientId}},{transaction:t});}
router.get('/context',async(req,res,next)=>{try{const u=req.user,uid=u.tenantId,org=await User.findByPk(uid,{attributes:['entreprise']});
 const people=owner(u)?await User.findAll({where:{[Op.or]:[{id:uid},{parentId:uid,isSuspended:false}]},attributes:['id','nom','role','parentId','permissions'],order:[['nom','ASC']]}):[];
 return sendResponse(res,200,{actorId:u.id,owner:owner(u),currency:currency(org.entreprise?.devise),today:today(),canCreate:(await rights.describe(uid)).crmCreate,assignees:people.filter(allowed).map(x=>({id:x.id,nom:x.nom})),stages},'Contexte CRM');}catch(e){next(e)}});
router.get('/opportunities',async(req,res,next)=>{try{const {page,limit}=paging(req.query),base=scope(req.user),where={...base};if(stages.includes(req.query.stage))where.stage=req.query.stage;
 if(req.query.due==='true'){where.stage={[Op.in]:active};where.followUpOn={[Op.lte]:today()};}
 if(typeof req.query.q==='string'&&req.query.q.trim())where[Op.or]=[{title:{[Op.iLike]:'%'+req.query.q.trim().slice(0,100)+'%'}},{contactName:{[Op.iLike]:'%'+req.query.q.trim().slice(0,100)+'%'}}];
 const r=await Opportunity.findAndCountAll({where,order:[['updatedAt','DESC'],['id','DESC']],limit,offset:(page-1)*limit});
 const counts=await Opportunity.findAll({where:base,attributes:['stage','currency',[sequelize.fn('COUNT',sequelize.col('id')),'count'],[sequelize.fn('SUM',sequelize.col('amount')),'value']],group:['stage','currency'],raw:true});
 return sendResponse(res,200,{rows:r.rows,total:r.count,page,limit,counts},'Pipeline');}catch(e){next(e)}});
router.get('/opportunities/:id/events',async(req,res,next)=>{try{const row=await Opportunity.findOne({where:{...scope(req.user),id:req.params.id}});if(!row)throw fail('Opportunité introuvable',404);const {page,limit}=paging(req.query),r=await OpportunityEvent.findAndCountAll({where:{userId:row.userId,opportunityId:row.id},order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{opportunity:row,rows:r.rows,total:r.count,page,limit},'Historique CRM');}catch(e){next(e)}});
router.post('/opportunities',async(req,res,next)=>{try{const r=await mutate(req,'crm.create',Opportunity,async(org,actor,t)=>{const row=await Opportunity.create({userId:org.id,actorId:actor.id,...await fields(org,actor,req.body,t),stage:'NEW',version:1},{transaction:t});await event(row,actor,'CREATE','Opportunité créée',t);return row;});return sendResponse(res,r.replayed?200:201,r.row,'Opportunité créée');}catch(e){next(e)}});
router.post('/opportunities/:id/actions',async(req,res,next)=>{try{const action=req.body.action;if(!['UPDATE','MOVE','NOTE'].includes(action))throw fail('Action invalide');
 const r=await mutate(req,'crm.'+action.toLowerCase(),Opportunity,async(org,actor,t)=>{
 const row=await Opportunity.findOne({where:{userId:org.id,id:req.params.id,...(owner(actor)?{}:{assigneeId:actor.id})},transaction:t,lock:t.LOCK.UPDATE});if(!row)throw fail('Opportunité introuvable',404);if(row.version!==req.body.expectedVersion)throw fail('Dossier modifié : actualisez',409);
 const note=clean(req.body.note,500);const patch={version:row.version+1};
 if(action==='MOVE'){if(!active.includes(row.stage)||!stages.includes(req.body.stage)||req.body.stage===row.stage)throw fail('Transition invalide',409);if(['WON','LOST'].includes(req.body.stage)&&req.body.confirm!==true)throw fail('Confirmation requise');patch.stage=req.body.stage;if(!active.includes(patch.stage))patch.followUpOn=null;}
 if(action==='UPDATE'){if(!active.includes(row.stage))throw fail('Opportunité clôturée',409);Object.assign(patch,await fields(org,actor,req.body,t));}
 await row.update(patch,{transaction:t});await event(row,actor,action,note,t);return row;});return sendResponse(res,r.replayed?200:201,r.row,'Action enregistrée');}catch(e){next(e)}});
router.get('/performance',async(req,res,next)=>{try{const uid=req.user.tenantId,start=month(req.query.month||today().slice(0,7)+'-01'),c=currency(req.query.currency),endDate=new Date(start+'T00:00:00Z');endDate.setUTCMonth(endDate.getUTCMonth()+1);const end=endDate.toISOString().slice(0,10),seller=owner(req.user)?null:req.user.id;
 const result=await sequelize.transaction({isolationLevel:'REPEATABLE READ'},async t=>{
 const [actual]=await sequelize.query(`SELECT COALESCE(s."sellerId",s."userId") AS "sellerKey",COALESCE(SUM(CASE WHEN j.event='SALE' THEN j.amount ELSE -j.amount END),0)::text AS net,COUNT(*) FILTER(WHERE j.event='SALE')::integer AS sales,COUNT(*) FILTER(WHERE j.event='REFUND_SALE')::integer AS refunds,COUNT(DISTINCT s."clientId") FILTER(WHERE j.event='SALE')::integer AS clients FROM "JournalEntries" j JOIN "Sales" s ON s."userId"=j."userId" AND s.id::text=j.reference WHERE j."userId"=:uid AND j.currency=:c AND j.event IN ('SALE','REFUND_SALE') AND j."createdAt">=(CAST(:start AS date)::timestamp AT TIME ZONE 'Africa/Kinshasa') AND j."createdAt"<(CAST(:end AS date)::timestamp AT TIME ZONE 'Africa/Kinshasa') AND (CAST(:seller AS integer) IS NULL OR COALESCE(s."sellerId",s."userId")=:seller) GROUP BY COALESCE(s."sellerId",s."userId")`,{replacements:{uid,c,start,end,seller},transaction:t});
 const [targets]=await sequelize.query('SELECT DISTINCT ON ("sellerKey") * FROM "SalesTargets" WHERE "userId"=:uid AND currency=:c AND month=:start AND (CAST(:seller AS integer) IS NULL OR "sellerKey"=:seller) ORDER BY "sellerKey",id DESC',{replacements:{uid,c,start,seller},transaction:t});
 const keys=[...new Set([...actual.map(r=>r.sellerKey),...targets.map(r=>r.sellerKey)].filter(k=>k!==0))];
 const people=keys.length?await User.findAll({where:{id:keys,[Op.or]:[{id:uid},{parentId:uid}]},attributes:['id','nom'],transaction:t}):[];
 const rows=keys.map(k=>{const a=actual.find(v=>v.sellerKey===k),target=targets.find(v=>v.sellerKey===k);return {sellerKey:k,name:people.find(p=>p.id===k)?.nom||'#'+k,net:a?.net||'0',sales:a?.sales||0,refunds:a?.refunds||0,clients:a?.clients||0,target:target||null}}).sort((a,b)=>Number(b.net)-Number(a.net));
 const teamNet=owner(req.user)?rows.reduce((sum,r)=>sum+require('../utils/budgetService').minor(r.net),0n):null;
 return {rows,teamNet:teamNet===null?null:require('../utils/budgetService').decimal(teamNet),teamTarget:targets.find(r=>r.sellerKey===0)||null,month:start,currency:c,coverage:'posted-sale-net-only'};
 });return sendResponse(res,200,result,'Performance commerciale');}catch(e){next(e)}});
router.post('/targets',async(req,res,next)=>{try{const r=await mutate(req,'crm.target',SalesTarget,async(org,actor,t)=>{if(!owner(actor)||req.body.confirm!==true)throw fail('Propriétaire et confirmation requis',403);
 const start=month(req.body.month),c=currency(org.entreprise?.devise),key=req.body.sellerKey;if(start<today().slice(0,7)+'-01'||req.body.currency!==c)throw fail('Période ou devise invalide');
 if(!Number.isSafeInteger(key)||key<0)throw fail('Commercial invalide');if(key&&key!==org.id&&!await User.findOne({where:{id:key,parentId:org.id,isSuspended:false},transaction:t}))throw fail('Commercial introuvable',404);
 const where={userId:org.id,sellerKey:key,currency:c,month:start},previous=await SalesTarget.findOne({where,order:[['id','DESC']],transaction:t});if((previous?.id??null)!==req.body.expectedTargetId)throw fail('Objectif modifié : actualisez',409);
 return SalesTarget.create({...where,actorId:actor.id,amount:amount(req.body.amount,c),reason:clean(req.body.reason,250)},{transaction:t});});return sendResponse(res,r.replayed?200:201,r.row,'Objectif enregistré');}catch(e){next(e)}});
router.get('/targets/history',async(req,res,next)=>{try{if(!owner(req.user))throw fail('Propriétaire requis',403);const {page,limit}=paging(req.query),key=Number(req.query.sellerKey);if(!Number.isSafeInteger(key)||key<0)throw fail('Commercial invalide');const r=await SalesTarget.findAndCountAll({where:{userId:req.user.tenantId,sellerKey:key,currency:currency(req.query.currency),month:month(req.query.month)},order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{rows:r.rows,total:r.count,page,limit},'Historique des objectifs');}catch(e){next(e)}});
router.get('/segments',async(req,res,next)=>{try{if(!owner(req.user))throw fail('Propriétaire requis',403);const uid=req.user.tenantId,{page,limit}=paging(req.query),c=currency(req.query.currency);
 const [rows]=await sequelize.query(`WITH posted AS (SELECT s."clientId",COUNT(*) FILTER(WHERE j.event='SALE')::integer AS sales,COUNT(*) FILTER(WHERE j.event='REFUND_SALE')::integer AS refunds,SUM(CASE WHEN j.event='SALE' THEN j.amount ELSE -j.amount END)::text AS net,MAX(j."createdAt") FILTER(WHERE j.event='SALE') AS last FROM "JournalEntries" j JOIN "Sales" s ON s."userId"=j."userId" AND s.id::text=j.reference WHERE j."userId"=:uid AND j.currency=:c AND j.event IN ('SALE','REFUND_SALE') AND s."clientId" IS NOT NULL GROUP BY s."clientId") SELECT c.id,c.nom,COALESCE(p.sales,0) AS sales,COALESCE(p.refunds,0) AS refunds,COALESCE(p.net,'0') AS net,p.last,CASE WHEN COALESCE(p.sales,0)=0 THEN 'NO_POSTED_SALE' WHEN p.last<now()-interval '90 days' THEN 'DORMANT' WHEN p.sales>=2 THEN 'RETURNING' ELSE 'NEW' END AS segment FROM "Clients" c LEFT JOIN posted p ON p."clientId"=c.id WHERE c."userId"=:uid AND c."deletedAt" IS NULL ORDER BY p.last DESC NULLS LAST,c.id LIMIT :limit OFFSET :offset`,{replacements:{uid,c,limit,offset:(page-1)*limit}});
 return sendResponse(res,200,{rows,total:await Client.count({where:{userId:uid}}),page,limit,currency:c},'Segments clients');}catch(e){next(e)}});
module.exports=router;
