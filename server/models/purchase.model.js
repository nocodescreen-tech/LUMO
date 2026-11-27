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
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0.0
    },
    tauxChange:{type:DataTypes.DECIMAL(20,8),allowNull:true},
    warehouseId:{type:DataTypes.INTEGER,allowNull:true},
    accountingCurrency:{type:DataTypes.STRING(3),allowNull:true},
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
