const {DataTypes:D}=require('sequelize');const {sequelize}=require('../config/database');
const int=(allowNull=false)=>({type:D.INTEGER,allowNull});const str=(n,allowNull=false)=>({type:D.STRING(n),allowNull});const amount=(allowNull=false)=>({type:D.DECIMAL(20,2),allowNull});
const ExpensePolicy=sequelize.define('ExpensePolicy',{userId:int(),actorId:int(),currency:str(3),threshold:amount(true),reason:str(250)},{updatedAt:false,indexes:[{fields:['userId','id']}]});
const ExpenseRequest=sequelize.define('ExpenseRequest',{userId:int(),requesterId:int(),description:str(250),category:str(80),amount:amount(),currency:str(3),status:str(16),approvedBy:int(true),expenseId:int(true)},{indexes:[{fields:['userId','status','id']},{fields:['userId','requesterId','id']},{unique:true,fields:['userId','expenseId']}]});
const ExpenseRequestEvent=sequelize.define('ExpenseRequestEvent',{userId:int(),requestId:int(),actorId:int(),kind:str(16),reason:str(250)},{updatedAt:false,indexes:[{fields:['userId','requestId','id']}]});
module.exports={ExpensePolicy,ExpenseRequest,ExpenseRequestEvent};
