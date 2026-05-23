const { Sale, Product, Client, StaffPayment, User } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

const calculateGrowth = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

const toCDF = (amount, devise, rate) => {
  const safeAmount = Number(amount) || 0;
  const safeRate = Number(rate);
  if (devise === 'USD' && (!Number.isFinite(safeRate) || safeRate <= 0)) return 0;
  if (devise === 'USD') return Math.round(safeAmount * safeRate);
  return safeAmount;
};

const normalizeSaleMonetaryToCDF = (saleLike, shopCurrency = 'CDF', rate = 0) => {
  // montantTotal/profitNet are stored in shop base currency in SaleController
  // so conversion must use shop currency, not sale.devise (to avoid double conversion)
  const baseDevise = shopCurrency === 'USD' ? 'USD' : 'CDF';
  return {
    revenueCDF: toCDF(Number(saleLike.montantTotal || 0), baseDevise, rate),
    profitCDF: toCDF(Number(saleLike.profitNet || 0), baseDevise, rate),
  };
};

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const owner = await User.findByPk(userId, { attributes: ['entreprise', 'preferences'], raw: true });
    const shopCurrency = owner?.entreprise?.devise || 'CDF';
    const shopRate = Number(owner?.preferences?.exchangeRate);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      allSales,
      stockStats,
      clientStats,
      previousClientStats,
      lowStockProducts,
      expStats,
      expiringProductsRaw,
    ] = await Promise.all([
      Sale.findAll({
        where: { userId },
        attributes: ['montantTotal', 'profitNet', 'devise', 'tauxChange', 'createdAt'],
        raw: true,
      }),
      Product.findOne({
        where: { userId },
        attributes: [
          [sequelize.literal('SUM(CAST("prix" AS NUMERIC) * "stock")'), 'totalValue'],
          [sequelize.literal('SUM(CAST("prixAchat" AS NUMERIC) * "stock")'), 'totalCost'],
          [sequelize.literal('COUNT(CASE WHEN "stock" <= "stockAlerte" THEN 1 END)'), 'lowStock'],
        ],
        raw: true,
      }),
      Client.count({ where: { userId } }),
      Client.count({ where: { userId, createdAt: { [Op.lt]: thirtyDaysAgo } } }),
      Product.findAll({
        where: { userId, stock: { [Op.lte]: sequelize.col('stockAlerte') } },
        attributes: ['nom', 'stock'],
        limit: 3,
        raw: true,
      }),
      StaffPayment.findOne({
        where: { userId },
        attributes: [[sequelize.literal('SUM("amount")'), 'total']],
        raw: true,
      }),
      Product.findAll({
        where: { userId },
        attributes: ['nom', 'metadata'],
        raw: true,
      }),
    ]);

    let revAll = 0;
    let profAll = 0;
    let revCurrent = 0;
    let profCurrent = 0;
    let revPrevious = 0;
    let profPrevious = 0;

    allSales.forEach((sale) => {
      const { revenueCDF, profitCDF } = normalizeSaleMonetaryToCDF(sale, shopCurrency, shopRate);
      const createdAt = new Date(sale.createdAt);

      revAll += revenueCDF;
      profAll += profitCDF;

      if (createdAt >= thirtyDaysAgo) {
        revCurrent += revenueCDF;
        profCurrent += profitCDF;
      } else if (createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo) {
        revPrevious += revenueCDF;
        profPrevious += profitCDF;
      }
    });

    const stockCostAll = parseFloat(stockStats?.totalCost || 0);
    const expAll = parseFloat(expStats?.total || 0);
    const netMargin = profAll;
    const marginPercent = revAll > 0 ? Math.round((profAll / revAll) * 10000) / 100 : 0;

    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringProducts = expiringProductsRaw
      .filter((p) => {
        if (!p.metadata || !p.metadata.dateExpiration) return false;
        const expDate = new Date(p.metadata.dateExpiration);
        return expDate <= thirtyDaysFromNow;
      })
      .map((p) => ({
        nom: p.nom,
        dateExpiration: p.metadata.dateExpiration,
        isExpired: new Date(p.metadata.dateExpiration) < now,
      }));

    const rawRecentSales = await Sale.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    const recentSales = rawRecentSales.map((sale) => {
      const plain = sale.toJSON();
      const normalized = normalizeSaleMonetaryToCDF(plain, shopCurrency, shopRate);
      return {
        ...plain,
        montantCDF: normalized.revenueCDF,
        profitCDF: normalized.profitCDF,
      };
    });

    res.json({
      summary: {
        revenue: revAll,
        profitNetEstimation: netMargin,
        marginPercent,
        totalExpenses: expAll,
        stockValue: parseFloat(stockStats?.totalValue || 0),
        stockCost: stockCostAll,
        lowStockCount: parseInt(stockStats?.lowStock || 0, 10),
        lowStockProducts,
        expiringProductsCount: expiringProducts.length,
        expiringProducts,
        totalClients: clientStats,
        revenueTrend: calculateGrowth(revCurrent, revPrevious),
        profitTrend: calculateGrowth(profCurrent, profPrevious),
        clientsTrend: calculateGrowth(clientStats, previousClientStats),
      },
      recentSales,
    });
  } catch (error) {
    next(error);
  }
};

