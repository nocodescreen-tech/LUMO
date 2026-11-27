const router=require('express').Router();
const {protect,authorize}=require('../middleware/authMiddleware');
const {Receivable,ReceivablePayment,Client}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {sendResponse}=require('../utils/response');
const {fail}=require('../utils/transactionSafety');
const {today}=require('../utils/lotService');
const service=require('../utils/receivableService');
router.use(protect,authorize('admin'));
const paging=q=>({page:Math.max(1,Math.min(100000,parseInt(q.page)||1)),limit:Math.max(1,Math.min(100,parseInt(q.limit)||20))});
router.get('/',async(req,res,next)=>{try{const uid=req.user.tenantId,{page,limit}=paging(req.query),where={userId:uid};if(req.query.status==='open')where.balance={[Op.gt]:0};if(req.query.status==='paid')where.balance=0;if(req.query.status==='overdue'){where.balance={[Op.gt]:0};where.dueOn={[Op.lt]:today()};}if(req.query.clientId){const id=Number(req.query.clientId);if(!Number.isSafeInteger(id)||id<=0)throw fail('Client invalide');where.clientId=id;}
 const result=await Receivable.findAndCountAll({where,order:[['id','DESC']],limit,offset:(page-1)*limit});const clients=await Client.findAll({where:{userId:uid,id:result.rows.map(r=>r.clientId)},attributes:['id','nom'],paranoid:false});return sendResponse(res,200,{rows:result.rows.map(r=>({...r.toJSON(),clientName:clients.find(c=>c.id===r.clientId)?.nom,overdue:Number(r.balance)>0&&!!r.dueOn&&r.dueOn<today()})),total:result.count,page,limit,today:today()},'Créances');}catch(e){next(e)}});
router.get('/summary',async(req,res,next)=>{try{const [rows]=await sequelize.query('SELECT currency,COALESCE(SUM(balance),0) AS outstanding,COALESCE(SUM(balance) FILTER(WHERE "dueOn"< :today),0) AS overdue,COALESCE(SUM(balance) FILTER(WHERE "dueOn" IS NULL),0) AS "undated" FROM "Receivables" WHERE "userId"= :uid GROUP BY currency',{replacements:{uid:req.user.tenantId,today:today()}});return sendResponse(res,200,{rows,coverage:'new-tracked-receivables-only'},'Synthèse des créances');}catch(e){next(e)}});
router.get('/:id/payments',async(req,res,next)=>{try{const {page,limit}=paging(req.query),row=await Receivable.findOne({where:{id:req.params.id,userId:req.user.tenantId}});if(!row)throw fail('Créance introuvable',404);const r=await ReceivablePayment.findAndCountAll({where:{userId:req.user.tenantId,receivableId:row.id},order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{receivable:row,rows:r.rows,total:r.count,page,limit},'Règlements');}catch(e){next(e)}});
router.post('/:id/payments',async(req,res,next)=>{try{const r=await service.settle(req,true);return sendResponse(res,r.replayed?200:201,r.row,'Règlement enregistré');}catch(e){next(e)}});
module.exports=router;
