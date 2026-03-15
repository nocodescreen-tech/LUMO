const { User } = require('../models');
const generateToken = require('../utils/generateToken');
const { validateRegister, validateLogin } = require('../middleware/validators');
const { logActivite } = require('./activiteController');
const crypto = require('crypto');
const { sendEmail, getVerificationTemplate, getResetPasswordTemplate } = require('../utils/emailService');
const { uploadImage } = require('../utils/cloudinary');

// Deprecated local version replaced by utility
const uploadAvatarToCloudinary = (buffer, mime) => uploadImage(buffer, 'avatars', mime);

// @desc    Register a new user
const registerAdmin = async (req, res, next) => {
  console.log(`--- REGISTRATION_REQUEST [${new Date().toISOString()}] ---`);
  
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

  const { nom, email, motDePasse, typeActivite, telephone, entrepriseNom, devise, ville } = req.body;

  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists) return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre compte' });

    // Check if it's the first user ever
    const isFirstUser = (await User.count()) === 0;

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const avatarUrl = req.file ? await uploadAvatarToCloudinary(req.file.buffer, req.file.mimetype) : 'default_avatar.png';

    const user = await User.create({
      nom,
      email,
      motDePasse,
      telephone: telephone || null,
      typeActivite: typeActivite || 'Boutique',
      avatar: avatarUrl,
      verificationCode,
      isVerified: isFirstUser, // Auto verify first user
      isAdminValidated: isFirstUser, // Auto validate first user
      role: isFirstUser ? 'superadmin' : 'admin',
      preferences: {
        theme: 'light',
        language: 'fr',
        enabledModules: [] 
      },
      entreprise: {
        nom: entrepriseNom || 'Mon Commerce',
        devise: devise || 'FC',
        adresse: ville || ''
      }
    });

    if (user) {
      if (!isFirstUser) {
        try {
          await sendEmail({
            email: user.email,
            subject: 'Vérifiez votre compte Lumo',
            html: getVerificationTemplate(verificationCode, user.nom)
          });
        } catch (mailError) {
          console.error('Email could not be sent', mailError);
        }
      }

      await logActivite(user.id, 'INSCRIPTION', isFirstUser ? 'SuperAdmin enregistré' : 'Nouvel utilisateur enregistré - Attente de validation', 'System');
      
      res.status(201).json({
        id: user.id,
        nom: user.nom,
        email: user.email,
        isVerified: user.isVerified,
        isAdminValidated: user.isAdminValidated,
        role: user.role,
        token: isFirstUser ? generateToken(user.id) : null,
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

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Aucun compte n'est associé à cet email" });
    }

    if (!(await user.matchMotDePasse(motDePasse))) {
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
    
    await logActivite(user.id, 'CONNEXION', 'Utilisateur s\'est connecté', 'System');
    res.status(200).json({
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      preferences: user.preferences,
      entreprise: user.entreprise,
      token: generateToken(user.id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vérifier l'email avec le code
const verifyEmail = async (req, res, next) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({ where: { email, verificationCode: code } });
    if (!user) return res.status(400).json({ message: 'Code de vérification invalide' });

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    res.status(200).json({
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      preferences: user.preferences,
      entreprise: user.entreprise,
      token: generateToken(user.id),
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
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "Aucun utilisateur avec cet email" });

    // Générer un code OTP à 6 chiffres
    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // On stocke le code en clair ou haché (ici clair pour la simplicité du reset immédiat, ou haché pour plus de sécurité)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetOTP).digest('hex');
    user.resetPasswordExpire = Date.now() + 3600000; // 1 heure

    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Code de récupération - Lumo',
        html: getResetPasswordTemplate(resetOTP, user.nom)
      });
      res.status(200).json({ message: 'Code de récupération envoyé par email' });
    } catch (err) {
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();
      return res.status(500).json({ message: "L'email n'a pas pu être envoyé" });
    }
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
        email,
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
        email,
        resetPasswordToken,
        resetPasswordExpire: { [require('sequelize').Op.gt]: Date.now() }
      }
    });

    if (!user) return res.status(400).json({ message: 'Session de récupération expirée' });

    user.motDePasse = motDePasse;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    await logActivite(user.id, 'SECURITE', 'Mot de passe réinitialisé', 'System');
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

    user.nom = nom || user.nom;
    user.email = email || user.email;
    user.telephone = telephone || user.telephone;
    user.typeActivite = typeActivite || user.typeActivite;
    user.entreprise = entreprise || user.entreprise;
    user.preferences = preferences || user.preferences;

    if (req.file) {
      user.avatar = await uploadAvatarToCloudinary(req.file.buffer, req.file.mimetype);
    } else if (avatar) {
      user.avatar = avatar;
    }

    if (motDePasse) {
      user.motDePasse = motDePasse;
    }

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
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

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
        preferences: user.preferences
      }
    });
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
    forgotPassword, 
    verifyResetCode,
    resetPassword 
};