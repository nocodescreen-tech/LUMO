const User = require('./User');
const Product = require('./Product');
const Client = require('./Client');
const Fournisseur = require('./Fournisseur');
const Sale = require('./sale.model');
const Purchase = require('./purchase.model');
const Notification = require('./notification.model');
const Activite = require('./Activite');
const Newsletter = require('./Newsletter');
const GlobalSetting = require('./GlobalSetting');
const StockMovement = require('./StockMovement');
const CashSession = require('./CashSession');
const Feedback = require('./Feedback');
const StaffPayment = require('./StaffPayment');
const Depense=require('./Depense');
const JournalEntry=require('./JournalEntry');
const OperationReceipt=require('./OperationReceipt');
const workspace=require('./Workspace');
const support=require('./Support');
const PlatformIncident=require('./PlatformIncident');
const BackupRun=require('./BackupRun');
const inventory=require('./Inventory');
const repair=require('./Repair');

// Associations
Product.hasMany(StockMovement, { foreignKey: 'productId', as: 'historiqueStock' });
StockMovement.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Sale.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Client.hasMany(Sale, { foreignKey: 'clientId' });

Purchase.belongsTo(Fournisseur, { foreignKey: 'fournisseurId', as: 'fournisseur' });
Fournisseur.hasMany(Purchase, { foreignKey: 'fournisseurId' });

// A8 Fix: FK constraints for Sale and Purchase to User
Sale.belongsTo(User, { foreignKey: 'userId', as: 'proprietaire' });
User.hasMany(Sale, { foreignKey: 'userId' });
Sale.belongsTo(User, { foreignKey: 'sellerId', as: 'vendeur' });
User.hasMany(Sale, { foreignKey: 'sellerId' });

Purchase.belongsTo(User, { foreignKey: 'userId', as: 'acheteur' });
User.hasMany(Purchase, { foreignKey: 'userId' });

Activite.belongsTo(User, { foreignKey: 'UserId', as: 'user' });
User.hasMany(Activite, { foreignKey: 'UserId' });

CashSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(CashSession, { foreignKey: 'userId' });

Feedback.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Feedback, { foreignKey: 'userId' });

StaffPayment.belongsTo(User, { foreignKey: 'staffId', as: 'member' });
User.hasMany(StaffPayment, { foreignKey: 'staffId', as: 'payments' });

module.exports = {
  User,
  Product,
  Client,
  Fournisseur,
  Sale,
  Purchase,
  Notification,
  Activite,
  Newsletter,
  GlobalSetting,
  StockMovement,
  CashSession,
  Feedback,
  StaffPayment, Depense, JournalEntry, OperationReceipt, ...workspace, ...support, PlatformIncident, BackupRun, ...inventory, ...repair
};
