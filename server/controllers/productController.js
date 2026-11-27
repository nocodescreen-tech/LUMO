const { pick,fail }=require('../utils/transactionSafety');
const inventory=require('../utils/inventoryService');
const Product = require('../models/Product');
const {sequelize}=require('../config/database');
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
    const { limit: l, offset } = getPagination(Math.max(1,Math.min(100000,parseInt(page)||1)),Math.max(1,Math.min(100,parseInt(limit)||10)));
    if(req.query.warehouseId!=null&&req.user.role!=='admin')throw fail('Sélection d’entrepôt réservée au propriétaire',403);
    const wh=await inventory.warehouse(tenantId,req.query.warehouseId);
    const locationSql=wh?'COALESCE((SELECT SUM(w.quantity) FROM "WarehouseBalances" w WHERE w."userId"="Product"."userId" AND w."productId"="Product".id AND w."warehouseId"='+Number(wh.id)+'),0)':'("Product".stock - COALESCE((SELECT SUM(w.quantity) FROM "WarehouseBalances" w WHERE w."userId"="Product"."userId" AND w."productId"="Product".id),0))';

    const lotSql='CASE WHEN EXISTS(SELECT 1 FROM "InventoryLots" l WHERE l."userId"="Product"."userId" AND l."productId"="Product".id) THEN COALESCE((SELECT SUM(l.quantity) FROM "InventoryLots" l WHERE l."userId"="Product"."userId" AND l."productId"="Product".id AND l."locationKey"='+Number(wh?.id||0)+' AND (l."expiresOn" IS NULL OR l."expiresOn">=(now() AT TIME ZONE \'Africa/Kinshasa\')::date)),0) ELSE '+locationSql+' END';
    const data = await Product.findAndCountAll({
      where: { userId: tenantId },
      attributes:{include:[[sequelize.literal('(\"Product\".stock - COALESCE((SELECT SUM(w.quantity) FROM \"WarehouseBalances\" w WHERE w.\"userId\"=\"Product\".\"userId\" AND w.\"productId\"=\"Product\".id),0))'),'unallocatedStock'],[sequelize.literal(lotSql),'availableStock']]},
      order: [['createdAt', 'DESC'],['id','DESC']],
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

    await sequelize.transaction(async transaction=>{
      const locked=await Product.findOne({where:{id:product.id,userId:tenantId},transaction,lock:transaction.LOCK.UPDATE});if(!locked)throw fail('Produit introuvable',404);
      const allocated=await inventory.allocated(locked,transaction);
      if(Object.hasOwn(updateData,'stock')&&Number(updateData.stock)!==Number(locked.stock)&&(allocated>0||await require('../utils/lotService').tracked(locked,transaction)))throw fail('Les produits affectés exigent un ajustement d’inventaire dédié',409);
      await locked.update(updateData,{transaction});Object.assign(product.dataValues,locked.dataValues);
    });
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
      const productData = pick(p,['nom','description','prix','prixVente','prixAchat','stock','stockAlerte','categorie','codeBarre','image','unite','devise','taxe','metadata','variantes']);
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
