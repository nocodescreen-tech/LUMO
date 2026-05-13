const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  note: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 }
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  module: {
    type: DataTypes.STRING,
    allowNull: true, // ex: 'Ventes', 'Stocks', 'IA'
  },
  statut: {
    type: DataTypes.STRING,
    defaultValue: 'NEW', // NEW, READ, FIXED
  }
}, {
  timestamps: true,
});

module.exports = Feedback;
