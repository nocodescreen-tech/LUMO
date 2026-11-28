const {User,Organization,Branch,Warehouse,Subscription,SubscriptionEvent}=require('../models');
const {fail,currency}=require('./transactionSafety');
const {sequelize}=require('../config/database');
const plans=Object.freeze({TRIAL:{branchLimit:1,warehouseLimit:1},STARTER:{branchLimit:1,warehouseLimit:1},BUSINESS:{branchLimit:3,warehouseLimit:6},PRO:{branchLimit:10,warehouseLimit:20},ENTERPRISE:{branchLimit:100,warehouseLimit:200}});
const label=(v,max=160)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw fail('Valeur invalide');return v.trim();};
const normalizeCode=v=>{const c=label(v,32).toUpperCase();if(!/^[A-Z0-9_-]+$/.test(c))throw fail('Code invalide');return c;};
const effective=s=>s.status==='ACTIVE' || s.status==='TRIAL'?(!s.endsAt||new Date(s.endsAt)>new Date()?s.status:'EXPIRED'):s.status;
async function lockedOwner(id,transaction){const owner=await User.findOne({where:{id,parentId:null,role:'admin'},transaction,lock:transaction.LOCK.UPDATE});if(!owner)throw fail('Entreprise introuvable',404);return owner;}
async function ensure(id,transaction){
 const owner=await lockedOwner(id,transaction);
 let org=await Organization.findOne({where:{ownerId:id},transaction});
 if(!org){org=await Organization.create({ownerId:id,name:owner.entreprise?.nom||owner.nom,currency:currency(owner.entreprise?.devise),status:'ACTIVE'},{transaction});
 const now=new Date();await Subscription.create({organizationId:org.id,plan:'TRIAL',status:'TRIAL',startsAt:now,endsAt:new Date(+now+14*86400000),...plans.TRIAL},{transaction});
 await SubscriptionEvent.create({organizationId:org.id,actorId:id,kind:'TRIAL_CREATED',reference:'initial-trial',details:{plan:'TRIAL'}},{transaction});}
 return org;
}
async function subscription(org,transaction){const row=await Subscription.findOne({where:{organizationId:org.id},transaction});if(!row)throw fail('Abonnement introuvable',409);return row;}
function assertEntitled(org,s){if(org.status!=='ACTIVE'||!['ACTIVE','TRIAL'].includes(effective(s)))throw fail('Abonnement inactif pour cette opération',403);}
async function context(id){return sequelize.transaction(async transaction=>{const org=await ensure(id,transaction),s=await subscription(org,transaction);return {organization:org,subscription:{...s.toJSON(),effectiveStatus:effective(s)},scope:'registry-only'};});}
module.exports={plans,label,normalizeCode,effective,lockedOwner,ensure,subscription,assertEntitled,context};
