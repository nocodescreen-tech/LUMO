const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');
const { Sale, Purchase, Product, Client } = require('../models');
const { sendResponse } = require('../utils/response');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Return the start-of-day Date for `daysAgo` days before now.
 */
function daysAgoDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── GET /stats/dashboard ────────────────────────────────────────────────────

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // ── Sales this month ──────────────────────────────────────────────────
    const salesThisMonth = await Sale.findAll({
      where: { userId, createdAt: { [Op.gte]: startOfMonth } },
      attributes: [
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('montantTotal')), 'revenue'],
        [fn('SUM', col('profitNet')), 'profit'],
      ],
      raw: true,
    });

    // ── Sales last month ──────────────────────────────────────────────────
    const salesLastMonth = await Sale.findAll({
      where: {
        userId,
        createdAt: { [Op.between]: [startOfLastMonth, endOfLastMonth] },
      },
      attributes: [
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('montantTotal')), 'revenue'],
      ],
      raw: true,
    });

    // ── Purchases this month ──────────────────────────────────────────────
    const purchasesThisMonth = await Purchase.findAll({
      where: { userId, createdAt: { [Op.gte]: startOfMonth } },
      attributes: [[fn('SUM', col('montantTotal')), 'total']],
      raw: true,
    });

    // ── Product counts ────────────────────────────────────────────────────
    const totalProducts = await Product.count({ where: { userId } });
    const lowStockProducts = await Product.count({
      where: {
        userId,
        stock: { [Op.lte]: sequelize.col('stockAlerte') },
      },
    });

    // ── Client count ──────────────────────────────────────────────────────
    const totalClients = await Client.count({ where: { userId } });

    // ── Assemble ──────────────────────────────────────────────────────────
    const currentRevenue = parseFloat(salesThisMonth[0]?.revenue) || 0;
    const lastRevenue = parseFloat(salesLastMonth[0]?.revenue) || 0;
    const revenueGrowth =
      lastRevenue > 0
        ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100 * 10) / 10
        : null;

    const stats = {
      sales: {
        countThisMonth: parseInt(salesThisMonth[0]?.count) || 0,
        revenueThisMonth: currentRevenue,
        profitThisMonth: parseFloat(salesThisMonth[0]?.profit) || 0,
        revenueGrowthPercent: revenueGrowth,
      },
      purchases: {
        totalThisMonth: parseFloat(purchasesThisMonth[0]?.total) || 0,
      },
      inventory: {
        totalProducts,
        lowStockProducts,
      },
      clients: {
        total: totalClients,
      },
    };

    sendResponse(res, 200, stats, 'Statistiques du dashboard récupérées');
  } catch (error) {
    next(error);
  }
};

// ─── GET /stats/sales-chart ──────────────────────────────────────────────────

exports.getSalesChartData = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    // Default: last 30 days; accept ?days=N query param (max 365)
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const since = daysAgoDate(days - 1);

    const rows = await Sale.findAll({
      where: { userId, createdAt: { [Op.gte]: since } },
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('SUM', col('montantTotal')), 'revenue'],
        [fn('SUM', col('profitNet')), 'profit'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true,
    });

    // Build a complete date series so the chart has no gaps
    const dataMap = {};
    for (const row of rows) {
      dataMap[row.date] = {
        revenue: parseFloat(row.revenue) || 0,
        profit: parseFloat(row.profit) || 0,
        count: parseInt(row.count) || 0,
      };
    }

    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      chartData.push({
        date: key,
        revenue: dataMap[key]?.revenue || 0,
        profit: dataMap[key]?.profit || 0,
        count: dataMap[key]?.count || 0,
      });
    }

    sendResponse(res, 200, chartData, 'Données graphique ventes récupérées');
  } catch (error) {
    next(error);
  }
};

// ─── GET /stats/analytics ────────────────────────────────────────────────────

exports.getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;

    // Date range: default last 30 days, overridable via ?startDate / ?endDate
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : daysAgoDate(29);

    const dateWhere = { [Op.between]: [startDate, endDate] };

    // ── Top-selling products ──────────────────────────────────────────────
    const salesInRange = await Sale.findAll({
      where: { userId, createdAt: dateWhere },
      attributes: ['articles'],
      raw: true,
    });

    const productTotals = {};
    for (const sale of salesInRange) {
      const articles = Array.isArray(sale.articles) ? sale.articles : [];
      for (const item of articles) {
        if (!item.id) continue;
        if (!productTotals[item.id]) {
          productTotals[item.id] = { id: item.id, nom: item.nom || '', quantite: 0, revenue: 0 };
        }
        productTotals[item.id].quantite += item.quantite || 0;
        productTotals[item.id].revenue +=
          (item.prixUnitaire || 0) * (item.quantite || 0);
      }
    }

    const topProducts = Object.values(productTotals)
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 10);

    // ── Revenue by payment method ─────────────────────────────────────────
    const byPaymentMethod = await Sale.findAll({
      where: { userId, createdAt: dateWhere },
      attributes: [
        'methodePaiement',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('montantTotal')), 'revenue'],
      ],
      group: ['methodePaiement'],
      raw: true,
    });

    // ── Top clients by revenue ────────────────────────────────────────────
    const topClients = await Sale.findAll({
      where: { userId, createdAt: dateWhere, clientId: { [Op.ne]: null } },
      attributes: [
        'clientId',
        [fn('COUNT', col('Sale.id')), 'salesCount'],
        [fn('SUM', col('montantTotal')), 'totalRevenue'],
      ],
      include: [{ model: Client, as: 'client', attributes: ['nom', 'telephone'] }],
      group: ['clientId', 'client.id'],
      order: [[fn('SUM', col('montantTotal')), 'DESC']],
      limit: 10,
      raw: false,
    });

    // ── Summary totals ────────────────────────────────────────────────────
    const summary = await Sale.findAll({
      where: { userId, createdAt: dateWhere },
      attributes: [
        [fn('COUNT', col('id')), 'totalSales'],
        [fn('SUM', col('montantTotal')), 'totalRevenue'],
        [fn('SUM', col('profitNet')), 'totalProfit'],
        [fn('AVG', col('montantTotal')), 'avgOrderValue'],
      ],
      raw: true,
    });

    const analytics = {
      period: {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
      },
      summary: {
        totalSales: parseInt(summary[0]?.totalSales) || 0,
        totalRevenue: parseFloat(summary[0]?.totalRevenue) || 0,
        totalProfit: parseFloat(summary[0]?.totalProfit) || 0,
        avgOrderValue: parseFloat(summary[0]?.avgOrderValue) || 0,
      },
      topProducts,
      revenueByPaymentMethod: byPaymentMethod.map((r) => ({
        method: r.methodePaiement,
        count: parseInt(r.count) || 0,
        revenue: parseFloat(r.revenue) || 0,
      })),
      topClients: topClients.map((s) => ({
        clientId: s.clientId,
        nom: s.client?.nom || 'Inconnu',
        telephone: s.client?.telephone || '',
        salesCount: parseInt(s.get('salesCount')) || 0,
        totalRevenue: parseFloat(s.get('totalRevenue')) || 0,
      })),
    };

    sendResponse(res, 200, analytics, 'Analytiques récupérées');
  } catch (error) {
    next(error);
  }
};
