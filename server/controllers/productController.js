const { pick,fail }=require('../utils/transactionSafety');
const inventory=require('../utils/inventoryService');
const Product = require('../models/Product');
const { uploadImage } = require('../utils/cloudinary');
const { logActivite } = require('./activiteController');
const { validateProduct } = require('../middleware/validators');
const { getPagination, getPagingData } = require('../utils/pagination');
const { invalidateCache } = require('../utils/cache');
const { sendResponse } = require('../utils/response');

const normalizeCurrency = (currency) => {
  const normalized = String(currency || '').toUpperCase();
  if (normalized === 'FC') return 'CDF';
  return normalized === 'USD' ? 'USD' : 'CDF';
};

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
    if (['caissier','vendeur'].includes(req.user.role)||(!['admin','superadmin'].includes(req.user.role)&&!(req.user.permissions||[]).includes('products.view_purchase_price'))) {
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
    const productData = { ...pick(req.body,['nom','description','prix','prixVente','prixAchat','stock','stockAlerte','categorie','codeBarre','image','unite','devise','taxe','metadata','variantes']), userId: tenantId, creatorId: req.user.id };
    // Le frontend envoie 'prixVente', mais la colonne BD est 'prix'
    if (productData.prixVente !== undefined && productData.prix === undefined) {
      productData.prix = productData.prixVente;
    }
    delete productData.prixVente;
    if (!productData.codeBarre) productData.codeBarre = null;
    if (typeof productData.variantes === 'string') {
      try { productData.variantes = JSON.parse(productData.variantes); } catch (e) { productData.variantes = []; }
    }
    if (typeof productData.metadata === 'string') {
      try { productData.metadata = JSON.parse(productData.metadata); } catch (e) { productData.metadata = {}; }
    }
    if (req.file) {
      productData.image = await uploadImage(req.file.buffer, 'products', req.file.mimetype);
    }
    if (productData.devise) productData.devise = normalizeCurrency(productData.devise);
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

    const updateData = pick(req.body,['nom','description','prix','prixVente','prixAchat','stock','stockAlerte','categorie','codeBarre','image','unite','devise','taxe','metadata','variantes']);
    // Le frontend envoie 'prixVente', mais la colonne BD est 'prix'
    if (updateData.prixVente !== undefined && updateData.prix === undefined) {
      updateData.prix = updateData.prixVente;
    }
    delete updateData.prixVente;
    if (!updateData.codeBarre) updateData.codeBarre = null;
    if (typeof updateData.variantes === 'string') {
      try { updateData.variantes = JSON.parse(updateData.variantes); } catch (e) { updateData.variantes = []; }
    }
    if (typeof updateData.metadata === 'string') {
      try { updateData.metadata = JSON.parse(updateData.metadata); } catch (e) { updateData.metadata = {}; }
    }
    if (req.file) {
      updateData.image = await uploadImage(req.file.buffer, 'products', req.file.mimetype);
    }
    if (updateData.devise) updateData.devise = normalizeCurrency(updateData.devise);

    if(Object.hasOwn(updateData,'stock')&&Number(updateData.stock)<await inventory.allocated(product))throw fail('Le stock total ne peut pas être inférieur aux quantités affectées',409);
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
    return res.status(409).json({message:'Suppression définitive indisponible : archivage requis pour préserver l’historique.'});
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
    if (!Array.isArray(req.body?.products) || req.body.products.length === 0) {
      return res.status(400).json({ message: 'Liste de produits invalide ou vide' });
    }
    if (req.body.products.length > 1000) {
      return res.status(400).json({ message: 'Maximum 1000 produits par import' });
    }

    const products = req.body.products.map(p => {
      const productData = { ...p };
      if (productData.prixVente !== undefined && productData.prix === undefined) {
        productData.prix = productData.prixVente;
      }
      delete productData.prixVente;
      productData.devise = normalizeCurrency(productData.devise);
      return {
        ...productData,
        userId: tenantId,
        codeBarre: productData.codeBarre?.trim() || null,
      };
    });

    const createdProducts = [];
    const skippedCount = { value: 0 };

    for (const p of products) {
      const barcode = p.codeBarre;
      const name = p.nom?.trim();

      let existing = null;
      if (barcode) {
        existing = await Product.findOne({ where: { codeBarre: barcode, userId: tenantId } });
      }
      if (!existing && name) {
        existing = await Product.findOne({ where: { nom: name, userId: tenantId } });
      }

      if (existing) {
        skippedCount.value++;
        continue;
      }

      try {
        const created = await Product.create(p, { individualHooks: true });
        createdProducts.push(created);
      } catch (err) {
        skippedCount.value++;
      }
    }

    await invalidateCache('products');
    await invalidateCache('stats');

    const message = `${createdProducts.length} produits importés${skippedCount.value > 0 ? `, ${skippedCount.value} ignorés (doublons)` : ''}`;
    sendResponse(res, 201, createdProducts, message);
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
