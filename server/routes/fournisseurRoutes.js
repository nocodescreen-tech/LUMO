const express = require('express');
const router = express.Router();
const { getFournisseurs, createFournisseur, updateFournisseur, deleteFournisseur } = require('../controllers/fournisseurController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getFournisseurs);
router.post('/', protect, createFournisseur);
router.put('/:id', protect, updateFournisseur);
router.delete('/:id', protect, deleteFournisseur);

module.exports = router;
