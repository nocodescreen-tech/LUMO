const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { 
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
} = require('../controllers/superAdminController');

// Toutes les routes superadmin sont protégées et réservées au rôle superadmin
router.use(protect, authorize('superadmin'));

/**
 * @swagger
 * tags:
 *   name: SuperAdmin
 *   description: Administration globale de la plateforme (Réservé SuperAdmin)
 */

/**
 * @swagger
 * /api/superadmin/users:
 *   get:
 *     summary: Liste de tous les utilisateurs/instances
 *     tags: [SuperAdmin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste récupérée
 */
router.get('/users', getSuperadminUsers);

router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/validate', validateUser);
router.put('/users/:id/verify', verifyUserEmail);
router.post('/users/:id/impersonate', impersonateUser);
router.delete('/users/:id', deleteUser);

router.get('/logs', getSuperadminLogs);
router.get('/stats', getSuperadminStats);
router.get('/newsletter', getNewsletterSubscribers);
router.get('/landing-inbox', getLandingInbox);
router.post('/notify', broadcastNotification);

router.get('/settings', getGlobalSettings);
router.post('/settings', updateGlobalSetting);

module.exports = router;
