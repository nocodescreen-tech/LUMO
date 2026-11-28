const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
const int=(nullable=false)=>({type:D.INTEGER,allowNull:nullable});
const str=(n,nullable=false)=>({type:D.STRING(n),allowNull:nullable});
const RepairOrder=sequelize.define('RepairOrder',{
 userId:int(),actorId:int(),unitId:int(true),saleId:int(true),clientId:int(true),customerName:str(160),customerPhone:str(50,true),deviceName:str(160),serial:str(100,true),imei:str(15,true),issue:{type:D.TEXT,allowNull:false},condition:{type:D.TEXT,allowNull:false},accessories:str(250,true),status:{...str(24),defaultValue:'RECEIVED'},warrantyUntil:{type:D.DATEONLY,allowNull:true},warrantyStatus:str(24),diagnosis:{type:D.TEXT,allowNull:true},estimate:{type:D.DECIMAL(20,2),allowNull:true},currency:str(3,true),approvalStatus:{...str(20),defaultValue:'PENDING'},assignedTo:int(true),deliveredAt:{type:D.DATE,allowNull:true}
},{indexes:[{fields:['userId','status','createdAt']},{fields:['userId','unitId']}]});
const RepairEvent=sequelize.define('RepairEvent',{userId:int(),orderId:int(),actorId:int(),kind:str(30),fromStatus:str(24,true),toStatus:str(24,true),note:{type:D.TEXT,allowNull:false},details:{type:D.JSONB,allowNull:false,defaultValue:{}}},{updatedAt:false,indexes:[{fields:['userId','orderId','id']}]});
module.exports={RepairOrder,RepairEvent};
