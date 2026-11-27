const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { exportBackup, exportEmailBackup, importBackup, previewBackup } = require('../controllers/backupController');

router.get('/export', protect, authorize('admin','superadmin'), exportBackup);
router.get('/email', protect, authorize('admin','superadmin'), exportEmailBackup);
router.post('/import', protect, authorize('admin','superadmin'), (req,res)=>res.status(409).json({message:'Restauration suspendue avant validation du remappage et des contrôles de sécurité.'}));
router.post('/preview', protect, authorize('admin','superadmin'), previewBackup);

module.exports = router;
