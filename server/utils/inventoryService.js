const {Organization,Warehouse,WarehouseBalance,InventoryTransfer,Product,User}=require('../models');
const {sequelize}=require('../config/database');
const {fail,positiveQuantity}=require('./transactionSafety');
const ledger=require('./commercialLedger');
function warehouseId(value){if(value===null||value===undefined)return null;const n=Number(value);if(!Number.isSafeInteger(n)||n<=0)throw fail('Entrepôt invalide');return n;}
async function warehouse(userId,value,transaction){const id=warehouseId(value);if(id===null)return null;const org=await Organization.findOne({where:{ownerId:userId},transaction});const row=org&&await Warehouse.findOne({where:{id,organizationId:org.id,active:true},transaction});if(!row)throw fail('Entrepôt introuvable dans cette entreprise',404);return row;}
async function allocated(product,transaction){return Number(await WarehouseBalance.sum('quantity',{where:{userId:product.userId,productId:product.id},transaction})||0);}
async function balance(product,wh,transaction){return WarehouseBalance.findOne({where:{userId:product.userId,warehouseId:wh.id,productId:product.id},transaction,lock:transaction.LOCK.UPDATE});}
async function available(product,wh,transaction){if(!wh)return Number(product.stock)-await allocated(product,transaction);return Number((await balance(product,wh,transaction))?.quantity||0);}
async function change(product,wh,delta,transaction){if(!wh)return;
 const row=await balance(product,wh,transaction),next=Number(row?.quantity||0)+delta;
 if(!Number.isSafeInteger(next)||next<0||next>2147483647)throw fail('Quantité disponible insuffisante ou invalide',409);
 if(row)await row.update({quantity:next},{transaction});else await WarehouseBalance.create({userId:product.userId,organizationId:wh.organizationId,warehouseId:wh.id,productId:product.id,quantity:next},{transaction});
}
async function transfer(req){const userId=req.user.tenantId,{productId,quantity,reason}=req.body,from=warehouseId(req.body.fromWarehouseId),to=warehouseId(req.body.toWarehouseId),qty=positiveQuantity(quantity);
 if(from===to||!req.body.operationId||typeof reason!=='string'||!reason.trim()||reason.length>250)throw fail('Source, destination, motif et clé de transaction requis');
 return sequelize.transaction(async transaction=>{
 const owner=await User.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);
 const prior=await ledger.replay(req,'inventory.transfer',transaction);if(prior){const row=await InventoryTransfer.findOne({where:{id:prior.resourceId,userId},transaction});if(!row)throw fail('Transfert introuvable',409);return {row,replayed:true}}
 const product=await Product.findOne({where:{id:productId,userId},transaction,lock:transaction.LOCK.UPDATE});if(!product)throw fail('Produit introuvable',404);
 const source=await warehouse(userId,from,transaction),destination=await warehouse(userId,to,transaction);
 if(await available(product,source,transaction)<qty)throw fail('Stock insuffisant dans la source',409);
 await change(product,source,-qty,transaction);await change(product,destination,qty,transaction);
 const row=await InventoryTransfer.create({userId,actorId:req.user.id,productId:product.id,fromWarehouseId:from,toWarehouseId:to,quantity:qty,reason:reason.trim()},{transaction});
 await ledger.remember(req,'inventory.transfer',row.id,transaction);return {row,replayed:false};
 });
}
module.exports={warehouseId,warehouse,allocated,available,change,transfer};
