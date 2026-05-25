const { Sale, Product, Client } = require('../models');
const { Op } = require('sequelize');
const { sendResponse } = require('../utils/response');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const notRefunded = {
  [Op.and]: [
    { statut: { [Op.ne]: 'Remboursée' } },
    { statut: { [Op.notILike]: '%rembours%' } },
  ],
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;

    const [totalSales, totalRevenue, completedRevenue, totalProducts, totalClients, lowStockCount, totalProfit, recentSales] = await Promise.all([
      Sale.count({ where: { userId, ...notRefunded } }),
      Sale.sum('montantTotal', { where: { userId, ...notRefunded } }),
      Sale.sum('montantTotal', { where: { userId, statut: { [Op.in]: ['Terminée', 'Complétée'] } } }),
      Product.count({ where: { userId } }),
      Client.count({ where: { userId } }),
      Product.count({ where: { userId, stock: { [Op.lt]: 10 } } }),
      Sale.sum('profitNet', { where: { userId, ...notRefunded } }),
      Sale.findAll({
        where: { userId, ...notRefunded },
        attributes: ['id', 'montantTotal', 'methodePaiement', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 8,
        raw: true,
      }),
    ]);

    const sales = Number(totalSales || 0);
    const revenue = Number(totalRevenue || 0);
    const completed = Number(completedRevenue || 0);
    const profit = Number(totalProfit || 0);
    const marginPercent = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(2)) : 0;

    return sendResponse(
      res,
      200,
      {
        summary: {
          revenue,
          profitNetEstimation: profit,
          marginPercent,
          totalClients: Number(totalClients || 0),
          lowStockCount: Number(lowStockCount || 0),
          totalProducts: Number(totalProducts || 0),
          totalSales: sales,
          completedRevenue: completed,
          averageOrderValue: sales > 0 ? revenue / sales : 0,
        },
        recentSales: recentSales.map((sale) => ({
          ...sale,
          montantCDF: Number(sale.montantTotal || 0),
        })),
      },
      'Statistiques du dashboard recuperees'
    );
  } catch (error) {
    next(error);
  }
};

exports.getSalesChartData = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const { period = 'month' } = req.query;

    let truncUnit = 'month';
    let lookbackDays = 183;

    if (period === 'today') {
      truncUnit = 'day';
      lookbackDays = 1;
    } else if (period === '7d' || period === 'day') {
      truncUnit = 'day';
      lookbackDays = 7;
    } else if (period === '30d') {
      truncUnit = 'day';
      lookbackDays = 30;
    } else if (period === 'week') {
      truncUnit = 'week';
      lookbackDays = 180;
    }

    const startDate = new Date(Date.now() - lookbackDays * MS_PER_DAY);

    const data = await Sale.findAll({
      where: {
        userId,
        ...notRefunded,
        createdAt: { [Op.gte]: startDate, [Op.lt]: new Date() },
      },
      attributes: [
        [Sale.sequelize.fn('DATE_TRUNC', truncUnit, Sale.sequelize.col('createdAt')), 'period'],
        [Sale.sequelize.fn('COUNT', Sale.sequelize.col('id')), 'totalCommandes'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('montantTotal')), 'revenue'],
        [Sale.sequelize.fn('AVG', Sale.sequelize.col('montantTotal')), 'prixMoyen'],
      ],
      group: ['period'],
      order: [['period', 'ASC']],
      raw: true,
    });

    return sendResponse(res, 200, { period: truncUnit, data }, 'Donnees graphiques de ventes recuperees');
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const { period = '7d', startDate, endDate } = req.query;

    const now = new Date();
    let fromDate = new Date(Date.now() - 7 * MS_PER_DAY);
    if (period === 'today') fromDate = new Date(Date.now() - 1 * MS_PER_DAY);
    if (period === '30d') fromDate = new Date(Date.now() - 30 * MS_PER_DAY);
    if (period === '1y') fromDate = new Date(Date.now() - 365 * MS_PER_DAY);
    if (startDate && endDate) fromDate = new Date(startDate);

    const toDate = endDate ? new Date(endDate) : now;
    const where = {
      userId,
      ...notRefunded,
      createdAt: { [Op.gte]: fromDate, [Op.lte]: toDate },
    };

    const sales = await Sale.findAll({
      where,
      attributes: ['id', 'articles', 'montantTotal', 'createdAt'],
      order: [['createdAt', 'ASC']],
      raw: true,
    });

    const periodByDay = {};
    const topProductsMap = {};
    let totalRevenue = 0;

    for (const s of sales) {
      const amount = Number(s.montantTotal || 0);
      totalRevenue += amount;

      const key = new Date(s.createdAt).toISOString().slice(0, 10);
      if (!periodByDay[key]) periodByDay[key] = { date: key, revenue: 0, total: 0 };
      periodByDay[key].revenue += amount;
      periodByDay[key].total += amount;

      const items = Array.isArray(s.articles) ? s.articles : [];
      for (const item of items) {
        const nom = item?.nom || 'Produit';
        const quantite = Number(item?.quantite || 0);
        const revenu = Number(item?.totalLigneCDF || ((item?.prixUnitaire || 0) * quantite) || 0);
        if (!topProductsMap[nom]) topProductsMap[nom] = { nom, quantite: 0, revenu: 0 };
        topProductsMap[nom].quantite += quantite;
        topProductsMap[nom].revenu += revenu;
      }
    }

    const stockByCategoryRaw = await Product.findAll({
      where: { userId },
      attributes: [
        [Product.sequelize.fn('COALESCE', Product.sequelize.col('categorie'), 'Sans categorie'), 'label'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('stock')), 'value'],
      ],
      group: ['categorie'],
      raw: true,
    });

    const monthlyRevenueRows = await Sale.findAll({
      where: {
        userId,
        ...notRefunded,
        createdAt: { [Op.gte]: new Date(Date.now() - 183 * MS_PER_DAY), [Op.lte]: now },
      },
      attributes: [
        [Sale.sequelize.fn('TO_CHAR', Sale.sequelize.fn('DATE_TRUNC', 'month', Sale.sequelize.col('createdAt')), 'YYYY-MM'), 'month'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('montantTotal')), 'revenue'],
      ],
      group: ['month'],
      order: [['month', 'ASC']],
      raw: true,
    });

    const payload = {
      totals: { revenue: totalRevenue, profit: totalRevenue },
      periodData: Object.values(periodByDay),
      topProducts: Object.values(topProductsMap)
        .sort((a, b) => b.revenu - a.revenu)
        .slice(0, 10),
      stockByCategory: stockByCategoryRaw.map((r, i) => ({
        id: i + 1,
        label: r.label || 'Sans categorie',
        value: Number(r.value || 0),
      })),
      monthlyRevenue: {
        labels: monthlyRevenueRows.map((r) => String(r.month)),
        values: monthlyRevenueRows.map((r) => Number(r.revenue || 0)),
      },
      revenuTotal: totalRevenue,
    };

    return sendResponse(res, 200, payload, 'Analytiques avancees recuperees');
  } catch (error) {
    next(error);
  }
};
