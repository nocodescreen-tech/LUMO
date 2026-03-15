const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    titre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contenu: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'INFO'
    },
    lu: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true
});

module.exports = Notification;
