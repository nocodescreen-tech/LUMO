const { Sale, Product, Client, Depense, Purchase } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

exports.getStats = async (req, res, next) => {
  try {
    const totalSales = await Sale.sum('montantTotal') || 0;
    const totalExpenses = await Depense.sum('montant') || 0;
    const totalPurchases = await Purchase.sum('montantTotal') || 0;
    const productCount = await Product.count();
    const clientCount = await Client.count();

    res.status(200).json({
      summary: {
        totalSales,
        totalExpenses,
        totalPurchases,
        netProfit: totalSales - totalExpenses - totalPurchases,
        productCount,
        clientCount
      }
    });
  } catch (error) {
    next(error);
  }
};
