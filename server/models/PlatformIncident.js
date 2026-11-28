const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
module.exports=sequelize.define('PlatformIncident',{
 title:{type:D.STRING(160),allowNull:false},
 severity:{type:D.STRING(16),allowNull:false},
 component:{type:D.STRING(32),allowNull:false},
 status:{type:D.STRING(24),allowNull:false,defaultValue:'OPEN'},
 summary:{type:D.TEXT,allowNull:false},
 createdBy:{type:D.INTEGER,allowNull:false},
 resolvedAt:{type:D.DATE,allowNull:true}
},{indexes:[{fields:['status','updatedAt']}]});
