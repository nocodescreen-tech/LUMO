const router=require('express').Router();
const {protect,authorize}=require('../middleware/authMiddleware');
const {Organization,Subscription,SubscriptionEvent,Activite}=require('../models');
const {sequelize}=require('../config/database');
const {sendResponse}=require('../utils/response');
const {fail}=require('../utils/transactionSafety');
const svc=require('../utils/workspaceService');
router.use(protect,authorize('superadmin'));
router.get('/plans',(_req,res)=>sendResponse(res,200,Object.entries(svc.plans).map(([code,quotas])=>({code,...quotas,price:null})),'Plans et quotas provisoires'));
router.get('/subscriptions',async(req,res,next)=>{try{const limit=Math.min(100,Math.max(1,parseInt(req.query.limit)||50)),page=Math.max(1,Math.min(100000,parseInt(req.query.page)||1));const rows=await Subscription.findAndCountAll({order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{rows:rows.rows,total:rows.count,page,limit},'Abonnements');}catch(e){next(e)}});
router.post('/subscriptions/:ownerId/grant',async(req,res,next)=>{try{
 const ownerId=Number(req.params.ownerId),plan=req.body.plan,days=Number(req.body.days),reference=svc.label(req.body.reference,100),reason=svc.label(req.body.reason,160);
 if(!Number.isSafeInteger(ownerId)||ownerId<1||!Object.hasOwn(svc.plans,plan)||plan==='TRIAL'||!Number.isInteger(days)||days<1||days>366)throw fail('Attribution invalide');
 const result=await sequelize.transaction(async transaction=>{
 const org=await svc.ensure(ownerId,transaction),s=await svc.subscription(org,transaction);
 const prior=await SubscriptionEvent.findOne({where:{organizationId:org.id,reference},transaction});
 if(prior)throw fail('Référence déjà utilisée',409);
 const now=new Date(),start=s.status==='ACTIVE'&&s.plan===plan&&s.endsAt&&new Date(s.endsAt)>now?new Date(s.endsAt):now;
 const endsAt=new Date(+start+days*86400000);
 await SubscriptionEvent.create({organizationId:org.id,actorId:req.user.id,kind:'MANUAL_GRANT',reference,details:{plan,days,reason,previousPlan:s.plan,previousEndsAt:s.endsAt,endsAt}},{transaction});
 await s.update({plan,status:'ACTIVE',startsAt:now,endsAt,...svc.plans[plan]},{transaction});
 await Activite.create({UserId:req.user.id,shopId:req.user.id,type:'PLATFORM_SUBSCRIPTION_GRANT',module:'Platform',description:'Organisation #'+org.id+' : '+plan+' / '+days+' jours / '+reference},{transaction});return s;
 });
 return sendResponse(res,200,result,'Accès attribué manuellement — aucun paiement confirmé');
}catch(e){next(e)}});
module.exports=router;
