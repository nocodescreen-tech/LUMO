const express = require('express');
const router = express.Router();
const { getClients, createClient, updateClient, deleteClient, settleDebt, sendReminder, getClientSales, deleteAllClients } = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Gestion de la clientèle et de la fidélité
 */

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Liste des clients
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste récupérée
 */
router.get('/', protect, getClients);

/**
 * @swagger
 * /api/clients/all:
 *   delete:
 *     summary: Supprimer TOUS les clients
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Base client vidée
 */
router.delete('/all', protect, deleteAllClients);

/**
 * @swagger
 * /api/clients/{id}/sales:
 *   get:
 *     summary: Historique d'achats d'un client
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Historique récupéré
 */
router.get('/:id/sales', protect, getClientSales);

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Créer un client
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Client créé
 */
router.post('/', protect, createClient);

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Modifier un client
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Client mis à jour
 */
router.put('/:id', protect, updateClient);

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Supprimer un client
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Client supprimé
 */
router.delete('/:id', protect, deleteClient);

/**
 * @swagger
 * /api/clients/{id}/regler:
 *   post:
 *     summary: Régler une dette client
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dette mise à jour
 */
router.post('/:id/regler', protect, settleDebt);

/**
 * @swagger
 * /api/clients/{id}/rappel:
 *   post:
 *     summary: Envoyer un rappel de dette (SMS/Email)
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Rappel envoyé
 */
router.post('/:id/rappel', protect, sendReminder);

module.exports = router;
