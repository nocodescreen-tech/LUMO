const {DataTypes:D}=require('sequelize');const {sequelize}=require('../config/database');
const PlanEntitlement=sequelize.define('PlanEntitlement',{plan:{type:D.STRING(32),allowNull:false},actorId:{type:D.INTEGER,allowNull:false},enforced:{type:D.BOOLEAN,allowNull:false},aiLimit:{type:D.INTEGER,allowNull:false},crmCreate:{type:D.BOOLEAN,allowNull:false},reason:{type:D.STRING(250),allowNull:false}},{updatedAt:false,indexes:[{fields:['plan','id']}]});
module.exports={PlanEntitlement};
