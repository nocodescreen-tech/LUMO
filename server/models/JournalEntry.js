const {DataTypes}=require('sequelize');
const {sequelize}=require('../config/database');
module.exports=sequelize.define('JournalEntry',{
 userId:{type:DataTypes.INTEGER,allowNull:false},actorId:{type:DataTypes.INTEGER,allowNull:false},
 event:{type:DataTypes.STRING(40),allowNull:false},reference:{type:DataTypes.STRING(100),allowNull:false},
 debitAccount:{type:DataTypes.STRING(40),allowNull:false},creditAccount:{type:DataTypes.STRING(40),allowNull:false},
 amount:{type:DataTypes.DECIMAL(20,2),allowNull:false,validate:{min:0}},currency:{type:DataTypes.STRING(3),allowNull:false,validate:{isIn:[['CDF','USD']]}},
 cashSessionId:{type:DataTypes.INTEGER,allowNull:true},rate:{type:DataTypes.DECIMAL(20,8),allowNull:true}
},{updatedAt:false,indexes:[{fields:['userId','createdAt']},{name:'journal_unique_posting',unique:true,fields:['userId','event','reference','debitAccount','creditAccount']}]});
