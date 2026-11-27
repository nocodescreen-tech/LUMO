const express=require('express'),platform=express.Router(),customer=express.Router();
const {User,Organization,Subscription,SubscriptionEvent,Branch,Warehouse,SaasPrice,SaasInvoice,SaasPayment,SaasInvoiceEvent,PlanEntitlement,Product,Client,CashSession,Sale}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {sendResponse}=require('../utils/response');
const {fail,currency,money,round}=require('../utils/transactionSafety');
const svc=require('../utils/workspaceService'),ledger=require('../utils/commercialLedger'),budget=require('../utils/budgetService');
const {today}=require('../utils/lotService');
const rights=require('../utils/planEntitlements');
const plans=Object.keys(svc.plans).filter(p=>p!=='TRIAL');
const owner=u=>u.role==='admin'&&!u.parentId;
const clean=(v,n)=>svc.label(v,n);
const id=v=>{if(!Number.isSafeInteger(v)||v<=0)throw fail('Identifiant invalide');return v};
const amount=(v,c)=>{const n=money(v);if(n<=0||round(n,c)!==n)throw fail('Montant invalide');return n};
const paging=q=>({page:Math.max(1,Math.min(100000,parseInt(q.page)||1)),limit:Math.max(1,Math.min(100,parseInt(q.limit)||20))});
const days=v=>{if(![30,365].includes(v))throw fail('Durée de 30 ou 365 jours requise');return v};
const plan=v=>{if(!plans.includes(v))throw fail('Offre inconnue');return v};
const methods=['BANK','MOBILE_MONEY','CASH','OTHER'];
async function prices(t){const [rows]=await sequelize.query('SELECT DISTINCT ON (plan,currency,days) * FROM "SaasPrices" ORDER BY plan,currency,days,id DESC',{transaction:t});return rows;}
async function action(req,op,model,fn){if(req.body.confirm!==true||!req.body.operationId)throw fail('Confirmation et clé requises');return sequelize.transaction(async t=>{
 const actor=await User.findByPk(req.user.id,{transaction:t,lock:t.LOCK.UPDATE});if(!actor||actor.role!=='superadmin'||actor.isSuspended||req.isImpersonating)throw fail('SuperAdmin requis',403);
 const prior=await ledger.replay(req,op,t);if(prior){const row=await model.findByPk(prior.resourceId,{transaction:t});if(!row)throw fail('Historique indisponible',409);return {row,replayed:true};}
 const row=await fn(actor,t);await ledger.remember(req,op,row.id,t);return {row,replayed:false};
 });}
const respond=(res,r,label)=>sendResponse(res,r.replayed?200:201,r.row,label);
platform.get('/entitlements',async(req,res,next)=>{try{return sendResponse(res,200,{plans:Object.keys(svc.plans),rows:await rights.catalog()},'Droits des offres');}catch(e){next(e)}});
platform.post('/entitlements',async(req,res,next)=>{try{const r=await action(req,'saas.entitlement',PlanEntitlement,async(actor,t)=>{
 await sequelize.query('SELECT pg_advisory_xact_lock(5140320, 0)',{transaction:t});
 const b=req.body;if(!Object.hasOwn(svc.plans,b.plan)||typeof b.enforced!=='boolean'||typeof b.crmCreate!=='boolean'||!Number.isSafeInteger(b.aiLimit)||b.aiLimit<0||b.aiLimit>100000)throw fail('Politique invalide');
 const previous=await rights.current(b.plan,t);if((previous?.id??null)!==b.expectedPolicyId)throw fail('Politique modifiée : actualisez',409);
 return PlanEntitlement.create({plan:b.plan,actorId:actor.id,enforced:b.enforced,crmCreate:b.crmCreate,aiLimit:b.aiLimit,reason:clean(b.reason,250)},{transaction:t});
 });return respond(res,r,'Politique enregistrée');}catch(e){next(e)}});
platform.get('/prices',async(req,res,next)=>{try{return sendResponse(res,200,{rows:await prices(),plans:plans.map(code=>({code,...svc.plans[code]}))},'Tarifs');}catch(e){next(e)}});
platform.post('/prices',async(req,res,next)=>{try{const r=await action(req,'saas.price',SaasPrice,async(actor,t)=>{
 await sequelize.query('SELECT pg_advisory_xact_lock(5140319, 0)',{transaction:t});
 const b=req.body,p=plan(b.plan),c=currency(b.currency),d=days(b.days),where={plan:p,currency:c,days:d},previous=await SaasPrice.findOne({where,order:[['id','DESC']],transaction:t});
 if((previous?.id??null)!==b.expectedPriceId)throw fail('Tarif modifié : actualisez',409);
 if(typeof b.enabled!=='boolean')throw fail('Activation invalide');
 return SaasPrice.create({...where,amount:amount(b.amount,c),enabled:b.enabled,actorId:actor.id,reason:clean(b.reason,250)},{transaction:t});
 });return respond(res,r,'Tarif enregistré');}catch(e){next(e)}});
