const {StaffAssignment,User,Warehouse,Branch,Organization}=require('../models');
const {sequelize}=require('../config/database');
const {fail}=require('./transactionSafety');
const ledger=require('./commercialLedger');
const isStaff=u=>!!u.parentId;
async function current(u,transaction){if(!isStaff(u))return null;return StaffAssignment.findOne({where:{userId:u.tenantId,staffId:u.id},order:[['id','DESC']],transaction});}
async function location(u,transaction){const a=await current(u,transaction);if(!a?.warehouseId)return null;
 const org=await Organization.findOne({where:{ownerId:u.tenantId},transaction}),w=org&&await Warehouse.findOne({where:{id:a.warehouseId,organizationId:org.id,branchId:a.branchId,active:true},transaction}),branch=w&&await Branch.findOne({where:{id:w.branchId,organizationId:org.id,active:true},transaction});
 if(!branch)throw fail('Affectation indisponible : contactez votre administrateur',409);return w;}
async function resolve(u,requested,transaction,{read=false}={}){const inventory=require('./inventoryService');if(!isStaff(u))return inventory.warehouse(u.tenantId,requested,transaction);
 const w=await location(u,transaction),id=inventory.warehouseId(requested);
 if(read&&requested===undefined)return w;
 if(id!==(w?.id??null))throw fail('Emplacement non autorisé ou affectation modifiée : rechargez le POS',403);
 return w;}
async function restrictMutation(u,transaction){if(isStaff(u)&&(await current(u,transaction))?.warehouseId)throw fail('Opération globale réservée au propriétaire pour un collaborateur affecté',403);}
async function assign(req){const {staffId,warehouseId,expectedAssignmentId,reason}=req.body;if(!Number.isSafeInteger(staffId)||staffId<=0||!(warehouseId===null||Number.isSafeInteger(warehouseId)&&warehouseId>0)||!(expectedAssignmentId===null||Number.isSafeInteger(expectedAssignmentId)&&expectedAssignmentId>0)||typeof reason!=='string'||!reason.trim()||reason.length>250||!req.body.operationId)throw fail('Affectation, version, motif et clé requis');
 return sequelize.transaction(async transaction=>{const owner=await User.findByPk(req.user.tenantId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);
 const prior=await ledger.replay(req,'staff.assignment',transaction);if(prior)return {row:await StaffAssignment.findOne({where:{id:prior.resourceId,userId:owner.id},transaction}),replayed:true};
 const staff=await User.findOne({where:{id:staffId,parentId:owner.id,isSuspended:false},transaction,lock:transaction.LOCK.UPDATE});if(!staff||['admin','superadmin'].includes(staff.role))throw fail('Collaborateur introuvable',404);
 const previous=await StaffAssignment.findOne({where:{userId:owner.id,staffId},order:[['id','DESC']],transaction});
 if((previous?.id??null)!==expectedAssignmentId)throw fail('Affectation modifiée : actualisez',409);
 const w=await require('./inventoryService').warehouse(owner.id,warehouseId,transaction);
 if(w&&!await Branch.findOne({where:{id:w.branchId,organizationId:w.organizationId,active:true},transaction}))throw fail('Succursale indisponible',409);
 const row=await StaffAssignment.create({userId:owner.id,staffId,actorId:req.user.id,warehouseId:w?.id??null,branchId:w?.branchId??null,reason:reason.trim()},{transaction});await ledger.remember(req,'staff.assignment',row.id,transaction);return {row,replayed:false};
 });}
module.exports={isStaff,current,location,resolve,restrictMutation,assign};
