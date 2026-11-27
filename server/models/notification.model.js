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
    category:{type:DataTypes.STRING(32),allowNull:true},
    dedupeKey:{type:DataTypes.STRING(160),allowNull:true},
    targetPath:{type:DataTypes.STRING(80),allowNull:true},
    archivedAt:{type:DataTypes.DATE,allowNull:true},
    lu: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    hooks: {
        afterCreate: (notification, options) => {
            const emit = () => {
            try {
                if (global.io) {
                    global.io.to(`user_${notification.userId}`).emit('notification', {refresh:true});
                }
            } catch (err) {
                console.error('Socket.io notification error:', err);
            }
            };
            if (options.transaction) options.transaction.afterCommit(emit); else emit();
        }
    },
    indexes: [
        { fields: ['userId'] },
        { fields: ['lu'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = Notification;
