const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockMovement = sequelize.define('StockMovement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('ENTREE', 'SORTIE', 'AJUSTEMENT'),
    allowNull: false
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ancienStock: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nouveauStock: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  raison: {
    type: DataTypes.STRING,
    defaultValue: 'Ajustement'
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['productId'] },
    { fields: ['userId'] }
  ]
});

module.exports = StockMovement;
