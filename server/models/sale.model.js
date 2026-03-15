const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sale = sequelize.define('Sale', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    clientId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    articles: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
    },
    montantTotal: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0
    },
    remise: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    methodePaiement: {
        type: DataTypes.STRING,
        defaultValue: 'Especes'
    },
    clientInfo: {
        type: DataTypes.JSONB,
        defaultValue: {
            nom: 'Client de passage',
            email: ''
        }
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['userId'] }
    ]
});

module.exports = Sale;
