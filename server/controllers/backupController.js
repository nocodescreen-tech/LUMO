const {BackupRun}=require('../models');
const archive=require('../utils/backupArchive');
const {sendEmail}=require('../utils/emailService');
const {fail}=require('../utils/transactionSafety');
const {sendResponse}=require('../utils/response');
async function run(req,mode,deliver){
 if(!archive.ready())throw fail('Clé de sauvegarde serveur non configurée',503);
 const row=await BackupRun.create({ownerId:req.user.id,mode,status:'RUNNING'});
 try{const output=await archive.create(req.user.id);await deliver(output);
 await row.update({status:mode==='DOWNLOAD'?'GENERATED':'DELIVERED',archiveId:output.archive.archiveId,bytes:output.buffer.length,digest:output.digest,finishedAt:new Date()});return output;
 }catch(e){await row.update({status:'FAILED',failure:e.statusCode===413?'SIZE_LIMIT':'BACKUP_FAILED',finishedAt:new Date()});throw e;}
}
exports.exportBackup=async(req,res,next)=>{try{
 const output=await run(req,'DOWNLOAD',async()=>{});res.set('Cache-Control','no-store');res.attachment('lumo-archive-'+output.archive.archiveId+'.json');res.type('application/json').send(output.buffer);
}catch(e){next(e)}};
exports.exportEmailBackup=async(req,res,next)=>{try{
 if(req.user.isVerified!==true)throw fail('Adresse email non vérifiée',403);
 if(req.body.confirm!==true)throw fail('Confirmation de l’envoi requise');
 await run(req,'EMAIL',async output=>{const result=await sendEmail({email:req.user.email,subject:'Archive chiffrée LUMO',html:'<p>Votre archive chiffrée est jointe. Conservez-la dans un espace sécurisé.</p>',attachments:[{filename:'lumo-archive-'+output.archive.archiveId+'.json',content:output.buffer}]});if(result===false)throw fail('Envoi indisponible',503)});
 return res.json({message:'Archive transmise au service email'});
}catch(e){next(e)}};
exports.previewBackup=async(req,res,next)=>{try{const payload=archive.open(req.body,req.user.id);return res.json({version:2,archiveId:payload.archiveId,exportedAt:payload.exportedAt,counts:Object.fromEntries(Object.entries(payload.data).map(([k,v])=>[k,v.length])),authenticated:true,restoreAvailable:false});}catch(e){next(e)}};
exports.importBackup=async(req,res)=>res.status(409).json({message:'Restauration de production non disponible. Vérifiez l’archive et contactez le support pour une procédure isolée.'});
exports.history=async(req,res,next)=>{try{const page=Math.max(1,Math.min(100000,parseInt(req.query.page)||1)),limit=Math.max(1,Math.min(50,parseInt(req.query.limit)||20));const result=await BackupRun.findAndCountAll({where:{ownerId:req.user.id},order:[['id','DESC']],limit,offset:(page-1)*limit});return sendResponse(res,200,{ready:archive.ready(),rows:result.rows,total:result.count,page,limit},'Historique des sauvegardes');}catch(e){next(e)}};
