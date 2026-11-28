const router=require('express').Router();
const {BackupRun}=require('../models');
const {sendResponse}=require('../utils/response');
const archive=require('../utils/backupArchive');
router.get('/',async(req,res,next)=>{try{
 const page=Math.max(1,Math.min(100000,parseInt(req.query.page)||1)),limit=Math.max(1,Math.min(100,parseInt(req.query.limit)||25));
 const result=await BackupRun.findAndCountAll({attributes:['id','ownerId','mode','status','archiveId','bytes','failure','finishedAt','createdAt'],order:[['id','DESC']],limit,offset:(page-1)*limit});
 return sendResponse(res,200,{rows:result.rows,total:result.count,page,limit,keyConfigured:archive.ready(),automaticEnabled:archive.ready()&&process.env.LUMO_AUTO_BACKUP==='true',restoreAvailable:false},'Supervision sauvegardes');
}catch(e){next(e)}});
module.exports=router;
