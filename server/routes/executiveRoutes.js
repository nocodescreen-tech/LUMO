const router=require('express').Router();
const {sequelize}=require('../config/database');
const {User,ExpenseRequest,LeaveRequest,Opportunity,SalesTarget,Notification,Product,InventoryLot,Purchase,Receivable}=require('../models');
const {Op}=require('sequelize');
const {sendResponse}=require('../utils/response');
const {fail,currency}=require('../utils/transactionSafety');
const {today}=require('../utils/lotService');
const budget=require('../utils/budgetService');
const active=['NEW','QUALIFIED','PROPOSAL','NEGOTIATION'];
const sum=(a,b)=>budget.decimal(budget.minor(a)+budget.minor(b));
const diff=(a,b)=>budget.decimal(budget.minor(a)-budget.minor(b));
const zero={revenue:'0.00',serviceRevenue:'0.00',costOfGoods:'0.00',operatingExpenses:'0.00',payroll:'0.00',inventoryGain:'0.00',inventoryLoss:'0.00',cashIn:'0.00',cashOut:'0.00',sales:0,refunds:0,entries:0};
function enrich(r){const x={...zero,...r};return {...x,totalRevenue:sum(x.revenue,x.serviceRevenue),goodsMargin:diff(x.revenue,x.costOfGoods),recordedResult:diff(diff(diff(sum(sum(diff(x.revenue,x.costOfGoods),x.serviceRevenue),x.inventoryGain),x.operatingExpenses),x.payroll),x.inventoryLoss),cashNet:diff(x.cashIn,x.cashOut)};}
const aggregates=`COALESCE(SUM(amount) FILTER(WHERE "creditAccount"='REVENUE'),0)-COALESCE(SUM(amount) FILTER(WHERE "debitAccount"='REVENUE'),0) AS revenue,
 COALESCE(SUM(amount) FILTER(WHERE "creditAccount"='SERVICE_REVENUE'),0)-COALESCE(SUM(amount) FILTER(WHERE "debitAccount"='SERVICE_REVENUE'),0) AS "serviceRevenue",
 COALESCE(SUM(amount) FILTER(WHERE "debitAccount"='COST_OF_GOODS'),0)-COALESCE(SUM(amount) FILTER(WHERE "creditAccount"='COST_OF_GOODS'),0) AS "costOfGoods",
 COALESCE(SUM(amount) FILTER(WHERE "debitAccount"='OPERATING_EXPENSE'),0)-COALESCE(SUM(amount) FILTER(WHERE "creditAccount"='OPERATING_EXPENSE'),0) AS "operatingExpenses",
 COALESCE(SUM(amount) FILTER(WHERE "debitAccount"='PAYROLL_EXPENSE'),0)-COALESCE(SUM(amount) FILTER(WHERE "creditAccount"='PAYROLL_EXPENSE'),0) AS payroll,
 COALESCE(SUM(amount) FILTER(WHERE "creditAccount"='INVENTORY_GAIN'),0)-COALESCE(SUM(amount) FILTER(WHERE "debitAccount"='INVENTORY_GAIN'),0) AS "inventoryGain",
 COALESCE(SUM(amount) FILTER(WHERE "debitAccount"='INVENTORY_LOSS'),0)-COALESCE(SUM(amount) FILTER(WHERE "creditAccount"='INVENTORY_LOSS'),0) AS "inventoryLoss",
 COALESCE(SUM(amount) FILTER(WHERE "debitAccount"='CASH'),0) AS "cashIn",
 COALESCE(SUM(amount) FILTER(WHERE "creditAccount"='CASH'),0) AS "cashOut",
 COUNT(*) FILTER(WHERE event='SALE')::integer AS sales,COUNT(*) FILTER(WHERE event='REFUND_SALE')::integer AS refunds,COUNT(*)::integer AS entries`;
