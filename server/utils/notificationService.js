const {User,Notification,NotificationSetting,ExpenseRequest,ExpensePolicy,LeaveRequest,Receivable,InventoryLot,AccessRevision}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {fail,currency}=require('./transactionSafety');
const {today}=require('./lotService');
const budget=require('./budgetService');
const labels={STOCK:'Stock physique faible',EXPENSE_QUEUE:'Dépenses à contrôler',BUDGET:'Budgets',RECEIVABLE:'Créances échues',LEAVE_QUEUE:'Congés à traiter',EXPIRY:'Péremption des lots',ACCESS:'Modifications des accès',PERSONAL_EXPENSE:'Mes demandes de dépenses',PERSONAL_LEAVE:'Mes congés'};
const owner=u=>u.role==='admin'&&!u.parentId;
const has=(u,p)=>Array.isArray(u.permissions)&&u.permissions.includes(p);
function categories(u){if(owner(u))return ['STOCK','EXPENSE_QUEUE','BUDGET','RECEIVABLE','LEAVE_QUEUE','EXPIRY','ACCESS'];if(!u.parentId)return [];return [...(has(u,'expenses.review')?['EXPENSE_QUEUE']:[]),...(has(u,'expenses.request')?['PERSONAL_EXPENSE']:[]),'PERSONAL_LEAVE'];}
function visibility(u){return {userId:u.id,archivedAt:null,[Op.or]:[{category:null},{category:{[Op.in]:categories(u)}}]};}
const dayPlus=(d,n)=>new Date(Date.parse(d)+n*86400000).toISOString().slice(0,10);
const emit=id=>{try{global.io?.to('user_'+id).emit('notification',{refresh:true})}catch(_){}};
async function scan(userId,{force=false}={}){
 return sequelize.transaction(async t=>{
  await sequelize.query('SELECT pg_advisory_xact_lock(5140319, :id)',{replacements:{id:userId},transaction:t});
  const u=await User.findByPk(userId,{transaction:t});if(!u||u.isSuspended)return {created:0,skipped:true};
  const uid=u.parentId||u.id,org=owner(u)?u:u.parentId?await User.findByPk(uid,{transaction:t}):null;
  if(!org||!owner(org)||org.isSuspended)return {created:0,skipped:true};
  const [pref]=await NotificationSetting.findOrCreate({where:{userId},defaults:{muted:[]},transaction:t});
  if(!force&&pref.lastScanAt&&Date.now()-new Date(pref.lastScanAt).getTime()<60000)return {created:0,skipped:true,lastScanAt:pref.lastScanAt};
  const date=today(),available=new Set(categories(u).filter(k=>!(pref.muted||[]).includes(k))),items=[];
  function add(category,key,title,body,type,path){if(available.has(category))items.push({userId,category,dedupeKey:category+':'+key,titre:title,contenu:body,type,targetPath:path,lu:false});}
  const daily=(category,count,title,body,type,path,suffix='')=>{if(count>0)add(category,date+suffix,title,body,type,path)};
  if(available.has('STOCK')){
   const [r]=await sequelize.query('SELECT count(*)::integer AS n FROM "Products" WHERE "userId"= :uid AND "deletedAt" IS NULL AND stock<COALESCE("stockAlerte",5)',{replacements:{uid},transaction:t});const n=r[0].n;
   daily('STOCK',n,'Stock physique sous le seuil',n+' produit(s) sous leur seuil global au moment du contrôle. Vérifiez les disponibilités par entrepôt.','WARNING','/inventory');
  }
  if(available.has('EXPENSE_QUEUE')){
   const p=await ExpensePolicy.findOne({where:{userId:uid},order:[['id','DESC']],transaction:t});
   const where={userId:uid,status:'PENDING'};
   if(!owner(u)){where.requesterId={[Op.ne]:u.id};where.reviewedBy=null;where[Op.or]=[{dualRequired:true},...(p?.dualThreshold!=null&&p.currency===currency(org.entreprise?.devise)?[{currency:p.currency,amount:{[Op.gte]:p.dualThreshold}}]:[])];}
   const n=await ExpenseRequest.count({where,transaction:t});daily('EXPENSE_QUEUE',n,owner(u)?'Demandes de dépenses en attente':'Premier contrôle requis',n+' demande(s) à consulter au moment du contrôle.','WARNING','/expense-approvals');
  }
  if(available.has('BUDGET')){
   const plans=await budget.current(uid,currency(org.entreprise?.devise),t,date);let near=0,over=0;
   for(const p of plans.slice(0,100)){const f=await budget.figures(p,t,null,date);if(f.over)over++;else if(f.near)near++;}
   const suffix=plans.length>100?' Contrôle limité aux 100 premières enveloppes ; ouvrez le registre complet.':'';
   daily('BUDGET',near,'Budgets proches du plafond',near+' enveloppe(s) mobilisée(s) à 80 % ou plus.'+suffix,'WARNING','/budgets',':near');
   daily('BUDGET',over,'Budgets dépassés',over+' enveloppe(s) au-delà du plafond.'+suffix,'ERROR','/budgets',':over');
  }
  if(available.has('RECEIVABLE')){const n=await Receivable.count({where:{userId:uid,balance:{[Op.gt]:0},dueOn:{[Op.lt]:date}},transaction:t});daily('RECEIVABLE',n,'Créances clients échues',n+' créance(s) non réglée(s) dont la date limite est passée.','WARNING','/receivables');}
  if(available.has('LEAVE_QUEUE')){const n=await LeaveRequest.count({where:{userId:uid,status:'PENDING'},transaction:t});daily('LEAVE_QUEUE',n,'Demandes de congé en attente',n+' demande(s) de congé à examiner.','INFO','/leave');}
  if(available.has('EXPIRY')){
   const base={userId:uid,quantity:{[Op.gt]:0}};
   const expired=await InventoryLot.count({where:{...base,expiresOn:{[Op.lt]:date}},transaction:t});
   const near=await InventoryLot.count({where:{...base,expiresOn:{[Op.between]:[date,dayPlus(date,30)]}},transaction:t});
   daily('EXPIRY',expired,'Lots périmés',expired+' lot(s) avec stock restant et date dépassée.','ERROR','/inventory',':expired');
   daily('EXPIRY',near,'Lots proches de la péremption',near+' lot(s) avec stock restant arrivant à échéance dans les 30 jours.','WARNING','/inventory',':near');
  }
  if(available.has('ACCESS')){const [r]=await sequelize.query(`SELECT count(*)::integer AS n FROM "AccessRevisions" WHERE "userId"=:uid AND kind='UPDATE' AND ("createdAt" AT TIME ZONE 'Africa/Kinshasa')::date=CAST(:date AS date)`,{replacements:{uid,date},transaction:t});daily('ACCESS',r[0].n,'Droits d’accès modifiés',r[0].n+' modification(s) administrative(s) aujourd’hui. Consultez le journal des accès.','INFO','/access-governance');}
  for(const [category,table,eventTable,staffCol,path] of [['PERSONAL_EXPENSE','ExpenseRequests','ExpenseRequestEvents','requesterId','/expense-approvals'],['PERSONAL_LEAVE','LeaveRequests','LeaveEvents','staffId','/leave']]){
   if(!available.has(category))continue;
   const [events]=await sequelize.query(`SELECT e.id,e.kind,e."requestId" FROM "${eventTable}" e JOIN "${table}" r ON r.id=e."requestId" AND r."userId"=e."userId" WHERE e."userId"=:uid AND r."${staffCol}"=:userId AND e."actorId"<>:userId AND e.kind IN ('APPROVE','REJECT','CANCEL','PAY','REVIEW') AND e."createdAt">=now()-interval '7 days' ORDER BY e.id DESC LIMIT 50`,{replacements:{uid,userId},transaction:t});
   const status={APPROVE:'approuvée',REJECT:'refusée',CANCEL:'annulée',PAY:'décaissée',REVIEW:'contrôlée'};
   for(const e of events)add(category,'event:'+e.id,'Décision sur votre demande','Votre demande #'+e.requestId+' a été '+status[e.kind]+'.',e.kind==='REJECT'?'WARNING':'INFO',path);
  }
  let created=0;
  for(const n of items){const [,fresh]=await Notification.findOrCreate({where:{userId,dedupeKey:n.dedupeKey},defaults:n,transaction:t});if(fresh)created++;}
  const lastScanAt=new Date();await pref.update({lastScanAt},{transaction:t});return {created,skipped:false,lastScanAt};
 });
}
async function preferences(userId,muted){return sequelize.transaction(async t=>{
 await sequelize.query('SELECT pg_advisory_xact_lock(5140319, :id)',{replacements:{id:userId},transaction:t});
 const u=await User.findByPk(userId,{transaction:t});if(!u||u.isSuspended)throw fail('Compte indisponible',403);
 const allowed=categories(u);if(muted!==undefined&&(!Array.isArray(muted)||muted.some(x=>typeof x!=='string'||!allowed.includes(x))))throw fail('Préférences invalides');
 const [row]=await NotificationSetting.findOrCreate({where:{userId},defaults:{muted:[]},transaction:t});
 if(muted!==undefined)await row.update({muted:[...new Set(muted)],lastScanAt:null},{transaction:t});
 return {muted:(row.muted||[]).filter(k=>allowed.includes(k)),categories:allowed.map(key=>({key,label:labels[key]})),lastScanAt:row.lastScanAt};
 });}
module.exports={scan,preferences,visibility,categories};
