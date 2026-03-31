const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct, createBulkProducts, deleteAllProducts } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, getProducts);
router.post('/', protect, upload.single('image'), createProduct);
router.post('/bulk', protect, createBulkProducts);
router.delete('/all', protect, deleteAllProducts);
router.put('/:id', protect, upload.single('image'), updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
