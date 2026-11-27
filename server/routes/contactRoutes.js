const express=require('express'),router=express.Router(),rateLimit=require('express-rate-limit');
const {sendEmail}=require('../utils/emailService');
const {Activite}=require('../models');
const escape=v=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=(v,max)=>typeof v==='string'&&v.trim().length<=max?v.trim():'';
const emailValid=v=>/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v);
const limit=max=>rateLimit({windowMs:15*60*1000,max,standardHeaders:true,legacyHeaders:false,message:{message:'Trop de demandes, réessayez plus tard.'}});
router.post('/',limit(5),async(req,res,next)=>{
 try{
 const nom=clean(req.body?.nom,120),email=clean(req.body?.email,254),message=clean(req.body?.message,2000);
 if(!nom||!emailValid(email)||!message||/[\r\n]/.test(nom))return res.status(400).json({message:'Nom, email et message valides requis.'});
 await Activite.create({type:'LANDING_MESSAGE',description:JSON.stringify({nom,email,message,createdAt:new Date().toISOString()}),module:'Landing',userNom:nom,source:'Public',UserId:null,shopId:null});
 // The inbox is authoritative. A mail-provider failure must not lose the inquiry.
 try{await sendEmail({email:process.env.LUMO_CONTACT_EMAIL||'no.codescreen@gmail.com',subject:'[LUMO] Nouvelle demande de contact',html:'<h2>Nouvelle demande de contact</h2><p>Nom : '+escape(nom)+'</p><p>Email : '+escape(email)+'</p><p>'+escape(message).replace(/\r?\n/g,'<br>')+'</p>'});}catch(_){require('../utils/logger').warn('Notification email du formulaire de contact indisponible');}
 return res.status(200).json({success:true,message:'Votre demande a été enregistrée.'});
 }catch(e){next(e)}
});
router.post('/visit',limit(30),async(req,res,next)=>{
 try{const path=clean(req.body?.path,100)||'/',lang=clean(req.body?.lang,20);
 if(path!=='/')return res.status(400).json({message:'Page invalide'});
 await Activite.create({type:'LANDING_VISIT',description:JSON.stringify({path,lang,createdAt:new Date().toISOString()}),module:'Landing',userNom:'Visiteur',source:'Public',UserId:null,shopId:null});
 return res.status(200).json({success:true});
 }catch(e){next(e)}
});
module.exports=router;
