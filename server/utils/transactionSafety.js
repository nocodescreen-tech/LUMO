const { convertCurrency } = require('./currency');
function fail(message,statusCode=400){return Object.assign(new Error(message),{statusCode});}
function pick(source,keys){return Object.fromEntries(keys.filter(k=>Object.prototype.hasOwnProperty.call(source,k)).map(k=>[k,source[k]]));}
function currency(value){const v=String(value||'CDF').toUpperCase();if(v==='FC')return 'CDF';if(!['USD','CDF'].includes(v))throw fail('Devise invalide');return v;}
function positiveQuantity(value){const n=Number(value);if(!Number.isSafeInteger(n)||n<=0)throw fail('Quantité invalide');return n;}
function money(value){const n=Number(value);if(value===null||value===''||!Number.isFinite(n)||n<0||n>1e12)throw fail('Montant invalide');return n;}
function round(value,devise){return currency(devise)==='CDF'?Math.round(value):Math.round((value+Number.EPSILON)*100)/100;}
function isCredit(method){return /crédit|credit|dette/i.test(String(method||''));}
function isCash(method){return /^(espèces|especes|cash)$/i.test(String(method||''));}
function rateFor(owner){const rate=Number(owner?.preferences?.exchangeRate??owner?.entreprise?.exchangeRate);if(!Number.isFinite(rate)||rate<=0)throw fail('Configurez un taux de change valide.');return rate;}
function trustedLine(product,item,saleCurrency,rate){
 const qty=positiveQuantity(item.quantite),source=currency(product.devise);
 const unit=convertCurrency(money(product.prix),source,saleCurrency,rate);
 const supplied=money(item.prixUnitaire??item.prix);
 if(Math.abs(unit-supplied)>0.00001)throw fail('Prix du produit modifié. Actualisez le panier.',409);
 return {qty,unit,source,cost:money(product.prixAchat??0)};
}
module.exports={fail,pick,currency,positiveQuantity,money,round,isCredit,isCash,rateFor,trustedLine};
