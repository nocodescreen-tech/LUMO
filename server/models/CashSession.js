const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CashSession = sequelize.define('CashSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  currency:{type:DataTypes.STRING(3),allowNull:true},
  branchKey:{type:DataTypes.INTEGER,allowNull:false,defaultValue:0},
  openedBy:{type:DataTypes.INTEGER,allowNull:true},
  closedBy:{type:DataTypes.INTEGER,allowNull:true},
  openingTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  closingTime: {
    type: DataTypes.DATE
  },
  openingBalance: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false,
    defaultValue: 0
  },
  expectedBalance: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0
  },
  closingBalance: {
    type: DataTypes.DECIMAL(20, 2)
  },
  totalSales: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0
  },
  totalExpenses: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('OPEN', 'CLOSED'),
    defaultValue: 'OPEN'
  },
  note: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { name:'cash_one_open_per_branch',unique:true,fields:['userId','branchKey'],where:{status:'OPEN'} }
  ]
});

module.exports = CashSession;
