const express = require('express');
const router = express.Router();
const { getFournisseurs, createFournisseur, updateFournisseur, deleteFournisseur } = require('../controllers/fournisseurController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.get('/', protect, checkPermission('suppliers'), getFournisseurs);
router.post('/', protect, checkPermission('suppliers.add'), createFournisseur);
router.put('/:id', protect, checkPermission('suppliers.edit'), updateFournisseur);
router.delete('/:id', protect, checkPermission('suppliers.delete'), deleteFournisseur);

module.exports = router;