const between=`"createdAt">=(CAST(:start AS date)::timestamp AT TIME ZONE 'Africa/Kinshasa') AND "createdAt"<(CAST(:end AS date)::timestamp AT TIME ZONE 'Africa/Kinshasa')`;
function previous(kind,start){const d=new Date(start+'T00:00:00Z');if(kind==='MONTH')d.setUTCMonth(d.getUTCMonth()-1);else d.setUTCFullYear(d.getUTCFullYear()-1);return d.toISOString().slice(0,10);}
const nextDay=d=>new Date(Date.parse(d)+86400000).toISOString().slice(0,10);
router.get('/',async(req,res,next)=>{try{
 const u=req.user;if(u.role!=='admin'||u.parentId)throw fail('Direction réservée au propriétaire',403);
 const uid=u.id,day=today(),kind=req.query.kind||'MONTH',start=req.query.start||budget.periods(day)[kind],bounds=budget.bounds(kind,start);if(start>day)throw fail('Période future',400);
 const org=await User.findByPk(uid,{attributes:['entreprise']});const c=currency(req.query.currency||org.entreprise?.devise),end=bounds.end>nextDay(day)?nextDay(day):bounds.end;
 const priorStart=previous(kind,start),priorBounds=budget.bounds(kind,priorStart);
 const elapsed=(Date.parse(end)-Date.parse(start))/86400000,priorEnd=bounds.end===end?priorBounds.end:new Date(Math.min(Date.parse(priorBounds.end),Date.parse(priorStart)+elapsed*86400000)).toISOString().slice(0,10);
 const result=await sequelize.transaction({isolationLevel:'REPEATABLE READ'},async t=>{
 const query=async(sql,replacements={})=>(await sequelize.query(sql,{replacements:{uid,c,start,end,day,...replacements},transaction:t}))[0];
 const journal=(a,b)=>query('SELECT '+aggregates+' FROM "JournalEntries" WHERE "userId"=:uid AND currency=:c AND '+between,{start:a,end:b});
 const current=enrich((await journal(start,end))[0]),prior=enrich((await journal(priorStart,priorEnd))[0]);
 const grain=kind==='MONTH'?'day':'month';
 const [trendRaw,locations,sellers,cash,treasury,debts,legacy]=await Promise.all([
 query(`SELECT to_char(date_trunc('${grain}',"createdAt" AT TIME ZONE 'Africa/Kinshasa'),'YYYY-MM-DD') AS bucket,${aggregates} FROM "JournalEntries" WHERE "userId"=:uid AND currency=:c AND ${between} GROUP BY bucket ORDER BY bucket`),
 query(`SELECT CASE WHEN s."warehouseId" IS NULL THEN 0 ELSE COALESCE(b.id,-1) END AS "branchKey",CASE WHEN s."warehouseId" IS NULL THEN 'Central / sans entrepôt' ELSE COALESCE(b.name,'Affectation inconnue') END AS name,SUM(CASE WHEN j.event='SALE' THEN j.amount ELSE -j.amount END)::text AS net,COUNT(*) FILTER(WHERE j.event='SALE')::integer AS sales FROM "JournalEntries" j JOIN "Sales" s ON s.id::text=j.reference AND s."userId"=j."userId" LEFT JOIN "Organizations" o ON o."ownerId"=s."userId" LEFT JOIN "Warehouses" w ON w.id=s."warehouseId" AND w."organizationId"=o.id LEFT JOIN "Branches" b ON b.id=w."branchId" AND b."organizationId"=o.id WHERE j."userId"=:uid AND j.currency=:c AND j.event IN ('SALE','REFUND_SALE') AND ${between.replaceAll('"createdAt"','j."createdAt"')} GROUP BY 1,2 ORDER BY SUM(CASE WHEN j.event='SALE' THEN j.amount ELSE -j.amount END) DESC`),
 query(`SELECT COALESCE(s."sellerId",s."userId") AS "sellerKey",COALESCE(u.nom,'Ancien commercial') AS name,SUM(CASE WHEN j.event='SALE' THEN j.amount ELSE -j.amount END)::text AS net,COUNT(*) FILTER(WHERE j.event='SALE')::integer AS sales FROM "JournalEntries" j JOIN "Sales" s ON s.id::text=j.reference AND s."userId"=j."userId" LEFT JOIN "Users" u ON u.id=COALESCE(s."sellerId",s."userId") AND (u.id=s."userId" OR u."parentId"=s."userId") WHERE j."userId"=:uid AND j.currency=:c AND j.event IN ('SALE','REFUND_SALE') AND ${between.replaceAll('"createdAt"','j."createdAt"')} GROUP BY 1,2 ORDER BY SUM(CASE WHEN j.event='SALE' THEN j.amount ELSE -j.amount END) DESC LIMIT 10`),
 query('SELECT COUNT(*)::integer AS count,COALESCE(SUM("expectedBalance"),0)::text AS balance FROM "CashSessions" WHERE "userId"=:uid AND currency=:c AND status=\'OPEN\''),
 query('SELECT kind,COUNT(*)::integer AS count,COALESCE(SUM(balance),0)::text AS balance FROM "TreasuryAccounts" WHERE "userId"=:uid AND currency=:c GROUP BY kind ORDER BY kind'),
 query('SELECT COUNT(*) FILTER(WHERE balance>0)::integer AS count,COALESCE(SUM(balance) FILTER(WHERE balance>0),0)::text AS balance,COALESCE(SUM(balance) FILTER(WHERE balance>0 AND "dueOn" < :day),0)::text AS overdue FROM "Receivables" WHERE "userId"=:uid AND currency=:c'),
 query(`SELECT COUNT(*)::integer AS count FROM "Sales" s WHERE s."userId"=:uid AND s."deletedAt" IS NULL AND ${between.replaceAll('"createdAt"','s."createdAt"')} AND NOT EXISTS(SELECT 1 FROM "JournalEntries" j WHERE j."userId"=s."userId" AND j.reference=s.id::text AND j.event='SALE')`)
 ]);
 const buckets=[];for(let d=start;d<end;){buckets.push({bucket:d,...enrich(trendRaw.find(r=>r.bucket===d)||{})});const date=new Date(d+'T00:00:00Z');if(kind==='MONTH')date.setUTCDate(date.getUTCDate()+1);else date.setUTCMonth(date.getUTCMonth()+1);d=date.toISOString().slice(0,10);}
 const [pending,committed,leaves,opps,followups,stock,expiry,purchases,target]=await Promise.all([
 ExpenseRequest.count({where:{userId:uid,status:'PENDING'},transaction:t}),
 ExpenseRequest.sum('amount',{where:{userId:uid,status:'APPROVED',currency:c},transaction:t}),
 LeaveRequest.count({where:{userId:uid,status:'PENDING'},transaction:t}),
 Opportunity.sum('amount',{where:{userId:uid,stage:{[Op.in]:active},currency:c},transaction:t}),
 Opportunity.count({where:{userId:uid,stage:{[Op.in]:active},followUpOn:{[Op.lte]:day}},transaction:t}),
 query('SELECT COUNT(*)::integer AS count FROM "Products" WHERE "userId"=:uid AND "deletedAt" IS NULL AND stock<COALESCE("stockAlerte",5)'),
 InventoryLot.count({where:{userId:uid,quantity:{[Op.gt]:0},expiresOn:{[Op.lt]:day}},transaction:t}),
 Purchase.count({where:{userId:uid,approvalState:'PENDING'},transaction:t}),
 kind==='MONTH'?SalesTarget.findOne({where:{userId:uid,sellerKey:0,month:start,currency:c},order:[['id','DESC']],transaction:t}):null
 ]);
 const [liabilities]=await query(`SELECT COALESCE(SUM(CASE WHEN "creditAccount"='PAYABLE' THEN amount WHEN "debitAccount"='PAYABLE' THEN -amount ELSE 0 END),0)::text AS suppliers,COALESCE(SUM(CASE WHEN "creditAccount"='PAYROLL_PAYABLE' THEN amount WHEN "debitAccount"='PAYROLL_PAYABLE' THEN -amount ELSE 0 END),0)::text AS payroll FROM "JournalEntries" WHERE "userId"=:uid AND currency=:c`);
 const plans=await budget.current(uid,c,t,day);const alerts={total:plans.length,scanned:Math.min(plans.length,100),near:0,over:0};for(const p of plans.slice(0,100)){const f=await budget.figures(p,t,null,day);if(f.over)alerts.over++;else if(f.near)alerts.near++;}
 return {kind,start,endExclusive:end,priorStart,priorEndExclusive:priorEnd,asOf:new Date().toISOString(),today:day,currency:c,timezone:'Africa/Kinshasa',coverage:'commercial-v2-postings-only',current,prior,trend:buckets,locations,sellers,legacySalesUnposted:legacy[0].count,target:target||null,snapshot:{cash:cash[0],treasury,receivables:debts[0],liabilities,approvedExpenses:String(committed||0),pipelineEstimate:String(opps||0),alerts:{pendingExpenses:pending,pendingLeaves:leaves,pendingPurchases:purchases,followups,lowStock:stock[0].count,expiredLots:expiry,budgets:alerts}}};
 });
 res.set('Cache-Control','no-store');return sendResponse(res,200,result,'Pilotage de direction');}catch(e){next(e)}});
module.exports=router;
