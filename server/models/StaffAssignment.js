const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
const int=(allowNull=false)=>({type:D.INTEGER,allowNull});
module.exports=sequelize.define('StaffAssignment',{userId:int(),staffId:int(),actorId:int(),warehouseId:int(true),branchId:int(true),reason:{type:D.STRING(250),allowNull:false}},{updatedAt:false,indexes:[{fields:['userId','staffId','id']}]});
