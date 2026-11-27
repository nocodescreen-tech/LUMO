const router=require('express').Router();
const {protect,authorize}=require('../middleware/authMiddleware');
const {SupportTicket,SupportMessage,User,Activite}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {fail}=require('../utils/transactionSafety');
const {sendResponse}=require('../utils/response');
const categories=['TECHNICAL','BILLING','ACCOUNT','FEATURE','OTHER'],priorities=['LOW','NORMAL','HIGH','URGENT'],statuses=['OPEN','IN_PROGRESS','WAITING_CUSTOMER','RESOLVED','CLOSED'];
const clean=(v,max)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw fail('Texte invalide');return v.trim()};
const platform=req=>req.user.role==='superadmin';
const whereFor=req=>platform(req)?{}:{ownerId:req.user.tenantId};
const audit=(req,ticket,type,description,transaction)=>Activite.create({UserId:req.user.id,shopId:req.user.id,module:'Platform',type,description:'Ticket #'+ticket.id+' : '+description},{transaction});
const find=async(req,transaction)=>{const row=await SupportTicket.findOne({where:{...whereFor(req),id:req.params.id},transaction,...(transaction?{lock:transaction.LOCK.UPDATE}:{})});if(!row)throw fail('Ticket introuvable',404);return row;};
router.use(protect,authorize('admin','superadmin'));
router.get('/',async(req,res,next)=>{try{
 const page=Math.max(1,Math.min(100000,parseInt(req.query.page)||1)),limit=Math.max(1,Math.min(50,parseInt(req.query.limit)||20)),where=whereFor(req);
 if(statuses.includes(req.query.status))where.status=req.query.status;
 if(priorities.includes(req.query.priority))where.priority=req.query.priority;
 if(typeof req.query.q==='string'&&req.query.q.trim())where.subject={[Op.iLike]:'%'+req.query.q.trim().slice(0,100)+'%'};
 const result=await SupportTicket.findAndCountAll({where,order:[['updatedAt','DESC'],['id','DESC']],limit,offset:(page-1)*limit});
 return sendResponse(res,200,{rows:result.rows,total:result.count,page,limit},'Tickets');
}catch(e){next(e)}});
router.post('/',authorize('admin'),require('../utils/platformFlags').guard('support_new_tickets'),async(req,res,next)=>{try{
 const subject=clean(req.body.subject,160),body=clean(req.body.body,5000),category=req.body.category;
 if(!categories.includes(category))throw fail('Catégorie invalide');
 const row=await sequelize.transaction(async transaction=>{
 const owner=await User.findByPk(req.user.tenantId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);
 if(await SupportTicket.count({where:{ownerId:owner.id,status:{[Op.notIn]:['CLOSED','RESOLVED']}},transaction})>=20)throw fail('Limite de tickets ouverts atteinte',409);
 const ticket=await SupportTicket.create({ownerId:owner.id,createdBy:req.user.id,subject,category,priority:'NORMAL',status:'OPEN'},{transaction});
 await SupportMessage.create({ticketId:ticket.id,actorId:req.user.id,actorRole:'CUSTOMER',body},{transaction});return ticket;
 });return sendResponse(res,201,row,'Ticket créé');
}catch(e){next(e)}});
router.get('/:id',async(req,res,next)=>{try{
 const ticket=await find(req);const before=Number(req.query.before)||null;
 const where={ticketId:ticket.id};if(before>0)where.id={[Op.lt]:before};
 const messages=await SupportMessage.findAll({where,order:[['id','DESC']],limit:51});const hasMore=messages.length>50;
 return sendResponse(res,200,{ticket,messages:messages.slice(0,50).reverse(),hasMore},'Conversation');
}catch(e){next(e)}});
router.post('/:id/messages',async(req,res,next)=>{try{
 const body=clean(req.body.body,5000);
 const row=await sequelize.transaction(async transaction=>{
 const ticket=await find(req,transaction);if(['CLOSED','RESOLVED'].includes(ticket.status))throw fail('Ticket clôturé ou résolu',409);
 const message=await SupportMessage.create({ticketId:ticket.id,actorId:req.user.id,actorRole:platform(req)?'SUPPORT':'CUSTOMER',body},{transaction});
 if(!platform(req)&&ticket.status==='WAITING_CUSTOMER')ticket.status='OPEN';
 ticket.changed('updatedAt',true);ticket.updatedAt=new Date();await ticket.save({transaction});
 return message;
 });return sendResponse(res,201,row,'Message enregistré');
}catch(e){next(e)}});
router.patch('/:id',authorize('superadmin'),async(req,res,next)=>{try{
 const reason=clean(req.body.reason,250);
 const row=await sequelize.transaction(async transaction=>{
 const ticket=await find(req,transaction),fields={};
 if(req.body.status!==undefined){if(!statuses.includes(req.body.status))throw fail('État invalide');fields.status=req.body.status;fields.closedAt=req.body.status==='CLOSED'?new Date():null;}
 if(req.body.priority!==undefined){if(!priorities.includes(req.body.priority))throw fail('Priorité invalide');fields.priority=req.body.priority;}
 if(req.body.assignToMe===true)fields.assignedTo=req.user.id;
 if(!Object.keys(fields).length)throw fail('Aucune modification');
 await ticket.update(fields,{transaction});await audit(req,ticket,'PLATFORM_SUPPORT_UPDATE',JSON.stringify(fields)+' — '+reason,transaction);return ticket;
 });return sendResponse(res,200,row,'Ticket mis à jour');
}catch(e){next(e)}});
module.exports=router;
