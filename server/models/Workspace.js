const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
// Sequelize mutates attribute definitions: each field must receive a fresh object.
const integer=()=>({type:D.INTEGER,allowNull:false});
const name=()=>({type:D.STRING(160),allowNull:false});
const code=()=>({type:D.STRING(32),allowNull:false});
const Organization=sequelize.define('Organization',{ownerId:{...integer(),unique:true},name:name(),currency:{type:D.STRING(3),allowNull:false},status:{type:D.STRING(20),allowNull:false,defaultValue:'ACTIVE'}});
const Branch=sequelize.define('Branch',{organizationId:integer(),name:name(),code:code(),address:{type:D.STRING(250)},active:{type:D.BOOLEAN,allowNull:false,defaultValue:true}},{indexes:[{unique:true,fields:['organizationId','code']}]});
const Warehouse=sequelize.define('Warehouse',{organizationId:integer(),branchId:integer(),name:name(),code:code(),active:{type:D.BOOLEAN,allowNull:false,defaultValue:true}},{indexes:[{unique:true,fields:['organizationId','code']}]});
const Subscription=sequelize.define('Subscription',{organizationId:{...integer(),unique:true},plan:{type:D.STRING(32),allowNull:false},status:{type:D.STRING(24),allowNull:false},startsAt:{type:D.DATE,allowNull:false},endsAt:{type:D.DATE,allowNull:true},branchLimit:integer(),warehouseLimit:integer()});
const SubscriptionEvent=sequelize.define('SubscriptionEvent',{organizationId:integer(),actorId:integer(),kind:{type:D.STRING(40),allowNull:false},reference:{type:D.STRING(100),allowNull:false},details:{type:D.JSONB,allowNull:false}},{updatedAt:false,indexes:[{unique:true,fields:['organizationId','reference']}]});
module.exports={Organization,Branch,Warehouse,Subscription,SubscriptionEvent};
