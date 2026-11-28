const {CashSession,User,Branch,Organization}=require('../models');
const {sequelize}=require('../config/database');
const {logActivite}=require('./activiteController');
const {sendResponse}=require('../utils/response');
const {fail,money,round,currency}=require('../utils/transactionSafety');
const scope=require('../utils/cashScope');
function expected(session){return round(Number(session.openingBalance||0)+Number(session.totalSales||0)-Number(session.totalExpenses||0),session.currency||'CDF');}
const note=v=>{if(v==null||v==='')return null;if(typeof v!=='string'||v.trim().length>1000)throw fail('Observation invalide');return v.trim()||null;};
exports.getCurrentSession=async(req,res,next)=>{try{const branchKey=await scope.resolve(req.user,req.query.branchKey),session=await scope.open(req.user.tenantId,branchKey);return res.json(session?{...session.toJSON(),expectedBalance:expected(session)}:null);}catch(e){next(e)}};
exports.openSession=async(req,res,next)=>{try{const userId=req.user.tenantId,result=await sequelize.transaction(async transaction=>{
 const owner=await User.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);
 const branchKey=await scope.resolve(req.user,req.body.branchKey,transaction,{write:true}),existing=await scope.open(userId,branchKey,transaction);if(existing)return {session:existing,created:false};
 const devise=currency(owner.entreprise?.devise),opening=round(money(req.body.openingBalance??0),devise);
 const session=await CashSession.create({userId,branchKey,openedBy:req.user.id,currency:devise,openingBalance:opening,expectedBalance:opening,totalSales:0,totalExpenses:0,note:note(req.body.note),status:'OPEN'},{transaction});return {session,created:true};
 });if(result.created)await logActivite(req.user.id,'CAISSE','Ouverture de caisse #'+result.session.id,'Caisse',userId);
 return sendResponse(res,result.created?201:200,result.session,result.created?'Caisse ouverte':'Session déjà ouverte');
}catch(e){next(e)}};
exports.closeSession=async(req,res,next)=>{try{const userId=req.user.tenantId,session=await sequelize.transaction(async transaction=>{
 const owner=await User.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);
 const branchKey=await scope.resolve(req.user,req.body.branchKey,transaction,{write:true}),row=await scope.open(userId,branchKey,transaction);if(!row)throw fail('Aucune session ouverte',404);
 if(Number(req.body.sessionId)!==row.id)throw fail('Session modifiée : actualisez avant de clôturer',409);
 if(row.currency!==currency(owner.entreprise?.devise))throw fail('Rapprochement de la devise de caisse nécessaire',409);
 if(req.body.closingBalance==null||req.body.closingBalance==='')throw fail('Saisissez le montant réellement compté en caisse');
 const balance=expected(row),actual=round(money(req.body.closingBalance),row.currency),description=note(req.body.note);
 if(actual!==balance&&!description)throw fail('Justifiez l’écart de caisse avant la clôture');
 await row.update({closingTime:new Date(),closingBalance:actual,expectedBalance:balance,status:'CLOSED',closedBy:req.user.id,note:description??row.note},{transaction});return row;
 });await logActivite(req.user.id,'CAISSE','Fermeture de caisse #'+session.id,'Caisse',userId);return res.json(session);
}catch(e){next(e)}};
exports.getSessions=async(req,res,next)=>{try{const branchKey=await scope.resolve(req.user,req.query.branchKey);return sendResponse(res,200,await CashSession.findAll({where:{userId:req.user.tenantId,branchKey},order:[['id','DESC']],limit:50}),'Historique des sessions')}catch(e){next(e)}};
exports.getLocations=async(req,res,next)=>{try{const uid=req.user.tenantId;if(req.user.parentId){const key=await scope.resolve(req.user);const w=await require('../utils/staffScope').location(req.user),branch=w&&await Branch.findOne({where:{id:key,organizationId:w.organizationId}});return sendResponse(res,200,[{id:key,name:branch?.name||'Caisse centrale'}],'Caisses autorisées');}
 if(req.user.role!=='admin')throw fail('Accès refusé',403);const org=await Organization.findOne({where:{ownerId:uid}}),branches=org?await Branch.findAll({where:{organizationId:org.id,active:true},attributes:['id','name'],order:[['name','ASC']]}):[];return sendResponse(res,200,[{id:0,name:'Caisse centrale'},...branches],'Caisses autorisées');
}catch(e){next(e)}};
exports.deleteSession=async(req,res)=>res.status(409).json({message:'La suppression des sessions de caisse est désactivée.'});
