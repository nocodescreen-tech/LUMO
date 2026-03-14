const { Sale, Product } = require('../models');

exports.getSales = async (req, res, next) => {
  try {
    const sales = await Sale.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json(sales);
  } catch (error) {
    next(error);
  }
};

exports.createSale = async (req, res, next) => {
  try {
    const { items, montantTotal, methodePaiement, clientId, clientInfo } = req.body;
    
    // On pourrait ici déduire le stock pour chaque item
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const product = await Product.findByPk(item.id);
        if (product) {
          product.stock -= item.quantite;
          await product.save();
        }
      }
    }

    const sale = await Sale.create({
      items,
      montantTotal,
      methodePaiement,
      clientId,
      clientInfo
    });

    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
};
