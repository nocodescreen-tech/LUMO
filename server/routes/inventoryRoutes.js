const router=require('express').Router();
const {protect,authorize}=require('../middleware/authMiddleware');
const {Product,Organization,Warehouse,WarehouseBalance,InventoryTransfer}=require('../models');
const {sequelize}=require('../config/database');
const {Transaction,Op}=require('sequelize');
const {sendResponse}=require('../utils/response');
const {invalidateCache}=require('../utils/cache');
const inventory=require('../utils/inventoryService');
router.use(protect,authorize('admin'));
const paging=q=>({page:Math.max(1,Math.min(100000,parseInt(q.page)||1)),limit:Math.max(1,Math.min(100,parseInt(q.limit)||25))});
router.get('/balances',async(req,res,next)=>{try{
 const userId=req.user.tenantId,{page,limit}=paging(req.query);
 const result=await sequelize.transaction({isolationLevel:Transaction.ISOLATION_LEVELS.REPEATABLE_READ,readOnly:true},async transaction=>{
 const org=await Organization.findOne({where:{ownerId:userId},transaction}),warehouses=org?await Warehouse.findAll({where:{organizationId:org.id},transaction,order:[['name','ASC']]}):[];
 const where={userId};if(typeof req.query.q==='string'&&req.query.q.trim())where.nom={[Op.iLike]:'%'+req.query.q.trim().slice(0,100)+'%'};
 const products=await Product.findAndCountAll({where,attributes:['id','nom','codeBarre','stock','stockAlerte'],transaction,order:[['nom','ASC'],['id','ASC']],limit,offset:(page-1)*limit});
 const balances=await WarehouseBalance.findAll({where:{userId,productId:products.rows.map(p=>p.id)},transaction});
 const rows=products.rows.map(p=>{const assigned=balances.filter(b=>b.productId===p.id);return {...p.toJSON(),unallocated:Number(p.stock)-assigned.reduce((s,b)=>s+Number(b.quantity),0),balances:assigned.map(b=>({warehouseId:b.warehouseId,quantity:b.quantity}))}});
 return {rows,total:products.count,page,limit,warehouses};
 });return sendResponse(res,200,result,'Inventaire');
}catch(e){next(e)}});
router.get('/transfers',async(req,res,next)=>{try{const {page,limit}=paging(req.query),r=await InventoryTransfer.findAndCountAll({where:{userId:req.user.tenantId},order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{rows:r.rows,total:r.count,page,limit},'Transferts');}catch(e){next(e)}});
router.post('/transfers',async(req,res,next)=>{try{const result=await inventory.transfer(req);await invalidateCache('products');return sendResponse(res,result.replayed?200:201,result.row,'Transfert enregistré');}catch(e){next(e)}});
module.exports=router;
