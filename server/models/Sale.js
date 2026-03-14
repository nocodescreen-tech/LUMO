const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  montantTotal: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  methodePaiement: {
    type: DataTypes.STRING,
    defaultValue: 'Espèces'
  },
  statut: {
    type: DataTypes.ENUM('Payé', 'En attente', 'Annulé'),
    defaultValue: 'Payé'
  },
  clientInfo: {
    type: DataTypes.JSONB // Pour stocker les infos du client si non enregistré
  },
  items: {
    type: DataTypes.JSONB // Liste des produits vendus (id, nom, prix, quantite)
  }
});

module.exports = Sale;
