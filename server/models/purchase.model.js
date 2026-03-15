const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Purchase = sequelize.define('Purchase', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fournisseurId: {
        type: DataTypes.INTEGER,
        allowNull: false // Facture doit provenir d'un fournisseur
    },
    numeroFacture: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    montantTotal: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0
    },
    statut: {
        type: DataTypes.STRING,
        defaultValue: 'Payé'
    }
}, {
    timestamps: true
});

module.exports = Purchase;
