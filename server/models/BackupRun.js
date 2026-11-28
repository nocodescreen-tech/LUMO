const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
module.exports=sequelize.define('BackupRun',{
 ownerId:{type:D.INTEGER,allowNull:false},mode:{type:D.STRING(16),allowNull:false},
 scheduleKey:{type:D.STRING(32),allowNull:true},status:{type:D.STRING(24),allowNull:false,defaultValue:'RUNNING'},
 archiveId:{type:D.UUID,allowNull:true},bytes:{type:D.INTEGER,allowNull:true},digest:{type:D.STRING(64),allowNull:true},
 failure:{type:D.STRING(40),allowNull:true},finishedAt:{type:D.DATE,allowNull:true}
},{indexes:[{fields:['ownerId','createdAt']},{unique:true,fields:['ownerId','scheduleKey']}]});
