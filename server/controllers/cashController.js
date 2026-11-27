const {CashSession,User}=require('../models');
const {sequelize}=require('../config/database');
const {logActivite}=require('./activiteController');
const {sendResponse}=require('../utils/response');
const {fail,money,round,currency}=require('../utils/transactionSafety');
function expected(session){return Math.round((Number(session.openingBalance||0)+Number(session.totalSales||0)-Number(session.totalExpenses||0))*100)/100;}
exports.getCurrentSession=async(req,res,next)=>{try{const session=await CashSession.findOne({where:{userId:req.user.tenantId,status:'OPEN'}});if(!session)return res.json(null);return res.json({...session.toJSON(),expectedBalance:expected(session)});}catch(e){next(e)}};
exports.openSession=async(req,res,next)=>{
 try{const userId=req.user.tenantId;const result=await sequelize.transaction(async transaction=>{
 const owner=await User.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);
 const existing=await CashSession.findOne({where:{userId,status:'OPEN'},transaction,lock:transaction.LOCK.UPDATE});if(existing)return {session:existing,created:false};
 const opening=round(money(req.body.openingBalance??0),currency(owner.entreprise?.devise));
 const session=await CashSession.create({userId,currency:currency(owner.entreprise?.devise),openingBalance:opening,expectedBalance:opening,totalSales:0,totalExpenses:0,note:req.body.note,status:'OPEN'},{transaction});return {session,created:true};
 });if(result.created)await logActivite(req.user.id,'CAISSE',`Ouverture de caisse #${result.session.id}`,'Caisse',userId);
 return sendResponse(res,result.created?201:200,result.session,result.created?'Caisse ouverte':'Session déjà ouverte');
 }catch(e){next(e)}
};
exports.closeSession=async(req,res,next)=>{
 try{const userId=req.user.tenantId;const session=await sequelize.transaction(async transaction=>{
 const owner=await User.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);
 const row=await CashSession.findOne({where:{userId,status:'OPEN'},transaction,lock:transaction.LOCK.UPDATE});if(!row)throw fail('Aucune session ouverte',404);
 if(row.currency!==currency(owner.entreprise?.devise))throw fail('Rapprochement de la devise de caisse nécessaire',409);
 if(req.body.closingBalance==null)throw fail('Saisissez le montant réellement compté en caisse');
 const balance=expected(row),actual=round(money(req.body.closingBalance),currency(owner.entreprise?.devise));
 if(actual!==balance&&(!req.body.note||typeof req.body.note!=='string'||!req.body.note.trim()))throw fail('Justifiez l’écart de caisse avant la clôture');
 await row.update({closingTime:new Date(),closingBalance:actual,expectedBalance:balance,status:'CLOSED',note:req.body.note??row.note},{transaction});return row;
 });await logActivite(req.user.id,'CAISSE',`Fermeture de caisse #${session.id}`,'Caisse',userId);return res.json(session);
 }catch(e){next(e)}
};
exports.getSessions=async(req,res,next)=>{try{return sendResponse(res,200,await CashSession.findAll({where:{userId:req.user.tenantId},order:[['createdAt','DESC']],limit:50}),'Historique des sessions récupéré')}catch(e){next(e)}};
exports.deleteSession=async(req,res)=>res.status(409).json({message:'La suppression des sessions de caisse est désactivée pour préserver la traçabilité.'});
