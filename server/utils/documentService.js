const {CommercialDocument,DocumentEvent,DocumentSequence,Product,Client,Sale,User}=require('../models');
const {sequelize}=require('../config/database');
const {fail,positiveQuantity,rateFor,currency,round,money}=require('./transactionSafety');
const {convertCurrency}=require('./currency');
const {today}=require('./lotService');
const ledger=require('./commercialLedger');
const inventory=require('./inventoryService');
const clean=(v,max,optional=false)=>{if(optional&&(v==null||v===''))return null;if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw fail('Texte invalide');return v.trim()};
const issuer=owner=>({name:owner.entreprise?.nom||owner.nom,address:owner.entreprise?.adresse||'',phone:owner.entreprise?.telephone||owner.telephone||''});
const customer=client=>({name:client.nom,email:client.email||'',phone:client.telephone||'',address:client.adresse||''});
async function number(uid,type,transaction){const year=Number(today().slice(0,4)),[seq]=await DocumentSequence.findOrCreate({where:{userId:uid,type,year},defaults:{lastNumber:0},transaction});await seq.increment('lastNumber',{transaction});await seq.reload({transaction});return ({QUOTE:'DEV',INVOICE:'FAC',DELIVERY:'BL'}[type])+'-'+year+'-'+String(seq.lastNumber).padStart(6,'0')}
const append=(req,doc,kind,note,transaction)=>DocumentEvent.create({userId:doc.userId,documentId:doc.id,actorId:req.user.id,kind,note},{transaction});
async function mutate(req,op,fn){if(!req.body.operationId)throw fail('Clé de transaction requise');return sequelize.transaction(async transaction=>{const owner=await User.findByPk(req.user.tenantId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);const prior=await ledger.replay(req,op,transaction);if(prior)return {row:await CommercialDocument.findOne({where:{id:prior.resourceId,userId:owner.id},transaction}),replayed:true};const row=await fn(owner,transaction);await ledger.remember(req,op,row.id,transaction);return {row,replayed:false}})}
async function createQuote(req){const validUntil=req.body.validUntil;if(typeof validUntil!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(validUntil)||!Number.isFinite(Date.parse(validUntil))||new Date(validUntil).toISOString().slice(0,10)!==validUntil||validUntil<today())throw fail('Date de validité invalide');const items=req.body.items;if(!Array.isArray(items)||!items.length||items.length>200||new Set(items.map(i=>Number(i.id))).size!==items.length)throw fail('Liste de produits invalide ou doublons');const note=clean(req.body.note,2000,true);
 return mutate(req,'document.quote',async(owner,transaction)=>{
 const uid=owner.id,client=await Client.findOne({where:{id:req.body.clientId,userId:uid},transaction});if(!client)throw fail('Client introuvable',404);
 const wh=await inventory.warehouse(uid,req.body.warehouseId,transaction),devise=currency(req.body.currency),rate=rateFor(owner),products=await Product.findAll({where:{id:items.map(i=>i.id),userId:uid},transaction,lock:transaction.LOCK.UPDATE,order:[['id','ASC']]});
 if(products.length!==items.length)throw fail('Produit introuvable',404);
 const lines=items.map(i=>{const p=products.find(p=>p.id===Number(i.id)),quantity=positiveQuantity(i.quantity),unitPrice=convertCurrency(money(p.prix),currency(p.devise),devise,rate);return {id:p.id,name:p.nom,quantity,unitPrice,lineTotal:round(unitPrice*quantity,devise)}});
 const total=round(lines.reduce((s,l)=>s+l.lineTotal,0),devise);money(total);
 const doc=await CommercialDocument.create({userId:uid,actorId:req.user.id,type:'QUOTE',number:await number(uid,'QUOTE',transaction),status:'DRAFT',clientId:client.id,warehouseId:wh?.id??null,currency:devise,rate,total,lines,customer:customer(client),issuer:issuer(owner),validUntil,note},{transaction});
 await append(req,doc,'CREATE','Devis enregistré sans réservation ni encaissement',transaction);return doc;
 });
}
async function transition(req){const target=req.body.status,reason=clean(req.body.reason,250);return mutate(req,'document.transition',async(owner,transaction)=>{const doc=await CommercialDocument.findOne({where:{id:req.params.id,userId:owner.id,type:'QUOTE'},transaction,lock:transaction.LOCK.UPDATE});if(!doc)throw fail('Devis introuvable',404);if(req.body.expectedStatus!==doc.status)throw fail('Devis modifié : actualisez',409);const allowed={DRAFT:['ISSUED','CANCELLED'],ISSUED:['ACCEPTED','DECLINED','CANCELLED'],ACCEPTED:['CANCELLED']};if(!(allowed[doc.status]||[]).includes(target))throw fail('Transition interdite',409);if(['ISSUED','ACCEPTED'].includes(target)&&doc.validUntil<today())throw fail('Devis expiré',409);if(target==='ACCEPTED'&&req.body.confirmCustomer!==true)throw fail('Accord du client requis',409);await doc.update({status:target},{transaction});await append(req,doc,target,reason,transaction);return doc;});}
async function validateQuoteSale(req,transaction){if(req.body.quoteId==null)return null;if(req.user.role!=='admin')throw fail('Conversion réservée au propriétaire',403);const q=await CommercialDocument.findOne({where:{id:req.body.quoteId,userId:req.user.tenantId,type:'QUOTE'},transaction,lock:transaction.LOCK.UPDATE});if(!q)throw fail('Devis introuvable',404);if(q.status!=='ACCEPTED'||q.validUntil<today())throw fail('Devis non accepté, expiré ou déjà converti',409);
 const items=req.body.items;if(q.currency!==req.body.devise||Number(q.clientId)!==Number(req.body.clientId)||Number(q.warehouseId||0)!==Number(req.body.warehouseId||0)||Number(q.total)!==Number(req.body.montantTotal)||items.length!==q.lines.length)throw fail('Vente incompatible avec le devis',409);
 for(const l of q.lines){const i=items.find(i=>Number(i.id)===l.id);if(!i||Number(i.quantite)!==l.quantity||Math.abs(Number(i.prixUnitaire??i.prix)-l.unitPrice)>0.000001)throw fail('Lignes incompatibles avec le devis',409);}
 return q;
}
async function convert(req,q,sale,transaction){if(!q)return;await q.update({status:'CONVERTED',saleId:sale.id},{transaction});await append(req,q,'CONVERTED','Vente #'+sale.id,transaction);}
async function issueFromSale(req){const type=req.body.type;if(!['INVOICE','DELIVERY'].includes(type))throw fail('Type de document invalide');const reason=type==='DELIVERY'?clean(req.body.reason,250):'Facture commerciale';if(type==='DELIVERY'&&req.body.handoverConfirmed!==true)throw fail('Confirmez la livraison intégrale');
 return mutate(req,'document.issue',async(owner,transaction)=>{
 const uid=owner.id,sale=await Sale.findOne({where:{id:req.body.saleId,userId:uid},transaction,lock:transaction.LOCK.UPDATE});if(!sale)throw fail('Vente introuvable',404);if(!sale.accountingCurrency||!['Complétée','Dette'].includes(sale.statut))throw fail('Vente historique ou remboursée non éligible',409);
 const prior=await CommercialDocument.findOne({where:{userId:uid,type,saleId:sale.id},transaction});if(prior)return prior;
 const quote=await CommercialDocument.findOne({where:{userId:uid,type:'QUOTE',saleId:sale.id},transaction});
 const client=sale.clientId?await Client.findOne({where:{id:sale.clientId,userId:uid},transaction,paranoid:false}):null;
 const lines=sale.articles.map(a=>({id:a.id,name:a.nom,quantity:a.quantite,unitPrice:Number(a.prixUnitaire),lineTotal:round(Number(a.prixUnitaire)*a.quantite,sale.devise),serialUnits:a.serialUnits||[]}));
 const doc=await CommercialDocument.create({userId:uid,actorId:req.user.id,type,number:await number(uid,type,transaction),status:'ISSUED',clientId:sale.clientId,saleId:sale.id,quoteId:quote?.id??null,warehouseId:sale.warehouseId,currency:sale.devise,rate:sale.tauxChange,total:sale.montantTotal,lines,customer:quote?.customer||(client?customer(client):{name:sale.clientInfo?.nom||'Client de passage',phone:sale.clientInfo?.telephone||'',email:sale.clientInfo?.email||''}),issuer:issuer(owner),note:reason},{transaction});
 await append(req,doc,'ISSUED',reason,transaction);return doc;
 });
}
module.exports={createQuote,transition,validateQuoteSale,convert,issueFromSale};
