const express = require('express');
const router = express.Router();
const { createPayment, getStaffPayments, deletePayment } = require('../controllers/staffPaymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createPayment);
router.get('/', getStaffPayments);
router.delete('/:id', deletePayment);

module.exports = router;
