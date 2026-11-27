const {RepairOrder,RepairBill,RepairPayment,RepairEvent,User,CashSession,DocumentSequence}=require('../models');
const {sequelize}=require('../config/database');
const {fail,round,currency,money,rateFor}=require('./transactionSafety');
const {convertCurrency}=require('./currency');
const {today}=require('./lotService');
const ledger=require('./commercialLedger');
const note=v=>{if(typeof v!=='string'||!v.trim()||v.length>250)throw fail('Motif requis');return v.trim()};
async function findBill(order,transaction){return RepairBill.findOne({where:{userId:order.userId,orderId:order.id},transaction,...(transaction?{lock:transaction.LOCK.UPDATE}:{})});}
async function initialize(owner,order,transaction){
 if(order.approvalStatus!=='APPROVED'||order.estimate==null||!order.currency||!['WAITING_APPROVAL','REPAIRING','READY'].includes(order.status))throw fail('Estimation approuvée requise',409);
 const base=currency(owner.entreprise?.devise),estimateCurrency=currency(order.currency),estimate=round(money(order.estimate),estimateCurrency),rate=rateFor(owner),total=round(convertCurrency(estimate,estimateCurrency,base,rate),base);money(total);
 return RepairBill.create({userId:owner.id,orderId:order.id,currency:base,estimateCurrency,estimate,rate,total,paid:0,status:'ADVANCE',issuer:{name:owner.entreprise?.nom||owner.nom,address:owner.entreprise?.adresse||'',phone:owner.entreprise?.telephone||owner.telephone||''},customer:{name:order.customerName,phone:order.customerPhone||'',device:order.deviceName,serial:order.serial||''}},{transaction});
}
async function sessionFor(uid,devise,transaction){const session=await require('./cashScope').open(uid,0,transaction);if(!session)throw fail('Caisse ouverte requise',409);ledger.assertSessionCurrency(session,devise);return session;}
async function mutate(req,op,fn){if(!req.body.operationId)throw fail('Clé de transaction requise');const description=note(req.body.note);return sequelize.transaction(async transaction=>{
 const owner=await User.findByPk(req.user.tenantId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);
 const prior=await ledger.replay(req,op,transaction);if(prior){const model=op==='repair.bill.issue'?RepairBill:RepairPayment,row=await model.findOne({where:{id:prior.resourceId,userId:owner.id},transaction});if(!row)throw fail('Transaction indisponible',409);return {row,replayed:true};}
 const order=await RepairOrder.findOne({where:{id:req.params.id,userId:owner.id},transaction,lock:transaction.LOCK.UPDATE});if(!order)throw fail('Dossier introuvable',404);
 if(['DELIVERED','CANCELLED'].includes(order.status))throw fail('Dossier clôturé',409);
 let bill=await findBill(order,transaction);
 if(!bill){if(op==='repair.bill.reverse')throw fail('Acompte introuvable',404);bill=await initialize(owner,order,transaction);}
 if(currency(owner.entreprise?.devise)!==bill.currency)throw fail('Devise comptable modifiée : rapprochement requis',409);
 const row=await fn(owner,order,bill,description,transaction);
 await ledger.remember(req,op,row.id,transaction);return {row,replayed:false};
 });}
async function event(req,order,kind,description,details,transaction){await RepairEvent.create({userId:order.userId,orderId:order.id,actorId:req.user.id,kind,note:description,fromStatus:order.status,toStatus:order.status,details},{transaction});}
async function pay(req){if(req.body.confirmCash!==true)throw fail('Confirmez l’encaissement physique');return mutate(req,'repair.bill.pay',async(owner,order,bill,description,transaction)=>{
 if(!['WAITING_APPROVAL','REPAIRING','READY'].includes(order.status)||order.approvalStatus!=='APPROVED')throw fail('Dossier non facturable',409);
 if(req.body.currency!==bill.currency)throw fail('Paiement dans la devise comptable requis');
 const amount=round(money(req.body.amount),bill.currency);if(amount<=0||amount>round(Number(bill.total)-Number(bill.paid),bill.currency))throw fail('Montant supérieur au solde ou invalide',409);
 const session=await sessionFor(owner.id,bill.currency,transaction),kind=bill.status==='ISSUED'?'PAYMENT':'DEPOSIT';
 const row=await RepairPayment.create({userId:owner.id,billId:bill.id,actorId:req.user.id,cashSessionId:session.id,kind,amount,currency:bill.currency,note:description},{transaction});
 await bill.update({paid:round(Number(bill.paid)+amount,bill.currency)},{transaction});
 session.totalSales=round(Number(session.totalSales||0)+amount,bill.currency);session.expectedBalance=round(Number(session.expectedBalance||0)+amount,bill.currency);await session.save({transaction});
 await ledger.post(req,transaction,{event:kind==='DEPOSIT'?'REPAIR_DEPOSIT':'REPAIR_PAYMENT',reference:row.id,debit:'CASH',credit:kind==='DEPOSIT'?'CUSTOMER_ADVANCES':'SERVICE_RECEIVABLE',amount,devise:bill.currency,session});
 await event(req,order,kind,description,{paymentId:row.id,amount,currency:bill.currency},transaction);return row;
 });}
