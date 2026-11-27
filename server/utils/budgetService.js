const {BudgetCenter,BudgetRevision,ExpenseRequest,Organization,Branch}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {fail,money,round}=require('./transactionSafety');
const {today}=require('./lotService');
const day=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw fail('Date invalide');return v};
const periods=(d=today())=>({MONTH:d.slice(0,7)+'-01',YEAR:d.slice(0,4)+'-01-01'});
function bounds(kind,start){day(start);if(!['MONTH','YEAR'].includes(kind)||start!==periods(start)[kind])throw fail('Début de période invalide');const d=new Date(start+'T00:00:00Z');if(kind==='MONTH')d.setUTCMonth(d.getUTCMonth()+1);else d.setUTCFullYear(d.getUTCFullYear()+1);return {start,end:d.toISOString().slice(0,10)}}
const minor=v=>{const s=String(v);if(!/^-?\d+(\.\d{1,2})?$/.test(s))throw fail('Montant de budget invalide');const neg=s[0]==='-',parts=(neg?s.slice(1):s).split('.');return (neg?-1n:1n)*(BigInt(parts[0])*100n+BigInt((parts[1]||'').padEnd(2,'0')))};
const decimal=n=>{const sign=n<0n?'-':'',v=n<0n?-n:n;return sign+(v/100n).toString()+'.'+(v%100n).toString().padStart(2,'0')};
async function current(uid,c,t,d=today()){
 const p=periods(d);
 const [rows]=await sequelize.query('SELECT DISTINCT ON ("centerId","periodKind") * FROM "BudgetRevisions" WHERE "userId"= :uid AND currency= :c AND (("periodKind"=\'MONTH\' AND "periodStart"= :month) OR ("periodKind"=\'YEAR\' AND "periodStart"= :year)) ORDER BY "centerId","periodKind",id DESC',{replacements:{uid,c,month:p.MONTH,year:p.YEAR},transaction:t});return rows;
}
async function options(uid,c,t){const rows=await current(uid,c,t),ids=[...new Set(rows.map(r=>r.centerId))];const centers=ids.length?await BudgetCenter.findAll({where:{userId:uid,id:ids},attributes:['id','name','department','branchKey'],order:[['name','ASC']],transaction:t}):[];return {required:ids.length>0,centers};}
async function selection(uid,c,id,t,plans){const all=plans??await current(uid,c,t);if(id==null){if(all.length)throw fail('Centre de coûts requis : choisissez un budget actif',409);return null;}
 if(!Number.isSafeInteger(id)||id<=0)throw fail('Centre de coûts invalide');
 if(!await BudgetCenter.findOne({where:{userId:uid,id},transaction:t}))throw fail('Centre de coûts introuvable',404);
 if(!all.some(p=>p.centerId===id))throw fail('Aucun budget actif pour ce centre et cette devise',409);return id;}
async function figures(plan,t,exclude=null,d=today()){
 const {start,end}=bounds(plan.periodKind,plan.periodStart),uid=plan.userId,c=plan.currency,center=plan.centerId;
 const [rows]=await sequelize.query(`SELECT COALESCE(SUM(CASE WHEN j.event='EXPENSE' THEN j.amount ELSE -j.amount END),0)::text AS actual FROM "JournalEntries" j JOIN "Depenses" e ON e."userId"=j."userId" AND e.id::text=j.reference WHERE j."userId"= :uid AND e."budgetCenterId"= :center AND j.currency= :c AND j.event IN ('EXPENSE','EXPENSE_REVERSAL') AND j."createdAt">=(CAST(:start AS date)::timestamp AT TIME ZONE 'Africa/Kinshasa') AND j."createdAt"<(CAST(:end AS date)::timestamp AT TIME ZONE 'Africa/Kinshasa')`,{replacements:{uid,center,c,start,end},transaction:t});
 const actual=minor(rows[0].actual),active=start<=d&&d<end;
 const [commitments]=active?await sequelize.query('SELECT COALESCE(SUM(amount),0)::text AS value FROM "ExpenseRequests" WHERE "userId"= :uid AND "budgetCenterId"= :center AND currency= :c AND status=\'APPROVED\' AND id<> :exclude',{replacements:{uid,center,c,exclude:exclude??-1},transaction:t}):[[{value:'0'}]];
 const committed=minor(commitments[0].value),limit=minor(plan.amount),available=limit-actual-committed,used=actual+committed;
 return {actual:decimal(actual),committed:active?decimal(committed):null,available:active?decimal(available):null,variance:decimal(limit-actual),utilization:Number(used)*100/Number(limit),active,over:used>limit,near:used*100n>=limit*80n};
}
async function guard(uid,c,id,value,t,exclude=null){
 if(!t)throw Error('Budget guard requires transaction and owner lock');
 const plans=await current(uid,c,t),center=await selection(uid,c,id,t,plans);if(center===null)return null;
 const proposed=minor(round(money(value),c));
 for(const p of plans.filter(p=>p.centerId===center)){const f=await figures(p,t,exclude);if(p.mode==='BLOCK'&&proposed>minor(f.available))throw fail('Budget '+(p.periodKind==='MONTH'?'mensuel':'annuel')+' insuffisant : révisez le budget ou annulez un engagement',409);}
 return center;
}
module.exports={day,periods,bounds,minor,decimal,current,options,selection,figures,guard};
