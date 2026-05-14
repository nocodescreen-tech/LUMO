const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StaffPayment = sequelize.define('StaffPayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  staffId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'The ID of the staff member (User) being paid'
  },
  amount: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  devise: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  type: {
    type: DataTypes.ENUM('SALAIRE', 'TRANSPORT', 'PRIME', 'AUTRE'),
    defaultValue: 'SALAIRE'
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  note: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['staffId'] },
    { fields: ['type'] }
  ]
});

module.exports = StaffPayment;
