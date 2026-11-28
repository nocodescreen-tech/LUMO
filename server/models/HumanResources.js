const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
const int=(allowNull=false)=>({type:D.INTEGER,allowNull});
const str=(n,allowNull=false)=>({type:D.STRING(n),allowNull});
const StaffProfileRevision=sequelize.define('StaffProfileRevision',{userId:int(),staffId:int(),actorId:int(),jobTitle:str(120),department:str(120),contractType:str(24),hiredOn:{type:D.DATEONLY,allowNull:true},reason:str(250)},{updatedAt:false,indexes:[{fields:['userId','staffId','id']}]});
const AttendanceRevision=sequelize.define('AttendanceRevision',{userId:int(),staffId:int(),actorId:int(),day:{type:D.DATEONLY,allowNull:false},status:str(24),workedMinutes:int(true),branchKey:int(true),reason:str(250)},{updatedAt:false,indexes:[{fields:['userId','day','staffId','id']}]});
const LeaveRequest=sequelize.define('LeaveRequest',{userId:int(),staffId:int(),kind:str(24),startsOn:{type:D.DATEONLY,allowNull:false},endsOn:{type:D.DATEONLY,allowNull:false},note:str(250),status:str(16),decidedBy:int(true)},{indexes:[{fields:['userId','staffId','status','startsOn','endsOn']}]});
const LeaveEvent=sequelize.define('LeaveEvent',{userId:int(),requestId:int(),actorId:int(),kind:str(16),reason:str(250)},{updatedAt:false,indexes:[{fields:['userId','requestId','id']}]});
module.exports={StaffProfileRevision,AttendanceRevision,LeaveRequest,LeaveEvent};
