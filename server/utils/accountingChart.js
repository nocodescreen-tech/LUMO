// Internal ledger classification; not a certified statutory chart.
const accounts=[
 ['CASH','Caisse','ASSET','DEBIT'],['BANK','Banques','ASSET','DEBIT'],['MOBILE_MONEY','Portefeuilles électroniques','ASSET','DEBIT'],['RECEIVABLE','Créances commerciales','ASSET','DEBIT'],['SERVICE_RECEIVABLE','Créances SAV','ASSET','DEBIT'],['INVENTORY','Stocks','ASSET','DEBIT'],
 ['PAYABLE','Dettes fournisseurs','LIABILITY','CREDIT'],['CUSTOMER_ADVANCES','Avances clients','LIABILITY','CREDIT'],
 ['REVENUE','Ventes de marchandises','REVENUE','CREDIT'],['SERVICE_REVENUE','Prestations SAV','REVENUE','CREDIT'],['INVENTORY_GAIN','Gains sur inventaire','REVENUE','CREDIT'],
 ['COST_OF_GOODS','Coût des marchandises vendues','EXPENSE','DEBIT'],['OPERATING_EXPENSE','Charges d’exploitation','EXPENSE','DEBIT'],['PAYROLL_EXPENSE','Charges de personnel','EXPENSE','DEBIT'],['INVENTORY_LOSS','Pertes sur inventaire','EXPENSE','DEBIT']
].map(([code,label,category,normal])=>Object.freeze({code,label,category,normal}));
const lookup=Object.freeze(Object.fromEntries(accounts.map(a=>[a.code,a])));
module.exports={accounts:Object.freeze(accounts),lookup};
