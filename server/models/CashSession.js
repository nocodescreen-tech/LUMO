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
    { fields: ['status'] }
  ]
});

module.exports = CashSession;
