const cron=require('node-cron');
const fs=require('fs/promises'),os=require('os'),path=require('path');
const {Op}=require('sequelize');
const {User,BackupRun}=require('../models');
const archive=require('../utils/backupArchive');
const {uploadBackup}=require('../services/firebaseService');
const logger=require('../utils/logger');
const TZ='Africa/Kinshasa';
let running=false;
async function executeDailyBackup(){
 if(running||!archive.ready()||process.env.LUMO_AUTO_BACKUP!=='true')return;
 running=true;
 try{
 const now=new Date(),clock=new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const value=k=>parts.find(p=>p.type===k).value,day=value('year')+'-'+value('month')+'-'+value('day');
 const owners=await User.findAll({where:{role:'admin',parentId:null,isSuspended:false,preferences:{[Op.contains]:{autoBackupEnabled:true}}},attributes:['id','preferences']});
 for(const owner of owners){
 if((owner.preferences?.backupTime||'00:00')!==clock)continue;
 let row;try{row=await BackupRun.create({ownerId:owner.id,mode:'SCHEDULED',scheduleKey:day,status:'RUNNING'});}catch(e){if(e.name==='SequelizeUniqueConstraintError')continue;logger.warn('Backup claim failed');continue;}
 let dir;
 try{const output=await archive.create(owner.id);dir=await fs.mkdtemp(path.join(os.tmpdir(),'lumo-backup-'));const filename='lumo-'+output.archive.archiveId+'.json',file=path.join(dir,filename);await fs.writeFile(file,output.buffer,{mode:0o600});if(await uploadBackup(file,filename)!==true)throw Error('Remote storage unavailable');
 await row.update({status:'STORED',archiveId:output.archive.archiveId,bytes:output.buffer.length,digest:output.digest,finishedAt:new Date()});
 }catch(e){await row.update({status:'FAILED',failure:'BACKUP_FAILED',finishedAt:new Date()});logger.warn('Scheduled encrypted backup failed');}
 finally{if(dir)await fs.rm(dir,{recursive:true,force:true});}
 }
 }catch(e){logger.error('Backup scheduler failed');}finally{running=false;}
}
function initBackupCron(){if(!archive.ready()||process.env.LUMO_AUTO_BACKUP!=='true'){logger.warn('Encrypted automatic backup disabled: configuration required');return;}cron.schedule('* * * *',()=>void executeDailyBackup(),{timezone:TZ});}
module.exports={initBackupCron,executeDailyBackup};
