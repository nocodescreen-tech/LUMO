const {User,Organization,Subscription,Branch,Warehouse,Sale,Product,Activite,GlobalSetting,Newsletter}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {sendResponse}=require('../utils/response');
const {effective}=require('../utils/workspaceService');
const pageOf=q=>({page:Math.max(1,Math.min(100000,parseInt(q.page)||1)),limit:Math.max(1,Math.min(100,parseInt(q.limit)||25))});
const userFields=['id','nom','email','role','parentId','isVerified','isAdminValidated','isSuspended','createdAt','lastActivity','typeActivite'];
exports.overview=async(req,res,next)=>{try{
 const start=Date.now(),now=new Date(),since=new Date(+now-30*86400000);
 const [owners,staff,suspended,pending,recent,orgs,branches,warehouses,subscriptions,sales,products,newsletter,visits,settings]=await Promise.all([
 User.count({where:{role:'admin',parentId:null}}),User.count({where:{parentId:{[Op.ne]:null}}}),User.count({where:{isSuspended:true}}),User.count({where:{role:'admin',parentId:null,isAdminValidated:false}}),User.count({where:{lastActivity:{[Op.gte]:since},isSuspended:false}}),Organization.count(),Branch.count(),Warehouse.count(),Subscription.findAll({attributes:['status','endsAt','plan']}),Sale.count(),Product.count(),Newsletter.count(),Activite.count({where:{type:'LANDING_VISIT'}}),GlobalSetting.findAll({where:{key:['maintenance_mode','registration_enabled']}})
 ]);
 const counts={ACTIVE:0,TRIAL:0,EXPIRED:0,OTHER:0};for(const s of subscriptions){const status=effective(s);counts[Object.hasOwn(counts,status)?status:'OTHER']++;}
 const [growth]=await sequelize.query(`SELECT to_char(date_trunc('day',"createdAt" AT TIME ZONE 'UTC'),'YYYY-MM-DD') AS day,count(*)::int AS count FROM "Users" WHERE role='admin' AND "parentId" IS NULL AND "createdAt">= :since GROUP BY 1 ORDER BY 1`,{replacements:{since}});
 const config=Object.fromEntries(settings.map(s=>[s.key,s.value]));
 return sendResponse(res,200,{owners,staff,suspended,pending,recent,orgs,branches,warehouses,subscriptions:counts,sales,products,newsletter,visits,growth,maintenance:config.maintenance_mode==='true',registration:config.registration_enabled!=='false',generatedAt:now.toISOString(),system:{database:'reachable',requestMs:Date.now()-start,processUptimeSeconds:Math.floor(process.uptime()),node:process.version},billing:{collectedRevenue:null,mrr:null,reason:'No verified billing provider connected'}},'Supervision plateforme');
}catch(e){next(e)}};
exports.accounts=async(req,res,next)=>{try{
 const {page,limit}=pageOf(req.query),where={},q=typeof req.query.q==='string'?req.query.q.trim().slice(0,100):'';
 if(q)where[Op.or]=[{nom:{[Op.iLike]:'%'+q+'%'}},{email:{[Op.iLike]:'%'+q+'%'}}];
 if(req.query.kind==='owners'){where.role='admin';where.parentId=null;}else if(req.query.kind==='staff')where.parentId={[Op.ne]:null};
 if(req.query.status==='suspended')where.isSuspended=true;else if(req.query.status==='pending'){where.isAdminValidated=false;where.isSuspended=false;}else if(req.query.status==='active'){where.isAdminValidated=true;where.isVerified=true;where.isSuspended=false;}
 const result=await User.findAndCountAll({where,attributes:userFields,order:[['createdAt','DESC'],['id','DESC']],limit,offset:(page-1)*limit});
 const ids=result.rows.filter(u=>u.role==='admin'&&!u.parentId).map(u=>u.id);
 const orgs=await Organization.findAll({where:{ownerId:ids}}),subs=await Subscription.findAll({where:{organizationId:orgs.map(o=>o.id)}});
 const rows=result.rows.map(u=>{const org=orgs.find(o=>o.ownerId===u.id),sub=subs.find(s=>s.organizationId===org?.id);return {...u.toJSON(),organization:org?{id:org.id,name:org.name}:null,subscription:sub?{plan:sub.plan,status:effective(sub),endsAt:sub.endsAt}:null};});
 return sendResponse(res,200,{rows,total:result.count,page,limit},'Comptes');
}catch(e){next(e)}};
exports.audit=async(req,res,next)=>{try{
 const {page,limit}=pageOf(req.query),where={};if(req.query.scope==='platform')where.type={[Op.like]:'PLATFORM_%'};
 const rows=await Activite.findAndCountAll({where,attributes:['id','type','description','UserId','shopId','createdAt','module'],order:[['createdAt','DESC'],['id','DESC']],limit,offset:(page-1)*limit});
 return sendResponse(res,200,{rows:rows.rows,total:rows.count,page,limit},'Journal');
}catch(e){next(e)}};
