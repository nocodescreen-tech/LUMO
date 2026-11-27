const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');
const { protect,checkPermission } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/locations',checkPermission('cash'),cashController.getLocations);
router.get('/current', checkPermission('cash'),cashController.getCurrentSession);
router.post('/open', checkPermission('cash.open'),cashController.openSession);
router.post('/close', checkPermission('cash.close'),cashController.closeSession);
router.get('/history', checkPermission('cash.view'),cashController.getSessions);
router.delete('/:id', checkPermission('cash.delete_session'),cashController.deleteSession);

module.exports = router;
