const {InventoryLot,LotMovement,Product,User,ReorderRule}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {fail,positiveQuantity,currency,money,rateFor}=require('./transactionSafety');
const ledger=require('./commercialLedger');
const inventory=()=>require('./inventoryService');
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Kinshasa',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const key=wh=>wh?.id??0;
const clean=(v,max)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw fail('Texte invalide');return v.trim()};
const validDate=v=>{if(v==null||v==='')return null;if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))throw fail('Date invalide');const d=new Date(v+'T00:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==v)throw fail('Date invalide');return v;};
const locationWhere=(product,wh)=>({userId:product.userId,productId:product.id,locationKey:key(wh)});
async function tracked(product,transaction){return !!await InventoryLot.findOne({where:{userId:product.userId,productId:product.id},attributes:['id'],transaction});}
async function reserved(product,wh,transaction){return Number(await InventoryLot.sum('quantity',{where:locationWhere(product,wh),transaction})||0);}
async function free(product,wh,transaction){return await inventory().available(product,wh,transaction)-await reserved(product,wh,transaction);}
async function move(req,lot,kind,quantity,reason,transaction,saleId=null){return LotMovement.create({userId:lot.userId,actorId:req.user.id,lotId:lot.id,productId:lot.productId,kind,quantity,reason,saleId},{transaction});}
async function lockProduct(req,id,transaction){const owner=await User.findByPk(req.user.tenantId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);const product=await Product.findOne({where:{id,userId:owner.id},transaction,lock:transaction.LOCK.UPDATE});if(!product)throw fail('Produit introuvable',404);return {owner,product};}
async function assign(req){const quantity=positiveQuantity(req.body.quantity),code=clean(req.body.code,80).toUpperCase(),reason=clean(req.body.reason,250),manufacturedOn=validDate(req.body.manufacturedOn),expiresOn=validDate(req.body.expiresOn);
 if(manufacturedOn&&manufacturedOn>today()||manufacturedOn&&expiresOn&&manufacturedOn>expiresOn||!req.body.operationId)throw fail('Dates ou clé de transaction invalides');
 return sequelize.transaction(async transaction=>{const {product}=await lockProduct(req,req.body.productId,transaction);
 const prior=await ledger.replay(req,'lot.assign',transaction);if(prior)return {row:await LotMovement.findByPk(prior.resourceId,{transaction}),replayed:true};
 const wh=await inventory().warehouse(product.userId,req.body.warehouseId,transaction);
 if(await free(product,wh,transaction)<quantity)throw fail('Quantité non identifiée insuffisante',409);
 // A batch code has the same dates across every location.
 const existing=await InventoryLot.findAll({where:{userId:product.userId,productId:product.id,code},transaction});
 if(existing.some(l=>(l.manufacturedOn||null)!==manufacturedOn||(l.expiresOn||null)!==expiresOn))throw fail('Dates incompatibles avec le lot existant',409);
 let lot=existing.find(l=>l.locationKey===key(wh));if(!lot)lot=await InventoryLot.create({...locationWhere(product,wh),code,manufacturedOn,expiresOn,quantity:0},{transaction});
 await lot.increment('quantity',{by:quantity,transaction});const row=await move(req,lot,'ASSIGN',quantity,reason,transaction);
 await ledger.remember(req,'lot.assign',row.id,transaction);return {row,replayed:false};
 });
}
async function consume(req,product,wh,qty,transaction){
 if(!await tracked(product,transaction))return [];
 const lots=await InventoryLot.findAll({where:{...locationWhere(product,wh),quantity:{[Op.gt]:0},[Op.or]:[{expiresOn:null},{expiresOn:{[Op.gte]:today()}}]},order:[[sequelize.literal('"expiresOn" ASC NULLS LAST')],['createdAt','ASC'],['id','ASC']],transaction,lock:transaction.LOCK.UPDATE});
 if(lots.reduce((s,l)=>s+l.quantity,0)<qty)throw fail('Stock identifié non périmé insuffisant : affectez les lots avant la vente',409);
 const allocations=[];let remaining=qty;
 for(const lot of lots){if(!remaining)break;const used=Math.min(remaining,lot.quantity);await lot.update({quantity:lot.quantity-used},{transaction});allocations.push({lot,quantity:used});remaining-=used;}
 return allocations;
}
async function recordSale(req,sale,allocations,transaction){for(const a of allocations)await move(req,a.lot,'SALE',-a.quantity,'Sortie FEFO / FIFO',transaction,sale.id);}
async function refund(req,sale,transaction){const entries=await LotMovement.findAll({where:{userId:sale.userId,saleId:sale.id,kind:'SALE'},transaction});for(const e of entries){const lot=await InventoryLot.findOne({where:{id:e.lotId,userId:sale.userId,productId:e.productId},transaction,lock:transaction.LOCK.UPDATE});if(!lot)throw fail('Lot historique indisponible',409);await lot.increment('quantity',{by:-e.quantity,transaction});await move(req,lot,'REFUND',-e.quantity,'Retour vente',transaction,sale.id);}}
async function relocate(req){const qty=positiveQuantity(req.body.quantity),reason=clean(req.body.reason,250);if(!req.body.operationId)throw fail('Clé requise');
 return sequelize.transaction(async transaction=>{const {product}=await lockProduct(req,req.body.productId,transaction);const prior=await ledger.replay(req,'lot.transfer',transaction);if(prior)return {row:await LotMovement.findByPk(prior.resourceId,{transaction}),replayed:true};
 const lot=await InventoryLot.findOne({where:{id:req.body.lotId,userId:product.userId,productId:product.id},transaction,lock:transaction.LOCK.UPDATE});if(!lot)throw fail('Lot introuvable',404);
 const source=await inventory().warehouse(product.userId,lot.locationKey||null,transaction),dest=await inventory().warehouse(product.userId,req.body.toWarehouseId,transaction);
 if(key(source)===key(dest)||lot.quantity<qty)throw fail('Destination ou quantité invalide',409);
 await lot.update({quantity:lot.quantity-qty},{transaction});await inventory().change(product,source,-qty,transaction);await inventory().change(product,dest,qty,transaction);
 let target=await InventoryLot.findOne({where:{...locationWhere(product,dest),code:lot.code},transaction});if(!target)target=await InventoryLot.create({...locationWhere(product,dest),code:lot.code,manufacturedOn:lot.manufacturedOn,expiresOn:lot.expiresOn,quantity:0},{transaction});
 await target.increment('quantity',{by:qty,transaction});const row=await move(req,lot,'TRANSFER_OUT',-qty,reason,transaction);await move(req,target,'TRANSFER_IN',qty,'Transfert #'+row.id+' : '+reason.slice(0,200),transaction);
 await ledger.remember(req,'lot.transfer',row.id,transaction);return {row,replayed:false};
 });
}
async function dispose(req){const qty=positiveQuantity(req.body.quantity),reason=clean(req.body.reason,250);if(!req.body.operationId)throw fail('Clé requise');
 return sequelize.transaction(async transaction=>{const {owner,product}=await lockProduct(req,req.body.productId,transaction);const prior=await ledger.replay(req,'lot.dispose',transaction);if(prior)return {row:await LotMovement.findByPk(prior.resourceId,{transaction}),replayed:true};
 const lot=await InventoryLot.findOne({where:{id:req.body.lotId,userId:product.userId,productId:product.id},transaction,lock:transaction.LOCK.UPDATE});if(!lot||lot.quantity<qty)throw fail('Lot ou quantité indisponible',409);
 const wh=await inventory().warehouse(product.userId,lot.locationKey||null,transaction);await lot.update({quantity:lot.quantity-qty},{transaction});await inventory().change(product,wh,-qty,transaction);product.stockUpdateRaison='Sortie de lot';product.stock-=qty;await product.save({transaction});
 const row=await move(req,lot,'DISPOSAL',-qty,reason,transaction),devise=currency(owner.entreprise?.devise),rate=rateFor(owner),cost=require('./currency').convertCurrency(money(product.prixAchat??0),currency(product.devise),devise,rate);
 await ledger.post(req,transaction,{event:'LOT_DISPOSAL',reference:row.id,debit:'INVENTORY_LOSS',credit:'INVENTORY',amount:cost*qty,devise,rate});await ledger.remember(req,'lot.dispose',row.id,transaction);return {row,replayed:false};
 });
}
async function reorder(req){const minimum=Number(req.body.minimum);if(req.body.minimum===null||req.body.minimum===''||!Number.isSafeInteger(minimum)||minimum<0||minimum>2147483647)throw fail('Seuil invalide');
 return sequelize.transaction(async transaction=>{const {product}=await lockProduct(req,req.body.productId,transaction),wh=await inventory().warehouse(product.userId,req.body.warehouseId,transaction);const [row]=await ReorderRule.findOrCreate({where:locationWhere(product,wh),defaults:{minimum},transaction});await row.update({minimum},{transaction});return row;});
}
module.exports={today,tracked,reserved,free,assign,consume,recordSale,refund,relocate,dispose,reorder};
