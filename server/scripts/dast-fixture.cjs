// Never run this runner against a shared or production database.
const fs=require('node:fs');
const env=process.env;
if(env.GITHUB_ACTIONS!=='true'||env.LUMO_DAST_LOCAL!=='1'||env.NODE_ENV!=='production'||env.DB_HOST!=='127.0.0.1'||env.DB_NAME!=='lumo_commercial_test'||env.DATABASE_URL||env.DB_USER!=='lumo_test')throw Error('Dedicated local CI fixture required');
if(!env.LUMO_DAST_FIXTURE_FILE)throw Error('Fixture output required');
const {sequelize}=require('../config/database'),{User,Product}=require('../models'),generateToken=require('../utils/generateToken');
async function run(){
 await sequelize.authenticate();
 const make=async(role,label,parentId=null,permissions=[])=>{
  const user=await User.create({nom:'Synthetic DAST '+label,email:'dast-'+label+'@example.invalid',motDePasse:require('node:crypto').randomBytes(24).toString('hex'),role,parentId,permissions,isVerified:true,isAdminValidated:true,activeSessions:[{sessionId:'dast-'+label}],entreprise:{nom:'Synthetic '+label,devise:'CDF'},preferences:{exchangeRate:2500,currency:'CDF'}});
  return {id:user.id,token:generateToken(user.id,'dast-'+label).accessToken};
 };
 const owner=await make('admin','owner'),other=await make('admin','other'),staff=await make('vendeur','staff',owner.id,['products']),platform=await make('superadmin','platform');
 const ownProduct=await Product.create({nom:'DAST OWN CATALOG',prix:10,prixAchat:4,devise:'USD',stock:4,userId:owner.id});
 const foreignProduct=await Product.create({nom:'DAST FOREIGN CATALOG',prix:10,prixAchat:4,devise:'USD',stock:4,userId:other.id});
 const app=require('../server');
 const server=app.listen(18080,'127.0.0.1',()=>{
  fs.writeFileSync(env.LUMO_DAST_FIXTURE_FILE,JSON.stringify({owner,other,staff,platform,products:{own:ownProduct.id,foreign:foreignProduct.id}}),{mode:0o600});
  console.log('Local synthetic API ready');
 });
 const close=()=>server.close(()=>process.exit(0));
 process.on('SIGTERM',close);process.on('SIGINT',close);
}
run().catch(()=>{console.error('Synthetic DAST fixture startup failed');process.exit(1)});
