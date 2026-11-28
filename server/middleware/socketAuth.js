const jwt=require('jsonwebtoken');
const config=require('../config');
const redis=require('../utils/redis');
const User=require('../models/User');
const {allowedOrigin}=require('./sessionOrigin');
async function socketIdentity(token,origin){
 if(origin&&!allowedOrigin(origin))return null;
 if(typeof token!=='string'||token.length>8192)return null;
 try{
  if(await redis.exists('blacklist:'+token))return null;
  const decoded=jwt.verify(token,config.jwt.secret,{algorithms:['HS256']});
  if(decoded.type!=='access'||!decoded.sessionId)return null;
  const user=await User.findByPk(decoded.id,{attributes:['id','role','parentId','isSuspended','isVerified','isAdminValidated','activeSessions']});
  if(!user||user.isSuspended||!(user.activeSessions||[]).some(s=>s.sessionId===decoded.sessionId))return null;
  if(user.role!=='superadmin'&&(!user.isVerified||!user.isAdminValidated))return null;
  if(user.parentId){
   if(['admin','superadmin'].includes(user.role))return null;
   const owner=await User.findByPk(user.parentId,{attributes:['id','parentId','role','isSuspended','isVerified','isAdminValidated']});
   if(!owner||owner.parentId||owner.role!=='admin'||owner.isSuspended||!owner.isVerified||!owner.isAdminValidated)return null;
  }
  return {userId:user.id,tenantId:user.parentId||user.id};
 }catch{return null}
}
module.exports={socketIdentity};
