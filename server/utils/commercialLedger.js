const crypto=require('crypto');
const {JournalEntry,OperationReceipt}=require('../models');
const {fail,round,currency}=require('./transactionSafety');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
function operationKey(req){const key=req.get?.('Idempotency-Key')||req.body?.operationId;if(key==null)return null;if(typeof key!=='string'||!/^[-a-zA-Z0-9_]{16,128}$/.test(key))throw fail('Clé de transaction invalide');return key;}
function fingerprint(req){const {operationId,...body}=req.body||{};return crypto.createHash('sha256').update(JSON.stringify(canonical({params:req.params||{},body}))).digest('hex');}
async function replay(req,operation,transaction){
 const key=operationKey(req);if(!key)return null;
 const row=await OperationReceipt.findOne({where:{userId:req.user.tenantId,operation,key},transaction});
 if(row&&(Number(row.actorId)!==Number(req.user.id)||row.fingerprint!==fingerprint(req)))throw fail('Clé déjà utilisée pour une autre transaction',409);
 return row;
}
async function remember(req,operation,id,transaction){
 const key=operationKey(req);if(!key)return;
 await OperationReceipt.create({userId:req.user.tenantId,actorId:req.user.id,operation,key,fingerprint:fingerprint(req),resourceId:id},{transaction});
}
async function post(req,transaction,{event,reference,debit,credit,amount,devise,rate=null,session=null}){
 if(!transaction)throw new Error('Journal requires a transaction');
 const value=round(Number(amount),devise);
 if(!Number.isFinite(value)||value<0||debit===credit)throw fail('Écriture financière invalide');
 if(value===0)return;
 await JournalEntry.create({userId:req.user.tenantId,actorId:req.user.id,event,reference:String(reference),debitAccount:debit,creditAccount:credit,amount:value,currency:currency(devise),rate,cashSessionId:session?.id??null},{transaction});
}
function assertSessionCurrency(session,devise){if(session&&session.currency!==devise)throw fail('Devise de caisse historique ou incompatible: rapprochement nécessaire',409);}
module.exports={replay,remember,post,assertSessionCurrency};
