const express = require('express');
const router = express.Router();
const { getClients, createClient, updateClient, deleteClient, settleDebt, sendReminder } = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getClients);
router.post('/', protect, createClient);
router.put('/:id', protect, updateClient);
router.delete('/:id', protect, deleteClient);
router.post('/:id/regler', protect, settleDebt);
router.post('/:id/rappel', protect, sendReminder);

module.exports = router;
