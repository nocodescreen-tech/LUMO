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
    const { startDate, endDate } = req.query;

    const dateFilter =
      startDate && endDate
        ? { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] } }
        : { createdAt: { [Op.gte]: new Date(Date.now() - 30 * MS_PER_DAY), [Op.lt]: new Date() } };

    const [totalRevenue, totalSalesByStatus, revenueByMonth] = await Promise.all([
      Sale.sum('montantTotal', { where: { userId, ...dateFilter } }),
      Sale.findAll({
        where: { userId, ...dateFilter },
        attributes: [
          'statut',
          [Sale.sequelize.fn('COUNT', Sale.sequelize.col('id')), 'count'],
          [Sale.sequelize.fn('SUM', Sale.sequelize.col('montantTotal')), 'total'],
        ],
        group: ['statut'],
        raw: true,
      }),
      Sale.findAll({
        where: { userId, ...dateFilter },
        attributes: [
          [Sale.sequelize.fn('DATE_TRUNC', 'month', Sale.sequelize.col('createdAt')), 'month'],
          [Sale.sequelize.fn('SUM', Sale.sequelize.col('montantTotal')), 'revenue'],
          [Sale.sequelize.fn('COUNT', Sale.sequelize.col('id')), 'orders'],
        ],
        group: ['month'],
        order: [['month', 'ASC']],
        raw: true,
      }),
    ]);

    return sendResponse(
      res,
      200,
      {
        revenuTotal: Number(totalRevenue || 0),
        repartitionStatut: totalSalesByStatus,
        topProduits: [],
        topClients: [],
        revenueByMonth,
      },
      'Analytiques avancees recuperees'
    );
  } catch (error) {
    next(error);
  }
};
