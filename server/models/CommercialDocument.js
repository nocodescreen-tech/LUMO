const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
const int=(nullable=false)=>({type:D.INTEGER,allowNull:nullable});
const str=(n,nullable=false)=>({type:D.STRING(n),allowNull:nullable});
const CommercialDocument=sequelize.define('CommercialDocument',{
 userId:int(),actorId:int(),type:str(16),number:str(32),status:str(24),clientId:int(true),saleId:int(true),quoteId:int(true),warehouseId:int(true),currency:str(3),rate:{type:D.DECIMAL(20,8),allowNull:false},total:{type:D.DECIMAL(20,2),allowNull:false},lines:{type:D.JSONB,allowNull:false},customer:{type:D.JSONB,allowNull:false},issuer:{type:D.JSONB,allowNull:false},validUntil:{type:D.DATEONLY,allowNull:true},note:{type:D.TEXT,allowNull:true}
},{indexes:[{unique:true,fields:['userId','number']},{fields:['userId','type','createdAt']}]});
const DocumentEvent=sequelize.define('DocumentEvent',{userId:int(),documentId:int(),actorId:int(),kind:str(24),note:{type:D.TEXT,allowNull:false}},{updatedAt:false,indexes:[{fields:['userId','documentId','id']}]});
const DocumentSequence=sequelize.define('DocumentSequence',{userId:int(),type:str(16),year:int(),lastNumber:int()},{indexes:[{unique:true,fields:['userId','type','year']}]});
module.exports={CommercialDocument,DocumentEvent,DocumentSequence};
