const {User,CashSession}=require('../models');
const {fail,currency,money,round,rateFor}=require('./transactionSafety');
const {convertCurrency}=require('./currency');
const ledger=require('./commercialLedger');
async function prepare(req,transaction,rawAmount,rawCurrency){
 const userId=req.user.tenantId;
 const owner=await User.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);
 const base=currency(owner.entreprise?.devise),devise=currency(rawCurrency||base),rate=rateFor(owner),amount=round(money(rawAmount),devise);
 if(amount<=0)throw fail('Montant strictement positif requis');
 const session=await CashSession.findOne({where:{userId,status:'OPEN'},transaction,lock:transaction.LOCK.UPDATE});
 if(!session)throw fail('Ouvrez une caisse avant de payer',409);ledger.assertSessionCurrency(session,base);
 const converted=round(convertCurrency(amount,devise,base,rate),base);
 if(converted<=0||Number(session.expectedBalance)<converted)throw fail('Solde de caisse insuffisant',409);
 return {userId,base,devise,rate,amount,converted,session};
}
async function pay(req,transaction,ctx,event,reference,account){
 const {session,converted,base,rate}=ctx;
 session.totalExpenses=Number(session.totalExpenses||0)+converted;session.expectedBalance=Number(session.expectedBalance)-converted;await session.save({transaction});
 await ledger.post(req,transaction,{event,reference,debit:account,credit:'CASH',amount:converted,devise:base,rate,session});
}
module.exports={prepare,pay};
