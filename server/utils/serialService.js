const {SerialUnit,SerialEvent,Product,User,InventoryLot}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {fail}=require('./transactionSafety');
const ledger=require('./commercialLedger');
const inventory=()=>require('./inventoryService');
const key=w=>w?.id??0;
const clean=(value,max)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw fail('Texte invalide');return value.trim()};
const code=v=>clean(v,100).toUpperCase();
function validImei(value){if(value==null||value==='')return null;if(typeof value!=='string'||!/^\d{15}$/.test(value))throw fail('IMEI invalide (15 chiffres requis)');const sum=[...value].reduce((s,c,i)=>{const n=Number(c)*(i%2?2:1);return s+(n>9?n-9:n)},0);if(sum%10)throw fail('Clé de contrôle IMEI invalide');return value;}
const tracked=(p,transaction)=>SerialUnit.count({where:{userId:p.userId,productId:p.id},transaction}).then(n=>n>0);
const reserved=(p,w,transaction)=>SerialUnit.count({where:{userId:p.userId,productId:p.id,locationKey:key(w),status:{[Op.ne]:'SOLD'}},transaction});
async function event(req,unit,kind,reason,transaction,extra={}){return SerialEvent.create({userId:unit.userId,actorId:req.user.id,productId:unit.productId,unitId:unit.id,kind,reason,...extra},{transaction});}
async function locked(req,transaction){const owner=await User.findByPk(req.user.tenantId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);const product=await Product.findOne({where:{id:req.body.productId,userId:owner.id},transaction,lock:transaction.LOCK.UPDATE});if(!product)throw fail('Produit introuvable',404);return product;}
async function mutate(req,operation,fn){if(!req.body.operationId)throw fail('Clé requise');const reason=clean(req.body.reason,250);return sequelize.transaction(async transaction=>{const product=await locked(req,transaction);const prior=await ledger.replay(req,operation,transaction);if(prior)return {row:await SerialEvent.findOne({where:{id:prior.resourceId,userId:product.userId},transaction}),replayed:true};const row=await fn(product,reason,transaction);await ledger.remember(req,operation,row.id,transaction);return {row,replayed:false}});}
async function register(req){const serial=code(req.body.serial),imei=validImei(req.body.imei),days=req.body.warrantyDays??0;if(!Number.isInteger(days)||days<0||days>3650)throw fail('Durée de garantie invalide');
 return mutate(req,'serial.register',async(product,reason,transaction)=>{
 if(await InventoryLot.count({where:{userId:product.userId,productId:product.id},transaction}))throw fail('Produit déjà suivi par lots',409);
 const wh=await inventory().warehouse(product.userId,req.body.warehouseId,transaction);
 if(await inventory().available(product,wh,transaction)-await reserved(product,wh,transaction)<1)throw fail('Aucune unité physique non identifiée disponible',409);
 if(await SerialUnit.findOne({where:{userId:product.userId,[Op.or]:[{serial},...(imei?[{imei}]:[])]},transaction}))throw fail('Numéro de série ou IMEI déjà enregistré',409);
 const unit=await SerialUnit.create({userId:product.userId,productId:product.id,locationKey:key(wh),serial,imei,warrantyDays:days,status:'AVAILABLE'},{transaction});
 return event(req,unit,'REGISTER',reason,transaction,{toLocation:key(wh)});
 });
}
async function consume(req,p,wh,qty,identifiers,transaction){
 if(!await tracked(p,transaction)){if(identifiers?.length)throw fail('Produit non suivi par numéro de série',409);return [];}
 if(!Array.isArray(identifiers)||identifiers.length!==qty||qty>1000)throw fail('Indiquez exactement un numéro de série par unité vendue',409);
 const codes=identifiers.map(code);if(new Set(codes).size!==codes.length)throw fail('Numéro de série répété',409);
 const units=await SerialUnit.findAll({where:{userId:p.userId,productId:p.id,locationKey:key(wh),status:'AVAILABLE',serial:codes},transaction,lock:transaction.LOCK.UPDATE,order:[['id','ASC']]});
 if(units.length!==qty)throw fail('Numéro de série indisponible ou incorrect',409);
 // Sale ID is assigned after stock changes; intermediate state is not persisted.
 return units;
}
async function recordSale(req,sale,units,transaction){for(const unit of units){await unit.update({status:'SOLD',saleId:sale.id},{transaction});const date=new Date(require('./lotService').today()+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+unit.warrantyDays);await event(req,unit,'SALE','Vente',transaction,{fromLocation:unit.locationKey,saleId:sale.id,warrantyUntil:unit.warrantyDays?date.toISOString().slice(0,10):null});}}
async function refund(req,sale,transaction){const units=await SerialUnit.findAll({where:{userId:sale.userId,saleId:sale.id,status:'SOLD'},transaction,lock:transaction.LOCK.UPDATE});for(const unit of units){await unit.update({status:'QUARANTINE',saleId:null},{transaction});await event(req,unit,'REFUND','Retour à contrôler',transaction,{toLocation:unit.locationKey,saleId:sale.id});}}
async function getUnit(product,id,transaction){const unit=await SerialUnit.findOne({where:{id,userId:product.userId,productId:product.id},transaction,lock:transaction.LOCK.UPDATE});if(!unit)throw fail('Unité introuvable',404);return unit;}
async function transfer(req){return mutate(req,'serial.transfer',async(product,reason,transaction)=>{const unit=await getUnit(product,req.body.unitId,transaction);if(unit.status!=='AVAILABLE')throw fail('Unité non transférable',409);const source=await inventory().warehouse(product.userId,unit.locationKey||null,transaction),dest=await inventory().warehouse(product.userId,req.body.toWarehouseId,transaction);if(key(source)===key(dest))throw fail('Destination identique');await inventory().change(product,source,-1,transaction);await inventory().change(product,dest,1,transaction);await unit.update({locationKey:key(dest)},{transaction});return event(req,unit,'TRANSFER',reason,transaction,{fromLocation:key(source),toLocation:key(dest)});});}
async function release(req){return mutate(req,'serial.release',async(product,reason,transaction)=>{const unit=await getUnit(product,req.body.unitId,transaction);if(unit.status!=='QUARANTINE'||req.body.inspected!==true)throw fail('Inspection confirmée requise',409);await unit.update({status:'AVAILABLE'},{transaction});return event(req,unit,'RELEASE',reason,transaction,{toLocation:unit.locationKey});});}
module.exports={tracked,reserved,register,consume,recordSale,refund,transfer,release,validImei};
