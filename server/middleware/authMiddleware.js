const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const logger = require('../utils/logger');

const redis = require('../utils/redis');

exports.blacklistToken = async (token) => {
    try {
        // On stocke le token révoqué dans Redis (TTL de 24h par défaut)
        await redis.set(`blacklist:${token}`, 'true', 'EX', 86400);
    } catch (err) {
        console.error('[Auth] Erreur lors de la mise en blacklist du token:', err);
    }
};

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logger.warn(`[AUTH_FAIL] Token manquant pour ${req.originalUrl} (${req.ip})`);
    return res.status(401).json({ message: 'Non autorisé, pas de jeton' });
  }

  try {
    const isBlacklisted = await redis.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      logger.warn(`[AUTH_FAIL] Token révoqué pour ${req.originalUrl} (${req.ip})`);
      return res.status(401).json({ message: 'Session révoquée, veuillez vous reconnecter' });
    }

    const decoded = jwt.verify(token, config.jwt.secret,{algorithms:['HS256']});
    // Reject refresh tokens used as access tokens
    if (decoded.type !== 'access') {
      logger.warn(`[AUTH_FAIL] Type de token invalide (${decoded.type}) pour ${req.originalUrl}`);
      return res.status(401).json({ message: 'Jeton invalide' });
    }
    req.user = await User.findByPk(decoded.id);
    if (!req.user) {
        logger.warn(`[AUTH_FAIL] Utilisateur non trouvé (ID: ${decoded.id}) pour ${req.originalUrl}`);
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    // Session validation (Concurrent Session Control)
    const sessions = req.user.activeSessions || [];
    const isSessionValid = sessions.some(s => s.sessionId === decoded.sessionId);
    if (!isSessionValid || !decoded.sessionId) {
      logger.warn(`[AUTH_FAIL] Session invalide/remplacée (SID: ${decoded.sessionId}) pour l'utilisateur ${req.user.id} sur ${req.originalUrl}`);
      return res.status(401).json({ message: 'Session expirée ou remplacée par une nouvelle connexion', code: 'SESSION_REPLACED' });
    }

    // Maintenance Mode Check
    if (req.user.role !== 'superadmin') {
        const { GlobalSetting } = require('../models');
        const maintenanceSetting = await GlobalSetting.findOne({ where: { key: 'maintenance_mode' } });
        if (maintenanceSetting && maintenanceSetting.value === 'true') {
            return res.status(503).json({ message: 'Mode maintenance en cours. Veuillez réessayer plus tard.' });
        }
    }

    if (req.user.isSuspended) {
        return res.status(403).json({ message: 'Votre compte a été suspendu par l\'administrateur. Veuillez contacter le support.' });
    }

    if(req.user.parentId){const owner=await User.findByPk(req.user.parentId,{attributes:['id','parentId','role','isSuspended']});if(!owner||owner.parentId||owner.role!=='admin'||owner.isSuspended)return res.status(403).json({message:'Entreprise indisponible'});}

    // Impersonation Support
    if (decoded.isImpersonating) {
        req.isImpersonating = true;
        req.originalAdminId = decoded.originalAdminId;
    }

    // Attach tenantId (the admin ID) for data filtering securely
    const resolvedTenantId = req.user.parentId || req.user.id;
    req.user.tenantId = resolvedTenantId; // works via Virtual field, but we set it explicitly
    req.tenantId = resolvedTenantId;      // Safe fallback on the request object itself
    
    // M4 Fix: update lastActivity max once per minute to reduce DB write overhead
    const now = new Date();
    const lastActivity = req.user.lastActivity ? new Date(req.user.lastActivity) : null;
    if (!lastActivity || (now - lastActivity) > 60000) {
      req.user.lastActivity = now;
      await req.user.save({ hooks: false });
    }
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn(`[AUTH_FAIL] Token expiré pour ${req.originalUrl}`);
      return res.status(401).json({ message: 'Token expiré', code: 'TOKEN_EXPIRED' });
    }
    logger.error(`[AUTH_ERROR] Erreur JWT sur ${req.originalUrl}: ${error.message}`);
    res.status(401).json({ message: 'Non autorisé, jeton invalide' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource` });
    }
    next();
  };
};

exports.checkPermission = (permissionId) => {
  return (req, res, next) => {
    // Admins and SuperAdmins have all permissions
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      return next();
    }

    const userPerms = req.user.permissions || [];

    // Exact match (e.g. 'products.edit' or 'products')
    if (userPerms.includes(permissionId)) {
      return next();
    }

    // If checking an action (e.g. 'products.add'), also accept the parent module ('products') as sufficient
    // This allows admins to grant blanket module access without listing all sub-actions
    const parentModule = permissionId.includes('.') ? permissionId.split('.')[0] : null;
    if (parentModule && !/(\.add|\.edit|\.delete|\.refund|\.import|\.settle|\.send_reminder|\.open|\.close|\.delete_session|\.view_purchase_price)$/.test(permissionId) && userPerms.includes(parentModule)) {
      return next();
    }

    return res.status(403).json({ 
      message: `Accès refusé. Permission requise : "${permissionId}".` 
    });
  };
};
