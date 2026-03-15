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
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Upload d'avatar de profil
router.post('/avatar', protect, upload.single('avatar'), updateProfile);

// Vérification d'email (code à 6 chiffres)
router.post('/verify-email', verifyEmail);

// Mot de passe oublié / reset (OTP)
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

module.exports = router;

