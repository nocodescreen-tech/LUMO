const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING
  },
  telephone: {
    type: DataTypes.STRING
  },
  adresse: {
    type: DataTypes.TEXT
  },
  detteTotale: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0
  },
  pointsFidelite: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = Client;
