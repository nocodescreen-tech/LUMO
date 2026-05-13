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
    timestamps: true,
    hooks: {
        afterCreate: (notification) => {
            try {
                if (global.io) {
                    const data = notification.get({ plain: true });
                    global.io.to(`user_${notification.userId}`).emit('notification', data);
                }
            } catch (err) {
                console.error('Socket.io notification error:', err);
            }
        }
    },
    indexes: [
        { fields: ['userId'] },
        { fields: ['lu'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = Notification;
