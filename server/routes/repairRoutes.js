const router=require('express').Router();
const {protect,authorize}=require('../middleware/authMiddleware');
const {RepairOrder,RepairEvent,SerialUnit,SerialEvent,Product,Sale,Client,User}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {fail,currency,money}=require('../utils/transactionSafety');
const {sendResponse}=require('../utils/response');
const ledger=require('../utils/commercialLedger');
const {today}=require('../utils/lotService');
const {validImei}=require('../utils/serialService');
const states=['RECEIVED','DIAGNOSIS','WAITING_APPROVAL','REPAIRING','READY','DELIVERED','CANCELLED'];
const transition={RECEIVED:['DIAGNOSIS','CANCELLED'],DIAGNOSIS:['WAITING_APPROVAL','CANCELLED'],WAITING_APPROVAL:['REPAIRING','DIAGNOSIS','CANCELLED'],REPAIRING:['READY'],READY:['DELIVERED','REPAIRING']};
const clean=(v,max,optional=false)=>{if(optional&&(v==null||v===''))return null;if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw fail('Texte invalide');return v.trim();};
const terminal=['DELIVERED','CANCELLED'];
const pageOf=q=>({page:Math.max(1,Math.min(100000,parseInt(q.page)||1)),limit:Math.max(1,Math.min(100,parseInt(q.limit)||20))});
const append=(req,order,kind,note,transaction,fromStatus=null,details={})=>RepairEvent.create({userId:order.userId,orderId:order.id,actorId:req.user.id,kind,fromStatus,toStatus:order.status,note,details},{transaction});
async function owner(req,transaction){const row=await User.findByPk(req.user.tenantId,{transaction,lock:transaction.LOCK.UPDATE});if(!row)throw fail('Entreprise introuvable',404);return row;}
async function soldUnit(uid,id,transaction){const unit=await SerialUnit.findOne({where:{id,userId:uid,status:'SOLD'},transaction,...(transaction?{lock:transaction.LOCK.UPDATE}:{})});if(!unit)throw fail('Appareil vendu introuvable',404);const sale=await Sale.findOne({where:{id:unit.saleId,userId:uid},transaction});const event=await SerialEvent.findOne({where:{userId:uid,unitId:unit.id,saleId:unit.saleId,kind:'SALE'},transaction,order:[['id','DESC']]});const product=await Product.findOne({where:{id:unit.productId,userId:uid},transaction,attributes:['id','nom']});if(!sale||!event||!product)throw fail('Historique de vente incomplet',409);return {unit,sale,event,product,warrantyStatus:!event.warrantyUntil?'NONE':event.warrantyUntil>=today()?'ACTIVE':'EXPIRED'};}
router.use(protect,authorize('admin'));
router.get('/warranty/:id',async(req,res,next)=>{try{const {unit,sale,event,product,warrantyStatus}=await soldUnit(req.user.tenantId,req.params.id);return sendResponse(res,200,{unitId:unit.id,serial:unit.serial,imei:unit.imei,deviceName:product.nom,saleId:sale.id,soldAt:sale.createdAt,warrantyUntil:event.warrantyUntil,warrantyStatus,customerName:sale.clientInfo?.nom||null,customerPhone:sale.clientInfo?.telephone||null},'Garantie commerciale enregistrée');}catch(e){next(e)}});
router.get('/',async(req,res,next)=>{try{const {page,limit}=pageOf(req.query),where={userId:req.user.tenantId};if(states.includes(req.query.status))where.status=req.query.status;if(typeof req.query.q==='string'&&req.query.q.trim()){const q='%'+req.query.q.trim().slice(0,100)+'%';where[Op.or]=['customerName','deviceName','serial','imei'].map(k=>({[k]:{[Op.iLike]:q}}));}const r=await RepairOrder.findAndCountAll({where,order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{rows:r.rows,total:r.count,page,limit},'Dossiers SAV');}catch(e){next(e)}});
router.post('/',async(req,res,next)=>{try{
 if(!req.body.operationId)throw fail('Clé de transaction requise');
 const issue=clean(req.body.issue,3000),condition=clean(req.body.condition,2000),accessories=clean(req.body.accessories,250,true),customerName=clean(req.body.customerName,160),customerPhone=clean(req.body.customerPhone,50,true);
 const result=await sequelize.transaction(async transaction=>{
 const own=await owner(req,transaction),uid=own.id,prior=await ledger.replay(req,'repair.create',transaction);if(prior)return {row:await RepairOrder.findOne({where:{id:prior.resourceId,userId:uid},transaction}),replayed:true};
 let data={unitId:null,saleId:null,clientId:null,warrantyUntil:null,warrantyStatus:'UNVERIFIED'};
 if(req.body.unitId!=null){const {unit,sale,event,product,warrantyStatus}=await soldUnit(uid,req.body.unitId,transaction);data={unitId:unit.id,saleId:sale.id,clientId:sale.clientId,deviceName:product.nom,serial:unit.serial,imei:unit.imei,warrantyUntil:event.warrantyUntil,warrantyStatus};}
 else{data.deviceName=clean(req.body.deviceName,160);data.serial=clean(req.body.serial,100,true)?.toUpperCase()||null;data.imei=validImei(req.body.imei);if(req.body.clientId!=null){const client=await Client.findOne({where:{id:req.body.clientId,userId:uid},transaction});if(!client)throw fail('Client introuvable',404);data.clientId=client.id;}if((data.serial||data.imei)&&await SerialUnit.findOne({where:{userId:uid,[Op.or]:[...(data.serial?[{serial:data.serial}]:[]),...(data.imei?[{imei:data.imei}]:[])]},transaction}))throw fail('Appareil connu : utilisez le dossier lié à sa vente',409);}
 const matches=[...(data.unitId?[{unitId:data.unitId}]:[]),...(data.imei?[{imei:data.imei}]:[]),...(data.serial?[{serial:data.serial}]:[])];
 if(matches.length&&await RepairOrder.findOne({where:{userId:uid,status:{[Op.notIn]:terminal},[Op.or]:matches},transaction}))throw fail('Un dossier actif existe déjà pour cet appareil',409);
 const row=await RepairOrder.create({userId:uid,actorId:req.user.id,...data,customerName,customerPhone,issue,condition,accessories,status:'RECEIVED'}, {transaction});
 await append(req,row,'INTAKE','Réception physique enregistrée',transaction);await ledger.remember(req,'repair.create',row.id,transaction);return {row,replayed:false};
 });return sendResponse(res,result.replayed?200:201,result.row,'Dossier enregistré');
}catch(e){next(e)}});
router.get('/:id',async(req,res,next)=>{try{const row=await RepairOrder.findOne({where:{id:req.params.id,userId:req.user.tenantId}});if(!row)throw fail('Dossier introuvable',404);const {page,limit}=pageOf(req.query),events=await RepairEvent.findAndCountAll({where:{userId:req.user.tenantId,orderId:row.id},order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{order:row,events:events.rows,total:events.count,page,limit},'Dossier SAV');}catch(e){next(e)}});
router.post('/:id/actions',async(req,res,next)=>{try{
 const note=clean(req.body.note,2000),action=req.body.action;if(!req.body.operationId)throw fail('Clé de transaction requise');
 const result=await sequelize.transaction(async transaction=>{
 const own=await owner(req,transaction),uid=own.id,prior=await ledger.replay(req,'repair.action',transaction);if(prior)return {row:await RepairEvent.findOne({where:{id:prior.resourceId,userId:uid},transaction}),replayed:true};
 const row=await RepairOrder.findOne({where:{id:req.params.id,userId:uid},transaction,lock:transaction.LOCK.UPDATE});if(!row)throw fail('Dossier introuvable',404);if(terminal.includes(row.status))throw fail('Dossier clôturé',409);
 if(req.body.expectedStatus!==row.status)throw fail('Le dossier a changé, actualisez',409);
 const previous=row.status;let details={};
 if(action==='estimate'){if(row.status!=='DIAGNOSIS')throw fail('Diagnostic requis',409);const diagnosis=clean(req.body.diagnosis,3000);const estimate=money(req.body.estimate);const devise=currency(req.body.currency);details={diagnosis,estimate,currency:devise};await row.update({diagnosis,estimate,currency:devise,approvalStatus:'PENDING',status:'WAITING_APPROVAL'},{transaction});}
 else if(action==='approval'){if(row.status!=='WAITING_APPROVAL'||!['APPROVED','DECLINED'].includes(req.body.decision)||req.body.confirmCustomer!==true)throw fail('Confirmation de la décision du client requise',409);details={decision:req.body.decision};await row.update({approvalStatus:req.body.decision},{transaction});}
 else if(action==='transition'){const target=req.body.status;if(!(transition[row.status]||[]).includes(target))throw fail('Transition non autorisée',409);if(row.status==='DIAGNOSIS'&&target==='WAITING_APPROVAL')throw fail('Enregistrez un diagnostic et une estimation',409);if(row.status==='WAITING_APPROVAL'&&target==='REPAIRING'&&row.approvalStatus!=='APPROVED')throw fail('Accord du client requis',409);if(['DELIVERED','CANCELLED'].includes(target)&&req.body.handoverConfirmed!==true)throw fail('Confirmez la restitution physique',409);await row.update({status:target,...(target==='DIAGNOSIS'?{approvalStatus:'PENDING'}:{}),...(terminal.includes(target)?{deliveredAt:new Date()}:{})},{transaction});}
 else if(action==='assign'){const technician=await User.findOne({where:{id:req.body.technicianId,isSuspended:false,[Op.or]:[{id:uid},{parentId:uid}]},attributes:['id'],transaction});if(!technician)throw fail('Collaborateur introuvable',404);details={assignedTo:technician.id};await row.update({assignedTo:technician.id},{transaction});}
 else if(action!=='note')throw fail('Action invalide');
 const e=await append(req,row,action.toUpperCase(),note,transaction,previous,details);await ledger.remember(req,'repair.action',e.id,transaction);return {row:e,replayed:false};
 });return sendResponse(res,result.replayed?200:201,result.row,'Intervention enregistrée');
}catch(e){next(e)}});
module.exports=router;
