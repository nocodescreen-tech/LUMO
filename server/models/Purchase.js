const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numeroFacture: {
    type: DataTypes.STRING,
    allowNull: false
  },
  montantTotal: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  fournisseurNom: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  statut: {
    type: DataTypes.STRING,
    defaultValue: 'Payé'
  }
});

module.exports = Purchase;
