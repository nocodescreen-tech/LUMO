const { User } = require('../models');
const { sendResponse } = require('../utils/response');

// Create a sub-user (cashier/manager)
exports.createSubUser = async (req, res) => {
  try {
    const { nom, email, motDePasse, role, telephone, permissions } = req.body;

    // Only allow manager or caissier roles for sub-users
    if (!['manager', 'caissier', 'vendeur'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide pour un sous-utilisateur' });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    let finalPermissions = permissions;
    if (!finalPermissions || finalPermissions.length === 0) {
      if (role === 'manager') {
        finalPermissions = ['products', 'sales', 'clients', 'expenses', 'stats', 'pos', 'cash'];
      } else if (role === 'caissier' || role === 'vendeur') {
        finalPermissions = ['pos', 'sales.add', 'products', 'clients'];
      } else {
        finalPermissions = [];
      }
    }

    const subUser = await User.create({
      nom,
      email,
      motDePasse,
      role,
      telephone,
      permissions: finalPermissions,
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
      return res.status(404).json({ message: 'Sous-utilisateur non trouvé' });
    }

    const { nom, email, role, telephone, isSuspended, permissions } = req.body;
    
    if (role && !['manager', 'caissier', 'vendeur'].includes(role)) {
        return res.status(400).json({ message: 'Rôle invalide' });
    }

    let updateData = { nom, email, role, telephone, isSuspended };

    // Update permissions based on role if role changed and no custom permissions provided
    if (role && role !== subUser.role && (!permissions || permissions.length === 0)) {
        if (role === 'manager') {
            updateData.permissions = ['products', 'sales', 'clients', 'expenses', 'stats', 'pos', 'cash'];
        } else if (role === 'caissier' || role === 'vendeur') {
            updateData.permissions = ['pos', 'sales.add', 'products', 'clients'];
        }
    } else if (permissions !== undefined) {
        updateData.permissions = permissions;
    }

    await subUser.update(updateData);
    sendResponse(res, 200, subUser, 'Membre d’équipe mis à jour');
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
      return res.status(404).json({ message: 'Sous-utilisateur non trouvé' });
    }

    await subUser.destroy();
    sendResponse(res, 200, null, 'Membre d’équipe supprimé');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
