const {Organization,Warehouse,WarehouseBalance,InventoryTransfer,InventoryCount,Product,User}=require('../models');
const {sequelize}=require('../config/database');
const {fail,positiveQuantity,currency,rateFor,money}=require('./transactionSafety');
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
const countQty=value=>{if(value===null||value===''||typeof value==='boolean'||!Number.isSafeInteger(Number(value))||Number(value)<0||Number(value)>2147483647)throw fail('Quantité comptée invalide');return Number(value)};
async function reconcile(req){
 const userId=req.user.tenantId,{productId,reason}=req.body,whId=warehouseId(req.body.warehouseId),expected=countQty(req.body.expected),counted=countQty(req.body.counted);
 if(!req.body.operationId||typeof reason!=='string'||!reason.trim()||reason.length>250)throw fail('Motif et clé de transaction requis');
 return sequelize.transaction(async transaction=>{
 const owner=await User.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);
 const prior=await ledger.replay(req,'inventory.count',transaction);if(prior){const row=await InventoryCount.findOne({where:{id:prior.resourceId,userId},transaction});if(!row)throw fail('Inventaire introuvable',409);return {row,replayed:true}}
 const product=await Product.findOne({where:{id:productId,userId},transaction,lock:transaction.LOCK.UPDATE});if(!product)throw fail('Produit introuvable',404);
 const wh=await warehouse(userId,whId,transaction),current=await available(product,wh,transaction);
 if(current!==expected)throw fail('Le stock a changé depuis le relevé : actualisez et recomptez',409);
 const delta=counted-expected,total=Number(product.stock)+delta;
 if(total<0||total>2147483647)throw fail('Stock total invalide',409);
 const rate=rateFor(owner),devise=currency(owner.entreprise?.devise),unitCost=require('./currency').convertCurrency(money(product.prixAchat??0),currency(product.devise),devise,rate);
 if(delta<0)await change(product,wh,delta,transaction);
 if(delta!==0){product.stockUpdateRaison='Inventaire physique';product.stock=total;await product.save({transaction});}
 if(delta>0)await change(product,wh,delta,transaction);
 const row=await InventoryCount.create({userId,actorId:req.user.id,productId:product.id,warehouseId:whId,expected,counted,delta,reason:reason.trim(),unitCost,currency:devise,rate},{transaction});
 if(delta)await ledger.post(req,transaction,{event:'INVENTORY_COUNT',reference:row.id,debit:delta>0?'INVENTORY':'INVENTORY_LOSS',credit:delta>0?'INVENTORY_GAIN':'INVENTORY',amount:Math.abs(delta)*unitCost,devise,rate});
 await ledger.remember(req,'inventory.count',row.id,transaction);return {row,replayed:false};
 });
}
module.exports={warehouseId,warehouse,allocated,available,change,transfer,reconcile};
