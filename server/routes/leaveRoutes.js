const router=require('express').Router();
const {protect}=require('../middleware/authMiddleware');
const {User,LeaveRequest,LeaveEvent}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {sendResponse}=require('../utils/response');
const {fail}=require('../utils/transactionSafety');
const ledger=require('../utils/commercialLedger');
const {today}=require('../utils/lotService');
const kinds=['ANNUAL','PERSONAL','SICK','FAMILY','OTHER'];
const states=['PENDING','APPROVED','REJECTED','CANCELLED'];
const owner=u=>u.role==='admin'&&!u.parentId;
const staff=u=>!!u.parentId&&!['admin','superadmin'].includes(u.role);
const clean=(v)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>250)throw fail('Motif requis (250 caractères maximum)');return v.trim()};
const day=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw fail('Date invalide');return v;};
const span=(a,b,max)=>{if(a>b||(Date.parse(b)-Date.parse(a))/86400000+1>max)throw fail('Période invalide');};
const paging=q=>({page:Math.max(1,Math.min(100000,parseInt(q.page)||1)),limit:Math.max(1,Math.min(100,parseInt(q.limit)||20))});
const visible=u=>({userId:u.tenantId,...(owner(u)?{}:{staffId:u.id})});
router.use(protect,(req,res,next)=>owner(req.user)||staff(req.user)?next():next(fail('Accès RH refusé',403)));
async function mutate(req,operation,fn){if(!req.body.operationId)throw fail('Clé de transaction requise');return sequelize.transaction(async t=>{
 const uid=req.user.tenantId,org=await User.findByPk(uid,{transaction:t,lock:t.LOCK.UPDATE});
 if(!org||!owner(org)||org.isSuspended)throw fail('Entreprise indisponible',403);
 const actor=req.user.id===uid?org:await User.findOne({where:{id:req.user.id,parentId:uid},transaction:t,lock:t.LOCK.UPDATE});
 if(!actor||actor.isSuspended||!owner(actor)&&!staff(actor))throw fail('Accès révoqué',403);
 const prior=await ledger.replay(req,operation,t);
 if(prior){const row=await LeaveRequest.findOne({where:{id:prior.resourceId,userId:uid,...(owner(actor)?{}:{staffId:actor.id})},transaction:t});if(!row)throw fail('Historique indisponible',409);return {row,replayed:true};}
 const row=await fn(org,actor,t);await ledger.remember(req,operation,row.id,t);return {row,replayed:false};
 });}
async function event(row,actor,kind,reason,t){await LeaveEvent.create({userId:row.userId,requestId:row.id,actorId:actor.id,kind,reason},{transaction:t});}
async function decorate(rows,uid){const ids=[...new Set(rows.map(r=>r.staffId))];const people=await User.findAll({where:{parentId:uid,id:ids},attributes:['id','nom']});return rows.map(r=>({...r.toJSON(),staffName:people.find(p=>p.id===r.staffId)?.nom??null}));}
router.get('/',async(req,res,next)=>{try{const {page,limit}=paging(req.query),where=visible(req.user);if(states.includes(req.query.status))where.status=req.query.status;
 const r=await LeaveRequest.findAndCountAll({where,order:[['id','DESC']],limit,offset:(page-1)*limit});const counts=await LeaveRequest.findAll({where:visible(req.user),attributes:['status',[sequelize.fn('COUNT',sequelize.col('id')),'count']],group:['status'],raw:true});
 return sendResponse(res,200,{rows:await decorate(r.rows,req.user.tenantId),total:r.count,page,limit,counts,canDecide:owner(req.user),canSubmit:staff(req.user),today:today()},'Congés');}catch(e){next(e)}});
router.get('/calendar',async(req,res,next)=>{try{const from=day(req.query.from),to=day(req.query.to);span(from,to,93);const {page,limit}=paging(req.query);
 const r=await LeaveRequest.findAndCountAll({where:{...visible(req.user),status:'APPROVED',startsOn:{[Op.lte]:to},endsOn:{[Op.gte]:from}},order:[['startsOn','ASC'],['id','ASC']],limit,offset:(page-1)*limit});
 const rows=(await decorate(r.rows,req.user.tenantId)).map(({id,staffId,staffName,startsOn,endsOn,kind})=>({id,staffId,staffName,startsOn,endsOn,kind}));
 return sendResponse(res,200,{rows,total:r.count,page,limit,from,to,timezone:'Africa/Kinshasa'},'Planning des congés');}catch(e){next(e)}});
