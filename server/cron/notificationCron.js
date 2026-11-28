const cron=require('node-cron');const {User}=require('../models');const {Op}=require('sequelize');const svc=require('../utils/notificationService');const logger=require('../utils/logger');
let running=false,cursor=0;
async function run(){if(running)return;running=true;try{
 const users=await User.findAll({where:{id:{[Op.gt]:cursor},isSuspended:false,role:{[Op.ne]:'superadmin'}},attributes:['id'],order:[['id','ASC']],limit:100});
 for(const u of users){try{await svc.scan(u.id)}catch(_){logger.warn('Personal alert scan failed');}cursor=u.id;}
 if(users.length<100)cursor=0;
}catch(_){logger.warn('Alert scheduler failed');}finally{running=false;}}
function initNotificationCron(){if(process.env.LUMO_ALERT_CRON!=='true')return;cron.schedule('*/15 * * * *',()=>void run(),{timezone:'Africa/Kinshasa'});}
module.exports={initNotificationCron,run};
