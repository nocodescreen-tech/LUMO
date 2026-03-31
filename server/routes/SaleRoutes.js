const express = require('express');
const router = express.Router();
const { getSales, createSale, deleteSale, deleteAllSales } = require('../controllers/SaleController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getSales);
router.delete('/all', protect, deleteAllSales);
router.post('/', protect, createSale);
router.delete('/:id', protect, deleteSale);

module.exports = router;
