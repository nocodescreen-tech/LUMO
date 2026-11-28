const { Op } = require('sequelize');
const { User } = require('../models');
const generateToken = require('../utils/generateToken');
const { validateRegister, validateLogin } = require('../middleware/validators');
const { logActivite } = require('./activiteController');
const crypto = require('crypto');
const {sequelize}=require('../config/database');
const {fail}=require('../utils/transactionSafety');
const emailPattern=value=>String(value??'').replace(/[\\%_]/g,c=>'\\'+c);
const hashMfa=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
const { sendEmail, getVerificationTemplate, getResetPasswordTemplate } = require('../utils/emailService');
const { uploadImage } = require('../utils/cloudinary');
const { authenticator } = require('otplib');
const qrcode = require('qrcode');

// Deprecated local version replaced by utility
const uploadAvatarToCloudinary = (buffer, mime) => uploadImage(buffer, 'avatars', mime);

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
  });
};

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
      field: error.details[0].path[0] 
    });
  }

  const { nom, email, motDePasse, typeActivite, telephone, entrepriseNom, devise, ville, tauxDollar } = req.body;

  try {
    const { Op } = require('sequelize');
    const userExists = await User.findOne({ where: { email: { [Op.iLike]:emailPattern(email) } } });
    if (userExists) return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre compte' });

    // Check if it's the first user ever
    // Platform administrators must be provisioned explicitly outside public registration.
    const isFirstUser = false;

    const verificationCode = crypto.randomInt(100000,1000000).toString();

    
    const hashedVerificationCode = 'v1:'+Date.now()+':'+hashMfa(verificationCode);

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
        setRefreshTokenCookie(res, tokens.refreshToken);
      }
      res.status(201).json({
        id: user.id,
        nom: user.nom,
        email: user.email,
        isVerified: user.isVerified,
        isAdminValidated: user.isAdminValidated,
        role: user.role,
        token: tokens ? tokens.accessToken : null,
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
    console.log('[AUTH_PERF] Login start');
    const { Op } = require('sequelize');
    const user = await User.findOne({ where: { email: { [Op.iLike]:emailPattern(email) } } });
    console.log(`[AUTH_PERF] DB FindUser: ${Date.now() - startTime}ms`);

    if (!user) {
      // SECURITY: message générique — ne pas révéler si l'email existe (anti-énumération)
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const passCheckStart = Date.now();
    const isMatch = await user.matchMotDePasse(motDePasse);
    console.log(`[AUTH_PERF] Bcrypt Compare: ${Date.now() - passCheckStart}ms`);

    if (!isMatch) {
      // SECURITY: même message que "email inconnu" — anti-énumération d'utilisateurs
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
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
      const challenge=crypto.randomBytes(32).toString('hex');
      const emailCode=user.twoFactorSecret?null:crypto.randomInt(100000,1000000).toString();
      user.twoFactorCode='login:'+hashMfa(challenge)+(emailCode?':'+hashMfa(emailCode):'');
      user.twoFactorExpire=Date.now()+5*60*1000;
      await user.save({hooks:false});
      if(emailCode)await sendEmail({email:user.email,subject:'Code de connexion LUMO',html:getVerificationTemplate(emailCode,user.nom)});
      return res.status(200).json({
        challenge,
        requires2FA: true,
        userId: user.id,
        mfaType: user.twoFactorSecret ? 'totp' : 'email',
        message: user.twoFactorSecret ? 'Entrez votre code Google Authenticator.' : 'Code envoyé par email.'
      });
    }
    // ---- END 2FA CHECK ----

    const sessionId = crypto.randomBytes(16).toString('hex');
    const { accessToken, refreshToken } = generateToken(user.id, sessionId);

    setRefreshTokenCookie(res, refreshToken);

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
      // SECURITY: refreshToken is NOT returned in the JSON body.
      // It is only set as an httpOnly cookie (see res.cookie above),
      // which is not accessible to JavaScript (XSS-safe).
      permissions: user.permissions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Verify 2FA OTP and return tokens
const verify2FA=async(req,res,next)=>{
 const {userId,code,challenge}=req.body;
 if(!userId||!/^\d{6}$/.test(String(code))||typeof challenge!=='string'||!/^\w{64}$/.test(challenge))return res.status(400).json({message:'Tentative de connexion invalide'});
 try{
  const result=await sequelize.transaction(async transaction=>{
   const user=await User.findByPk(userId,{transaction,lock:transaction.LOCK.UPDATE});
   if(!user||!user.twoFactorEnabled||user.isSuspended||(user.role!=='superadmin'&&(!user.isVerified||!user.isAdminValidated)))throw fail('Tentative de connexion invalide',401);
   const parts=String(user.twoFactorCode||'').split(':');
   if(parts[0]!=='login'||parts[1]!==hashMfa(challenge)||Number(user.twoFactorExpire)<=Date.now())throw fail('Tentative expirée, reconnectez-vous',401);
   const valid=user.twoFactorSecret?authenticator.check(String(code),user.twoFactorSecret):parts[2]===hashMfa(code);
   if(!valid)throw fail('Code invalide',400);
   user.twoFactorCode=null;user.twoFactorExpire=null;
   const sessionId=crypto.randomBytes(16).toString('hex'),tokens=generateToken(user.id,sessionId);
   user.activeSessions=[...(user.activeSessions||[]),{sessionId,createdAt:new Date(),userAgent:req.headers['user-agent'],ip:req.ip}].slice(-5);
   await user.save({hooks:false,transaction});return {user,tokens};
  });
  const {user,tokens}=result;setRefreshTokenCookie(res,tokens.refreshToken);
  await logActivite(user.id,'CONNEXION','Connexion 2FA réussie','System',user.parentId||user.id);
  return res.status(200).json({id:user.id,nom:user.nom,email:user.email,role:user.role,avatar:user.avatar,preferences:user.preferences,entreprise:user.entreprise,twoFactorEnabled:user.twoFactorEnabled,permissions:user.permissions,token:tokens.accessToken});
 }catch(error){next(error);}
};

// @desc  Refresh access token using a valid refresh token
const refreshAccessToken = async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) return res.status(400).json({ message: 'Refresh token requis' });

  try {
    const jwt = require('jsonwebtoken');
    const config = require('../config');
    const decoded = jwt.verify(refreshToken, config.jwt.secret,{algorithms:['HS256']});

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Token invalide' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé' });

    if(user.isSuspended|| (user.role!=='superadmin'&&(!user.isVerified||!user.isAdminValidated)))return res.status(403).json({message:'Compte indisponible'});
    if(user.parentId){const owner=await User.findByPk(user.parentId,{attributes:['id','role','parentId','isSuspended','isVerified','isAdminValidated']});if(!owner||owner.parentId||owner.role!=='admin'||owner.isSuspended||!owner.isVerified||!owner.isAdminValidated)return res.status(403).json({message:'Entreprise indisponible'});}
    const sessionId = decoded.sessionId;
    if(!sessionId||!(user.activeSessions||[]).some(s=>s.sessionId===sessionId))return res.status(401).json({message:'Session révoquée',code:'SESSION_REPLACED'});
    const { accessToken, refreshToken: newRefreshToken } = generateToken(user.id, sessionId);

    setRefreshTokenCookie(res, newRefreshToken);

    // Refresh never rewrites activeSessions: concurrent revocations must remain durable.
    // SECURITY: refreshToken is only set as an httpOnly cookie, not returned in JSON body.
    res.status(200).json({ token: accessToken });
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

    // Réinitialiser seulement les champs actifs de setup précédent (pas twoFactorEnabled)
    // pour éviter de perdre l'état activé si on re-scanne le QR code
    user.twoFactorCode = null;
    user.twoFactorExpire = null;

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'LUMO Pro', secret);

    // Le secret est stocké dans twoFactorCode (champ réutilisé temporairement)
    user.twoFactorCode = secret;
    user.twoFactorExpire = Date.now() + 15 * 60 * 1000;
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

    // Vérifier l'expiration de la session de setup TOTP
    if (user.twoFactorExpire && Number(user.twoFactorExpire) < Date.now()) {
      // Nettoyage de sécurité
      user.twoFactorCode = null;
      user.twoFactorExpire = null;
      await user.save({ hooks: false });
      return res.status(400).json({ message: "Session d'activation TOTP expirée. Recommencez depuis le début." });
    }

    authenticator.options = { window: 1 }; // Allow 1 step (30s) before/after
    const isVerified = authenticator.check(String(code), secret);
    if (!isVerified) return res.status(400).json({ message: "Code incorrect. Réessayez." });

    user.twoFactorSecret = secret;
    user.twoFactorEnabled = true;
    user.twoFactorCode = null;
    user.twoFactorExpire = null;
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
    const { motDePasse } = req.body;
    if (!motDePasse) {
      return res.status(400).json({ message: 'Mot de passe requis pour désactiver la 2FA' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const valid = await user.matchMotDePasse(motDePasse);
    if (!valid) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

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
const verifyEmail=async(req,res,next)=>{
 const {email,code}=req.body;
 if(typeof email!=='string'||!/^\d{6}$/.test(String(code)))return res.status(400).json({message:'Code de vérification invalide'});
 try{
 const result=await sequelize.transaction(async transaction=>{
  const user=await User.findOne({where:{email:{[Op.iLike]:emailPattern(email)}},transaction,lock:transaction.LOCK.UPDATE});
  const [version,issued,hash]=String(user?.verificationCode||'').split(':');
  if(!user||user.isVerified||user.isSuspended||version!=='v1'||Date.now()-Number(issued)>15*60*1000||!Number.isFinite(Number(issued))||hash!==hashMfa(code))throw fail('Code invalide ou expiré; demandez un nouveau code',400);
  user.isVerified=true;user.isAdminValidated=true;user.verificationCode=null;
  const sessionId=crypto.randomBytes(16).toString('hex'),tokens=generateToken(user.id,sessionId);
  user.activeSessions=[...(user.activeSessions||[]),{sessionId,createdAt:new Date(),ip:req.ip,userAgent:req.headers['user-agent']}].slice(-5);
  await user.save({hooks:false,transaction});return {user,tokens};
 });
 const {user,tokens}=result;setRefreshTokenCookie(res,tokens.refreshToken);return res.json({id:user.id,nom:user.nom,email:user.email,role:user.role,avatar:user.avatar,preferences:user.preferences,entreprise:user.entreprise,twoFactorEnabled:user.twoFactorEnabled,permissions:user.permissions,token:tokens.accessToken,message:'Email vérifié avec succès'});
 }catch(e){next(e)}
};

// @desc    Mot de passe oublié (Envoi OTP)
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email: { [Op.iLike]:emailPattern(email) } } });
    if (!user) return res.status(200).json({message:'Si ce compte existe, un code de récupération sera envoyé.'});

    // Générer un code OTP à 6 chiffres
    const resetOTP = crypto.randomInt(100000,1000000).toString();
    
    user.resetPasswordToken = crypto.createHash('sha256').update(resetOTP).digest('hex');
    user.resetPasswordExpire = new Date(Date.now()+15*60*1000);

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
        email: { [Op.iLike]:emailPattern(email) },
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
const resetPassword=async(req,res,next)=>{
 const {email,code,motDePasse}=req.body;
 if(typeof email!=='string'||!/^\d{6}$/.test(String(code))||typeof motDePasse!=='string'||!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,72}$/.test(motDePasse)||Buffer.byteLength(motDePasse)>72)return res.status(400).json({message:'Code ou mot de passe invalide'});
 try{
 const user=await sequelize.transaction(async transaction=>{
  const row=await User.findOne({where:{email:{[Op.iLike]:emailPattern(email)},resetPasswordToken:hashMfa(code),resetPasswordExpire:{[Op.gt]:new Date()}},transaction,lock:transaction.LOCK.UPDATE});
  if(!row||row.isSuspended)throw fail('Session de récupération expirée');
  row.motDePasse=motDePasse;row.resetPasswordToken=null;row.resetPasswordExpire=null;row.activeSessions=[];row.twoFactorCode=null;row.twoFactorExpire=null;await row.save({transaction});return row;
 });
 await logActivite(user.id,'SECURITE','Mot de passe réinitialisé','System',user.parentId||user.id);return res.json({message:'Votre mot de passe a été modifié avec succès'});
 }catch(e){next(e)}
};

