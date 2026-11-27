const express = require('express');
const router = express.Router();
const { getPurchases, createPurchase, updatePurchase, deletePurchase } = require('../controllers/purchaseController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Purchases
 *   description: Achats fournisseurs et approvisionnement
 */

/**
 * @swagger
 * /api/purchases:
 *   get:
 *     summary: Liste des achats effectués
 *     tags: [Purchases]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste récupérée
 */
router.get('/', protect, checkPermission('purchases'), getPurchases);

/**
 * @swagger
 * /api/purchases:
 *   post:
 *     summary: Enregistrer un achat et mettre à jour le stock
 *     tags: [Purchases]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Achat enregistré et produits créés/mis à jour
 */
router.post('/', protect, checkPermission('purchases.add'), createPurchase);

router.put('/:id', protect, checkPermission('purchases.edit'), updatePurchase);
router.delete('/:id', protect, checkPermission('purchases.delete'), deletePurchase);

module.exports = router;
