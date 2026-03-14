const User = require('./User');
const Product = require('./Product');
const Client = require('./Client');
const Fournisseur = require('./Fournisseur');
const Depense = require('./Depense');
const Sale = require('./Sale');
const Purchase = require('./Purchase');

// Associations
Sale.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Client.hasMany(Sale, { foreignKey: 'clientId' });

Purchase.belongsTo(Fournisseur, { foreignKey: 'fournisseurId', as: 'fournisseur' });
Fournisseur.hasMany(Purchase, { foreignKey: 'fournisseurId' });

module.exports = {
  User,
  Product,
  Client,
  Fournisseur,
  Depense,
  Sale,
  Purchase
};
