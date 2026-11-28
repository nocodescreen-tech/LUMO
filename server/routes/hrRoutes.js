const router=require('express').Router();
const {protect,authorize}=require('../middleware/authMiddleware');
const {User,StaffProfileRevision,AttendanceRevision,Organization,Branch}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {sendResponse}=require('../utils/response');
const {fail}=require('../utils/transactionSafety');
const ledger=require('../utils/commercialLedger');
const {today}=require('../utils/lotService');
const states=['PRESENT','ABSENT','LEAVE','REST','UNRECORDED'];
const contracts=['UNSPECIFIED','PERMANENT','FIXED_TERM','INTERN','OTHER'];
const text=(v,max)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw fail('Texte invalide');return v.trim()};
const date=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v||v>today())throw fail('Date passée ou actuelle requise');return v};
const integer=v=>{if(!Number.isSafeInteger(v)||v<=0)throw fail('Identifiant invalide');return v};
const paging=q=>({page:Math.max(1,Math.min(100000,parseInt(q.page)||1)),limit:Math.max(1,Math.min(100,parseInt(q.limit)||20))});
async function member(uid,id,transaction){const row=await User.findOne({where:{id,parentId:uid},attributes:['id','nom','role','isSuspended'],transaction});if(!row)throw fail('Collaborateur introuvable',404);return row;}
router.use(protect,authorize('admin'));
router.use('/payroll',require('./payrollRoutes'));
router.get('/team',async(req,res,next)=>{try{const uid=req.user.tenantId,{page,limit}=paging(req.query),day=date(req.query.day||today()),where={parentId:uid};if(typeof req.query.q==='string'&&req.query.q.trim())where.nom={[Op.iLike]:'%'+req.query.q.trim().slice(0,100)+'%'};
 const data=await sequelize.transaction({isolationLevel:'REPEATABLE READ'},async transaction=>{
 const r=await User.findAndCountAll({where,attributes:['id','nom','role','isSuspended'],order:[['nom','ASC'],['id','ASC']],limit,offset:(page-1)*limit,transaction}),ids=r.rows.map(x=>x.id);
 const [profiles]=await sequelize.query('SELECT DISTINCT ON ("staffId") * FROM "StaffProfileRevisions" WHERE "userId"= :uid AND "staffId" IN (:ids) ORDER BY "staffId",id DESC',{replacements:{uid,ids:ids.length?ids:[-1]},transaction});
 const [attendance]=await sequelize.query('SELECT DISTINCT ON ("staffId") * FROM "AttendanceRevisions" WHERE "userId"= :uid AND day= :day AND "staffId" IN (:ids) ORDER BY "staffId",id DESC',{replacements:{uid,day,ids:ids.length?ids:[-1]},transaction});
 const [leaves]=await sequelize.query('SELECT "staffId",id,kind,"startsOn","endsOn" FROM "LeaveRequests" WHERE "userId"= :uid AND "staffId" IN (:ids) AND status=\'APPROVED\' AND "startsOn"<= :day AND "endsOn">= :day',{replacements:{uid,day,ids:ids.length?ids:[-1]},transaction});
 const [counts]=await sequelize.query('WITH latest AS (SELECT DISTINCT ON (a."staffId") a."staffId",a.status FROM "AttendanceRevisions" a JOIN "Users" u ON u.id=a."staffId" AND u."parentId"=a."userId" WHERE a."userId"= :uid AND a.day= :day ORDER BY a."staffId",a.id DESC) SELECT COALESCE(l.status,\'UNRECORDED\') AS status,COUNT(*)::integer AS count FROM "Users" u LEFT JOIN latest l ON l."staffId"=u.id WHERE u."parentId"= :uid GROUP BY COALESCE(l.status,\'UNRECORDED\')',{replacements:{uid,day},transaction});
 const org=await Organization.findOne({where:{ownerId:uid},transaction}),branches=org?await Branch.findAll({where:{organizationId:org.id,active:true},attributes:['id','name'],transaction}):[];
 return {rows:r.rows.map(u=>({...u.toJSON(),profile:profiles.find(p=>p.staffId===u.id)||null,attendance:attendance.find(p=>p.staffId===u.id)||null,plannedLeave:leaves.find(p=>p.staffId===u.id)||null})),total:r.count,page,limit,day,counts,branches,timezone:'Africa/Kinshasa'};
 });return sendResponse(res,200,data,'Personnel');
}catch(e){next(e)}});
router.get('/:id/history',async(req,res,next)=>{try{const uid=req.user.tenantId,id=integer(Number(req.params.id)),{page,limit}=paging(req.query);await member(uid,id);const model=req.query.kind==='profile'?StaffProfileRevision:AttendanceRevision;const r=await model.findAndCountAll({where:{userId:uid,staffId:id},order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{rows:r.rows,total:r.count,page,limit},'Historique RH');}catch(e){next(e)}});
async function save(req,kind){const uid=req.user.tenantId,id=integer(Number(req.params.id)),reason=text(req.body.reason,250),expected=req.body.expectedRevisionId;if(!(expected===null||Number.isSafeInteger(expected)&&expected>0)||!req.body.operationId)throw fail('Version et clé requises');
 const profile=kind==='profile',model=profile?StaffProfileRevision:AttendanceRevision,operation='hr.'+kind;
 return sequelize.transaction(async transaction=>{
 const owner=await User.findByPk(uid,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);
 const prior=await ledger.replay(req,operation,transaction);if(prior)return {row:await model.findOne({where:{id:prior.resourceId,userId:uid},transaction}),replayed:true};
 await member(uid,id,transaction);let fields={},where={userId:uid,staffId:id};
 if(profile){if(!contracts.includes(req.body.contractType))throw fail('Type de contrat invalide');fields={jobTitle:text(req.body.jobTitle,120),department:text(req.body.department,120),contractType:req.body.contractType,hiredOn:req.body.hiredOn?date(req.body.hiredOn):null};}
 else{const day=date(req.body.day),status=req.body.status,minutes=req.body.workedMinutes,branchKey=req.body.branchKey;if(!states.includes(status)||!(minutes===null||status==='PRESENT'&&Number.isInteger(minutes)&&minutes>=0&&minutes<=1440)||!(branchKey===null||Number.isSafeInteger(branchKey)&&branchKey>=0))throw fail('Présence invalide');
 if(branchKey>0){const org=await Organization.findOne({where:{ownerId:uid},transaction}),b=org&&await Branch.findOne({where:{id:branchKey,organizationId:org.id,active:true},transaction});if(!b)throw fail('Succursale introuvable',404);}
 fields={day,status,workedMinutes:minutes,branchKey};where.day=day;}
 const previous=await model.findOne({where,order:[['id','DESC']],transaction});if((previous?.id??null)!==expected)throw fail('Fiche modifiée : actualisez',409);
 const row=await model.create({userId:uid,staffId:id,actorId:req.user.id,reason,...fields},{transaction});await ledger.remember(req,operation,row.id,transaction);return {row,replayed:false};
 });
}
for(const kind of ['profile','attendance'])router.post('/:id/'+kind,async(req,res,next)=>{try{const r=await save(req,kind);return sendResponse(res,r.replayed?200:201,r.row,'Révision enregistrée');}catch(e){next(e)}});
module.exports=router;
