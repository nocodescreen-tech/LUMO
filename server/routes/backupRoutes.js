const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { exportBackup, exportEmailBackup, importBackup, previewBackup } = require('../controllers/backupController');

router.get('/export', protect, exportBackup);
router.get('/email', protect, exportEmailBackup);
router.post('/import', protect, importBackup);
router.post('/preview', protect, previewBackup);

module.exports = router;
