const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  prix: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  prixAchat: {
    type: DataTypes.DECIMAL(20, 2),
    validate: {
      min: 0
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  stockAlerte: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  categorie: {
    type: DataTypes.STRING
  },
  codeBarre: {
    type: DataTypes.STRING,
    unique: true
  },
  image: {
    type: DataTypes.STRING
  },
  unite: {
    type: DataTypes.STRING,
    defaultValue: 'pcs'
  },
  devise: {
    type: DataTypes.STRING,
    defaultValue: 'CDF',
    validate: {
      isIn: [['USD', 'CDF']]
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  taxe: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  variantes: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  hooks: {
    afterCreate: async (product, options) => {
      try {
        const Activite = sequelize.models.Activite;
        if (Activite && product.userId) {
          const User = sequelize.models.User;
          let userNom = 'Système';
          if (User) {
             const user = await User.findByPk(product.creatorId || product.userId);
             if (user) userNom = user.nom;
          }
          await Activite.create({
             type: 'CREATION_PRODUIT',
             description: `Création du produit: ${product.nom} (${product.stock} unités)`,
             userNom,
             module: 'Inventaire',
             UserId: product.creatorId || product.userId,
             shopId: product.userId
          }, { transaction: options.transaction });
        }
      } catch (err) {}
    },
    afterDestroy: async (product, options) => {
      try {
        const Activite = sequelize.models.Activite;
        if (Activite && product.userId) {
          const User = sequelize.models.User;
          let userNom = 'Système';
          if (User) {
             const user = await User.findByPk(product.userId);
             if (user) userNom = user.nom;
          }
          await Activite.create({
             type: 'SUPPRESSION_PRODUIT',
             description: `Suppression du produit: ${product.nom}`,
             userNom,
             module: 'Inventaire',
             UserId: product.userId,
             shopId: product.userId
          }, { transaction: options.transaction });
        }
      } catch (err) {}
    },
    afterSave: async (product, options) => {
      // Create stock movement history only if stock was actually changed
      if (product.changed('stock')) {
        // If it's a new product, previous value is undefined, so we use 0
        const isNewRecord = options.isNewRecord || false;
        const ancienStock = isNewRecord ? 0 : (product.previous('stock') || 0);
        const nouveauStock = product.stock;
        const difference = nouveauStock - ancienStock;
        
        if (difference !== 0) {
          const StockMovement = sequelize.models.StockMovement;
          if (StockMovement) {
            await StockMovement.create({
              productId: product.id,
              userId: product.userId,
              type: difference > 0 ? 'ENTREE' : 'SORTIE',
              quantite: Math.abs(difference),
              ancienStock,
              nouveauStock,
              raison: product.stockUpdateRaison || (isNewRecord ? 'Initialisation' : 'Ajustement')
            }, { transaction: options.transaction });
          }

          // Déclenchement automatique de la notification si stock faible (seulement lors du passage sous le seuil)
          const alertLevel = product.stockAlerte || 5;
          if (nouveauStock < alertLevel && ancienStock >= alertLevel) {
            const Notification = sequelize.models.Notification;
            if (Notification) {
              await Notification.create({
                userId: product.userId,
                titre: 'Stock Faible',
                contenu: `Alerte: Le stock pour "${product.nom}" est passé sous le seuil (${nouveauStock} restants).`,
                type: 'WARNING'
              }, { transaction: options.transaction });
            }
          }

          // Notification pour l'ajout de stock (ENTREE)
          if (difference > 0 && !isNewRecord) {
            const Notification = sequelize.models.Notification;
            if (Notification) {
              await Notification.create({
                userId: product.userId,
                titre: 'Stock Approvisionné',
                contenu: `Le stock de "${product.nom}" a été augmenté de +${difference}. Nouveau stock: ${nouveauStock}.`,
                type: 'INFO'
              }, { transaction: options.transaction });
            }
          }

          // Notification pour la création d'un nouveau produit
          if (isNewRecord) {
            const Notification = sequelize.models.Notification;
            if (Notification) {
              await Notification.create({
                userId: product.userId,
                titre: 'Nouveau Produit',
                contenu: `Le produit "${product.nom}" a été ajouté avec un stock initial de ${nouveauStock}.`,
                type: 'SUCCESS'
              }, { transaction: options.transaction });
            }
          }
        }
      }
    }
  },
  indexes: [
    { fields: ['userId'] },
    { fields: ['codeBarre'] },
    { fields: ['nom'] },
    { fields: ['categorie'] }
  ],
  paranoid: true
});

module.exports = Product;
