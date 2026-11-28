const {User,CashSession,TreasuryAccount,TreasuryTransfer,TreasuryReconciliation}=require('../models');
const {sequelize}=require('../config/database');
const {currency,money,round,fail}=require('./transactionSafety');
const ledger=require('./commercialLedger');
const clean=(v,max,optional=false)=>{if(optional&&(v==null||v===''))return null;if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw fail('Texte invalide');return v.trim();};
const accountId=v=>{if(v===null)return null;if(!Number.isSafeInteger(v)||v<=0)throw fail('Compte invalide');return v;};
function amountOf(value,devise,allowZero=false){if(typeof value!=='number'&&typeof value!=='string')throw fail('Montant invalide');const n=money(value);if(n!==round(n,devise)||(!allowZero&&n===0))throw fail('Montant ou précision invalide');return n;}
async function mutate(req,operation,model,fn){if(!req.body.operationId)throw fail('Clé de transaction requise');return sequelize.transaction(async transaction=>{const owner=await User.findByPk(req.user.tenantId,{transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);const prior=await ledger.replay(req,operation,transaction);if(prior){const row=await model.findOne({where:{userId:owner.id,id:prior.resourceId},transaction});if(!row)throw fail('Opération introuvable',409);return {row,replayed:true};}const row=await fn(owner,currency(owner.entreprise?.devise),transaction);await ledger.remember(req,operation,row.id,transaction);return {row,replayed:false};});}
async function account(uid,id,devise,transaction){if(id===null)return null;const row=await TreasuryAccount.findOne({where:{id,userId:uid},transaction,lock:transaction.LOCK.UPDATE});if(!row)throw fail('Compte introuvable',404);if(row.currency!==devise)throw fail('Devise comptable incompatible : rapprochement requis',409);return row;}
async function create(req){const name=clean(req.body.name,120),provider=clean(req.body.provider,100,true),referenceHint=clean(req.body.referenceHint,80,true),kind=req.body.kind;if(!['BANK','MOBILE_MONEY'].includes(kind))throw fail('Type de compte invalide');if(req.body.confirmZero!==true)throw fail('Confirmez la création avec un solde logiciel nul');
 return mutate(req,'treasury.account',TreasuryAccount,async(owner,devise,transaction)=>{if(await TreasuryAccount.count({where:{userId:owner.id},transaction})>=100)throw fail('Limite de comptes atteinte',409);if(await TreasuryAccount.findOne({where:{userId:owner.id,name},transaction}))throw fail('Nom de compte déjà utilisé',409);return TreasuryAccount.create({userId:owner.id,name,kind,currency:devise,balance:0,provider,referenceHint},{transaction});});}
async function transfer(req){const from=accountId(req.body.fromAccountId),to=accountId(req.body.toAccountId),note=clean(req.body.note,250),externalReference=clean(req.body.externalReference,100,true);if(from===to||req.body.confirmExecuted!==true)throw fail('Source, destination et transfert réel confirmé requis');
 return mutate(req,'treasury.transfer',TreasuryTransfer,async(owner,devise,transaction)=>{
 const uid=owner.id;if(req.body.currency!==devise)throw fail('Devise comptable requise');const amount=amountOf(req.body.amount,devise);
 const source=await account(uid,from,devise,transaction),destination=await account(uid,to,devise,transaction);
 const session=from===null||to===null?await CashSession.findOne({where:{userId:uid,branchKey:0,status:'OPEN'},transaction,lock:transaction.LOCK.UPDATE}):null;
 if((from===null||to===null)&&!session)throw fail('Caisse ouverte requise',409);ledger.assertSessionCurrency(session,devise);
 if(Number(source?source.balance:session.expectedBalance)<amount)throw fail('Solde disponible insuffisant',409);
 if(destination&&Number(destination.balance)+amount>1e12)throw fail('Solde maximal dépassé');
 if(source)await source.update({balance:round(Number(source.balance)-amount,devise)},{transaction});
 else{session.totalExpenses=round(Number(session.totalExpenses||0)+amount,devise);session.expectedBalance=round(Number(session.expectedBalance)-amount,devise);await session.save({transaction});}
 if(destination)await destination.update({balance:round(Number(destination.balance)+amount,devise)},{transaction});
 else{session.totalSales=round(Number(session.totalSales||0)+amount,devise);session.expectedBalance=round(Number(session.expectedBalance)+amount,devise);await session.save({transaction});}
 const row=await TreasuryTransfer.create({userId:uid,actorId:req.user.id,fromAccountId:from,toAccountId:to,cashSessionId:session?.id??null,amount,currency:devise,note,externalReference},{transaction});
 const debit=destination?.kind||'CASH',credit=source?.kind||'CASH';
 // Transfers within the same general ledger account net to zero; immutable subledger remains authoritative by account.
 if(debit!==credit)await ledger.post(req,transaction,{event:'TREASURY_TRANSFER',reference:row.id,debit,credit,amount,devise,session});
 return row;
 });}
async function reconcile(req){const id=accountId(req.body.accountId),note=clean(req.body.note,250),day=new Date().toISOString().slice(0,10);if(id===null||req.body.statementDate!==day||req.body.confirmObserved!==true)throw fail('Solde observé aujourd’hui et confirmation requis');
 return mutate(req,'treasury.reconcile',TreasuryReconciliation,async(owner,devise,transaction)=>{
 const row=await account(owner.id,id,devise,transaction),expected=amountOf(req.body.expected,devise,true),observed=amountOf(req.body.observed,devise,true);
 if(Number(row.balance)!==expected)throw fail('Solde modifié : actualisez le rapprochement',409);
 return TreasuryReconciliation.create({userId:owner.id,actorId:req.user.id,accountId:id,currency:devise,expected,observed,difference:round(observed-expected,devise),statementDate:day,note},{transaction});
 });}
module.exports={create,transfer,reconcile};