router.get('/:id/events',async(req,res,next)=>{try{const row=await LeaveRequest.findOne({where:{...visible(req.user),id:req.params.id}});if(!row)throw fail('Demande introuvable',404);const {page,limit}=paging(req.query),r=await LeaveEvent.findAndCountAll({where:{userId:row.userId,requestId:row.id},order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{request:(await decorate([row],row.userId))[0],rows:r.rows,total:r.count,page,limit},'Historique des congés');}catch(e){next(e)}});
router.post('/',async(req,res,next)=>{try{const r=await mutate(req,'leave.submit',async(org,actor,t)=>{
 if(!staff(actor))throw fail('Demande réservée aux collaborateurs',403);
 const startsOn=day(req.body.startsOn),endsOn=day(req.body.endsOn),kind=req.body.kind,note=clean(req.body.note);
 span(startsOn,endsOn,366);if(startsOn<today()||!kinds.includes(kind))throw fail('Type ou date de départ invalide');
 if(req.body.confirm!==true)throw fail('Confirmation requise');
 const active={userId:org.id,staffId:actor.id,status:{[Op.in]:['PENDING','APPROVED']}};
 if(await LeaveRequest.count({where:{...active,status:'PENDING'},transaction:t})>=30)throw fail('Trop de demandes en attente',409);
 if(await LeaveRequest.findOne({where:{...active,startsOn:{[Op.lte]:endsOn},endsOn:{[Op.gte]:startsOn}},transaction:t}))throw fail('Période déjà demandée ou approuvée',409);
 const row=await LeaveRequest.create({userId:org.id,staffId:actor.id,kind,startsOn,endsOn,note,status:'PENDING'},{transaction:t});await event(row,actor,'SUBMIT','Demande soumise',t);return row;
 });return sendResponse(res,r.replayed?200:201,r.row,'Demande enregistrée');}catch(e){next(e)}});
router.post('/:id/actions',async(req,res,next)=>{try{const action=req.body.action;if(!['APPROVE','REJECT','CANCEL'].includes(action))throw fail('Action invalide');
 const r=await mutate(req,'leave.'+action.toLowerCase(),async(org,actor,t)=>{
 const row=await LeaveRequest.findOne({where:{id:req.params.id,userId:org.id,...(owner(actor)?{}:{staffId:actor.id})},transaction:t,lock:t.LOCK.UPDATE});
 if(!row)throw fail('Demande introuvable',404);if(row.status!==req.body.expectedStatus)throw fail('Demande modifiée : actualisez',409);
 const reason=clean(req.body.reason);if(req.body.confirm!==true)throw fail('Confirmation requise');
 if(action==='CANCEL'){if(row.status!=='PENDING'&&!(owner(actor)&&row.status==='APPROVED'&&row.startsOn>today()))throw fail('Annulation non autorisée',409);await row.update({status:'CANCELLED'},{transaction:t});}
 else{if(!owner(actor)||actor.id===row.staffId)throw fail('Approbateur indépendant requis',403);if(row.status!=='PENDING')throw fail('Demande déjà traitée',409);
 if(action==='APPROVE'){if(row.startsOn<today())throw fail('Demande expirée : décision de refus ou annulation requise',409);const employee=await User.findOne({where:{id:row.staffId,parentId:org.id,isSuspended:false},transaction:t});if(!employee)throw fail('Collaborateur indisponible',409);}
 await row.update({status:action==='APPROVE'?'APPROVED':'REJECTED',decidedBy:actor.id},{transaction:t});}
 await event(row,actor,action,reason,t);return row;
 });return sendResponse(res,r.replayed?200:201,r.row,'Décision enregistrée');}catch(e){next(e)}});
module.exports=router;
