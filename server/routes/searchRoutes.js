const router=require('express').Router();
const {Op}=require('sequelize');
const {Product,Client,Sale,Fournisseur}=require('../models');
const {protect}=require('../middleware/authMiddleware');
router.get('/',protect,async(req,res,next)=>{
 try{
 const userId=req.user.tenantId, q=typeof req.query.q==='string'?req.query.q.trim().slice(0,100):'';
 if(q.length<2)return res.json({products:[],clients:[],sales:[],fournisseurs:[]});
 const allowed=(...p)=>['admin','superadmin'].includes(req.user.role)||p.some(k=>(req.user.permissions||[]).includes(k));
 const pattern='%'+q.replace(/[\\%_]/g,v=>'\\'+v)+'%',where={userId,nom:{[Op.iLike]:pattern}},saleWhere={userId,'clientInfo.nom':{[Op.iLike]:pattern}};
 if(req.user.parentId&&allowed('sales'))saleWhere.warehouseId=(await require('../utils/staffScope').location(req.user))?.id??null;
 const [products,clients,sales,fournisseurs]=await Promise.all([
 allowed('products','pos')?Product.findAll({where,limit:5,attributes:req.user.parentId?['id','nom','prix','devise']:['id','nom','prix','devise','stock']}):[],
 allowed('clients')?Client.findAll({where,limit:5,attributes:['id','nom','telephone']}):[],
 allowed('sales')?Sale.findAll({where:saleWhere,limit:5,attributes:['id','clientInfo','montantTotal','devise']}):[],
 allowed('suppliers')?Fournisseur.findAll({where,limit:3,attributes:['id','nom']}):[]
 ]);
 res.json({products,clients,sales:sales.map(s=>({id:s.id,client:s.clientInfo?.nom,total:s.montantTotal,devise:s.devise})),fournisseurs});
 }catch(e){next(e);}
});
module.exports=router;
