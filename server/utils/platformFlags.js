const {GlobalSetting}=require('../models');
const {fail}=require('./transactionSafety');
const definitions=Object.freeze({
 support_new_tickets:{label:'Création de nouveaux tickets',description:'Autorise les entreprises à ouvrir de nouvelles demandes ; les conversations existantes restent accessibles.',defaultEnabled:true},
 workspace_registry_creation:{label:'Nouvelles succursales et entrepôts',description:'Autorise la création de registres de succursales et entrepôts ; les données existantes restent accessibles.',defaultEnabled:true}
});
async function list(transaction){const rows=await GlobalSetting.findAll({where:{key:Object.keys(definitions).map(k=>'flag:'+k)},transaction});return Object.entries(definitions).map(([key,d])=>({key,...d,enabled:rows.find(r=>r.key==='flag:'+key)?.value==='false'?false:d.defaultEnabled}));}
function guard(key){return async(req,res,next)=>{try{if(!Object.hasOwn(definitions,key))throw new Error('Unknown flag');const row=await GlobalSetting.findOne({where:{key:'flag:'+key}});if(row?.value==='false')throw fail('Fonctionnalité temporairement indisponible',503);next()}catch(e){next(e)}};}
module.exports={definitions,list,guard};
