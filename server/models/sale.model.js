const { DataTypes } = require('sequelize');
const { convertCurrency }=require('../utils/currency');
const { sequelize } = require('../config/database');

const Sale = sequelize.define('Sale', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    profitNet: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    methodePaiement: {
        type: DataTypes.STRING,
        defaultValue: 'Especes'
    },
    statut: {
        type: DataTypes.STRING,
        defaultValue: 'Complétée'
    },
    clientInfo: {
        type: DataTypes.JSONB,
        defaultValue: {
            nom: 'Client de passage',
            email: ''
        }
    },
    devise: {
        type: DataTypes.STRING,
        defaultValue: 'USD'
    },
    tauxChange: {
        type: DataTypes.FLOAT,
        defaultValue: 1.0
    },
    devisePaiement: {
        type: DataTypes.STRING,
        defaultValue: 'USD'
    },
    montantRecu: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    sellerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
}, {
    timestamps: true,
    hooks: {
        afterCreate: async (sale, options) => {
            try {
                const Activite = sequelize.models.Activite;
                if (Activite && sale.userId) {
                    const User = sequelize.models.User;
                    let userNom = 'Système';
                    let shopCurrency = 'USD';
                    if (User) {
                        const seller = await User.findByPk(sale.sellerId || sale.userId);
                        const tenant = await User.findByPk(sale.userId);
                        if (seller) {
                            userNom = seller.nom;
                        }
                        if (tenant) {
                            shopCurrency = tenant.entreprise?.devise || 'USD';
                        }
                    }

                    // Calcul de l'équivalent pour la description
                    let description = `Vente #${sale.id}: ${sale.montantTotal} ${sale.devise}`;
                    const altCurrency = sale.devise === 'USD' ? 'CDF' : 'USD';
                    
                    // Récupérer le taux de change de l'entreprise si celui de la vente est invalide (1)
                    let rate = sale.tauxChange;
                    if ((!rate || rate === 1) && User) {
                        const owner = await User.findByPk(sale.userId);
                        rate = owner?.preferences?.exchangeRate || 2800;
                    }
                    
                    let altAmount = 0;
                    if (sale.devise === 'USD') {
                        altAmount = convertCurrency(sale.montantTotal, sale.devise, altCurrency, rate);
                    description += ` (≙ ${altAmount.toLocaleString()} ${altCurrency})`;
                    } else {
                        altAmount = Math.round((sale.montantTotal / (rate || 2800)) * 100) / 100;
                        description += ` (≙ ${altAmount} ${altCurrency})`;
                    }

                    await Activite.create({
                        type: 'VENTE',
                        description,
                        userNom,
                        module: 'Caisse',
                        UserId: sale.sellerId || sale.userId,
                        shopId: sale.userId
                    }, { transaction: options.transaction });
                }
            } catch (err) {}
        },
        afterDestroy: async (sale, options) => {
            try {
                const Activite = sequelize.models.Activite;
                if (Activite && sale.userId) {
                    const User = sequelize.models.User;
                    let userNom = 'Système';
                    if (User) {
                        const seller = await User.findByPk(sale.sellerId || sale.userId);
                        if (seller) userNom = seller.nom;
                    }
                    await Activite.create({
                        type: 'SUPPRESSION_VENTE',
                        description: `Suppression de la vente #${sale.id} (${sale.montantTotal} ${sale.devise})`,
                        userNom,
                        module: 'Caisse',
                        UserId: sale.userId,
                        shopId: sale.userId
                    }, { transaction: options.transaction });
                }
            } catch (err) {}
        }
    },
    indexes: [
        { fields: ['userId'] },
        { fields: ['clientId'] },
        { fields: ['createdAt'] },
        { fields: ['sellerId'] },
        { fields: ['statut'] }
    ],
    paranoid: true
});

module.exports = Sale;
