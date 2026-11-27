const router=require('express').Router();
const {protect,authorize}=require('../middleware/authMiddleware');
const {sequelize}=require('../config/database');
const {Branch,Warehouse,Organization}=require('../models');
const {sendResponse}=require('../utils/response');
const {fail}=require('../utils/transactionSafety');
const svc=require('../utils/workspaceService');
router.use(protect,authorize('admin'));
router.get('/context',async(req,res,next)=>{try{return sendResponse(res,200,await svc.context(req.user.tenantId),'Espace de travail');}catch(e){next(e)}});
router.put('/organization',async(req,res,next)=>{try{
 const org=await sequelize.transaction(async transaction=>{const org=await svc.ensure(req.user.tenantId,transaction);await org.update({name:svc.label(req.body.name)},{transaction});return org;});return sendResponse(res,200,org,'Entreprise mise à jour');
}catch(e){next(e)}});
router.get('/branches',async(req,res,next)=>{try{const {organization}=await svc.context(req.user.tenantId);return sendResponse(res,200,await Branch.findAll({where:{organizationId:organization.id},order:[['name','ASC']]}),'Succursales');}catch(e){next(e)}});
router.post('/branches',require('../utils/platformFlags').guard('workspace_registry_creation'),async(req,res,next)=>{try{
 const row=await sequelize.transaction(async transaction=>{const org=await svc.ensure(req.user.tenantId,transaction),s=await svc.subscription(org,transaction);svc.assertEntitled(org,s);
 if(await Branch.count({where:{organizationId:org.id},transaction})>=s.branchLimit)throw fail('Quota de succursales atteint',409);
 const code=svc.normalizeCode(req.body.code);if(await Branch.findOne({where:{organizationId:org.id,code},transaction}))throw fail('Code déjà utilisé',409);
 return Branch.create({organizationId:org.id,name:svc.label(req.body.name),code,address:req.body.address?svc.label(req.body.address,250):null},{transaction});});
 return sendResponse(res,201,row,'Succursale créée');
}catch(e){next(e)}});
router.get('/warehouses',async(req,res,next)=>{try{const {organization}=await svc.context(req.user.tenantId);return sendResponse(res,200,await Warehouse.findAll({where:{organizationId:organization.id},order:[['name','ASC']]}),'Entrepôts');}catch(e){next(e)}});
router.post('/warehouses',require('../utils/platformFlags').guard('workspace_registry_creation'),async(req,res,next)=>{try{
 const row=await sequelize.transaction(async transaction=>{const org=await svc.ensure(req.user.tenantId,transaction),s=await svc.subscription(org,transaction);svc.assertEntitled(org,s);
 const branch=await Branch.findOne({where:{id:req.body.branchId,organizationId:org.id,active:true},transaction});if(!branch)throw fail('Succursale introuvable',404);
 if(await Warehouse.count({where:{organizationId:org.id},transaction})>=s.warehouseLimit)throw fail('Quota d’entrepôts atteint',409);
 const code=svc.normalizeCode(req.body.code);if(await Warehouse.findOne({where:{organizationId:org.id,code},transaction}))throw fail('Code déjà utilisé',409);
 return Warehouse.create({organizationId:org.id,branchId:branch.id,name:svc.label(req.body.name),code},{transaction});});
 return sendResponse(res,201,row,'Entrepôt créé');
}catch(e){next(e)}});
module.exports=router;
