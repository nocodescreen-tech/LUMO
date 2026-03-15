const { Purchase } = require('../models');

exports.getPurchases = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const purchases = await Purchase.findAll({ 
      where: { userId },
      order: [['createdAt', 'DESC']] 
    });
    res.status(200).json(purchases);
  } catch (error) {
    next(error);
  }
};

exports.createPurchase = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const payload = {
      userId,
      fournisseurId: req.body.fournisseurId,
      numeroFacture: req.body.numeroFacture,
      description: req.body.description,
      montantTotal: req.body.montantTotal,
      statut: req.body.statut,
    };
    const purchase = await Purchase.create(payload);
    res.status(201).json(purchase);
  } catch (error) {
    next(error);
  }
};
