const { Sale, Product, Client } = require('../models');

exports.getSales = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sales = await Sale.findAll({ 
      where: { userId },
      order: [['createdAt', 'DESC']] 
    });
    res.status(200).json(sales);
  } catch (error) {
    next(error);
  }
};

exports.createSale = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items, montantTotal, methodePaiement, clientId, clientInfo } = req.body;

    // Déduction du stock pour chaque ligne d'article
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const product = await Product.findByPk(item.id);
        if (product) {
          product.stock -= item.quantite;
          await product.save();
        }
      }
    }

    // Normalisation des articles pour le modèle Sale enrichi
    const articles = Array.isArray(items)
      ? items.map((item) => ({
          id: item.id,
          nom: item.nom,
          prixUnitaire: item.prix,
          quantite: item.quantite,
          prixAchat: item.prixAchat || 0,
        }))
      : [];

    // Auto-créer ou trouver le client si nom/téléphone fourni
    let resolvedClientId = clientId || null;
    if (!resolvedClientId && clientInfo && clientInfo.nom && clientInfo.nom.trim() !== 'Client de passage') {
      const existingClient = clientInfo.telephone
        ? await Client.findOne({ where: { telephone: clientInfo.telephone.trim(), userId } })
        : null;

      if (existingClient) {
        resolvedClientId = existingClient.id;
      } else {
        const newClient = await Client.create({
          nom: clientInfo.nom.trim(),
          telephone: clientInfo.telephone?.trim() || '',
          email: clientInfo.email?.trim() || '',
          userId
        });
        resolvedClientId = newClient.id;
      }
    }

    const sale = await Sale.create({
      userId,
      clientId: resolvedClientId,
      articles,
      montantTotal,
      remise: 0,
      methodePaiement: methodePaiement || 'Espèces',
      clientInfo: clientInfo || { nom: 'Client de passage', email: '' },
    });

    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
};

exports.deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: "Vente non trouvée" });
    }
    
    // On pourrait réincrémenter le stock ici si nécessaire
    // if (sale.articles) { ... }

    await sale.destroy();
    res.status(200).json({ message: "Vente supprimée avec succès" });
  } catch (error) {
    next(error);
  }
};
