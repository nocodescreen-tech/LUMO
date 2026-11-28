const {DataTypes}=require('sequelize');
const {sequelize}=require('../config/database');
module.exports=sequelize.define('Depense',{
 userId:{type:DataTypes.INTEGER,allowNull:false},actorId:{type:DataTypes.INTEGER,allowNull:false},
 description:{type:DataTypes.STRING(250),allowNull:false},categorie:{type:DataTypes.STRING(80),allowNull:false},
 montant:{type:DataTypes.DECIMAL(20,2),allowNull:false,validate:{min:0}},devise:{type:DataTypes.STRING(3),allowNull:false},
 accountingCurrency:{type:DataTypes.STRING(3),allowNull:false},tauxChange:{type:DataTypes.DECIMAL(20,8),allowNull:false},
 budgetCenterId:{type:DataTypes.INTEGER,allowNull:true},
 cashSessionId:{type:DataTypes.INTEGER,allowNull:false},reference:{type:DataTypes.STRING(100),allowNull:true},
 status:{type:DataTypes.STRING(16),allowNull:false,defaultValue:'POSTED'}
},{indexes:[{fields:['userId','createdAt']}]});
