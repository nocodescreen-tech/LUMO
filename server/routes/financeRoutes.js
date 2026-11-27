const router=require('express').Router();
const {protect,authorize}=require('../middleware/authMiddleware');
const {JournalEntry}=require('../models');
const {sendResponse}=require('../utils/response');
router.get('/journal',protect,authorize('admin','superadmin'),async(req,res,next)=>{
 try{const page=Math.max(1,Math.min(100000,parseInt(req.query.page)||1)),limit=Math.max(1,Math.min(100,parseInt(req.query.limit)||50));
 const result=await JournalEntry.findAndCountAll({where:{userId:req.user.tenantId},order:[['createdAt','DESC'],['id','DESC']],limit,offset:(page-1)*limit});
 return sendResponse(res,200,{rows:result.rows,total:result.count,page,limit},'Journal financier');
 }catch(e){next(e);}
});
module.exports=router;
