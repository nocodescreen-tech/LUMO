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
  verifyUserEmail
} = require('../controllers/superAdminController');

// Toutes les routes superadmin sont protégées et réservées au rôle superadmin
router.use(protect, authorize('superadmin'));

router.get('/users', getSuperadminUsers);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/validate', validateUser);
router.put('/users/:id/verify', verifyUserEmail);
router.delete('/users/:id', deleteUser);

router.get('/logs', getSuperadminLogs);
router.get('/stats', getSuperadminStats);
router.post('/notify', broadcastNotification);

module.exports = router;
