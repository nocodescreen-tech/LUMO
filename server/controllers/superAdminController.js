const {
  User,
  Sale,
  Product,
  Client,
  Fournisseur,
  Notification,
  Purchase,
  Newsletter,
  GlobalSetting,
  Activite,
  StockMovement,
  CashSession,
  Feedback,
  StaffPayment,
} = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const Joi = require('joi');

const unlinkAndDeleteStaffUsers = async (staffIds, transaction) => {
  const ids = staffIds.filter(Boolean);
  if (ids.length === 0) return;

  await Promise.all([
    StockMovement.destroy({ where: { userId: { [Op.in]: ids } }, transaction }),
    Sale.destroy({ where: { userId: { [Op.in]: ids } }, force: true, transaction }),
    Sale.update({ sellerId: null }, { where: { sellerId: { [Op.in]: ids } }, transaction }),
    Purchase.destroy({ where: { userId: { [Op.in]: ids } }, transaction }),
    CashSession.destroy({ where: { userId: { [Op.in]: ids } }, transaction }),
    Activite.update({ UserId: null }, { where: { UserId: { [Op.in]: ids } }, transaction }),
    StaffPayment.destroy({ where: { userId: { [Op.in]: ids } }, transaction }),
    StaffPayment.destroy({ where: { staffId: { [Op.in]: ids } }, transaction }),
    Feedback.destroy({ where: { userId: { [Op.in]: ids } }, transaction }),
    Notification.destroy({ where: { userId: { [Op.in]: ids } }, transaction }),
  ]);

  await Promise.all([
    Product.update({ creatorId: null }, { where: { creatorId: { [Op.in]: ids } }, transaction }),
    Product.destroy({ where: { userId: { [Op.in]: ids } }, force: true, transaction }),
    Client.destroy({ where: { userId: { [Op.in]: ids } }, force: true, transaction }),
    Fournisseur.destroy({ where: { userId: { [Op.in]: ids } }, transaction }),
  ]);

  await User.destroy({ where: { id: { [Op.in]: ids } }, transaction });
};

const deleteTenantData = async (tenantId, transaction) => {
  const subUsers = await User.findAll({
    where: { parentId: tenantId },
    attributes: ['id'],
    transaction,
  });
  const subUserIds = subUsers.map((u) => u.id);
  const allUserIds = [tenantId, ...subUserIds];

  await unlinkAndDeleteStaffUsers(subUserIds, transaction);

  await Promise.all([
    StockMovement.destroy({ where: { userId: { [Op.in]: allUserIds } }, transaction }),
    Sale.destroy({ where: { userId: { [Op.in]: allUserIds } }, force: true, transaction }),
    Sale.update({ sellerId: null }, { where: { sellerId: { [Op.in]: allUserIds } }, transaction }),
    Purchase.destroy({ where: { userId: { [Op.in]: allUserIds } }, transaction }),
    CashSession.destroy({ where: { userId: { [Op.in]: allUserIds } }, transaction }),
    StaffPayment.destroy({ where: { userId: { [Op.in]: allUserIds } }, transaction }),
    StaffPayment.destroy({ where: { staffId: { [Op.in]: allUserIds } }, transaction }),
    Notification.destroy({ where: { userId: { [Op.in]: allUserIds } }, transaction }),
    Feedback.destroy({ where: { userId: { [Op.in]: allUserIds } }, transaction }),
  ]);

  await Promise.all([
    Product.update({ creatorId: null }, { where: { creatorId: { [Op.in]: allUserIds } }, transaction }),
    Product.destroy({ where: { userId: { [Op.in]: allUserIds } }, force: true, transaction }),
    Client.destroy({ where: { userId: { [Op.in]: allUserIds } }, force: true, transaction }),
    Fournisseur.destroy({ where: { userId: { [Op.in]: allUserIds } }, transaction }),
  ]);

  await Activite.destroy({
    where: {
      [Op.or]: [
        { UserId: { [Op.in]: allUserIds } },
        { shopId: tenantId },
      ],
    },
    transaction,
  });
};

