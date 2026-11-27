const router=require('express').Router();
const {protect,authorize}=require('../middleware/authMiddleware');
const {sequelize}=require('../config/database');
const {PlatformIncident,GlobalSetting,Activite}=require('../models');
const {sendResponse}=require('../utils/response');
const {fail}=require('../utils/transactionSafety');
const metrics=require('../utils/operationalMetrics');
const flags=require('../utils/platformFlags');
const redis=require('../utils/redis');
const statuses=['OPEN','INVESTIGATING','MONITORING','RESOLVED'],severity=['LOW','MEDIUM','HIGH','CRITICAL'],components=['API','DATABASE','CACHE','AUTH','BILLING','SUPPORT','OTHER'];
const clean=(value,max)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw fail('Texte invalide');return value.trim()};
const audit=(req,type,description,transaction)=>Activite.create({UserId:req.user.id,shopId:req.user.id,type,description,module:'Platform'},{transaction});
router.use(protect,authorize('superadmin'));
router.get('/metrics',async(req,res,next)=>{try{
 const start=Date.now();await sequelize.query('SELECT 1');const dbMs=Date.now()-start;
 const raw=process.env.RAILWAY_GIT_COMMIT_SHA||process.env.GITHUB_SHA||'';
 return sendResponse(res,200,{...metrics.snapshot(),services:{database:{status:'reachable',queryMs:dbMs},cache:{mode:redis.connectionMode()},runtime:{node:process.version,uptimeSeconds:Math.floor(process.uptime()),rssBytes:process.memoryUsage().rss}},release:{packageVersion:require('../package.json').version,commit:/^[a-f0-9]{7,64}$/i.test(raw)?raw.slice(0,12):null}},'Mesures du processus');
}catch(e){next(e)}});
router.get('/incidents',async(req,res,next)=>{try{
 const page=Math.max(1,Math.min(100000,parseInt(req.query.page)||1)),limit=Math.max(1,Math.min(100,parseInt(req.query.limit)||20)),where={};
 if(statuses.includes(req.query.status))where.status=req.query.status;
 const result=await PlatformIncident.findAndCountAll({where,order:[['updatedAt','DESC'],['id','DESC']],limit,offset:(page-1)*limit});
 return sendResponse(res,200,{rows:result.rows,total:result.count,page,limit},'Incidents');
}catch(e){next(e)}});
router.post('/incidents',async(req,res,next)=>{try{
 const {component,severity:level}=req.body;if(!components.includes(component)||!severity.includes(level))throw fail('Composant ou sévérité invalide');
 const title=clean(req.body.title,160),summary=clean(req.body.summary,3000);
 const row=await sequelize.transaction(async transaction=>{const incident=await PlatformIncident.create({title,summary,component,severity:level,createdBy:req.user.id},{transaction});await audit(req,'PLATFORM_INCIDENT_CREATE','Incident #'+incident.id+' · '+level,transaction);return incident;});
 return sendResponse(res,201,row,'Incident déclaré');
}catch(e){next(e)}});
router.patch('/incidents/:id',async(req,res,next)=>{try{
 const reason=clean(req.body.reason,250),status=req.body.status;if(!statuses.includes(status))throw fail('Statut invalide');
 const result=await sequelize.transaction(async transaction=>{const row=await PlatformIncident.findByPk(req.params.id,{transaction,lock:transaction.LOCK.UPDATE});if(!row)throw fail('Incident introuvable',404);
 const previous=row.status;await row.update({status,resolvedAt:status==='RESOLVED'?(row.resolvedAt||new Date()):null},{transaction});await audit(req,'PLATFORM_INCIDENT_UPDATE','Incident #'+row.id+' : '+previous+' → '+status+' — '+reason,transaction);return row;});
 return sendResponse(res,200,result,'Incident mis à jour');
}catch(e){next(e)}});
router.get('/flags',async(req,res,next)=>{try{return sendResponse(res,200,await flags.list(),'Contrôles de disponibilité');}catch(e){next(e)}});
router.put('/flags/:key',async(req,res,next)=>{try{
 const key=req.params.key,{enabled}=req.body,reason=clean(req.body.reason,250);
 if(!Object.hasOwn(flags.definitions,key)||typeof enabled!=='boolean')throw fail('Contrôle invalide');
 await sequelize.transaction(async transaction=>{await sequelize.query('SELECT pg_advisory_xact_lock(5140320)',{transaction});const [row,created]=await GlobalSetting.findOrCreate({where:{key:'flag:'+key},defaults:{value:String(enabled)},transaction});if(!created)await row.update({value:String(enabled)},{transaction});await audit(req,'PLATFORM_FLAG_UPDATE',key+' : '+enabled+' — '+reason,transaction);});
 return sendResponse(res,200,await flags.list(),'Contrôle mis à jour');
}catch(e){next(e)}});
module.exports=router;
