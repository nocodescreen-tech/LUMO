const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/current', cashController.getCurrentSession);
router.post('/open', cashController.openSession);
router.post('/close', cashController.closeSession);
router.get('/history', cashController.getSessions);
router.delete('/:id', cashController.deleteSession);

module.exports = router;
