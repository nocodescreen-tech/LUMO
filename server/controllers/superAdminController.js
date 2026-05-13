const { User, Sale, Depense, Product, Notification, Purchase, Newsletter, GlobalSetting, Activite } = require('../models');
const Joi = require('joi');

// Liste des utilisateurs / instances
const getSuperadminUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Retourner tous les logs d'activité réels
const getSuperadminLogs = async (req, res, next) => {
  try {
    const logs = await Activite.findAll({ 
        order: [['createdAt', 'DESC']],
        limit: 500
    });
    
    // Format pour SuperAdminDashboard (qui s'attend à { id, action, description, userId, createdAt })
    const formattedLogs = logs.map(l => ({
        id: l.id,
        action: l.type,
        description: l.description,
        userId: l.UserId,
        createdAt: l.createdAt
    }));
    
    res.json(formattedLogs);
  } catch (error) {
    next(error);
  }
};

// Statistiques globales
const getSuperadminStats = async (req, res, next) => {
  try {
    const startTs = Date.now();
    const [revenueRows, expensesRows, purchaseRows, counts, usersForAi] = await Promise.all([
      Sale.findAll(),
      Depense.findAll(),
      Purchase.findAll(),
      Promise.all([
        User.count(),
        Product.count(),
        Activite.count(),
      ]),
      User.findAll({ attributes: ['chatHistory'] })
    ]);

    const totalRevenue = revenueRows.reduce((acc, s) => {
      const amount = s.montantTotal || 0;
      const rate = s.tauxChange || 2800;
      return acc + (s.devise === 'CDF' ? amount / rate : amount);
    }, 0);

    const totalExpenses = expensesRows.reduce((acc, e) => {
      const amount = e.montant || 0;
      const rate = e.tauxChange || 2800;
      return acc + (e.devise === 'CDF' ? amount / rate : amount);
    }, 0);

    const totalPurchases = purchaseRows.reduce((acc, p) => {
      const amount = p.montantTotal || 0;
      const rate = p.tauxChange || 2800;
      return acc + (p.devise === 'CDF' ? amount / rate : amount);
    }, 0);
    
    // Calcul réel de l'utilisation de l'IA (messages échangés)
    let totalAiMessages = 0;
    usersForAi.forEach(u => {
        if (u.chatHistory && Array.isArray(u.chatHistory)) {
            totalAiMessages += u.chatHistory.length;
        }
    });

    // Dynamically calculate API costs from expenses categorized as 'API' or 'Maintenance'
    let apiCosts = expensesRows
      .filter(e => e.categorie?.toLowerCase() === 'api' || e.categorie?.toLowerCase() === 'maintenance')
      .reduce((acc, e) => acc + (e.montant || 0), 0);
      
    // Si pas de dépense API déclarée, on estime via le nombre de requêtes IA (ex: 0.0015$ par message)
    if (apiCosts === 0 && totalAiMessages > 0) {
        apiCosts = parseFloat((totalAiMessages * 0.0015).toFixed(2));
    }

    const [usersCount, productsCount, activityCount] = counts;

    // Calcul de l'uptime du serveur Node.js
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor(uptimeSeconds % (3600 * 24) / 3600);
    const uptimeStr = days > 0 ? `${days}j ${hours}h` : `${hours}h ${Math.floor(uptimeSeconds % 3600 / 60)}m`;

    // Metrics Système
    const os = require('os');
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
    
    const cpuLoad = os.loadavg(); // [1, 5, 15] minute averages

    res.json({
      revenue: { total: totalRevenue },
      purchases: { total: totalPurchases },
      expenses: { total: totalExpenses },
      aiUsage: totalAiMessages,
      apiCosts: apiCosts,
      uptime: uptimeStr,
      latency: `${Date.now() - startTs}ms`,
      system: {
        memory: `${(usedMem / 1024 / 1024 / 1024).toFixed(2)}GB / ${(totalMem / 1024 / 1024 / 1024).toFixed(2)}GB`,
        memPercent: memUsagePercent,
        cpuLoad: cpuLoad[0].toFixed(2),
        nodeVersion: process.version,
        platform: os.platform()
      },
      counts: {
        users: usersCount,
        products: productsCount,
        activities: activityCount
      },
    });
  } catch (error) {
    next(error);
  }
};

