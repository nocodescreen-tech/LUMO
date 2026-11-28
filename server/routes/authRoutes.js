const express = require('express');
const router = express.Router();
const { 
  login, 
  register, 
  getProfile, 
  updateProfile,
  verifyEmail,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  refreshAccessToken,
  setupTOTP,
  activateTOTP,
  disable2FA,
  verify2FA,
  updateLogo,
  logout,
  resendCode
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [nom, email, motDePasse, entrepriseNom]
 *             properties:
 *               nom: { type: string }
 *               email: { type: string }
 *               motDePasse: { type: string }
 *               entrepriseNom: { type: string }
 *               avatar: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Utilisateur enregistré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.post('/register', upload.single('avatar'), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, motDePasse]
 *             properties:
 *               email: { type: string }
 *               motDePasse: { type: string }
 *     responses:
 *       200:
 *         description: Connexion réussie
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtenir le profil de l'utilisateur connecté
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profil récupéré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 */
router.get('/profile', protect, getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Mettre à jour le profil
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profil mis à jour
 */
router.put('/profile', protect, updateProfile);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Vérifier l'email via code OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string }
 *               code: { type: string }
 */
router.post('/verify-email', verifyEmail);

/**
 * @swagger
 * /api/auth/2fa/verify:
 *   post:
 *     summary: Vérifier le code 2FA (Google Authenticator)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string }
 *               code: { type: string }
 */
router.post('/2fa/verify', verify2FA);

router.post('/logout', protect, logout);
router.post('/avatar', protect, upload.single('avatar'), updateProfile);
router.post('/logo', protect, upload.single('logo'), updateLogo);
router.post('/resend-code', resendCode);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.post('/refresh', require('../middleware/sessionOrigin').protectRefresh, refreshAccessToken);
router.get('/2fa/setup', protect,(_req,res)=>res.status(405).set('Allow','POST').json({message:'Utilisez POST avec le mot de passe actuel.'}));
router.post('/2fa/setup', protect, setupTOTP);
router.post('/2fa/activate', protect, activateTOTP);
router.post('/2fa/disable', protect, disable2FA);

module.exports = router;
