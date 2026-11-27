const {Receivable,ReceivablePayment,User,Client,Sale,CashSession}=require('../models');
const {sequelize}=require('../config/database');
const {Op}=require('sequelize');
const {fail,round,money,currency}=require('./transactionSafety');
const ledger=require('./commercialLedger');
const {today}=require('./lotService');
const date=v=>{if(v==null||v==='')return null;if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v||v<today())throw fail('Échéance invalide');return v;};
const note=(v,fallback)=>{if(v==null||v==='')return fallback;if(typeof v!=='string'||!v.trim()||v.length>250)throw fail('Motif invalide');return v.trim()};
async function openSale(req,sale,client,original,deposit,session,transaction){const devise=sale.accountingCurrency;
 const row=await Receivable.create({userId:sale.userId,clientId:client.id,saleId:sale.id,currency:devise,original,balance:original,dueOn:date(req.body.dueOn)},{transaction});
 client.detteTotale=round(Number(client.detteTotale||0)+original,devise);await client.save({transaction});
 if(deposit>0)await apply(req,client,row,deposit,session,devise,'DEPOSIT','Acompte à la vente',transaction);
 return row;
}
async function apply(req,client,row,amount,session,devise,kind,description,transaction){
 if(amount<=0||amount>Number(client.detteTotale)||row&&(row.currency!==devise||amount>Number(row.balance)))throw fail('Règlement supérieur au solde ou devise incompatible',409);
 const payment=await ReceivablePayment.create({userId:client.userId,actorId:req.user.id,clientId:client.id,receivableId:row?.id??null,cashSessionId:session.id,amount,currency:devise,kind,note:description},{transaction});
 if(row){const balance=round(Number(row.balance)-amount,devise);await row.update({balance},{transaction});if(balance===0){const sale=await Sale.findOne({where:{id:row.saleId,userId:client.userId},transaction,lock:transaction.LOCK.UPDATE});if(!sale||sale.statut!=='Dette')throw fail('Vente non rapprochable',409);await sale.update({statut:'Complétée'},{transaction});}}
 client.detteTotale=round(Number(client.detteTotale)-amount,devise);await client.save({transaction});
 session.totalSales=round(Number(session.totalSales||0)+amount,devise);session.expectedBalance=round(Number(session.expectedBalance||0)+amount,devise);await session.save({transaction});
 await ledger.post(req,transaction,{event:kind==='DEPOSIT'?'SALE_DEPOSIT':'DEBT_PAYMENT',reference:'RP-'+payment.id,debit:'CASH',credit:'RECEIVABLE',amount,devise,session});
 return payment;
}
async function context(req,transaction){const owner=await User.findByPk(req.user.tenantId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);const devise=currency(owner.entreprise?.devise),amount=round(money(req.body.montant),devise);if(amount<=0||req.body.currency&&currency(req.body.currency)!==devise)throw fail('Montant ou devise invalide');return {owner,devise,amount};}
async function openSession(uid,devise,transaction){const session=await CashSession.findOne({where:{userId:uid,status:'OPEN'},transaction,lock:transaction.LOCK.UPDATE});if(!session)throw fail('Ouvrez une caisse pour enregistrer le règlement',409);ledger.assertSessionCurrency(session,devise);return session;}
async function settle(req,targeted=false){const op=targeted?'receivable.pay':'debt.settle';if(targeted&&!req.body.operationId)throw fail('Clé de transaction requise');
 return sequelize.transaction(async transaction=>{
 const {owner,devise,amount}=await context(req,transaction),uid=owner.id,prior=await ledger.replay(req,op,transaction);
 if(prior){const row=targeted?await ReceivablePayment.findOne({where:{id:prior.resourceId,userId:uid},transaction}):await Client.findOne({where:{id:prior.resourceId,userId:uid},transaction});if(!row)throw fail('Règlement historique indisponible',409);return {row,replayed:true,amount:0};}
 const target=targeted?await Receivable.findOne({where:{id:req.params.id,userId:uid},transaction,lock:transaction.LOCK.UPDATE}):null;
 if(targeted&&!target)throw fail('Créance introuvable',404);
 const client=await Client.findOne({where:{id:targeted?target.clientId:req.params.id,userId:uid},transaction,lock:transaction.LOCK.UPDATE});if(!client)throw fail('Client introuvable',404);
 const rows=await Receivable.findAll({where:{userId:uid,clientId:client.id,balance:{[Op.gt]:0}},order:[['dueOn','ASC NULLS LAST'],['id','ASC']],transaction,lock:transaction.LOCK.UPDATE});
 if(rows.some(r=>r.currency!==devise))throw fail('Devise historique incompatible : rapprochement requis',409);
 const tracked=round(rows.reduce((s,r)=>s+Number(r.balance),0),devise),legacy=round(Number(client.detteTotale)-tracked,devise);
 if(legacy<0||amount>Number(client.detteTotale)||targeted&&amount>Number(target.balance))throw fail('Solde incohérent ou règlement excessif',409);
 const session=await openSession(uid,devise,transaction),description=note(req.body.note,'Règlement en espèces');
 if(targeted){const row=await apply(req,client,target,amount,session,devise,'PAYMENT',description,transaction);await ledger.remember(req,op,row.id,transaction);return {row,amount,replayed:false};}
 let remaining=amount;const old=Math.min(remaining,legacy);if(old>0){await apply(req,client,null,old,session,devise,'LEGACY',description,transaction);remaining=round(remaining-old,devise);}
 for(const row of rows){if(remaining<=0)break;const part=Math.min(remaining,Number(row.balance));await apply(req,client,row,part,session,devise,'PAYMENT',description,transaction);remaining=round(remaining-part,devise);}
 if(remaining!==0)throw fail('Rapprochement incomplet',409);
 await ledger.remember(req,op,client.id,transaction);return {row:client,amount,replayed:false};
 });
}
module.exports={date,openSale,settle};
