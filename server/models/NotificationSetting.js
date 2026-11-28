const {DataTypes:D}=require('sequelize');const {sequelize}=require('../config/database');
module.exports=sequelize.define('NotificationSetting',{userId:{type:D.INTEGER,primaryKey:true},muted:{type:D.JSONB,allowNull:false,defaultValue:[]},lastScanAt:{type:D.DATE,allowNull:true}},{timestamps:false});
