const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct, createBulkProducts, deleteAllProducts } = require('../controllers/productController');
const { protect, authorize, checkPermission } = require('../middleware/authMiddleware');

const allowProductImport = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'superadmin') return next();
  const perms = req.user.permissions || [];
  if (perms.includes('products.import')) return next();
  return res.status(403).json({ message: 'Accès refusé. Permission requise : products.import' });
};

const globalStock=async(req,res,next)=>{try{await require('../utils/staffScope').restrictMutation(req.user);next()}catch(e){next(e)}};
const upload = require('../middleware/uploadMiddleware');
const { cacheMiddleware } = require('../utils/cache');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestion de l'inventaire
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Liste des produits de l'utilisateur
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste récupérée
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Product' }
 */
router.get('/', protect, checkPermission('products'), getProducts);

/**
 * @swagger
 * /api/products/all/history:
 *   get:
 *     summary: Obtenir tout l'historique des mouvements de stock
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Historique global récupéré
 */
router.get('/all/history', protect, checkPermission('products'), globalStock, require('../controllers/productController').getAllStockHistory);

/**
 * @swagger
 * /api/products/{id}/history:
 *   get:
 *     summary: Obtenir l'historique d'un produit spécifique
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Historique du produit récupéré
 */
router.get('/:id/history', protect, checkPermission('products'), globalStock, require('../controllers/productController').getProductHistory);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Créer un nouveau produit
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [nom, prix]
 *             properties:
 *               nom: { type: string }
 *               prix: { type: number }
 *               stock: { type: integer }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Produit créé
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 */
router.post('/', protect, checkPermission('products.add'), globalStock, upload.single('image'), createProduct);
router.put('/:id', protect, checkPermission('products.edit'), globalStock, upload.single('image'), updateProduct);
/**
 * @swagger
 * /api/products/bulk:
 *   post:
 *     summary: Importer des produits en masse (JSON)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products: { type: array, items: { type: object } }
 *     responses:
 *       201:
 *         description: Produits importés
 */
router.post('/bulk', protect, allowProductImport, globalStock, createBulkProducts);

/**
 * @swagger
 * /api/products/all:
 *   delete:
 *     summary: Supprimer TOUS les produits
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Inventaire vidé
 */
router.delete('/all', protect, checkPermission('products.delete'), (req,res)=>res.status(409).json({message:'La purge du stock est désactivée pour préserver la traçabilité.'}));
router.delete('/:id', protect, checkPermission('products.delete'), globalStock, deleteProduct);

module.exports = router;
