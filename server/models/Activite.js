const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Activite = sequelize.define('Activite', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Ex: VENTE, CONNEXION, SUPPRESSION_PRODUIT'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    module: {
        type: DataTypes.STRING,
        defaultValue: 'Système',
        comment: 'Ex: Caisse, Inventaire, Admin'
    },
    userNom: {
        type: DataTypes.STRING,
        defaultValue: 'Système'
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    shopId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID du tenant (propriétaire de la boutique)'
    },
    source: {
        type: DataTypes.STRING,
        defaultValue: 'System',
        comment: 'IP address or System'
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['UserId'] },
        { fields: ['shopId'] },
        { fields: ['type'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = Activite;
