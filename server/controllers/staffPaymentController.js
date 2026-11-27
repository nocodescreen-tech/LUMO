const {StaffPayment,User}=require('../models');
const {sequelize}=require('../config/database');
const {sendResponse}=require('../utils/response');
const {fail}=require('../utils/transactionSafety');
const ledger=require('../utils/commercialLedger');
const {prepare,pay}=require('../utils/cashOutflow');
const {logActivite}=require('./activiteController');
const {invalidateCache}=require('../utils/cache');
exports.createPayment=async(req,res,next)=>{try{
 const {staffId,amount,devise,type='SALAIRE',note}=req.body,userId=req.user.tenantId;
 if(!['SALAIRE','TRANSPORT','PRIME','AUTRE'].includes(type))throw fail('Type de paiement invalide');
 const result=await sequelize.transaction(async transaction=>{
  await User.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});
  const prior=await ledger.replay(req,'staff.payment',transaction);
  if(prior){const payment=await StaffPayment.findOne({where:{id:prior.resourceId,userId},transaction});if(!payment)throw fail('Paiement historique indisponible',409);return {payment,replayed:true};}
  const member=await User.findOne({where:{id:staffId,parentId:userId},transaction});if(!member)throw fail('Membre d’équipe non trouvé',404);
  if(await require('../models').PayRate.findOne({where:{userId,staffId},transaction}))throw fail('Collaborateur géré par la paie mensuelle : utilisez son bulletin',409);
  const ctx=await prepare(req,transaction,amount,devise);
  const payment=await StaffPayment.create({userId,staffId,amount:ctx.amount,devise:ctx.devise,type,date:new Date(),note:typeof note==='string'?note.slice(0,1000):null},{transaction});
  await pay(req,transaction,ctx,'STAFF_PAYMENT',payment.id,'PAYROLL_EXPENSE');
  await ledger.remember(req,'staff.payment',payment.id,transaction);return {payment,replayed:false};
 });
 if(!result.replayed)await logActivite(req.user.id,'PAIEMENT_PERSONNEL','Paiement #'+result.payment.id,'Finance',userId);
 await invalidateCache('stats');return sendResponse(res,result.replayed?200:201,result.payment,'Paiement enregistré');
}catch(e){next(e)}};
exports.getStaffPayments=async(req,res,next)=>{try{
 const userId=req.user.tenantId,where={userId};if(req.query.staffId)where.staffId=req.query.staffId;
 const payments=await StaffPayment.findAll({where,order:[['date','DESC']],limit:500,include:[{model:User,as:'member',attributes:['nom','email']}]});
 return sendResponse(res,200,payments,'Paiements récupérés');
}catch(e){next(e)}};
exports.deletePayment=async(req,res)=>res.status(409).json({message:'Suppression interdite. Un workflow de contrepassation est requis.'});
