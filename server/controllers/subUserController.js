const {
  User,
  Sale,
  Product,
  Client,
  Fournisseur,
  Purchase,
  Activite,
  StockMovement,
  CashSession,
  StaffPayment,
  Feedback,
  Notification,
} = require('../models');
const { sequelize } = require('../config/database');
const { sendResponse } = require('../utils/response');

// ─── Rôles autorisés pour membres ──────────────────────
const VALID_ROLES = ['manager', 'caissier', 'vendeur', 'inventoriste', 'superviseur', 'gerant'];

// Permissions officiellement supportées (backend whitelist)
const VALID_PERMISSIONS = new Set([
  'pos', 'sales.add', 'sales.refund', 'sales.edit', 'sales.delete', 'sales.export', 'sales',
  'products', 'products.add', 'products.edit', 'products.delete', 'products.import', 'products.export', 'products.view_purchase_price',
  'clients', 'clients.add', 'clients.edit', 'clients.delete', 'clients.settle_debt', 'clients.send_reminder',
  'suppliers', 'suppliers.add', 'suppliers.edit', 'suppliers.delete',
  'purchases', 'purchases.add', 'purchases.edit', 'purchases.delete', 'purchases.refund',
  'stock-history', 'stock-history.view', 'stock-history.export',
  'cash', 'cash.open', 'cash.close', 'cash.view', 'cash.delete_session',
  'debts', 'debts.settle', 'debts.delete', 'debts.send_reminder',
  'stats', 'activities',
  'settings', 'settings.view', 'settings.edit', 'settings.profile', 'settings.appearance', 'settings.exchange_rate',
  'team', 'team.add', 'team.edit', 'team.delete', 'team.view_activity'
]);

const sanitizePermissions = (permissions = []) => {
  if (!Array.isArray(permissions)) return [];
  return [...new Set(permissions.filter((p) => VALID_PERMISSIONS.has(String(p))))];
};

// Create a sub-user (cashier/manager)
exports.createSubUser = async (req, res) => {
  try {
    const { nom, email, motDePasse, role, telephone, permissions, limits } = req.body;

    // Only allow valid roles for sub-users
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide pour un membre. Rôles valides: ' + VALID_ROLES.join(', ') });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const finalPermissions = sanitizePermissions(permissions);
    if (!finalPermissions || finalPermissions.length === 0) {
      return res.status(400).json({ message: "Sélectionnez au moins une permission pour créer un membre." });
    }

    const subUser = await User.create({
      nom,
      email,
      motDePasse,
      role,
      telephone,
      permissions: finalPermissions,
      limits: limits || {},
      parentId: req.tenantId, // Use the resolved tenantId from middleware
      entreprise: req.user.entreprise,
      typeActivite: req.user.typeActivite,
      isAdminValidated: true,
      isVerified: true
    });

    sendResponse(res, 201, subUser, 'Membre d’équipe créé avec succès');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all sub-users for the current admin
exports.getSubUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where: { parentId: req.tenantId },
      attributes: { exclude: ['motDePasse'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    sendResponse(res, 200, rows, 'Membres récupérés', {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a sub-user
exports.updateSubUser = async (req, res) => {
  try {
    const subUser = await User.findOne({
      where: { id: req.params.id, parentId: req.user.tenantId }
    });

    if (!subUser) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    const { nom, email, role, telephone, isSuspended, permissions, limits, suspendUntil, suspendReason } = req.body;

    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide. Rôles valides: ' + VALID_ROLES.join(', ') });
    }

    let updateData = { nom, email, role, telephone, isSuspended };

    // Support suspension scheduling
    if (suspendUntil !== undefined) updateData.suspendUntil = suspendUntil;
    if (suspendReason !== undefined) updateData.suspendReason = suspendReason;
    if (limits !== undefined) updateData.limits = limits;

    // Aucune permission par défaut: l'éditeur décide explicitement
    if (permissions !== undefined) {
      const sanitized = sanitizePermissions(permissions);
      if (sanitized.length === 0) {
        return res.status(400).json({ message: "Un membre doit garder au moins une permission." });
      }
      updateData.permissions = sanitized;
    }

    await subUser.update(updateData);
    sendResponse(res, 200, subUser, 'Membre d’équipe mis à jour');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get activity log for a specific sub-user
exports.getSubUserActivity = async (req, res) => {
  try {
    const subUser = await User.findOne({
      where: { id: req.params.id, parentId: req.user.tenantId }
    });
    if (!subUser) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    const activities = await Activite.findAll({
      where: { UserId: subUser.id },
      order: [['createdAt', 'DESC']],
      limit: 20,
      attributes: ['id', 'type', 'description', 'createdAt', 'module', 'source']
    });

    res.set('Cache-Control', 'no-store');
    sendResponse(res, 200, activities, 'Activités récupérées');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a sub-user
exports.deleteSubUser = async (req, res) => {
  try {
    const subUser = await User.findOne({
      where: { id: req.params.id, parentId: req.user.tenantId }
    });

    if (!subUser) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    await sequelize.transaction(async (transaction) => {
      await Promise.all([
        StockMovement.destroy({ where: { userId: subUser.id }, transaction }),
        Sale.destroy({ where: { userId: subUser.id }, force: true, transaction }),
        Sale.update({ sellerId: null }, { where: { sellerId: subUser.id }, transaction }),
        Purchase.destroy({ where: { userId: subUser.id }, transaction }),
        CashSession.destroy({ where: { userId: subUser.id }, transaction }),
        Activite.update({ UserId: null }, { where: { UserId: subUser.id }, transaction }),
        StaffPayment.destroy({ where: { userId: subUser.id }, transaction }),
        StaffPayment.destroy({ where: { staffId: subUser.id }, transaction }),
        Feedback.destroy({ where: { userId: subUser.id }, transaction }),
        Notification.destroy({ where: { userId: subUser.id }, transaction }),
      ]);

      await Promise.all([
        Product.update({ creatorId: null }, { where: { creatorId: subUser.id }, transaction }),
        Product.destroy({ where: { userId: subUser.id }, force: true, transaction }),
        Client.destroy({ where: { userId: subUser.id }, force: true, transaction }),
        Fournisseur.destroy({ where: { userId: subUser.id }, transaction }),
      ]);

      await subUser.destroy({ transaction });
    });
    sendResponse(res, 200, null, 'Membre d’équipe supprimé');
  } catch (error) {
    const message = error.name === 'SequelizeForeignKeyConstraintError'
      ? 'Impossible de supprimer ce membre car des donnees liees existent encore.'
      : error.message;
    res.status(500).json({ success: false, message });
  }
};
