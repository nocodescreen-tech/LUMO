const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
const int=(nullable=false)=>({type:D.INTEGER,allowNull:nullable});
const amount=()=>({type:D.DECIMAL(20,2),allowNull:false});
const Receivable=sequelize.define('Receivable',{userId:int(),clientId:int(),saleId:int(),currency:{type:D.STRING(3),allowNull:false},original:amount(),balance:amount(),dueOn:{type:D.DATEONLY,allowNull:true}},{indexes:[{unique:true,fields:['userId','saleId']},{fields:['userId','clientId','dueOn']}]});
const ReceivablePayment=sequelize.define('ReceivablePayment',{userId:int(),actorId:int(),clientId:int(),receivableId:int(true),cashSessionId:int(),amount:amount(),currency:{type:D.STRING(3),allowNull:false},kind:{type:D.STRING(20),allowNull:false},note:{type:D.STRING(250),allowNull:false}},{updatedAt:false,indexes:[{fields:['userId','receivableId','id']}]});
module.exports={Receivable,ReceivablePayment};
