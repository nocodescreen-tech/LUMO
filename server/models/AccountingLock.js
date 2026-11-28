const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
module.exports=sequelize.define('AccountingLock',{userId:{type:D.INTEGER,allowNull:false},actorId:{type:D.INTEGER,allowNull:false},through:{type:D.DATEONLY,allowNull:false},note:{type:D.STRING(250),allowNull:false}},{updatedAt:false,indexes:[{unique:true,fields:['userId','through']}]});
