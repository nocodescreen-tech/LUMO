const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
const int=()=>({type:D.INTEGER,allowNull:false});
const str=n=>({type:D.STRING(n),allowNull:false});
const BudgetCenter=sequelize.define('BudgetCenter',{userId:int(),actorId:int(),branchKey:int(),department:str(120),name:str(120)},{updatedAt:false,indexes:[{fields:['userId','id']}]});
const BudgetRevision=sequelize.define('BudgetRevision',{userId:int(),centerId:int(),actorId:int(),currency:str(3),periodKind:str(8),periodStart:{type:D.DATEONLY,allowNull:false},amount:{type:D.DECIMAL(20,2),allowNull:false},mode:str(8),reason:str(250)},{updatedAt:false,indexes:[{fields:['userId','centerId','currency','periodKind','periodStart','id']}]});
module.exports={BudgetCenter,BudgetRevision};
