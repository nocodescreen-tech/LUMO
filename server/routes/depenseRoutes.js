const express = require('express');
const router = express.Router();
const { getDepenses, createDepense, updateDepense, deleteDepense } = require('../controllers/depenseController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getDepenses);
router.post('/', protect, createDepense);
router.put('/:id', protect, updateDepense);
router.delete('/:id', protect, deleteDepense);

module.exports = router;
