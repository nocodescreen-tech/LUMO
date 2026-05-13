const { Purchase, Product } = require('../models');
const { validatePurchase } = require('../middleware/validators');
const { logActivite } = require('./activiteController');
const { getPagination, getPagingData } = require('../utils/pagination');
const { User } = require('../models');
const { convertCurrency } = require('../utils/currency');
const { sendResponse } = require('../utils/response');

exports.getPurchases = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const { page, limit } = req.query;
    const { limit: l, offset } = getPagination(page, limit);

    const data = await Purchase.findAndCountAll({ 
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: l,
      offset
    });

    const response = getPagingData(data, page, l);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, response, 'Achats récupérés');
  } catch (error) {
    next(error);
  }
};

exports.createPurchase = async (req, res, next) => {
  const { error } = validatePurchase(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const userId = req.user.tenantId;
    let { articles, fournisseurId, numeroFacture, description, montantTotal, statut, devise } = req.body;
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
        return res.status(400).json({ message: 'La liste des articles ne peut pas être vide.' });
    }

    // Optimisation N+1 : Récupérer tous les produits en une seule requête
    const productIds = articles.filter(a => a.id).map(a => a.id);
    const existingProducts = await Product.findAll({ where: { id: productIds, userId } });
    const productMap = existingProducts.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

    for (let i = 0; i < articles.length; i++) {
        let item = articles[i];
        if (item.id && productMap[item.id]) {
            const product = productMap[item.id];
            product.stockUpdateRaison = 'Achat Fournisseur';
            product.stock += (item.quantite || 0);
            if (item.prixAchat) product.prixAchat = item.prixAchat;
            await product.save();
        } else if (item.nom) {
            const newProduct = await Product.create({
                userId,
                nom: item.nom,
                prix: item.prix || item.prixAchat || 0,
                prixAchat: item.prixAchat || 0,
                stock: item.quantite || 0,
                stockUpdateRaison: 'Achat Fournisseur (Nouveau)'
            });
            articles[i].id = newProduct.id;
        }
    }

    // Mise à jour de la session de caisse active
    const { CashSession } = require('../models');
    const activeSession = await CashSession.findOne({ 
      where: { userId, status: 'OPEN' } 
    });

    if (activeSession) {
      const owner = await User.findByPk(userId);
      const rate = owner.entreprise?.exchangeRate || 2800;
      const sessionDevise = owner.entreprise?.devise || 'CDF';
      
      const montantConverti = convertCurrency(montantTotal, devise || 'USD', sessionDevise, rate);
      activeSession.expectedBalance = Number(activeSession.expectedBalance || 0) - Number(montantConverti);
      await activeSession.save();
    }

    const payload = {
      userId,
      fournisseurId,
      numeroFacture,
      description,
      montantTotal,
      statut,
      devise,
      articles
    };
    
    const purchase = await Purchase.create(payload);
    await logActivite(req.user.id, 'ACHAT', `Nouvel achat: ${purchase.numeroFacture} (${purchase.montantTotal} ${purchase.devise})`, 'System', userId);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 201, purchase, 'Achat enregistré');
  } catch (error) {
    console.error("Erreur lors de la création de l'achat:", error);
    next(error);
  }
};

exports.updatePurchase = async (req, res, next) => {
  const { error } = validatePurchase(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const userId = req.user.tenantId;
    const purchase = await Purchase.findOne({ where: { id: req.params.id, userId } });
    if (!purchase) return res.status(404).json({ message: 'Achat non trouvé' });
    
    await purchase.update(req.body);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, purchase, 'Achat mis à jour');
  } catch (error) {
    next(error);
  }
};

exports.deletePurchase = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const purchase = await Purchase.findOne({ where: { id: req.params.id, userId } });
    if (!purchase) return res.status(404).json({ message: 'Achat non trouvé' });
    
    // Décrémenter le stock si l'achat est annulé
    if (purchase.articles && Array.isArray(purchase.articles)) {
        for (const item of purchase.articles) {
            if (item.id) {
               const product = await Product.findByPk(item.id);
               if (product) {
                  product.stockUpdateRaison = 'Annulation Achat Fournisseur';
                  product.stock = Math.max(0, product.stock - (item.quantite || 0));
                  await product.save();
               }
            }
        }
    }

    const numFacture = purchase.numeroFacture;
    await purchase.destroy();
    await logActivite(req.user.id, 'ACHAT', `Suppression achat: ${numFacture}`, 'System', userId);
    const { sendResponse } = require('../utils/response');
    sendResponse(res, 200, null, 'Achat supprimé');
  } catch (error) {
    next(error);
  }
};
