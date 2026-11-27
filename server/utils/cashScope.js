const {Branch,Organization,CashSession}=require('../models');
const {fail}=require('./transactionSafety');
const staff=require('./staffScope');
function key(v){if(v===undefined||v===null)return 0;if(typeof v!=='number'&&typeof v!=='string'||String(v).trim()===''||!Number.isSafeInteger(Number(v))||Number(v)<0)throw fail('Succursale invalide');return Number(v)}
async function resolve(user,value,transaction,{write=false}={}){
 if(user.parentId){const w=await staff.location(user,transaction),assigned=w?.branchId??0;if((value!==undefined||write)&&key(value)!==assigned)throw fail('Caisse hors affectation ou affectation modifiée',403);return assigned;}
 const id=key(value);if(id===0)return 0;if(user.role!=='admin')throw fail('Succursale non autorisée',403);
 const org=await Organization.findOne({where:{ownerId:user.tenantId},transaction}),branch=org&&await Branch.findOne({where:{id,organizationId:org.id,active:true},transaction});if(!branch)throw fail('Succursale introuvable',404);return branch.id;
}
async function open(uid,branchKey,transaction){return CashSession.findOne({where:{userId:uid,branchKey,status:'OPEN'},transaction,...(transaction?{lock:transaction.LOCK.UPDATE}:{})});}
module.exports={resolve,open,key};
