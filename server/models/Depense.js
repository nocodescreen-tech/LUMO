const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Depense = sequelize.define('Depense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  montant: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  categorie: {
    type: DataTypes.STRING,
    defaultValue: 'Autres'
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  description: {
    type: DataTypes.TEXT
  },
  devise: {
    type: DataTypes.STRING,
    defaultValue: 'CDF'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  indexes: [
    { fields: ['userId'] },
    { fields: ['date'] },
    { fields: ['categorie'] }
  ]
});

module.exports = Depense;
