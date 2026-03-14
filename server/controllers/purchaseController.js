const Purchase = require('../models/Purchase');

exports.getPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json(purchases);
  } catch (error) {
    next(error);
  }
};

exports.createPurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.create(req.body);
    res.status(201).json(purchase);
  } catch (error) {
    next(error);
  }
};