// Suspendre ou réactiver un utilisateur
const suspendUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    // Sécurité: Empêcher la suspension du SuperAdmin
    if (user.role === 'superadmin') {
      return res.status(403).json({ message: 'Action interdite : Le SuperAdmin ne peut pas être suspendu.' });
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.json({ 
      message: `Utilisateur ${user.isSuspended ? 'suspendu' : 'réactivé'} avec succès`, 
      isSuspended: user.isSuspended 
    });
  } catch (error) {
    next(error);
  }
};

// Valider un utilisateur
const validateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    user.isAdminValidated = true;
    await user.save();

    res.json({ message: 'Compte utilisateur validé avec succès' });
  } catch (error) {
    next(error);
  }
};

// Supprimer un utilisateur définitivement
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    // Sécurité: Empêcher la suppression du SuperAdmin
    if (user.role === 'superadmin') {
      return res.status(403).json({ message: 'Action interdite : Le compte SuperAdmin est protégé et ne peut pas être supprimé.' });
    }

    await user.destroy();
    res.json({ message: 'Utilisateur supprimé définitivement' });
  } catch (error) {
    next(error);
  }
};

// Broadcast de notification système
const broadcastNotification = async (req, res, next) => {
  try {
    const { titre, message, type } = req.body;
    if (!titre || !message) return res.status(400).json({ message: 'Titre et message requis' });

    const users = await User.findAll({ attributes: ['id'] });
    
    const notifications = users.map(u => ({
      userId: u.id,
      titre,
      contenu: message,
      type: type || 'INFO',
      lu: false
    }));

    await Notification.bulkCreate(notifications);
    res.status(200).json({ message: `Notification envoyée à ${users.length} utilisateurs` });
  } catch (error) {
    next(error);
  }
};

// Valider l'email d'un utilisateur manuellement
const verifyUserEmail = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    user.isVerified = true;
    await user.save();

    res.json({ message: 'Email utilisateur marqué comme vérifié' });
  } catch (error) {
    next(error);
  }
};

const getNewsletterSubscribers = async (req, res, next) => {
  try {
    const subscribers = await Newsletter.findAll({ order: [['createdAt', 'DESC']] });
    res.json(subscribers);
  } catch (error) {
    next(error);
  }
};

// Impersonation (Se connecter en tant que)
const jwt = require('jsonwebtoken');

const impersonateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (user.role === 'superadmin') return res.status(403).json({ message: 'Impossible d\'usurper un autre SuperAdmin' });

    // Generate token for the target user
    const token = jwt.sign(
      { id: user.id, isImpersonating: true, originalAdminId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Short expiration for impersonation
    );

    // Log the action
    await Activite.create({
      type: 'SECURITY',
      description: `SuperAdmin (ID: ${req.user.id}) s'est connecté en tant que ${user.email}`,
      UserId: req.user.id,
      entrepriseId: req.user.tenantId || req.user.id
    });

    res.json({
      message: `Connexion réussie en tant que ${user.nom}`,
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        entreprise: user.entreprise,
        preferences: user.preferences,
        isImpersonating: true
      }
    });
  } catch (error) {
    next(error);
  }
};

const getGlobalSettings = async (req, res, next) => {
  try {
    const settings = await GlobalSetting.findAll();
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

const updateGlobalSetting = async (req, res, next) => {
  try {
    const schema = Joi.object({
      key: Joi.string().required().messages({
        'string.empty': 'La clé est requise',
        'any.required': 'La clé est requise'
      }),
      value: Joi.string().allow('', null).required().messages({
        'any.required': 'La valeur est requise'
      })
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { key, value } = req.body;

    const [setting, created] = await GlobalSetting.findOrCreate({
      where: { key },
      defaults: { key, value }
    });

    if (!created) {
      setting.value = value;
      await setting.save();
    }

    res.json({ message: 'Paramètre mis à jour', setting });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuperadminUsers,
  getSuperadminLogs,
  getSuperadminStats,
  broadcastNotification,
  suspendUser,
  validateUser,
  deleteUser,
  verifyUserEmail,
  getNewsletterSubscribers,
  getGlobalSettings,
  updateGlobalSetting,
  impersonateUser
};
