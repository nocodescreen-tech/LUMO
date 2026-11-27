const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
const int=()=>({type:D.INTEGER,allowNull:false});
const SupportTicket=sequelize.define('SupportTicket',{
 ownerId:int(),createdBy:int(),subject:{type:D.STRING(160),allowNull:false},category:{type:D.STRING(32),allowNull:false},
 priority:{type:D.STRING(16),allowNull:false,defaultValue:'NORMAL'},status:{type:D.STRING(24),allowNull:false,defaultValue:'OPEN'},
 assignedTo:{type:D.INTEGER,allowNull:true},closedAt:{type:D.DATE,allowNull:true}
},{indexes:[{fields:['ownerId','updatedAt']},{fields:['status','updatedAt']}]});
const SupportMessage=sequelize.define('SupportMessage',{
 ticketId:int(),actorId:int(),actorRole:{type:D.STRING(24),allowNull:false},body:{type:D.TEXT,allowNull:false}
},{updatedAt:false,indexes:[{fields:['ticketId','id']}]});
module.exports={SupportTicket,SupportMessage};
