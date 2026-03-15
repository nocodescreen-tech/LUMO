const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, getProducts);
router.post('/', protect, upload.single('image'), createProduct);
router.put('/:id', protect, upload.single('image'), updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
