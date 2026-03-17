const Product = require('../models/Product');
const { uploadImage } = require('../utils/cloudinary');

exports.getProducts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const products = await Product.findAll({ 
      where: { userId },
      order: [['createdAt', 'DESC']] 
    });
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productData = { ...req.body, userId };
    if (req.file) {
      productData.image = await uploadImage(req.file.buffer, 'products', req.file.mimetype);
    }
    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const product = await Product.findOne({ where: { id: req.params.id, userId } });
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = await uploadImage(req.file.buffer, 'products', req.file.mimetype);
    }
    
    await product.update(updateData);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const product = await Product.findOne({ where: { id: req.params.id, userId } });
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    await product.destroy();
    res.status(200).json({ message: 'Produit supprimé' });
  } catch (error) {
    next(error);
  }
};

exports.createBulkProducts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const products = req.body.products.map(p => ({ ...p, userId }));
    const createdProducts = await Product.bulkCreate(products);
    res.status(201).json(createdProducts);
  } catch (error) {
    next(error);
  }
};
