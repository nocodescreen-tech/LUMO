const {DataTypes}=require('sequelize');
const {sequelize}=require('../config/database');
module.exports=sequelize.define('OperationReceipt',{
 userId:{type:DataTypes.INTEGER,allowNull:false},actorId:{type:DataTypes.INTEGER,allowNull:false},
 operation:{type:DataTypes.STRING(50),allowNull:false},key:{type:DataTypes.STRING(128),allowNull:false},
 fingerprint:{type:DataTypes.STRING(64),allowNull:false},resourceId:{type:DataTypes.INTEGER,allowNull:false}
},{updatedAt:false,indexes:[{name:'operation_unique_key',unique:true,fields:['userId','operation','key']}]});
