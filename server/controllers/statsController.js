const { Sale, Product, Client, User } = require('../models');
const { Op } = require('sequelize');
const { sendResponse } = require('../utils/response');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const REFUNDED_STATUSES = ['Remboursee', 'Remboursée'];
const notRefunded = {
  [Op.and]: [
    { statut: { [Op.notIn]: REFUNDED_STATUSES } },
    { statut: { [Op.notILike]: '%rembours%' } },
  ],
};

const round2 = (n) => Number((Number(n) || 0).toFixed(2));

const safeParseArticles = (articles) => {
  if (Array.isArray(articles)) return articles;
  if (typeof articles === 'string') {
    try {
      const parsed = JSON.parse(articles);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
};

const getSafeRate = (owner) => {
  const baseRate = Number(owner?.preferences?.exchangeRate || owner?.entreprise?.exchangeRate || 2800);
  return Number.isFinite(baseRate) && baseRate > 1 ? baseRate : 2800;
};

const normalizeCurrency = (currency) => (currency === 'FC' ? 'CDF' : (currency || 'CDF'));

const toCDF = (amount, devise, rate, fallbackRate) => {
  const safeAmount = Number(amount || 0);
  const effectiveRate = Number.isFinite(Number(rate)) && Number(rate) > 1 ? Number(rate) : fallbackRate;
  return normalizeCurrency(devise) === 'USD' ? (safeAmount * effectiveRate) : safeAmount;
};

const normalizeItemSalesUnit = (item) => {
  if (!item) return 0;
  const direct = Number(item.prixUnitaire);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const legacy = Number(item.prix);
  if (Number.isFinite(legacy) && legacy > 0) return legacy;
  const totalLigne = Number(item.totalLigneOrigine);
  const qty = Number(item.quantite || 0);
  if (Number.isFinite(totalLigne) && qty > 0) return totalLigne / qty;
  return 0;
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.tenantId;
    const owner = await User.findByPk(userId);
    const safeRate = getSafeRate(owner);
    const shopCurrency = normalizeCurrency(owner?.entreprise?.devise);

    const [salesRows, totalProducts, totalClients, lowStockCount, recentSales] = await Promise.all([
      Sale.findAll({
        where: { userId, ...notRefunded },
        attributes: ['id', 'montantTotal', 'devise', 'tauxChange', 'articles', 'profitNet', 'statut', 'createdAt'],
        order: [['createdAt', 'DESC']],
        raw: true,
      }),
      Product.count({ where: { userId } }),
      Client.count({ where: { userId } }),
      Product.count({ where: { userId, stock: { [Op.lt]: 10 } } }),
      Sale.findAll({
        where: { userId, ...notRefunded },
        attributes: ['id', 'montantTotal', 'methodePaiement', 'createdAt', 'devise', 'tauxChange'],
        order: [['createdAt', 'DESC']],
        limit: 8,
        raw: true,
      }),
    ]);

    let revenue = 0;
    let completed = 0;
    let profit = 0;

    for (const sale of salesRows) {
      const saleRate = Number(sale.tauxChange) > 1 ? Number(sale.tauxChange) : safeRate;
      const saleRevenueCDF = toCDF(sale.montantTotal, sale.devise || shopCurrency, saleRate, safeRate);
      revenue += saleRevenueCDF;
      if (['Terminee', 'Completee', 'Terminée', 'Complétée'].includes(String(sale.statut || ''))) completed += saleRevenueCDF;

      const items = safeParseArticles(sale.articles);
      let costCDF = 0;
      for (const item of items) {
        const qty = Number(item?.quantite || 0);
        const unitCost = Number(item?.prixAchat || 0);
        const itemDevise = item?.deviseProduit || sale.devise || 'CDF';
        costCDF += toCDF(unitCost * qty, itemDevise, saleRate, safeRate);
      }

      if (costCDF > 0) {
        profit += saleRevenueCDF - costCDF;
      } else {
        profit += toCDF(sale.profitNet || 0, shopCurrency, saleRate, safeRate);
      }
    }

    const salesCount = Number(salesRows.length || 0);
    const revenueRounded = round2(revenue);
    const completedRounded = round2(completed);
    const profitRounded = round2(profit);
    const marginPercent = revenueRounded > 0 ? round2((profitRounded / revenueRounded) * 100) : 0;

    return sendResponse(
      res,
      200,
      {
        summary: {
          revenue: revenueRounded,
          profitNetEstimation: profitRounded,
          marginPercent,
          totalClients: Number(totalClients || 0),
          lowStockCount: Number(lowStockCount || 0),
          totalProducts: Number(totalProducts || 0),
          totalSales: salesCount,
          completedRevenue: completedRounded,
          averageOrderValue: salesCount > 0 ? round2(revenueRounded / salesCount) : 0,
        },
        recentSales: recentSales.map((sale) => ({
          ...sale,
          montantCDF: round2(toCDF(sale.montantTotal, sale.devise || shopCurrency, sale.tauxChange, safeRate)),
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

    const owner = await User.findByPk(userId);
    const safeRate = getSafeRate(owner);
    const shopCurrency = normalizeCurrency(owner?.entreprise?.devise);
    const sales = await Sale.findAll({
      where: {
        userId,
        ...notRefunded,
        createdAt: { [Op.gte]: startDate, [Op.lt]: new Date() },
      },
      attributes: ['id', 'montantTotal', 'devise', 'tauxChange', 'createdAt'],
      order: [['createdAt', 'ASC']],
      raw: true,
    });

    const grouped = new Map();
    for (const sale of sales) {
      const d = new Date(sale.createdAt);
      let keyDate = d;
      if (truncUnit === 'week') {
        const day = d.getUTCDay();
        const diff = day === 0 ? -6 : 1 - day;
        keyDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
      } else if (truncUnit === 'month') {
        keyDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
      } else {
        keyDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      }
      const key = keyDate.toISOString();
      if (!grouped.has(key)) grouped.set(key, { period: keyDate, totalCommandes: 0, revenue: 0 });
      const row = grouped.get(key);
      const saleRate = Number(sale.tauxChange) > 1 ? Number(sale.tauxChange) : safeRate;
      row.totalCommandes += 1;
      row.revenue += toCDF(sale.montantTotal, sale.devise || shopCurrency, saleRate, safeRate);
    }

    const data = Array.from(grouped.values())
      .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())
      .map((r) => ({
        period: r.period,
        totalCommandes: r.totalCommandes,
        revenue: round2(r.revenue),
        prixMoyen: r.totalCommandes > 0 ? round2(r.revenue / r.totalCommandes) : 0,
      }));

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

    const owner = await User.findByPk(userId);
    const safeRate = getSafeRate(owner);
    const shopCurrency = normalizeCurrency(owner?.entreprise?.devise);

    const sales = await Sale.findAll({
      where,
      attributes: ['id', 'articles', 'montantTotal', 'devise', 'tauxChange', 'createdAt'],
      order: [['createdAt', 'ASC']],
      raw: true,
    });

    const periodByDay = {};
    const topProductsMap = {};
    let totalRevenue = 0;
    let totalProfit = 0;

    for (const s of sales) {
      const saleRate = Number(s.tauxChange) > 1 ? Number(s.tauxChange) : safeRate;
      const amount = toCDF(s.montantTotal, s.devise || shopCurrency, saleRate, safeRate);
      totalRevenue += amount;
      let cost = 0;

      const key = new Date(s.createdAt).toISOString().slice(0, 10);
      if (!periodByDay[key]) periodByDay[key] = { date: key, revenue: 0, profit: 0 };
      periodByDay[key].revenue += amount;

      const items = safeParseArticles(s.articles);
      for (const item of items) {
        const nom = item?.nom || 'Produit';
        const productKey = item?.id ? `${nom}::${item.id}` : nom;
        const quantite = Number(item?.quantite || 0);
        const unitSale = normalizeItemSalesUnit(item);
        const revenu = Number.isFinite(Number(item?.totalLigneCDF))
          ? Number(item.totalLigneCDF)
          : Number(toCDF(unitSale * quantite, item?.deviseProduit || s.devise || 'CDF', saleRate, safeRate) || 0);
        cost += toCDF((Number(item?.prixAchat || 0) * quantite), item?.deviseProduit || s.devise || 'CDF', saleRate, safeRate);

        if (!topProductsMap[productKey]) topProductsMap[productKey] = { nom, quantite: 0, revenu: 0 };
        topProductsMap[productKey].quantite += quantite;
        topProductsMap[productKey].revenu += revenu;
      }
      const dayProfit = amount - cost;
      periodByDay[key].profit += dayProfit;
      totalProfit += dayProfit;
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

    const monthlyLookbackDays = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : period === '1y' ? 365 : 183;
    const monthlyFromDate = new Date(Date.now() - monthlyLookbackDays * MS_PER_DAY);

    const monthlySales = await Sale.findAll({
      where: {
        userId,
        ...notRefunded,
        createdAt: { [Op.gte]: monthlyFromDate, [Op.lte]: toDate },
      },
      attributes: ['montantTotal', 'devise', 'tauxChange', 'createdAt'],
      order: [['createdAt', 'ASC']],
      raw: true,
    });

    const monthlyMap = new Map();
    for (const s of monthlySales) {
      const dt = new Date(s.createdAt);
      const month = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
      const saleRate = Number(s.tauxChange) > 1 ? Number(s.tauxChange) : safeRate;
      const amount = toCDF(s.montantTotal, s.devise || shopCurrency, saleRate, safeRate);
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + amount);
    }

    const monthlyRevenueRows = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, revenue]) => ({ month, revenue: round2(revenue) }));

    const payload = {
      totals: { revenue: round2(totalRevenue), profit: round2(totalProfit) },
      periodData: Object.values(periodByDay).map((p) => ({ ...p, revenue: round2(p.revenue), profit: round2(p.profit || 0) })),
      topProducts: Object.values(topProductsMap)
        .sort((a, b) => b.revenu - a.revenu)
        .slice(0, 10)
        .map((p) => ({ ...p, revenu: round2(p.revenu) })),
      stockByCategory: stockByCategoryRaw.map((r, i) => ({
        id: i + 1,
        label: r.label || 'Sans categorie',
        value: Number(r.value || 0),
      })),
      monthlyRevenue: {
        labels: monthlyRevenueRows.map((r) => String(r.month)),
        values: monthlyRevenueRows.map((r) => Number(r.revenue || 0)),
      },
      revenuTotal: round2(totalRevenue),
    };

    return sendResponse(res, 200, payload, 'Analytiques avancees recuperees');
  } catch (error) {
    next(error);
  }
};
