const express = require('express');
const router = express.Router();
const { getSales, createSale, deleteSale, deleteAllSales, updateSale, refundSale } = require('../controllers/SaleController');
const { protect, authorize, checkPermission } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Gestion des ventes et transactions
 */
 
/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Liste des ventes
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste récupérée
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Sale' }
 */
router.get('/', protect, checkPermission('sales'), getSales);
 
/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Créer une vente (POS)
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, montantTotal, methodePaiement]
 *             properties:
 *               clientId: { type: integer }
 *               items: { type: array, items: { type: object } }
 *               montantTotal: { type: number }
 *               methodePaiement: { type: string }
 *     responses:
 *       201:
 *         description: Vente créée
 */
router.post('/', protect, checkPermission('pos'), createSale);
 
/**
 * @swagger
 * /api/sales/{id}/refund:
 *   post:
 *     summary: Rembourser une vente
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Vente remboursée et stock restitué
 */
router.post('/:id/refund', protect, checkPermission('sales.refund'), refundSale);

/**
 * @swagger
 * /api/sales/all:
 *   delete:
 *     summary: Vider tout l'historique des ventes
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Historique vidé
 */
router.delete('/all', protect, authorize('admin', 'superadmin'), deleteAllSales);

/**
 * @swagger
 * /api/sales/{id}:
 *   put:
 *     summary: Modifier une vente
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Vente mise à jour
 */
router.put('/:id', protect, checkPermission('sales'), updateSale);

/**
 * @swagger
 * /api/sales/{id}:
 *   delete:
 *     summary: Supprimer une vente spécifique
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Vente supprimée
 */
router.delete('/:id', protect, checkPermission('sales.delete'), deleteSale);

module.exports = router;