const getSalesChartData = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const period = req.query.period || '7d';

    let interval = '7d';
    let dateExpr = sequelize.fn('DATE', sequelize.col('createdAt'));
    if (period === 'today') {
      interval = '1d';
      dateExpr = sequelize.literal("DATE_TRUNC('hour', \"createdAt\")");
    } else if (period === '30d') {
      interval = '30d';
    }

    const stats = await Sale.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: sequelize.literal(`NOW() - INTERVAL '${interval}'`) },
      },
      attributes: [
        [dateExpr, 'date'],
        [sequelize.literal('SUM("montantTotal")'), 'total'],
      ],
      group: [dateExpr],
      order: [[dateExpr, 'ASC']],
    });
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const owner = await User.findByPk(userId, { attributes: ['entreprise', 'preferences'], raw: true });
    const shopCurrency = owner?.entreprise?.devise || 'CDF';
    const shopRate = Number(owner?.preferences?.exchangeRate);
    const now = new Date();
    const period = req.query.period || '7d';

    let interval = '7d';
    if (period === 'today') interval = '1d';
    else if (period === '30d') interval = '30d';
    else if (period === '1y') interval = '1y';

    const periodSales = await Sale.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: sequelize.literal(`NOW() - INTERVAL '${interval}'`) },
      },
      attributes: ['createdAt', 'montantTotal', 'devise', 'tauxChange'],
      raw: true,
    });

    const dateMap = {};
    periodSales.forEach((s) => {
      const { revenueCDF } = normalizeSaleMonetaryToCDF(s, shopCurrency, shopRate);
      let dateKey;
      if (period === 'today') {
        const d = new Date(s.createdAt);
        d.setMinutes(0, 0, 0);
        dateKey = d.toISOString();
      } else if (period === '1y') {
        const d = new Date(s.createdAt);
        dateKey = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      } else {
        dateKey = new Date(s.createdAt).toISOString().slice(0, 10);
      }

      if (!dateMap[dateKey]) dateMap[dateKey] = { date: dateKey, revenue: 0, expenses: 0 };
      dateMap[dateKey].revenue += revenueCDF;
    });

    const periodData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    const products = await Product.findAll({ where: { userId } });
    const categoryMap = {};
    products.forEach((p) => {
      const cat = p.categorie || 'Autre';
      if (!categoryMap[cat]) categoryMap[cat] = 0;
      categoryMap[cat] += p.stock;
    });
    const stockByCategory = Object.entries(categoryMap).map(([label, value], id) => ({ id, label, value }));

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlySales = await Sale.findAll({
      where: { userId, createdAt: { [Op.gte]: sixMonthsAgo } },
      attributes: ['createdAt', 'montantTotal', 'devise', 'tauxChange'],
      raw: true,
    });

    const monthlyBucket = {};
    monthlySales.forEach((sale) => {
      const d = new Date(sale.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const { revenueCDF } = normalizeSaleMonetaryToCDF(sale, shopCurrency, shopRate);
      monthlyBucket[key] = (monthlyBucket[key] || 0) + revenueCDF;
    });

    const monthlyLabels = [];
    const monthlyValues = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyLabels.push(d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
      monthlyValues.push(monthlyBucket[`${d.getFullYear()}-${d.getMonth()}`] || 0);
    }

    let topProducts = [];
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const recentSales = await Sale.findAll({
        where: { userId, createdAt: { [Op.gte]: oneMonthAgo } },
        attributes: ['articles', 'devise', 'tauxChange'],
      });

      const productStats = {};
      recentSales.forEach((sale) => {
        const saleDevise = sale.devise || 'CDF';
        const saleRate = Number(sale.tauxChange || shopRate);
        const articles = sale.articles || [];

        articles.forEach((item) => {
          const nom = item.nom || 'Inconnu';
          const quantite = Number(item.quantite) || 0;
          const itemDevise = item.deviseOrigine || saleDevise;
          const itemRate = Number(item.tauxChange || saleRate);
          const prixUnitaire = Number(item.prixUnitaire) || 0;
          const prixAchat = Number(item.prixAchat) || 0;
          const revenuCDF = toCDF(prixUnitaire * quantite, itemDevise, itemRate);
          const coutAchatCDF = toCDF(prixAchat * quantite, itemDevise, itemRate);

          if (!productStats[nom]) productStats[nom] = { nom, quantite: 0, revenu: 0, margeNette: 0 };
          productStats[nom].quantite += quantite;
          productStats[nom].revenu += revenuCDF;
          productStats[nom].margeNette += (revenuCDF - coutAchatCDF);
        });
      });

      topProducts = Object.values(productStats).sort((a, b) => b.quantite - a.quantite).slice(0, 5);
    } catch (error) {
      console.warn('[LUMO_STATS] topProducts calculation failed:', error.message);
      topProducts = [];
    }

    res.json({
      periodData,
      stockByCategory,
      monthlyRevenue: { labels: monthlyLabels, values: monthlyValues },
      topProducts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getSalesChartData, getAnalytics };