// Liste des utilisateurs / instances
const getSuperadminUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({attributes:['id','nom','email','role','parentId','isVerified','isAdminValidated','isSuspended','createdAt','lastActivity','typeActivite'],order:[['createdAt','DESC']],limit:1000});
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
    const [revenueRows, purchaseRows, counts, usersForAi, landingVisits, landingMessages, usersRates] = await Promise.all([
      Sale.findAll(),
      Purchase.findAll(),
      Promise.all([
        User.count(),
        Product.count(),
        Activite.count(),
      ]),
      User.findAll({ attributes: ['chatHistory'] }),
      Activite.count({ where: { type: 'LANDING_VISIT' } }),
      Activite.count({ where: { type: 'LANDING_MESSAGE' } }),
      User.findAll({ attributes: ['id', 'preferences', 'entreprise'] })
    ]);

    const ratesByUser = new Map();
    usersRates.forEach((u) => {
      const prefRate = Number(u?.preferences?.exchangeRate);
      const companyRate = Number(u?.entreprise?.exchangeRate);
      const rate = Number.isFinite(prefRate) && prefRate > 1
        ? prefRate
        : (Number.isFinite(companyRate) && companyRate > 1 ? companyRate : 2800);
      ratesByUser.set(Number(u.id), rate);
    });

    const getUserRate = (userId) => ratesByUser.get(Number(userId)) || 2800;

    const toUsd = (amount, devise, rate) => {
      const safeAmount = Number(amount || 0);
      const safeRate = Number.isFinite(Number(rate)) && Number(rate) > 1 ? Number(rate) : 2800;
      return devise === 'CDF' ? safeAmount / safeRate : safeAmount;
    };

    const totalRevenue = revenueRows.reduce((acc, s) => {
      const amount = s.montantTotal || 0;
      const rate = Number(s.tauxChange) > 1 ? Number(s.tauxChange) : getUserRate(s.userId);
      return acc + toUsd(amount, s.devise, rate);
    }, 0);

    const totalPurchases = purchaseRows.reduce((acc, p) => {
      const amount = p.montantTotal || 0;
      const rate = getUserRate(p.userId);
      return acc + toUsd(amount, p.devise, rate);
    }, 0);
    
    // Calcul réel de l'utilisation de l'IA (messages échangés)
    let totalAiMessages = 0;
    usersForAi.forEach(u => {
        if (u.chatHistory && Array.isArray(u.chatHistory)) {
            totalAiMessages += u.chatHistory.length;
        }
    });

    // Dynamically calculate API costs from expenses categorized as 'API' or 'Maintenance'
    let apiCosts = null;
      
    // Si pas de dépense API déclarée, on estime via le nombre de requêtes IA (ex: 0.0015$ par message)
    // No verified billing or metering provider: do not fabricate API costs.

    const [usersCount, productsCount, activityCount] = counts;

    // Calcul de l'uptime du serveur Node.js
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor(uptimeSeconds % (3600 * 24) / 3600);
    const uptimeStr = days > 0 ? `${days}d ${hours}h` : `${hours}h ${Math.floor(uptimeSeconds % 3600 / 60)}m`;

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
        activities: activityCount,
        landingVisits,
        landingMessages
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

    if(typeof req.body.suspended!=='boolean'||typeof req.body.reason!=='string'||!req.body.reason.trim()||req.body.reason.length>250)return res.status(400).json({message:'État et motif obligatoires'});
    await sequelize.transaction(async transaction=>{const row=await User.findByPk(user.id,{transaction,lock:transaction.LOCK.UPDATE});row.isSuspended=req.body.suspended;if(row.isSuspended)row.activeSessions=[];await row.save({transaction,hooks:false});await require('../models').Activite.create({UserId:req.user.id,shopId:req.user.id,type:'PLATFORM_SUSPENSION',description:'Compte #'+row.id+' : '+req.body.reason,module:'Platform'},{transaction});user.isSuspended=row.isSuspended;});

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

    if(user.role==='superadmin'||!user.isVerified)return res.status(409).json({message:'Vérification email préalable requise'});
    await sequelize.transaction(async transaction=>{await user.update({isAdminValidated:true},{transaction});await Activite.create({UserId:req.user.id,shopId:req.user.id,type:'PLATFORM_VALIDATION',description:'Compte #'+user.id,module:'Platform'},{transaction});});

    res.json({ message: 'Compte utilisateur validé avec succès' });
  } catch (error) {
    next(error);
  }
};

