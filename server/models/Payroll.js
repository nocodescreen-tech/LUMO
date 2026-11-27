const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
const int=(allowNull=false)=>({type:D.INTEGER,allowNull});
const str=(n,allowNull=false)=>({type:D.STRING(n),allowNull});
const amount=()=>({type:D.DECIMAL(20,2),allowNull:false});
const PayRate=sequelize.define('PayRate',{userId:int(),staffId:int(),actorId:int(),effectiveMonth:str(7),currency:str(3),base:amount(),reason:str(250)},{updatedAt:false,indexes:[{fields:['userId','staffId','effectiveMonth','id']}]});
const PayrollSlip=sequelize.define('PayrollSlip',{userId:int(),staffId:int(),actorId:int(),rateId:int(),month:str(7),currency:str(3),base:amount(),bonus:amount(),allowance:amount(),total:amount(),paid:amount(),status:str(16),reason:str(250),employeeName:str(160),issuer:{type:D.JSONB,allowNull:false},approvedAt:{type:D.DATE,allowNull:true}},{indexes:[{fields:['userId','month','staffId']}]});
const PayrollMovement=sequelize.define('PayrollMovement',{userId:int(),slipId:int(),actorId:int(),cashSessionId:int(),kind:str(16),amount:amount(),currency:str(3),reversalOf:int(true),note:str(250)},{updatedAt:false,indexes:[{fields:['userId','slipId','id']},{unique:true,fields:['userId','reversalOf']}]});
module.exports={PayRate,PayrollSlip,PayrollMovement};
