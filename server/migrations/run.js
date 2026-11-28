const fs=require('fs');const path=require('path');const crypto=require('crypto');
const {sequelize}=require('../config/database');
async function migrate(){
 await sequelize.transaction(async transaction=>{
  await sequelize.query('SELECT pg_advisory_xact_lock(5140318)',{transaction});
  await sequelize.query('CREATE TABLE IF NOT EXISTS "LumoSchemaMigrations" (name text PRIMARY KEY,checksum text NOT NULL,"appliedAt" timestamptz NOT NULL DEFAULT now())',{transaction});
  for(const name of fs.readdirSync(__dirname).filter(n=>/^\d+.*\.sql$/.test(n)).sort()){
   const sql=fs.readFileSync(path.join(__dirname,name),'utf8'),checksum=crypto.createHash('sha256').update(sql).digest('hex');
   const [rows]=await sequelize.query('SELECT checksum FROM "LumoSchemaMigrations" WHERE name=:name',{replacements:{name},transaction});
   if(rows.length){if(rows[0].checksum!==checksum)throw new Error('Applied migration changed: '+name);continue;}
   await sequelize.query(sql,{transaction});
   await sequelize.query('INSERT INTO "LumoSchemaMigrations"(name,checksum) VALUES (:name,:checksum)',{replacements:{name,checksum},transaction});
  }
 });
}
if(require.main===module)migrate().then(()=>console.log('Migrations applied')).catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>sequelize.close());
module.exports=migrate;
