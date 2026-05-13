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
        allowNull: true
    },
    numeroFacture: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    articles: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    montantTotal: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0
    },
    statut: {
        type: DataTypes.STRING,
        defaultValue: 'Payé'
    },
    devise: {
        type: DataTypes.STRING,
        defaultValue: 'USD'
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['fournisseurId'] },
        { fields: ['createdAt'] },
        { fields: ['statut'] }
    ]
});

module.exports = Purchase;
