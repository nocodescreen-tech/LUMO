const {DataTypes:D}=require('sequelize');
const {sequelize}=require('../config/database');
const int=(allowNull=false)=>({type:D.INTEGER,allowNull});
const WarehouseBalance=sequelize.define('WarehouseBalance',{userId:int(),organizationId:int(),warehouseId:int(),productId:int(),quantity:{...int(),defaultValue:0}},{indexes:[{unique:true,fields:['warehouseId','productId']},{fields:['userId','productId']}]});
const InventoryTransfer=sequelize.define('InventoryTransfer',{userId:int(),actorId:int(),productId:int(),fromWarehouseId:int(true),toWarehouseId:int(true),quantity:int(),reason:{type:D.STRING(250),allowNull:false}},{updatedAt:false,indexes:[{fields:['userId','createdAt']}]});
module.exports={WarehouseBalance,InventoryTransfer};
