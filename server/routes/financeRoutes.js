const router=require('express').Router();
const {protect,authorize}=require('../middleware/authMiddleware');
const {JournalEntry,OperationReceipt}=require('../models');
const {sequelize}=require('../config/database');
const {sendResponse}=require('../utils/response');
router.get('/journal',protect,authorize('admin','superadmin'),async(req,res,next)=>{
 try{const page=Math.max(1,Math.min(100000,parseInt(req.query.page)||1)),limit=Math.max(1,Math.min(100,parseInt(req.query.limit)||50));
 const result=await JournalEntry.findAndCountAll({where:{userId:req.user.tenantId},order:[['createdAt','DESC'],['id','DESC']],limit,offset:(page-1)*limit});
 return sendResponse(res,200,{rows:result.rows,total:result.count,page,limit},'Journal financier');
 }catch(e){next(e);}
});
router.get('/operations/:operation/:key',protect,async(req,res,next)=>{try{const row=await OperationReceipt.findOne({where:{userId:req.user.tenantId,actorId:req.user.id,operation:req.params.operation,key:req.params.key}});return sendResponse(res,200,{committed:!!row,resourceId:row?.resourceId??null},'État de transaction');}catch(e){next(e);}});
router.get('/trial-balance',protect,authorize('admin','superadmin'),async(req,res,next)=>{
 try{
 const [rows]=await sequelize.query(`SELECT currency,account,SUM(debit) AS debit,SUM(credit) AS credit,SUM(debit-credit) AS balance FROM (SELECT currency,"debitAccount" AS account,amount AS debit,0::numeric AS credit FROM "JournalEntries" WHERE "userId"= :userId UNION ALL SELECT currency,"creditAccount",0::numeric,amount FROM "JournalEntries" WHERE "userId"= :userId) q GROUP BY currency,account ORDER BY currency,account`,{replacements:{userId:req.user.tenantId}});
 return sendResponse(res,200,{rows,coverage:'commercial-v2-postings-only'},'Balance des écritures');
 }catch(e){next(e);}
});
const {fail}=require('../utils/transactionSafety');
const {Op}=require('sequelize');
function period(query){
 const from=query.from,to=query.to;
 if(!from||!to||!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to))throw fail('Dates ISO requises (YYYY-MM-DD)');
 const start=new Date(from+'T00:00:00.000Z'),end=new Date(to+'T00:00:00.000Z');
 if(!Number.isFinite(+start)||!Number.isFinite(+end)||start.toISOString().slice(0,10)!==from||end.toISOString().slice(0,10)!==to||end<start||end-start>366*86400000)throw fail('Période invalide (366 jours maximum)');
 end.setUTCDate(end.getUTCDate()+1);return {start,end};
}
router.get('/income-statement',protect,authorize('admin','superadmin'),async(req,res,next)=>{
 try{const {start,end}=period(req.query);
 const [rows]=await sequelize.query(`WITH movements AS (
 SELECT currency,"creditAccount" AS account,amount AS value FROM "JournalEntries" WHERE "userId"= :userId AND "createdAt">= :start AND "createdAt"< :end
 UNION ALL SELECT currency,"debitAccount" AS account,-amount AS value FROM "JournalEntries" WHERE "userId"= :userId AND "createdAt">= :start AND "createdAt"< :end
 ) SELECT currency,COALESCE(SUM(value) FILTER(WHERE account='REVENUE'),0) AS revenue,-COALESCE(SUM(value) FILTER(WHERE account='COST_OF_GOODS'),0) AS "costOfGoods",-COALESCE(SUM(value) FILTER(WHERE account='OPERATING_EXPENSE'),0) AS "operatingExpenses",-COALESCE(SUM(value) FILTER(WHERE account='PAYROLL_EXPENSE'),0) AS payroll,COALESCE(SUM(value) FILTER(WHERE account IN ('REVENUE','COST_OF_GOODS','OPERATING_EXPENSE','PAYROLL_EXPENSE')),0) AS "recordedResult" FROM movements GROUP BY currency ORDER BY currency`,{replacements:{userId:req.user.tenantId,start,end}});
 return sendResponse(res,200,{rows,from:req.query.from,to:req.query.to,timezone:'UTC',coverage:'commercial-v2-postings-only',complete:false},'Résultat des écritures enregistrées');
 }catch(e){next(e);}
});
router.get('/cash-flow',protect,authorize('admin','superadmin'),async(req,res,next)=>{
 try{const {start,end}=period(req.query);
 const [rows]=await sequelize.query(`SELECT currency,event,COALESCE(SUM(amount) FILTER(WHERE "debitAccount"='CASH'),0) AS inflow,COALESCE(SUM(amount) FILTER(WHERE "creditAccount"='CASH'),0) AS outflow FROM "JournalEntries" WHERE "userId"= :userId AND "createdAt">= :start AND "createdAt"< :end AND ("debitAccount"='CASH' OR "creditAccount"='CASH') GROUP BY currency,event ORDER BY currency,event`,{replacements:{userId:req.user.tenantId,start,end}});
 return sendResponse(res,200,{rows,from:req.query.from,to:req.query.to,timezone:'UTC',coverage:'commercial-v2-postings-only',complete:false},'Flux de caisse enregistrés');
 }catch(e){next(e);}
});
module.exports=router;