// Supprimer un utilisateur définitivement
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouve' });

    if (user.role === 'superadmin') {
      return res.status(403).json({ message: 'Action interdite : le compte SuperAdmin est protege et ne peut pas etre supprime.' });
    }

    await sequelize.transaction(async (transaction) => {
      if (user.parentId) {
        await unlinkAndDeleteStaffUsers([user.id], transaction);
        return;
      }

      await deleteTenantData(user.id, transaction);
      await user.destroy({ transaction });
    });

    res.json({ message: 'Utilisateur supprime definitivement' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: "Impossible de supprimer cet utilisateur car il possede des donnees liees." });
    }
    next(error);
  }
};
// Broadcast de notification système
const broadcastNotification = async (req, res, next) => {
  try {
    const {titre,message}=req.body;const type=String(req.body.type||'INFO').toUpperCase();
    if(typeof titre!=='string'||!titre.trim()||titre.length>160||typeof message!=='string'||!message.trim()||message.length>2000||!['INFO','SUCCESS','WARNING','ERROR'].includes(type)||req.body.confirm!==true)return res.status(400).json({message:'Contenu, type et confirmation requis'});

    const users = await User.findAll({where:{isSuspended:false},attributes:['id']});
    
    const notifications = users.map(u => ({
      userId: u.id,
      titre,
      contenu: message,
      type: type || 'INFO',
      lu: false
    }));

    await sequelize.transaction(async transaction=>{await Notification.bulkCreate(notifications,{transaction});await Activite.create({UserId:req.user.id,shopId:req.user.id,type:'PLATFORM_BROADCAST',description:'Notification : '+titre+' ('+users.length+' destinataires)',module:'Platform'},{transaction});});
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

    return res.status(409).json({message:'La vérification email doit être réalisée par le titulaire du compte.'});

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

const getLandingInbox = async (req, res, next) => {
  try {
    const messages = await Activite.findAll({
      where: { type: 'LANDING_MESSAGE' },
      order: [['createdAt', 'DESC']],
      limit: 200
    });

    const payload = messages.map((m) => {
      let parsed = {};
      try { parsed = JSON.parse(m.description || '{}'); } catch (_) {}
      return {
        id: m.id,
        nom: parsed.nom || m.userNom || 'Visiteur',
        email: parsed.email || '',
        message: parsed.message || m.description || '',
        createdAt: m.createdAt,
      };
    });
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

// Impersonation (Se connecter en tant que)
const jwt = require('jsonwebtoken');

const impersonateUser=async(req,res)=>res.status(409).json({message:'Accès support délégué suspendu avant mise en place du consentement et de la journalisation.'});

const getGlobalSettings = async (req, res, next) => {
  try {
    const settings = await GlobalSetting.findAll({where:{key:['maintenance_mode','registration_enabled','newsletter_title','newsletter_body','newsletter_logo']}});
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
    if(!['maintenance_mode','registration_enabled','newsletter_title','newsletter_body','newsletter_logo'].includes(key)||typeof value!=='string'||value.length>10000||(['maintenance_mode','registration_enabled'].includes(key)&&!['true','false'].includes(value)))return res.status(400).json({message:'Paramètre invalide'});

    const [setting, created] = await GlobalSetting.findOrCreate({
      where: { key },
      defaults: { key, value }
    });

    if (!created) {
      setting.value = value;
      await setting.save();
    }

    await Activite.create({UserId:req.user.id,shopId:req.user.id,type:'PLATFORM_SETTING',description:'Paramètre modifié : '+key,module:'Platform'});
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
  getLandingInbox,
  getGlobalSettings,
  updateGlobalSetting,
  impersonateUser
};