platform.get('/invoices',async(req,res,next)=>{try{const {page,limit}=paging(req.query),where={};if(['ISSUED','PAID','VOID'].includes(req.query.status))where.status=req.query.status;if(req.query.ownerId)where.ownerId=id(Number(req.query.ownerId));if(['USD','CDF'].includes(req.query.currency))where.currency=req.query.currency;if(plans.includes(req.query.plan))where.plan=req.query.plan;if(req.query.overdue==='true'){where.status='ISSUED';where.dueOn={[Op.lt]:today()};}
 const r=await SaasInvoice.findAndCountAll({where,order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{rows:r.rows,total:r.count,page,limit},'Factures SaaS');}catch(e){next(e)}});
platform.post('/invoices',async(req,res,next)=>{try{const r=await action(req,'saas.invoice',SaasInvoice,async(actor,t)=>{
 const b=req.body,ownerId=id(b.ownerId),org=await svc.ensure(ownerId,t);
 await sequelize.query('SELECT pg_advisory_xact_lock(5140319, 0)',{transaction:t});
 const price=await SaasPrice.findByPk(id(b.priceId),{transaction:t});if(!price||!price.enabled||!(await prices(t)).some(x=>x.id===price.id&&x.enabled))throw fail('Tarif indisponible : actualisez',409);
 const dueOn=budget.day(b.dueOn);if(dueOn<today())throw fail('Date d’échéance passée');
 if(await SaasInvoice.findOne({where:{ownerId,status:'ISSUED'},transaction:t}))throw fail('Une facture ouverte existe déjà pour cette entreprise',409);
 const reference='LUMO-'+require('crypto').randomUUID().toUpperCase();
 const row=await SaasInvoice.create({organizationId:org.id,ownerId,priceId:price.id,actorId:actor.id,plan:price.plan,currency:price.currency,days:price.days,amount:price.amount,status:'ISSUED',dueOn,reference,reason:clean(b.reason,250)},{transaction:t});
 await SaasInvoiceEvent.create({invoiceId:row.id,ownerId,actorId:actor.id,kind:'ISSUE',reason:row.reason},{transaction:t});return row;
 });return respond(res,r,'Facture interne émise');}catch(e){next(e)}});
platform.post('/invoices/:id/actions',async(req,res,next)=>{try{const b=req.body;if(!['PAY','VOID'].includes(b.action))throw fail('Action invalide');
 const r=await action(req,'saas.invoice.'+b.action.toLowerCase(),SaasInvoice,async(actor,t)=>{
 const initial=await SaasInvoice.findByPk(req.params.id,{transaction:t});if(!initial)throw fail('Facture introuvable',404);
 const org=await svc.ensure(initial.ownerId,t),sub=await svc.subscription(org,t),row=await SaasInvoice.findByPk(initial.id,{transaction:t,lock:t.LOCK.UPDATE});
 if(row.organizationId!==org.id||row.status!=='ISSUED'||b.expectedStatus!=='ISSUED')throw fail('Facture déjà traitée',409);
 const reason=clean(b.reason,250);
 if(b.action==='VOID'){await row.update({status:'VOID'},{transaction:t});await SaasInvoiceEvent.create({invoiceId:row.id,ownerId:row.ownerId,actorId:actor.id,kind:'VOID',reason},{transaction:t});return row;}
 if(!methods.includes(b.method)||b.currency!==row.currency||budget.minor(amount(b.amount,row.currency))!==budget.minor(row.amount))throw fail('Montant exact, devise et méthode requis');
 const externalReference=clean(b.externalReference,100).toUpperCase();
 if(await SaasPayment.findOne({where:{method:b.method,externalReference},transaction:t}))throw fail('Référence de paiement déjà utilisée',409);
 if(org.status!=='ACTIVE')throw fail('Organisation inactive',409);
 const now=new Date(),valid=['ACTIVE','TRIAL'].includes(svc.effective(sub)),same=sub.plan===row.plan;
 if(valid&&sub.plan!=='TRIAL'&&!same)throw fail('Changement de plan en cours de licence : annulez la facture ou attendez l’échéance',409);
 const start=valid&&same&&sub.endsAt&&new Date(sub.endsAt)>now?new Date(sub.endsAt):now,end=new Date(+start+row.days*86400000);
 const [branches,warehouses]=await Promise.all([Branch.count({where:{organizationId:org.id},transaction:t}),Warehouse.count({where:{organizationId:org.id},transaction:t})]);
 const quotas=svc.plans[row.plan];if(branches>quotas.branchLimit||warehouses>quotas.warehouseLimit)throw fail('Le plan est inférieur aux registres existants',409);
 await SaasPayment.create({invoiceId:row.id,organizationId:org.id,ownerId:row.ownerId,actorId:actor.id,amount:row.amount,currency:row.currency,method:b.method,externalReference,note:reason,periodStart:start,periodEnd:end},{transaction:t});
 await SubscriptionEvent.create({organizationId:org.id,actorId:actor.id,kind:'INVOICE_PAID',reference:'invoice-'+row.id,details:{invoiceId:row.id,plan:row.plan,days:row.days,endsAt:end,manual:true}},{transaction:t});
 await sub.update({plan:row.plan,status:'ACTIVE',startsAt:valid&&same?sub.startsAt:now,endsAt:end,...quotas},{transaction:t});
 await row.update({status:'PAID'},{transaction:t});await SaasInvoiceEvent.create({invoiceId:row.id,ownerId:row.ownerId,actorId:actor.id,kind:'PAY',reason},{transaction:t});return row;
 });return respond(res,r,b.action==='PAY'?'Encaissement déclaré et licence prolongée':'Facture annulée');}catch(e){if(e.name==='SequelizeUniqueConstraintError')return next(fail('Référence déjà utilisée',409));next(e)}});
async function detail(req,res,next,platformView){try{const where={id:req.params.id,...(platformView?{}:{ownerId:req.user.id})},row=await SaasInvoice.findOne({where});if(!row)throw fail('Facture introuvable',404);
 const [payment,events]=await Promise.all([SaasPayment.findOne({where:{invoiceId:row.id,ownerId:row.ownerId}}),SaasInvoiceEvent.findAll({where:{invoiceId:row.id,ownerId:row.ownerId},order:[['id','ASC']]})]);
 return sendResponse(res,200,{invoice:row,payment,events},'Facture');}catch(e){next(e)}}
platform.get('/invoices/:id',(req,res,next)=>detail(req,res,next,true));
platform.get('/metrics',async(req,res,next)=>{try{const start=req.query.month||today().slice(0,7)+'-01',{end}=budget.bounds('MONTH',start);
 const [receipts]=await sequelize.query(`SELECT currency,COUNT(*)::integer AS count,SUM(amount)::text AS amount FROM "SaasPayments" WHERE "createdAt">=(CAST(:start AS date)::timestamp AT TIME ZONE 'Africa/Kinshasa') AND "createdAt"<(CAST(:end AS date)::timestamp AT TIME ZONE 'Africa/Kinshasa') GROUP BY currency`,{replacements:{start,end}});
 const [outstanding]=await sequelize.query('SELECT currency,COUNT(*)::integer AS count,SUM(amount)::text AS amount FROM "SaasInvoices" WHERE status=\'ISSUED\' GROUP BY currency');
 const [licenses]=await sequelize.query(`SELECT plan,CASE WHEN status IN ('ACTIVE','TRIAL') AND "endsAt" IS NOT NULL AND "endsAt"<=now() THEN 'EXPIRED' ELSE status END AS effective,COUNT(*)::integer AS count FROM "Subscriptions" GROUP BY 1,2 ORDER BY 1,2`);
 return sendResponse(res,200,{month:start,receipts,outstanding,licenses,coverage:'manual-receipts-only'},'Indicateurs SaaS');}catch(e){next(e)}});
customer.use((req,res,next)=>owner(req.user)?next():next(fail('Propriétaire requis',403)));
customer.get('/',async(req,res,next)=>{try{const context=await svc.context(req.user.id),org=context.organization;
 const [branches,warehouses,openInvoices]=await Promise.all([Branch.count({where:{organizationId:org.id}}),Warehouse.count({where:{organizationId:org.id}}),SaasInvoice.count({where:{ownerId:req.user.id,status:'ISSUED'}})]);
 const uid=req.user.id;
 const [products,clients,staff,cashSessions,sales]=await Promise.all([Product.count({where:{userId:uid}}),Client.count({where:{userId:uid}}),User.count({where:{parentId:uid,isSuspended:false}}),CashSession.count({where:{userId:uid}}),Sale.count({where:{userId:uid}})]);
 const onboarding={profile:!!org.name&&!!org.currency,products:products>0,clients:clients>0,staff:staff>0,cash:cashSessions>0,sales:sales>0};
 const catalog=(await prices()).filter(v=>v.enabled).map(({id,plan,currency,days,amount})=>({id,plan,currency,days,amount}));
 return sendResponse(res,200,{...context,usage:{branches,warehouses},onboarding,entitlements:await rights.describe(uid),openInvoices,catalog,plans:plans.map(code=>({code,...svc.plans[code]})),enforcement:'registry-and-configured-features'},'Mon abonnement');}catch(e){next(e)}});
customer.get('/invoices',async(req,res,next)=>{try{const {page,limit}=paging(req.query),r=await SaasInvoice.findAndCountAll({where:{ownerId:req.user.id},order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{rows:r.rows,total:r.count,page,limit},'Mes factures');}catch(e){next(e)}});
customer.get('/invoices/:id',(req,res,next)=>detail(req,res,next,false));
module.exports={platform,customer};
