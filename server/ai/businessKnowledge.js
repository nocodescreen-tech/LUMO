const {sequelize}=require('../config/database');
const {User,Product,Client,Fournisseur,Purchase,ExpenseRequest,LeaveRequest,Opportunity,RepairOrder,CommercialDocument,InventoryLot,Receivable,CashSession,TreasuryAccount,PayrollSlip,Organization,Subscription,Branch,Warehouse}=require('../models');
const {Op}=require('sequelize');
const budget=require('../utils/budgetService'),{today}=require('../utils/lotService');
const {currency}=require('../utils/transactionSafety');
const modules=[
 ['Direction générale','/executive','Résultats issus du journal, comparaison mensuelle/annuelle, soldes actuels et export Excel.'],
 ['Point de vente','/pos','Ventes, crédit client, caisse et stock; les opérations réelles nécessitent validation dans le module.'],
 ['Produits','/products','Catalogue, prix, seuils de stock.'],
 ['Inventaire','/inventory','Entrepôts, transferts, inventaires, lots, séries et alertes de réapprovisionnement.'],
 ['Achats','/purchases','Demandes fournisseurs, approbation et réception contrôlée.'],
 ['Clients','/clients','Fiches clients; les créances suivies sont dans Créances.'],
 ['Créances','/receivables','Soldes, échéances, règlements.'],
 ['CRM','/crm','Opportunités, relances, interactions, objectifs et ventes nettes.'],
 ['SAV','/repairs','Dossiers de réparation, garanties et facturation.'],
 ['Documents','/documents','Documents commerciaux et historique.'],
 ['Caisse','/cash','Sessions, soldes attendus et clôtures.'],
 ['Comptabilité','/accounting','Journal enregistré, balance, résultat interne et verrouillage de périodes.'],
 ['Trésorerie','/treasury','Comptes, transferts et rapprochements déclarés.'],
 ['Dépenses','/expense-approvals','Demandes, seuils, double contrôle et décaissement.'],
 ['Budgets','/budgets','Enveloppes mensuelles et annuelles, engagements et dépenses générales; achats et paie exclus.'],
 ['Ressources humaines','/hr','Collaborateurs et présences.'],
 ['Congés','/leave','Demandes et décisions, calendrier séparé des présences.'],
 ['Paie','/payroll','Bulletins, décisions et paiements enregistrés.'],
 ['Accès','/access-governance','Permissions individuelles et audit.'],
 ['Notifications','/notifications','Alertes personnelles et préférences.'],
 ['Abonnement','/subscription','Licence, quotas, offres et factures internes; renouvellement manuel.'],
 ['Support','/support','Demandes d’assistance.'],
 ['Paramètres','/settings','Profil, préférences, sécurité et sauvegarde.']
].map(([name,path,description])=>({name,path,description}));
const coverage='commercial-v2-postings-only';
async function snapshot(uid){
 if(!Number.isSafeInteger(uid)||uid<=0)throw Error('Invalid tenant');
 return sequelize.transaction({isolationLevel:'REPEATABLE READ'},async t=>{
 const u=await User.findOne({where:{id:uid,role:'admin',parentId:null,isSuspended:false},attributes:['id','entreprise'],transaction:t});if(!u)throw Error('Tenant unavailable');
 const day=today(),month=day.slice(0,7)+'-01',end=new Date(Date.parse(day)+86400000).toISOString().slice(0,10);
 const query=async(sql,extra={})=>(await sequelize.query(sql,{replacements:{uid,day,month,end,...extra},transaction:t}))[0];
 const financial=await query(`WITH movement AS (SELECT currency,"creditAccount" AS account,amount AS value FROM "JournalEntries" WHERE "userId"=:uid AND "createdAt">=(CAST(:month AS date)::timestamp AT TIME ZONE 'Africa/Kinshasa') AND "createdAt"<(CAST(:end AS date)::timestamp AT TIME ZONE 'Africa/Kinshasa') UNION ALL SELECT currency,"debitAccount",-amount FROM "JournalEntries" WHERE "userId"=:uid AND "createdAt">=(CAST(:month AS date)::timestamp AT TIME ZONE 'Africa/Kinshasa') AND "createdAt"<(CAST(:end AS date)::timestamp AT TIME ZONE 'Africa/Kinshasa')) SELECT currency,COALESCE(SUM(value) FILTER(WHERE account='REVENUE'),0)::text AS revenue,COALESCE(SUM(value) FILTER(WHERE account='SERVICE_REVENUE'),0)::text AS "serviceRevenue",(-COALESCE(SUM(value) FILTER(WHERE account='COST_OF_GOODS'),0))::text AS "costOfGoods",COALESCE(SUM(value) FILTER(WHERE account IN ('REVENUE','SERVICE_REVENUE','COST_OF_GOODS','OPERATING_EXPENSE','PAYROLL_EXPENSE','INVENTORY_LOSS','INVENTORY_GAIN')),0)::text AS "recordedResult" FROM movement GROUP BY currency ORDER BY currency`);
 const [stock]=await query('SELECT COUNT(*)::integer AS products,COUNT(*) FILTER(WHERE stock<COALESCE("stockAlerte",5))::integer AS "lowStock" FROM "Products" WHERE "userId"=:uid AND "deletedAt" IS NULL');
 const debts=await query('SELECT currency,COUNT(*)::integer AS count,SUM(balance)::text AS balance,COALESCE(SUM(balance) FILTER(WHERE "dueOn" < :day),0)::text AS overdue FROM "Receivables" WHERE "userId"=:uid AND balance>0 GROUP BY currency');
 const cash=await query('SELECT currency,COUNT(*)::integer AS count,SUM("expectedBalance")::text AS balance FROM "CashSessions" WHERE "userId"=:uid AND status=\'OPEN\' GROUP BY currency');
 const treasury=await query('SELECT currency,kind,SUM(balance)::text AS balance FROM "TreasuryAccounts" WHERE "userId"=:uid GROUP BY currency,kind');
 const commitments=await query('SELECT currency,SUM(amount)::text AS amount FROM "ExpenseRequests" WHERE "userId"=:uid AND status=\'APPROVED\' GROUP BY currency');
 const pipeline=await query('SELECT currency,COUNT(*)::integer AS count,SUM(amount)::text AS estimate FROM "Opportunities" WHERE "userId"=:uid AND stage IN (\'NEW\',\'QUALIFIED\',\'PROPOSAL\',\'NEGOTIATION\') GROUP BY currency');
 const count=(model,where={})=>model.count({where:{userId:uid,...where},transaction:t});
 const [clients,suppliers,purchases,expenses,leaves,repairs,documents,payroll,expiry,followups,staff]=await Promise.all([count(Client),count(Fournisseur),count(Purchase,{approvalState:'PENDING'}),count(ExpenseRequest,{status:'PENDING'}),count(LeaveRequest,{status:'PENDING'}),count(RepairOrder),count(CommercialDocument),count(PayrollSlip),count(InventoryLot,{quantity:{[Op.gt]:0},expiresOn:{[Op.lt]:day}}),count(Opportunity,{stage:{[Op.in]:['NEW','QUALIFIED','PROPOSAL','NEGOTIATION']},followUpOn:{[Op.lte]:day}}),User.count({where:{parentId:uid,isSuspended:false},transaction:t})]);
 const c=currency(u.entreprise?.devise),plans=await budget.current(uid,c,t,day);let near=0,over=0;
 for(const p of plans.slice(0,100)){const f=await budget.figures(p,t,null,day);if(f.over)over++;else if(f.near)near++;}
 const org=await Organization.findOne({where:{ownerId:uid},transaction:t});const sub=org?await Subscription.findOne({where:{organizationId:org.id},transaction:t}):null;
 return {asOf:new Date().toISOString(),day,month,timezone:'Africa/Kinshasa',accountingCurrency:c,coverage,financial,stock,debts,cash,treasury,commitments,pipeline,counts:{clients,suppliers,pendingPurchases:purchases,pendingExpenses:expenses,pendingLeaves:leaves,repairOrders:repairs,documents,payrollSlips:payroll,expiredLots:expiry,followups,staff},budgets:{currency:c,total:plans.length,scanned:Math.min(plans.length,100),near,over},subscription:sub?{plan:sub.plan,status:sub.status,endsAt:sub.endsAt}:null};
 });
}
function insights(s,en=false){
 const n=s.stock.lowStock,debts=s.debts.filter(v=>Number(v.overdue)>0).map(v=>v.overdue+' '+v.currency).join(' / '),sales=s.financial.map(v=>v.revenue+' '+v.currency).join(' / ');
 return {source:'recorded-rules',asOf:s.asOf,coverage:s.coverage,suggestions:[
 {type:'stock',title:en?'Stock control':'Contrôle du stock',desc:en?n+' products below global stock threshold.':n+' produit(s) sous le seuil de stock global.',impact:en?'Review availability':'Vérifier les disponibilités'},
 {type:'sales',title:en?'Posted net goods sales':'Ventes nettes comptabilisées',desc:(en?'Month to date: ':'Depuis le début du mois : ')+(sales||(en?'No posted entries':'Aucune écriture'))+'.',impact:en?'Review sales and refunds':'Examiner ventes et remboursements'},
 {type:'pricing',title:en?'Financial follow-up':'Suivi financier',desc:(en?'Overdue tracked receivables: ':'Créances suivies échues : ')+(debts||(en?'None recorded':'Aucun montant enregistré'))+'. '+s.counts.pendingExpenses+(en?' pending expense requests.':' demande(s) de dépense en attente.'),impact:en?'Review commitments':'Examiner les engagements'}
 ],analysis:en?'Rule-based recommendations from the recorded journal and current registers, not forecasts. Currencies remain separate.':'Recommandations calculées à partir du journal et des registres actuels, sans prévision ni conversion entre devises.'};
}
module.exports={snapshot,insights,modules};