// @desc    Mise à jour du profil / paramètres (y compris avatar)
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const { nom, telephone, email, entreprise, preferences, typeActivite, avatar, motDePasse } = req.body;

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    // Use explicit undefined checks to prevent falsy values (like "") from keeping old data
    if (nom !== undefined && nom !== null && nom.trim() !== '') user.nom = nom.trim();
    if(email!==undefined&&email!==null&&email!==user.email)return res.status(409).json({message:'Le changement d’adresse email nécessite une procédure de vérification. Contactez le support.'});
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
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,100}$/;
      if (!passwordRegex.test(motDePasse)) {
        return res.status(400).json({
          message: 'Le mot de passe doit contenir entre 8 et 100 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&#).'
        });
      }
      user.motDePasse = motDePasse;
    }

    if (preferences?.exchangeRate !== undefined) {
      const rate = Number(preferences.exchangeRate);
      if (!Number.isFinite(rate) || rate <= 0) {
        return res.status(400).json({ message: 'Taux de change invalide. Il doit être supérieur à 0.' });
      }
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
      user.changed('entreprise', true);
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
        await blacklistToken(token);
        const decoded=require('jsonwebtoken').verify(token,require('../config').jwt.secret);
        await sequelize.transaction(async transaction=>{const user=await User.findByPk(req.user.id,{transaction,lock:transaction.LOCK.UPDATE});if(user){user.activeSessions=(user.activeSessions||[]).filter(s=>s.sessionId!==decoded.sessionId);await user.save({hooks:false,transaction});}});
    }
    
    await logActivite(req.user.id, 'DECONNEXION', 'Utilisateur déconnecté (Jeton révoqué)', 'System', req.user.tenantId);
    
    // Nettoyer le cookie refresh token
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
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

    const user = await User.findOne({ where: { email: { [Op.iLike]:emailPattern(email) } } });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (user.isVerified) return res.status(400).json({ message: 'Compte déjà vérifié' });

    const verificationCode = crypto.randomInt(100000,1000000).toString();

    
    const hashedVerificationCode = 'v1:'+Date.now()+':'+hashMfa(verificationCode);
    user.verificationCode = hashedVerificationCode;
    // Expiration is encoded in the persisted verificationCode field.
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
