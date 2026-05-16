const { Op } = require('sequelize');
const { User } = require('../models');
const generateToken = require('../utils/generateToken');
const { validateRegister, validateLogin } = require('../middleware/validators');
const { logActivite } = require('./activiteController');
const crypto = require('crypto');
const { sendEmail, getVerificationTemplate, getResetPasswordTemplate } = require('../utils/emailService');
const { uploadImage } = require('../utils/cloudinary');
const { authenticator } = require('otplib');
const qrcode = require('qrcode');

// Deprecated local version replaced by utility
const uploadAvatarToCloudinary = (buffer, mime) => uploadImage(buffer, 'avatars', mime);

// @desc    Register a new user
const registerAdmin = async (req, res, next) => {
  
  // Patch automatique si nom manquant
  if (!req.body.nom) {
    if (req.body.entrepriseNom) {
      req.body.nom = 'Propriétaire ' + req.body.entrepriseNom;
    } else {
      req.body.nom = 'Admin Lumo'; // Fallback ultime
    }
  }

  const { error } = validateRegister(req.body);
  if (error) {
    console.warn(`[LUMO_VAL_FAIL] ${error.details[0].message}`);
    return res.status(400).json({ 
      message: error.details[0].message,
      field: error.details[0].path[0],
      receivedData: { ...req.body, motDePasse: '***' } 
    });
  }

  const { nom, email, motDePasse, typeActivite, telephone, entrepriseNom, devise, ville, tauxDollar } = req.body;

  try {
    const { Op } = require('sequelize');
    const userExists = await User.findOne({ where: { email: { [Op.iLike]: email } } });
    if (userExists) return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre compte' });

    // Check if it's the first user ever
    const isFirstUser = (await User.count()) === 0;

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[DEV ONLY] Code de vérification pour ${email} : ${verificationCode}`);
    
    const hashedVerificationCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

    const avatarUrl = req.file ? await uploadAvatarToCloudinary(req.file.buffer, req.file.mimetype) : 'default_avatar.png';

    const user = await User.create({
      nom,
      email,
      motDePasse,
      telephone: telephone || null,
      typeActivite: typeActivite || 'Boutique',
      avatar: avatarUrl,
      verificationCode: hashedVerificationCode,
      isVerified: isFirstUser, // Auto verify first user
      isAdminValidated: isFirstUser, // Auto validate first user
      role: isFirstUser ? 'superadmin' : 'admin',
      preferences: {
        theme: 'light',
        language: 'fr',
        enabledModules: [],
        exchangeRate: parseFloat(tauxDollar) || 2250
      },
      entreprise: {
        nom: entrepriseNom || 'Mon Commerce',
        devise: devise || 'CDF',
        adresse: ville || ''
      }
    });

    if (user) {
      if (!isFirstUser) {
        sendEmail({
          email: user.email,
          subject: 'Vérifiez votre compte Lumo',
          html: getVerificationTemplate(verificationCode, user.nom)
        }).catch(mailError => console.error('Email could not be sent', mailError));
      }

      await logActivite(user.id, 'INSCRIPTION', isFirstUser ? 'SuperAdmin enregistré' : 'Nouvel utilisateur enregistré - Attente de validation', 'System', user.id);
      
      const sessionId = crypto.randomBytes(16).toString('hex');
      const tokens = isFirstUser ? generateToken(user.id, sessionId) : null;
      
      if (isFirstUser) {
        user.activeSessions = [{ sessionId, createdAt: new Date() }];
        await user.save();
      }
      res.status(201).json({
        id: user.id,
        nom: user.nom,
        email: user.email,
        isVerified: user.isVerified,
        isAdminValidated: user.isAdminValidated,
        role: user.role,
        token: tokens ? tokens.accessToken : null,
        refreshToken: tokens ? tokens.refreshToken : null,
        message: isFirstUser ? 'Compte SuperAdmin créé avec succès.' : 'Inscription réussie. Veuillez vérifier votre email et attendre la validation de l\'administrateur.'
      });
    }
  } catch (error) {
    next(error);
  }
};

const loginAdmin = async (req, res, next) => {
  const { error } = validateLogin(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, motDePasse } = req.body;

  const startTime = Date.now();
  try {
    console.log(`[AUTH_PERF] Login start for ${email}`);
    const { Op } = require('sequelize');
    const user = await User.findOne({ where: { email: { [Op.iLike]: email } } });
    console.log(`[AUTH_PERF] DB FindUser: ${Date.now() - startTime}ms`);

    if (!user) {
      return res.status(401).json({ message: "Aucun compte n'est associé à cet email" });
    }

    const passCheckStart = Date.now();
    const isMatch = await user.matchMotDePasse(motDePasse);
    console.log(`[AUTH_PERF] Bcrypt Compare: ${Date.now() - passCheckStart}ms`);

    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // Role check logic
    if (user.role !== 'superadmin') {
        if (!user.isVerified) {
          return res.status(401).json({ message: "Veuillez vérifier votre email avant de vous connecter" });
        }
        if (user.isSuspended) {
          return res.status(401).json({ message: "Votre compte a été suspendu par l'administrateur" });
        }
        if (!user.isAdminValidated) {
          return res.status(401).json({ message: "Votre compte est en attente de validation par l'administrateur principal" });
        }
    }

    // ---- 2FA CHECK (TOTP / Google Authenticator) ----
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        requires2FA: true,
        userId: user.id,
        mfaType: user.twoFactorSecret ? 'totp' : 'email',
        message: user.twoFactorSecret ? 'Entrez votre code Google Authenticator.' : 'Code envoyé par email.'
      });
    }
    // ---- END 2FA CHECK ----

    const sessionId = crypto.randomBytes(16).toString('hex');
    const { accessToken, refreshToken } = generateToken(user.id, sessionId);

    // Secure Refresh Token in Cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    // Manage concurrent sessions (limit to 5)
    let sessions = user.activeSessions || [];
    sessions.push({ 
        sessionId, 
        userAgent: req.headers['user-agent'], 
        ip: req.ip,
        createdAt: new Date() 
    });
    if (sessions.length > 5) sessions.shift(); // Remove oldest
    user.activeSessions = sessions;
    user.changed('activeSessions', true);
    await user.save({ hooks: false });

    // Non-blocking activity log (Fire and Forget for better performance)
    logActivite(user.id, 'CONNEXION', 'Utilisateur s\'est connecté', req.ip, user.parentId || user.id, user.nom);

    res.status(200).json({
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      preferences: user.preferences,
      entreprise: user.entreprise,
      twoFactorEnabled: user.twoFactorEnabled,
      token: accessToken,
      // On peut garder le refreshToken dans le JSON pour le mobile, 
      // mais le web utilisera de préférence le cookie.
      refreshToken, 
      permissions: user.permissions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Verify 2FA OTP and return tokens
const verify2FA = async (req, res, next) => {
  const { userId, code } = req.body;
  if (!userId || !code) return res.status(400).json({ message: 'userId et code requis' });

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    let isVerified = false;

    // Mode TOTP (Google Authenticator)
    if (user.twoFactorSecret) {
      isVerified = authenticator.check(code, user.twoFactorSecret);
    } 
    // Mode Email (Fallback)
    else {
      const hashed = crypto.createHash('sha256').update(code).digest('hex');
      if (user.twoFactorCode === hashed && user.twoFactorExpire > Date.now()) {
        isVerified = true;
      }
    }

    if (!isVerified) return res.status(400).json({ message: 'Code invalide ou expiré' });

    // Clear temporary 2FA code (not secret)
    user.twoFactorCode = null;
    user.twoFactorExpire = null;
    await user.save({ hooks: false });

    await logActivite(user.id, 'CONNEXION', 'Connexion 2FA réussie', 'System', user.parentId || user.id);
    
    const sessionId = crypto.randomBytes(16).toString('hex');
    const { accessToken, refreshToken } = generateToken(user.id, sessionId);

    // Manage sessions
    let sessions = user.activeSessions || [];
    sessions.push({ sessionId, createdAt: new Date(), userAgent: req.headers['user-agent'] });
    if (sessions.length > 5) sessions.shift();
    user.activeSessions = sessions;
    await user.save({ hooks: false });
    res.status(200).json({
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      preferences: user.preferences,
      entreprise: user.entreprise,
      twoFactorEnabled: user.twoFactorEnabled,
      token: accessToken,
      refreshToken,
      permissions: user.permissions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Refresh access token using a valid refresh token
const refreshAccessToken = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!refreshToken) return res.status(400).json({ message: 'Refresh token requis' });

  try {
    const jwt = require('jsonwebtoken');
    const config = require('../config');
    const decoded = jwt.verify(refreshToken, config.jwt.secret);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Token invalide' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé' });

    if (user.isSuspended) {
      return res.status(403).json({ message: 'Votre compte est suspendu' });
    }

    const sessionId = decoded.sessionId;
    const { accessToken, refreshToken: newRefreshToken } = generateToken(user.id, sessionId);

    // Rotation du Refresh Token dans le cookie
    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    // M6 Fix: Ne pas écraser activeSessions si le sessionId est le même,
    // mais on peut quand même mettre à jour les métadonnées (userAgent, IP)
    let sessions = user.activeSessions || [];
    const currentSession = sessions.find(s => s.sessionId === sessionId);
    if (currentSession) {
      currentSession.userAgent = req.headers['user-agent'];
      currentSession.ip = req.ip;
      currentSession.updatedAt = new Date();
    } else {
      // Au cas où la session n'existait plus en BDD (nettoyage agressif), on la recrée
      sessions.push({ 
        sessionId, 
        userAgent: req.headers['user-agent'], 
        ip: req.ip,
        createdAt: new Date() 
      });
      if (sessions.length > 5) sessions.shift();
    }
    
    user.activeSessions = sessions;
    user.changed('activeSessions', true);
    await user.save({ hooks: false });

    res.status(200).json({ token: accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expirée, veuillez vous reconnecter', code: 'REFRESH_EXPIRED' });
    }
    res.status(401).json({ message: 'Token invalide' });
  }
};

// @desc  Setup TOTP (Generate QR Code)
const setupTOTP = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'LUMO Pro', secret);
    
    // On stocke temporairement le secret dans le cache ou une session
    // Ici on peut le stocker dans un champ temporaire du user pour validation
    user.twoFactorCode = secret; // On réutilise ce champ temporairement
    await user.save({ hooks: false });

    const qrCodeDataUrl = await qrcode.toDataURL(otpauth);
    res.status(200).json({ 
      qrCode: qrCodeDataUrl, 
      secret: secret,
      message: "Scannez le QR Code avec Google Authenticator."
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Verify and enable TOTP
const activateTOTP = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findByPk(req.user.id);
    
    // Le secret temporaire était dans twoFactorCode
    const secret = user.twoFactorCode;
    if (!secret) return res.status(400).json({ message: "Session d'activation expirée." });

    const isVerified = authenticator.check(code, secret);
    if (!isVerified) return res.status(400).json({ message: "Code incorrect. Réessayez." });

    user.twoFactorSecret = secret;
    user.twoFactorEnabled = true;
    user.twoFactorCode = null;
    await user.save({ hooks: false });

    await logActivite(user.id, 'SECURITE', 'Double authentification TOTP activée', 'System', user.parentId || user.id);
    res.status(200).json({ message: 'Double authentification activée avec succès.' });
  } catch (error) {
    next(error);
  }
};

// @desc  Disable 2FA for current user
const disable2FA = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorCode = null;
    user.twoFactorExpire = null;
    await user.save({ hooks: false });

    await logActivite(user.id, 'SECURITE', 'Double authentification désactivée', 'System', user.parentId || user.id);
    res.status(200).json({ message: 'Double authentification désactivée', twoFactorEnabled: false });
  } catch (error) {
    next(error);
  }
};

// @desc    Vérifier l'email avec le code
const verifyEmail = async (req, res, next) => {
  const { email, code } = req.body;
  try {
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    const user = await User.findOne({ 
      where: { 
        email: { [Op.iLike]: email }, 
        verificationCode: hashedCode 
      } 
    });
    if (!user) return res.status(400).json({ message: 'Code de vérification invalide' });

    user.isVerified = true;
    user.isAdminValidated = true; // Auto-validate once email is verified via OTP
    user.verificationCode = null;
    await user.save();

    const tokens = generateToken(user.id);
    res.status(200).json({
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      preferences: user.preferences,
      entreprise: user.entreprise,
      twoFactorEnabled: user.twoFactorEnabled,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'Email vérifié avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mot de passe oublié (Envoi OTP)
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email: { [Op.iLike]: email } } });
    if (!user) return res.status(404).json({ message: "Aucun utilisateur avec cet email" });

    // Générer un code OTP à 6 chiffres
    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordToken = crypto.createHash('sha256').update(resetOTP).digest('hex');
    user.resetPasswordExpire = Date.now() + 3600000; // 1 heure

    await user.save();

    // Fire-and-forget pour éviter le timeout 499
    sendEmail({
      email: user.email,
      subject: 'Code de récupération - Lumo',
      html: getResetPasswordTemplate(resetOTP, user.nom)
    }).catch(async (err) => {
      console.error('[EMAIL] Échec envoi forgot-password:', err.message);
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();
    });

    res.status(200).json({ message: 'Code de récupération envoyé par email' });
  } catch (error) {
    next(error);
  }
};

// @desc    Vérifier le code OTP de réinitialisation
const verifyResetCode = async (req, res, next) => {
  const { email, code } = req.body;
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(code).digest('hex');
    
    const user = await User.findOne({
      where: {
        email: { [Op.iLike]: email },
        resetPasswordToken,
        resetPasswordExpire: { [require('sequelize').Op.gt]: Date.now() }
      }
    });

    if (!user) return res.status(400).json({ message: 'Code invalide ou expiré' });

    res.status(200).json({ message: 'Code vérifié avec succès. Vous pouvez changer votre mot de passe.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Réinitialiser le mot de passe final
const resetPassword = async (req, res, next) => {
  const { email, code, motDePasse } = req.body;
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(code).digest('hex');
    
    const user = await User.findOne({
      where: {
        email: { [Op.iLike]: email },
        resetPasswordToken,
        resetPasswordExpire: { [require('sequelize').Op.gt]: Date.now() }
      }
    });

    if (!user) return res.status(400).json({ message: 'Session de récupération expirée' });

    user.motDePasse = motDePasse;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    await logActivite(user.id, 'SECURITE', 'Mot de passe réinitialisé', 'System', user.parentId || user.id);
    res.status(200).json({ message: 'Votre mot de passe a été modifié avec succès' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mise à jour du profil / paramètres (y compris avatar)
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const { nom, telephone, email, entreprise, preferences, typeActivite, avatar, motDePasse } = req.body;

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    // Use explicit undefined checks to prevent falsy values (like "") from keeping old data
    if (nom !== undefined && nom !== null && nom.trim() !== '') user.nom = nom.trim();
    if (email !== undefined && email !== null) user.email = email;
    if (telephone !== undefined && telephone !== null) user.telephone = telephone;
    if (typeActivite !== undefined && typeActivite !== null) user.typeActivite = typeActivite;
    if (entreprise !== undefined && entreprise !== null) user.entreprise = entreprise;
    if (entreprise) {
      user.changed('entreprise', true);
    }

    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
      user.changed('preferences', true);
    }

    if (req.file) {
      user.avatar = await uploadAvatarToCloudinary(req.file.buffer, req.file.mimetype);
    } else if (avatar) {
      user.avatar = avatar;
    }

    if (motDePasse) {
      user.motDePasse = motDePasse;
    }

    const updatedUser = await user.save();
    
    // Log activity
    await logActivite(
      updatedUser.id, 
      'PARAMETRES', 
      'Mise à jour du profil et des préférences système', 
      'System', 
      updatedUser.parentId || updatedUser.id
    );
    res.json({
      id: updatedUser.id,
      nom: updatedUser.nom,
      email: updatedUser.email,
      telephone: updatedUser.telephone,
      avatar: updatedUser.avatar,
      entreprise: updatedUser.entreprise,
      preferences: updatedUser.preferences,
      typeActivite: updatedUser.typeActivite,
      twoFactorEnabled: updatedUser.twoFactorEnabled,
    });
  } catch (error) {
    next(error);
  }
};



const updateLogo = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    if (req.file) {
      const logoUrl = await uploadImage(req.file.buffer, 'logos', req.file.mimetype);
      user.entreprise = { ...user.entreprise, logo: logoUrl };
      const updatedUser = await user.save();
      
      res.json({
        id: updatedUser.id,
        nom: updatedUser.nom,
        email: updatedUser.email,
        telephone: updatedUser.telephone,
        avatar: updatedUser.avatar,
        entreprise: updatedUser.entreprise,
        preferences: updatedUser.preferences,
        typeActivite: updatedUser.typeActivite,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
      });
    } else {
        res.status(400).json({ message: 'Aucun fichier fourni' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout (Revoke token)
const logoutAdmin = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
        const { blacklistToken } = require('../middleware/authMiddleware');
        blacklistToken(token);
    }
    
    await logActivite(req.user.id, 'DECONNEXION', 'Utilisateur déconnecté (Jeton révoqué)', 'System', req.user.tenantId);
    
    // Nettoyer le cookie refresh token
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    // M6 Fix: Force radical cleanup on browser side
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
    
    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    // Prevent browser from caching old user profile across logins
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json({
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        telephone: user.telephone,
        typeActivite: user.typeActivite,
        entreprise: user.entreprise,
        preferences: user.preferences,
        twoFactorEnabled: user.twoFactorEnabled,
        permissions: user.permissions,
      }
    });
  } catch (error) {
    next(error);
  }
};

// Resend Verification Code
const resendCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis' });

    const user = await User.findOne({ where: { email: { [Op.iLike]: email } } });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (user.isVerified) return res.status(400).json({ message: 'Compte déjà vérifié' });

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[DEV ONLY] NOUVEAU Code de vérification pour ${email} : ${verificationCode}`);
    
    const hashedVerificationCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
    user.verificationCode = hashedVerificationCode;
    user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    const { sendEmail, getVerificationTemplate } = require('../utils/emailService');
    sendEmail({
      email: user.email,
      subject: 'Nouveau code de vérification Lumo',
      html: getVerificationTemplate(verificationCode, user.nom)
    }).catch(mailError => console.error('Email resend failed', mailError));

    res.json({ message: 'Un nouveau code a été envoyé' });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
    register: registerAdmin, 
    login: loginAdmin, 
    getProfile,
    updateProfile, 
    verifyEmail, 
    resendCode,
    forgotPassword, 
    verifyResetCode,
    resetPassword,
    refreshAccessToken,
    setupTOTP,
    activateTOTP,
    disable2FA,
    verify2FA,
    updateLogo,
    logout: logoutAdmin
};