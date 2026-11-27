const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
const int=(nullable=false)=>({type:D.INTEGER,allowNull:nullable});
const amount=()=>({type:D.DECIMAL(20,2),allowNull:false});
const RepairBill=sequelize.define('RepairBill',{userId:int(),orderId:int(),currency:{type:D.STRING(3),allowNull:false},estimateCurrency:{type:D.STRING(3),allowNull:false},estimate:amount(),rate:{type:D.DECIMAL(20,8),allowNull:false},total:amount(),paid:amount(),status:{type:D.STRING(16),allowNull:false,defaultValue:'ADVANCE'},number:{type:D.STRING(32),allowNull:true},issuedAt:{type:D.DATE,allowNull:true},issuer:{type:D.JSONB,allowNull:false},customer:{type:D.JSONB,allowNull:false}},{indexes:[{unique:true,fields:['userId','orderId']},{unique:true,fields:['userId','number']}]});
const RepairPayment=sequelize.define('RepairPayment',{userId:int(),billId:int(),actorId:int(),cashSessionId:int(),kind:{type:D.STRING(16),allowNull:false},amount:amount(),currency:{type:D.STRING(3),allowNull:false},reversalOf:int(true),note:{type:D.STRING(250),allowNull:false}},{updatedAt:false,indexes:[{fields:['userId','billId','id']},{unique:true,fields:['userId','reversalOf']}]});
module.exports={RepairBill,RepairPayment};
