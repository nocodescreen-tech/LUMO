const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  prix: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  prixAchat: {
    type: DataTypes.DECIMAL(20, 2)
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  stockAlerte: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  categorie: {
    type: DataTypes.STRING
  },
  codeBarre: {
    type: DataTypes.STRING,
    unique: true
  },
  image: {
    type: DataTypes.STRING
  },
  unite: {
    type: DataTypes.STRING,
    defaultValue: 'pcs'
  },
  devise: {
    type: DataTypes.STRING,
    defaultValue: 'CDF'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  taxe: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
});

module.exports = Product;
