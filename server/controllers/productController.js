const Product = require('../models/Product');
const { uploadImage } = require('../utils/cloudinary');
const { logActivite } = require('./activiteController');
const { validateProduct } = require('../middleware/validators');
const { getPagination, getPagingData } = require('../utils/pagination');
const { invalidateCache } = require('../utils/cache');
const { sendResponse } = require('../utils/response');

exports.getProducts = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { page, limit } = req.query;
    const { limit: l, offset } = getPagination(page, limit);

    const data = await Product.findAndCountAll({
      where: { userId: tenantId },
      order: [['createdAt', 'DESC']],
      limit: l,
      offset
    });

    // Sécurité : masquer le prix d'achat pour les caissiers
    if (req.user.role === 'caissier') {
      data.rows = data.rows.map(p => {
        const product = p.get({ clone: true });
        delete product.prixAchat;
        return product;
      });
    }

    const response = getPagingData(data, page, l);
    sendResponse(res, 200, response, 'Produits récupérés avec succès');
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  const { error } = validateProduct(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const tenantId = req.user.tenantId;
    const productData = { ...req.body, userId: tenantId, creatorId: req.user.id };
    // Le frontend envoie 'prixVente', mais la colonne BD est 'prix'
    if (productData.prixVente !== undefined && productData.prix === undefined) {
      productData.prix = productData.prixVente;
    }
    delete productData.prixVente;
    if (!productData.codeBarre) productData.codeBarre = null;
    if (typeof productData.variantes === 'string') {
      try { productData.variantes = JSON.parse(productData.variantes); } catch(e) { productData.variantes = []; }
    }
    if (req.file) {
      productData.image = await uploadImage(req.file.buffer, 'products', req.file.mimetype);
    }
    const product = await Product.create(productData);
    await logActivite(req.user.id, 'PRODUIT', `Création du produit: ${product.nom}`, 'System', tenantId);
    
    // Invalidation du cache
    await invalidateCache('products');
    await invalidateCache('stats');
    
    sendResponse(res, 201, product, 'Produit créé avec succès');
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  const { error } = validateProduct(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const tenantId = req.user.tenantId;
    const product = await Product.findOne({ where: { id: req.params.id, userId: tenantId } });
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    
    const updateData = { ...req.body };
    // Le frontend envoie 'prixVente', mais la colonne BD est 'prix'
    if (updateData.prixVente !== undefined && updateData.prix === undefined) {
      updateData.prix = updateData.prixVente;
    }
    delete updateData.prixVente;
    if (!updateData.codeBarre) updateData.codeBarre = null;
    if (typeof updateData.variantes === 'string') {
      try { updateData.variantes = JSON.parse(updateData.variantes); } catch(e) { updateData.variantes = []; }
    }
    if (req.file) {
      updateData.image = await uploadImage(req.file.buffer, 'products', req.file.mimetype);
    }
    
    await product.update(updateData);
    await logActivite(req.user.id, 'PRODUIT', `Mise à jour du produit: ${product.nom}`, 'System', tenantId);
    
    // Invalidation du cache
    await invalidateCache('products');
    await invalidateCache('stats');
    
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const product = await Product.findOne({ where: { id: req.params.id, userId: tenantId } });
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    const nomProduit = product.nom;
    await product.destroy();
    await logActivite(req.user.id, 'PRODUIT', `Suppression du produit: ${nomProduit}`, 'System', tenantId);
    
    // Invalidation du cache
    await invalidateCache('products');
    await invalidateCache('stats');
    
    res.status(200).json({ message: 'Produit supprimé' });
  } catch (error) {
    next(error);
  }
};

exports.createBulkProducts = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    // B7 Fix: strip empty/null codeBarre to avoid unique constraint crashes on duplicates
    const products = req.body.products.map(p => ({
      ...p,
      userId: tenantId,
      codeBarre: p.codeBarre?.trim() || null,
    }));
    const createdProducts = await Product.bulkCreate(products, {
      updateOnDuplicate: ['nom', 'prix', 'prixAchat', 'stock', 'categorie', 'description', 'variantes'],
      ignoreDuplicates: false, 
      individualHooks: true
    });
    
    
    // Invalidation du cache
    await invalidateCache('products');
    await invalidateCache('stats');
    
    sendResponse(res, 201, createdProducts, `${createdProducts.length} produits importés`);
  } catch (error) {
    next(error);
  }
};

exports.deleteAllProducts = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { StockMovement } = require('../models');
    await StockMovement.destroy({ where: { userId: tenantId } });
    await Product.destroy({ where: { userId: tenantId }, force: true });
    await logActivite(req.user.id, 'PRODUIT', 'Suppression de TOUS les produits et de l\'historique stock', 'System', tenantId);
    
    // Invalidation du cache
    await invalidateCache('products');
    await invalidateCache('stats');
    
    res.status(200).json({ message: 'Tous vos produits ont été supprimés' });
  } catch (error) {
    next(error);
  }
};

exports.getProductHistory = async (req, res, next) => {
  try {
    const { StockMovement } = require('../models');
    const movements = await StockMovement.findAll({
      where: { productId: req.params.id, userId: req.user.tenantId },
      include: [{ model: require('../models').Product, as: 'product' }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.status(200).json(movements);
  } catch (error) {
    next(error);
  }
};

exports.getAllStockHistory = async (req, res, next) => {
  try {
    const { StockMovement, Product } = require('../models');
    const movements = await StockMovement.findAll({
      where: { userId: req.user.tenantId },
      include: [{ model: Product, as: 'product', attributes: ['nom', 'image'] }],
      order: [['createdAt', 'DESC']],
      limit: 500
    });
    res.status(200).json(movements);
  } catch (error) {
    next(error);
  }
};