async function issue(req){if(req.body.confirmCompleted!==true)throw fail('Confirmez la prestation terminée');return mutate(req,'repair.bill.issue',async(owner,order,bill,description,transaction)=>{
 if(order.status!=='READY'||order.approvalStatus!=='APPROVED')throw fail('Intervention terminée et approuvée requise',409);
 if(bill.status==='ISSUED')return bill;
 const year=Number(today().slice(0,4)),[seq]=await DocumentSequence.findOrCreate({where:{userId:owner.id,type:'REPAIR',year},defaults:{lastNumber:0},transaction});await seq.increment('lastNumber',{transaction});await seq.reload({transaction});
 const number='SAV-'+year+'-'+String(seq.lastNumber).padStart(6,'0');
 await bill.update({status:'ISSUED',number,issuedAt:new Date()},{transaction});
 await ledger.post(req,transaction,{event:'REPAIR_INVOICE',reference:bill.id,debit:'SERVICE_RECEIVABLE',credit:'SERVICE_REVENUE',amount:Number(bill.total),devise:bill.currency,rate:bill.rate});
 await ledger.post(req,transaction,{event:'REPAIR_ADVANCE_APPLIED',reference:bill.id,debit:'CUSTOMER_ADVANCES',credit:'SERVICE_RECEIVABLE',amount:Number(bill.paid),devise:bill.currency,rate:bill.rate});
 await event(req,order,'INVOICE',description,{billId:bill.id,number,total:bill.total,currency:bill.currency},transaction);return bill;
 });}
async function reverse(req){if(req.body.confirmCash!==true)throw fail('Confirmez le remboursement physique');return mutate(req,'repair.bill.reverse',async(owner,order,bill,description,transaction)=>{
 if(bill.status!=='ADVANCE')throw fail('Avoir requis après facturation',409);
 const original=await RepairPayment.findOne({where:{id:req.body.paymentId,userId:owner.id,billId:bill.id,kind:'DEPOSIT'},transaction,lock:transaction.LOCK.UPDATE});if(!original)throw fail('Acompte introuvable',404);
 if(await RepairPayment.findOne({where:{userId:owner.id,reversalOf:original.id},transaction}))throw fail('Acompte déjà remboursé',409);
 const amount=Number(original.amount),session=await sessionFor(owner.id,bill.currency,transaction);
 if(session.id!==original.cashSessionId||Number(session.expectedBalance)<amount||Number(bill.paid)<amount)throw fail('Remboursement limité à la caisse initiale encore ouverte et suffisamment approvisionnée',409);
 const row=await RepairPayment.create({userId:owner.id,billId:bill.id,actorId:req.user.id,cashSessionId:session.id,kind:'REVERSAL',amount,currency:bill.currency,reversalOf:original.id,note:description},{transaction});
 await bill.update({paid:round(Number(bill.paid)-amount,bill.currency)},{transaction});
 session.totalSales=round(Number(session.totalSales)-amount,bill.currency);session.expectedBalance=round(Number(session.expectedBalance)-amount,bill.currency);await session.save({transaction});
 await ledger.post(req,transaction,{event:'REPAIR_DEPOSIT_REVERSAL',reference:row.id,debit:'CUSTOMER_ADVANCES',credit:'CASH',amount,devise:bill.currency,session});
 await event(req,order,'DEPOSIT_REVERSAL',description,{paymentId:row.id,reversalOf:original.id,amount,currency:bill.currency},transaction);return row;
 });}
async function guard(order,action,target,transaction){const bill=await findBill(order,transaction);
 if(action==='estimate'||action==='approval'||target==='DIAGNOSIS'){if(bill)throw fail('Estimation verrouillée après ouverture de la facturation',409);}
 if(target==='CANCELLED'&&bill&&(bill.status==='ISSUED'||Number(bill.paid)>0))throw fail('Remboursez les acomptes avant annulation',409);
 if(target==='REPAIRING'&&order.status==='READY'&&bill?.status==='ISSUED')throw fail('Facture émise : correction par procédure dédiée requise',409);
 if(target==='DELIVERED'&&(!bill||bill.status!=='ISSUED'||Number(bill.paid)!==Number(bill.total)))throw fail('Émettez la facture SAV et soldez le reste dû avant restitution',409);
}
module.exports={findBill,pay,issue,reverse,guard};
