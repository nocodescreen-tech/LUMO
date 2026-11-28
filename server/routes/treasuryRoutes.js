const router=require('express').Router();
const {protect,authorize}=require('../middleware/authMiddleware');
const {TreasuryAccount,TreasuryTransfer,TreasuryReconciliation,CashSession,User}=require('../models');
const {sequelize}=require('../config/database');
const {sendResponse}=require('../utils/response');
const {currency}=require('../utils/transactionSafety');
const svc=require('../utils/treasuryService');
const {Op}=require('sequelize');
const {fail}=require('../utils/transactionSafety');
router.use(protect,authorize('admin'));
const paging=q=>({page:Math.max(1,Math.min(100000,parseInt(q.page)||1)),limit:Math.max(1,Math.min(100,parseInt(q.limit)||20))});
router.get('/accounts',async(req,res,next)=>{try{const uid=req.user.tenantId,result=await sequelize.transaction({isolationLevel:'REPEATABLE READ'},async transaction=>{
 const owner=await User.findByPk(uid,{transaction,attributes:['entreprise']}),rows=await TreasuryAccount.findAll({where:{userId:uid},order:[['name','ASC']],transaction}),session=await CashSession.findOne({where:{userId:uid,branchKey:0,status:'OPEN'},attributes:['id','currency','expectedBalance'],transaction});
 const [controls]=await sequelize.query(`SELECT a.id,a.balance-COALESCE(SUM(CASE WHEN t."toAccountId"=a.id THEN t.amount ELSE -t.amount END),0) AS "controlDifference" FROM "TreasuryAccounts" a LEFT JOIN "TreasuryTransfers" t ON t."userId"=a."userId" AND (t."fromAccountId"=a.id OR t."toAccountId"=a.id) WHERE a."userId"= :uid GROUP BY a.id,a.balance`,{replacements:{uid},transaction});
 // A left-join row without a transfer contributes NULL, not a fictitious movement.
 return {rows:rows.map(r=>({...r.toJSON(),controlDifference:controls.find(c=>c.id===r.id)?.controlDifference??null})),cash:session,accountingCurrency:currency(owner.entreprise?.devise),mode:'manual-recording',openingBalancesIncluded:false};
 });return sendResponse(res,200,result,'Trésorerie');}catch(e){next(e)}});
for(const [path,model] of [['transfers',TreasuryTransfer],['reconciliations',TreasuryReconciliation]])router.get('/'+path,async(req,res,next)=>{try{const {page,limit}=paging(req.query),where={userId:req.user.tenantId};if(['USD','CDF'].includes(req.query.currency))where.currency=req.query.currency;
 if(req.query.accountId){const id=Number(req.query.accountId);if(!Number.isSafeInteger(id)||id<1||id>2147483647)throw fail('Compte invalide');if(path==='transfers')where[Op.or]=[{fromAccountId:id},{toAccountId:id}];else where.accountId=id;}
 const r=await model.findAndCountAll({where,order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{rows:r.rows,total:r.count,page,limit},'Historique');}catch(e){next(e)}});
for(const [path,fn] of [['accounts',svc.create],['transfers',svc.transfer],['reconciliations',svc.reconcile]])router.post('/'+path,async(req,res,next)=>{try{const r=await fn(req);return sendResponse(res,r.replayed?200:201,r.row,'Opération enregistrée')}catch(e){next(e)}});
module.exports=router;
