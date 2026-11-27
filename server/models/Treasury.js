const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
const int=(nullable=false)=>({type:D.INTEGER,allowNull:nullable});
const str=(n,nullable=false)=>({type:D.STRING(n),allowNull:nullable});
const amount=()=>({type:D.DECIMAL(20,2),allowNull:false});
const TreasuryAccount=sequelize.define('TreasuryAccount',{userId:int(),name:str(120),kind:str(20),currency:str(3),balance:amount(),provider:str(100,true),referenceHint:str(80,true)},{indexes:[{unique:true,fields:['userId','name']}]});
const TreasuryTransfer=sequelize.define('TreasuryTransfer',{userId:int(),actorId:int(),fromAccountId:int(true),toAccountId:int(true),cashSessionId:int(true),amount:amount(),currency:str(3),note:str(250),externalReference:str(100,true)},{updatedAt:false,indexes:[{fields:['userId','id']}]});
const TreasuryReconciliation=sequelize.define('TreasuryReconciliation',{userId:int(),actorId:int(),accountId:int(),currency:str(3),expected:amount(),observed:amount(),difference:amount(),statementDate:{type:D.DATEONLY,allowNull:false},note:str(250)},{updatedAt:false,indexes:[{fields:['userId','accountId','id']}]});
module.exports={TreasuryAccount,TreasuryTransfer,TreasuryReconciliation};
