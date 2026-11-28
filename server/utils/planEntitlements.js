const {PlanEntitlement,Organization,Subscription,User}=require('../models');
const {sequelize}=require('../config/database');
const {fail}=require('./transactionSafety');
const svc=require('./workspaceService'),{today}=require('./lotService');
const month=()=>today().slice(0,7)+'-01';
async function current(plan,t){return PlanEntitlement.findOne({where:{plan},order:[['id','DESC']],transaction:t});}
async function catalog(t){const [r]=await sequelize.query('SELECT DISTINCT ON (plan) * FROM "PlanEntitlements" ORDER BY plan,id DESC',{transaction:t});return r;}
async function usage(uid,t){const [r]=await sequelize.query('SELECT count FROM "AiMonthlyUsage" WHERE "userId" = :uid AND month = :month',{replacements:{uid,month:month()},transaction:t});return Number(r[0]?.count||0);}
async function context(uid,t){
 const org=await Organization.findOne({where:{ownerId:uid},transaction:t}),sub=org?await Subscription.findOne({where:{organizationId:org.id},transaction:t}):null;
 const plan=sub?.plan||'TRIAL',rule=await current(plan,t),enforced=!!rule?.enforced,valid=!enforced||(!org&&!sub)||!!(org?.status==='ACTIVE'&&sub&&['ACTIVE','TRIAL'].includes(svc.effective(sub)));
 return {org,sub,plan,rule,enforced,valid};
}
async function describe(uid,t){const x=await context(uid,t),used=await usage(uid,t);return {plan:x.plan,enforced:x.enforced,valid:x.valid,aiLimit:x.enforced?x.rule.aiLimit:null,aiUsed:used,month:month(),crmCreate:!x.enforced||x.valid&&x.rule.crmCreate,providerConfigured:process.env.AI_PROVIDER==='ollama'||(!process.env.AI_PROVIDER||process.env.AI_PROVIDER==='deepseek')&&!!process.env.DEEPSEEK_API_KEY};}
async function check(uid,feature,t){
 if(!t)throw Error('Owner transaction required');
 // Caller must hold tenant owner lock; config updates take exclusive advisory lock.
 await sequelize.query('SELECT pg_advisory_xact_lock_shared(5140320, 0)',{transaction:t});
 let x=await context(uid,t);
 if(x.enforced&&!x.org){await svc.ensure(uid,t);x=await context(uid,t);}
 if(!x.enforced)return x;
 if(!x.valid)throw fail('Licence inactive : renouvelez votre abonnement',403);
 if(feature==='crmCreate'&&!x.rule.crmCreate)throw fail('Création d’opportunités non incluse dans cette offre',403);
 if(feature==='ai'&&await usage(uid,t)>=x.rule.aiLimit)throw fail('Quota mensuel IA atteint ou désactivé',429);
 return x;
}
async function reserveAI(uid){return sequelize.transaction(async t=>{
 const u=await User.findOne({where:{id:uid,role:'admin',parentId:null,isSuspended:false},transaction:t,lock:t.LOCK.UPDATE});if(!u)throw fail('Compte indisponible',403);
 await check(uid,'ai',t);
 // Count attempted provider calls even when the plan is not enforced; no reset on plan change.
 const [r]=await sequelize.query('INSERT INTO "AiMonthlyUsage" ("userId",month,count) VALUES (:uid,:month,1) ON CONFLICT ("userId",month) DO UPDATE SET count="AiMonthlyUsage".count+1 RETURNING count',{replacements:{uid,month:month()},transaction:t});return Number(r[0].count);
 });}
module.exports={current,catalog,describe,check,reserveAI};
