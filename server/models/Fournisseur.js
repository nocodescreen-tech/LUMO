const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Fournisseur = sequelize.define('Fournisseur', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  entreprise: {
    type: DataTypes.STRING,
    allowNull: false
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
  categorie: {
    type: DataTypes.STRING
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = Fournisseur;
