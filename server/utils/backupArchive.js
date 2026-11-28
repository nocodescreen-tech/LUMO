const crypto=require('crypto');
const {Transaction,Op}=require('sequelize');
const models=require('../models');
const {sequelize}=require('../config/database');
const {fail}=require('./transactionSafety');
const MAX_BYTES=5*1024*1024,MAX_ROWS=20000;
const format='LUMO-ARCHIVE-2';
const keyIdPattern=/^[a-zA-Z0-9_-]{1,40}$/;
const hexPattern=/^[a-f0-9]{64}$/i;
function keyring(){
 const invalid=()=>fail('Configuration des clés de sauvegarde invalide',503);
 const legacy=process.env.LUMO_BACKUP_KEY_HEX||'';
 const raw=process.env.LUMO_BACKUP_KEYS_JSON||'';
 const activeId=process.env.LUMO_BACKUP_ACTIVE_KEY_ID||'';
 if(legacy&&!hexPattern.test(legacy))throw invalid();
 if(!raw&&!activeId){if(!legacy)throw invalid();return {activeId:null,active:Buffer.from(legacy,'hex'),legacy:Buffer.from(legacy,'hex'),keys:new Map()};}
 if(!raw||raw.length>4096||!keyIdPattern.test(activeId))throw invalid();
 let data;try{data=JSON.parse(raw)}catch{throw invalid()}
 if(!data||Array.isArray(data)||typeof data!=='object')throw invalid();
 const entries=Object.entries(data);
 if(!entries.length||entries.length>16||entries.some(([id,key])=>!keyIdPattern.test(id)||typeof key!=='string'||!hexPattern.test(key)))throw invalid();
 const keys=new Map(entries.map(([id,key])=>[id,Buffer.from(key,'hex')]));
 if(!keys.has(activeId))throw invalid();
 return {activeId,active:keys.get(activeId),legacy:legacy?Buffer.from(legacy,'hex'):null,keys};
}
const ready=()=>{try{keyring();return true}catch{return false}};
const digest=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const aad=(ownerId,id,keyId)=>Buffer.from(format+':'+ownerId+':'+id+(keyId?':key:'+keyId:''));
function seal(payload){
 const buf=Buffer.from(JSON.stringify(payload));if(buf.length>MAX_BYTES)throw fail('Archive trop volumineuse : export administrateur requis',413);
 const ring=keyring(),iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',ring.active,iv);cipher.setAAD(aad(payload.ownerId,payload.archiveId,ring.activeId));
 const ciphertext=Buffer.concat([cipher.update(buf),cipher.final()]);
 return {format,archiveId:payload.archiveId,ownerId:payload.ownerId,...(ring.activeId?{keyId:ring.activeId}:{}),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')};
}
function open(envelope,ownerId){
 if(!envelope||envelope.format!==format||envelope.ownerId!==ownerId||typeof envelope.archiveId!=='string'||!/^[-a-f0-9]{36}$/i.test(envelope.archiveId)||typeof envelope.ciphertext!=='string'||envelope.ciphertext.length>Math.ceil(MAX_BYTES/3)*4||typeof envelope.iv!=='string'||envelope.iv.length!==16||typeof envelope.tag!=='string'||envelope.tag.length!==24)throw fail('Archive invalide, ancienne ou appartenant à une autre entreprise',400);
 const ring=keyring();try{
 const keyId=Object.hasOwn(envelope,'keyId')?envelope.keyId:null;
 if(Object.hasOwn(envelope,'keyId')&&(typeof keyId!=='string'||!keyIdPattern.test(keyId)))throw Error('Invalid key identifier');
 const key=keyId?ring.keys.get(keyId):ring.legacy;if(!key)throw Error('Unavailable archive key');
 const iv=Buffer.from(envelope.iv,'base64'),tag=Buffer.from(envelope.tag,'base64');if(iv.length!==12||tag.length!==16)throw Error('Invalid header');
 const decipher=crypto.createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(aad(ownerId,envelope.archiveId,keyId));decipher.setAuthTag(tag);
 const payload=JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext,'base64')),decipher.final()]).toString('utf8'));
 if(payload.ownerId!==ownerId||payload.archiveId!==envelope.archiveId||payload.version!==2||!payload.data||typeof payload.data!=='object')throw Error('Invalid archive');
 return payload;
 }catch(e){throw fail('Authentification de l’archive impossible : fichier altéré ou clé incorrecte',400);}
}
const tenantModels={products:'Product',sales:'Sale',clients:'Client',fournisseurs:'Fournisseur',purchases:'Purchase',movements:'StockMovement',sessions:'CashSession',notifications:'Notification',feedbacks:'Feedback',staffPayments:'StaffPayment',expenses:'Depense',journal:'JournalEntry',receipts:'OperationReceipt',warehouseBalances:'WarehouseBalance',inventoryTransfers:'InventoryTransfer',inventoryCounts:'InventoryCount',inventoryLots:'InventoryLot',lotMovements:'LotMovement',reorderRules:'ReorderRule',serialUnits:'SerialUnit',serialEvents:'SerialEvent',repairOrders:'RepairOrder',repairEvents:'RepairEvent',commercialDocuments:'CommercialDocument',documentEvents:'DocumentEvent',documentSequences:'DocumentSequence',receivables:'Receivable',receivablePayments:'ReceivablePayment',repairBills:'RepairBill',repairPayments:'RepairPayment',accountingLocks:'AccountingLock',treasuryAccounts:'TreasuryAccount',treasuryTransfers:'TreasuryTransfer',treasuryReconciliations:'TreasuryReconciliation',staffAssignments:'StaffAssignment',staffProfiles:'StaffProfileRevision',attendance:'AttendanceRevision',payRates:'PayRate',payrollSlips:'PayrollSlip',payrollMovements:'PayrollMovement',accessRevisions:'AccessRevision',expensePolicies:'ExpensePolicy',expenseRequests:'ExpenseRequest',expenseRequestEvents:'ExpenseRequestEvent',budgetCenters:'BudgetCenter',budgetRevisions:'BudgetRevision',opportunities:'Opportunity',opportunityEvents:'OpportunityEvent',salesTargets:'SalesTarget',leaveRequests:'LeaveRequest',leaveEvents:'LeaveEvent'};
const safeUser=['id','nom','email','telephone','role','parentId','isVerified','isAdminValidated','isSuspended','createdAt'];
async function snapshot(ownerId){
 keyring();
 return sequelize.transaction({isolationLevel:Transaction.ISOLATION_LEVELS.REPEATABLE_READ,readOnly:true},async transaction=>{
 const owner=await models.User.findOne({where:{id:ownerId,parentId:null,role:'admin'},attributes:['id','nom','email','typeActivite','entreprise'],transaction});if(!owner)throw fail('Entreprise introuvable',404);
 const data={};let total=0,bytes=0;
 async function take(key,model,where,attributes,orderKey='id'){
  const rows=[];
  for(let offset=0;;offset+=250){
   const batch=await model.findAll({where,attributes,transaction,order:[[orderKey,'ASC']],limit:Math.min(250,MAX_ROWS-total+1),offset,raw:true});
   if(!batch.length)break;
   for(const row of batch){
    total++;bytes+=Buffer.byteLength(JSON.stringify(row),'utf8')+1;
    if(total>MAX_ROWS||bytes>MAX_BYTES)throw fail('Archive trop volumineuse : export administrateur requis',413);
    rows.push(row);
   }
   if(batch.length<250)break;
  }
  data[key]=rows;return rows;
 }
 for(const [key,model] of Object.entries(tenantModels))await take(key,models[model],{userId:ownerId});
 await take('activities',models.Activite,{shopId:ownerId,type:{[Op.notLike]:'PLATFORM_%'}});
 await take('subUsers',models.User,{parentId:ownerId},safeUser);
 await take('notificationSettings',models.NotificationSetting,{userId:ownerId},['userId','muted','lastScanAt'],'userId');
 for(const [key,model] of Object.entries({saasInvoices:'SaasInvoice',saasPayments:'SaasPayment',saasInvoiceEvents:'SaasInvoiceEvent'}))await take(key,models[model],{ownerId});
 const orgs=await take('organizations',models.Organization,{ownerId});const orgIds=orgs.map(x=>x.id);
 for(const [key,model] of Object.entries({branches:'Branch',warehouses:'Warehouse',subscriptions:'Subscription',subscriptionEvents:'SubscriptionEvent'}))await take(key,models[model],{organizationId:orgIds});
 const tickets=await take('supportTickets',models.SupportTicket,{ownerId});await take('supportMessages',models.SupportMessage,{ticketId:tickets.map(t=>t.id)});
 return {version:2,archiveId:crypto.randomUUID(),ownerId,exportedAt:new Date().toISOString(),owner:owner.get({plain:true}),data};
 });
}
async function create(ownerId){const payload=await snapshot(ownerId),archive=seal(payload),buffer=Buffer.from(JSON.stringify(archive));return {archive,buffer,digest:digest(buffer),counts:Object.fromEntries(Object.entries(payload.data).map(([k,v])=>[k,v.length]))};}
module.exports={ready,seal,open,snapshot,create,digest,MAX_BYTES};
