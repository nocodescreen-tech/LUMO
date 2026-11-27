const crypto=require('crypto');
const {Transaction,Op}=require('sequelize');
const models=require('../models');
const {sequelize}=require('../config/database');
const {fail}=require('./transactionSafety');
const MAX_BYTES=5*1024*1024,MAX_ROWS=20000;
const format='LUMO-ARCHIVE-2';
function getKey(){const raw=process.env.LUMO_BACKUP_KEY_HEX||'';if(!/^[a-f0-9]{64}$/i.test(raw))throw fail('Clé de sauvegarde serveur non configurée',503);return Buffer.from(raw,'hex');}
const ready=()=>/^[a-f0-9]{64}$/i.test(process.env.LUMO_BACKUP_KEY_HEX||'');
const digest=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const aad=(ownerId,id)=>Buffer.from(format+':'+ownerId+':'+id);
function seal(payload){
 const buf=Buffer.from(JSON.stringify(payload));if(buf.length>MAX_BYTES)throw fail('Archive trop volumineuse : export administrateur requis',413);
 const key=getKey(),iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad(payload.ownerId,payload.archiveId));
 const ciphertext=Buffer.concat([cipher.update(buf),cipher.final()]);
 return {format,archiveId:payload.archiveId,ownerId:payload.ownerId,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')};
}
function open(envelope,ownerId){
 if(!envelope||envelope.format!==format||envelope.ownerId!==ownerId||typeof envelope.archiveId!=='string'||!/^[-a-f0-9]{36}$/i.test(envelope.archiveId)||typeof envelope.ciphertext!=='string'||envelope.ciphertext.length>Math.ceil(MAX_BYTES/3)*4||typeof envelope.iv!=='string'||typeof envelope.tag!=='string')throw fail('Archive invalide, ancienne ou appartenant à une autre entreprise',400);
 const key=getKey();try{
 const iv=Buffer.from(envelope.iv,'base64'),tag=Buffer.from(envelope.tag,'base64');if(iv.length!==12||tag.length!==16)throw Error('Invalid header');
 const decipher=crypto.createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(aad(ownerId,envelope.archiveId));decipher.setAuthTag(tag);
 const payload=JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext,'base64')),decipher.final()]).toString('utf8'));
 if(payload.ownerId!==ownerId||payload.archiveId!==envelope.archiveId||payload.version!==2||!payload.data||typeof payload.data!=='object')throw Error('Invalid archive');
 return payload;
 }catch(e){throw fail('Authentification de l’archive impossible : fichier altéré ou clé incorrecte',400);}
}
const tenantModels={products:'Product',sales:'Sale',clients:'Client',fournisseurs:'Fournisseur',purchases:'Purchase',movements:'StockMovement',sessions:'CashSession',notifications:'Notification',feedbacks:'Feedback',staffPayments:'StaffPayment',expenses:'Depense',journal:'JournalEntry',receipts:'OperationReceipt',warehouseBalances:'WarehouseBalance',inventoryTransfers:'InventoryTransfer',inventoryCounts:'InventoryCount',inventoryLots:'InventoryLot',lotMovements:'LotMovement',reorderRules:'ReorderRule',serialUnits:'SerialUnit',serialEvents:'SerialEvent',repairOrders:'RepairOrder',repairEvents:'RepairEvent',commercialDocuments:'CommercialDocument',documentEvents:'DocumentEvent',documentSequences:'DocumentSequence',receivables:'Receivable',receivablePayments:'ReceivablePayment'};
const safeUser=['id','nom','email','telephone','role','parentId','isVerified','isAdminValidated','isSuspended','createdAt'];
async function snapshot(ownerId){
 getKey();
 return sequelize.transaction({isolationLevel:Transaction.ISOLATION_LEVELS.REPEATABLE_READ,readOnly:true},async transaction=>{
 const owner=await models.User.findOne({where:{id:ownerId,parentId:null,role:'admin'},attributes:['id','nom','email','typeActivite','entreprise'],transaction});if(!owner)throw fail('Entreprise introuvable',404);
 const data={};let total=0;
 async function take(key,model,where,attributes){const rows=await model.findAll({where,attributes,transaction,order:[['id','ASC']],limit:MAX_ROWS+1,raw:true});total+=rows.length;if(rows.length>MAX_ROWS||total>MAX_ROWS)throw fail('Archive trop volumineuse : export administrateur requis',413);data[key]=rows;return rows;}
 for(const [key,model] of Object.entries(tenantModels))await take(key,models[model],{userId:ownerId});
 await take('activities',models.Activite,{shopId:ownerId,type:{[Op.notLike]:'PLATFORM_%'}});
 await take('subUsers',models.User,{parentId:ownerId},safeUser);
 const orgs=await take('organizations',models.Organization,{ownerId});const orgIds=orgs.map(x=>x.id);
 for(const [key,model] of Object.entries({branches:'Branch',warehouses:'Warehouse',subscriptions:'Subscription',subscriptionEvents:'SubscriptionEvent'}))await take(key,models[model],{organizationId:orgIds});
 const tickets=await take('supportTickets',models.SupportTicket,{ownerId});await take('supportMessages',models.SupportMessage,{ticketId:tickets.map(t=>t.id)});
 return {version:2,archiveId:crypto.randomUUID(),ownerId,exportedAt:new Date().toISOString(),owner:owner.get({plain:true}),data};
 });
}
async function create(ownerId){const payload=await snapshot(ownerId),archive=seal(payload),buffer=Buffer.from(JSON.stringify(archive));return {archive,buffer,digest:digest(buffer),counts:Object.fromEntries(Object.entries(payload.data).map(([k,v])=>[k,v.length]))};}
module.exports={ready,seal,open,snapshot,create,digest,MAX_BYTES};
