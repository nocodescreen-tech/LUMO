const { Sale, Product, Client, User } = require('../models');
const { Op, Transaction } = require('sequelize');
const {sequelize}=require('../config/database');
const {fail}=require('../utils/transactionSafety');
const BATCH=500;
// Keyset iteration in one consistent snapshot: bounded row materialization without OFFSET scans.
async function scanSales(where,attributes,visit){
 return sequelize.transaction({isolationLevel:Transaction.ISOLATION_LEVELS.REPEATABLE_READ,readOnly:true},async transaction=>{
  let after=0,count=0;
  while(true){const rows=await Sale.findAll({where:{...where,id:{[Op.gt]:after}},attributes:[...new Set(['id',...attributes])],order:[['id','ASC']],limit:BATCH,raw:true,transaction});
   for(const row of rows){visit(row);count++;}
   if(rows.length<BATCH)return count;
   after=rows[rows.length-1].id;
  }
 });
}
const periodDays={today:1,'7d':7,day:7,'30d':30,week:180,month:183,'1y':365};
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
  const baseRate = Number(owner?.preferences?.exchangeRate || owner?.entreprise?.exchangeRate || 2250);
  return Number.isFinite(baseRate) && baseRate > 1 ? baseRate : 2250;
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

    const [totalProducts, totalClients, lowStockCount, recentSales] = await Promise.all([
      Product.count({ where: { userId } }),
      Client.count({ where: { userId } }),
      Product.count({ where: { userId, stock: { [Op.lt]: 10 } } }),
      Sale.findAll({
        where: { userId, ...notRefunded },
        attributes: ['id', 'montantTotal', 'methodePaiement', 'createdAt', 'devise', 'tauxChange'],
        order: [['createdAt', 'DESC'],['id','DESC']],
        limit: 8,
        raw: true,
      }),
    ]);

    let revenue = 0;
    let revenueUSD = 0;
    let completed = 0;
    let completedUSD = 0;
    let profit = 0;
    let profitUSD = 0;

    const salesCount=await scanSales({userId,...notRefunded},['montantTotal','devise','tauxChange','articles','profitNet','statut'],sale=>{
      const saleRate = Number(sale.tauxChange) > 1 ? Number(sale.tauxChange) : safeRate;
      const isSaleUSD = normalizeCurrency(sale.devise || shopCurrency) === 'USD';
      
      const saleRevenueCDF = toCDF(sale.montantTotal, sale.devise || shopCurrency, saleRate, safeRate);
      const saleRevenueUSD = isSaleUSD ? Number(sale.montantTotal || 0) : (saleRevenueCDF / saleRate);
      
      revenue += saleRevenueCDF;
      revenueUSD += saleRevenueUSD;
      
      if (['Terminee', 'Completee', 'Terminée', 'Complétée'].includes(String(sale.statut || ''))) {
        completed += saleRevenueCDF;
        completedUSD += saleRevenueUSD;
      }

      const items = safeParseArticles(sale.articles);
      let costCDF = 0;
      let costUSD = 0;
      for (const item of items) {
        const qty = Number(item?.quantite || 0);
        const unitCost = Number(item?.prixAchat || 0);
        const itemDevise = item?.deviseProduit || sale.devise || 'CDF';
        
        const itemCostCDF = toCDF(unitCost * qty, itemDevise, saleRate, safeRate);
        const itemCostUSD = normalizeCurrency(itemDevise) === 'USD' ? (unitCost * qty) : (itemCostCDF / saleRate);
        
        costCDF += itemCostCDF;
        costUSD += itemCostUSD;
      }

      if (costCDF > 0) {
        profit += saleRevenueCDF - costCDF;
        profitUSD += saleRevenueUSD - costUSD;
      } else {
        const profitCDF = toCDF(sale.profitNet || 0, shopCurrency, saleRate, safeRate);
        profit += profitCDF;
        profitUSD += (normalizeCurrency(shopCurrency) === 'USD' ? Number(sale.profitNet || 0) : (profitCDF / saleRate));
      }
    });
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
          revenueUSD: round2(revenueUSD),
          profitNetEstimation: profitRounded,
          profitNetEstimationUSD: round2(profitUSD),
          marginPercent,
          totalClients: Number(totalClients || 0),
          lowStockCount: Number(lowStockCount || 0),
          totalProducts: Number(totalProducts || 0),
          totalSales: salesCount,
          completedRevenue: completedRounded,
          completedRevenueUSD: round2(completedUSD),
          averageOrderValue: salesCount > 0 ? round2(revenueRounded / salesCount) : 0,
          averageOrderValueUSD: salesCount > 0 ? round2(revenueUSD / salesCount) : 0,
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
    if(!Object.prototype.hasOwnProperty.call(periodDays,period))throw fail('Période invalide');

    let truncUnit = 'month';
    let lookbackDays = periodDays[period];

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
    const grouped = new Map();
    await scanSales({userId,...notRefunded,createdAt:{[Op.gte]:startDate,[Op.lt]:new Date()}},['montantTotal','devise','tauxChange','createdAt'],sale=>{
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
      if (!grouped.has(key)) grouped.set(key, { period: keyDate, totalCommandes: 0, revenue: 0, revenueUSD: 0 });
      const row = grouped.get(key);
      const saleRate = Number(sale.tauxChange) > 1 ? Number(sale.tauxChange) : safeRate;
      row.totalCommandes += 1;
      
      const isSaleUSD = normalizeCurrency(sale.devise || shopCurrency) === 'USD';
      const cdfAmount = toCDF(sale.montantTotal, sale.devise || shopCurrency, saleRate, safeRate);
      
      row.revenue += cdfAmount;
      row.revenueUSD += isSaleUSD ? Number(sale.montantTotal || 0) : (cdfAmount / saleRate);
    });

    const data = Array.from(grouped.values())
      .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())
      .map((r) => ({
        period: r.period,
        totalCommandes: r.totalCommandes,
        revenue: round2(r.revenue),
        revenueUSD: round2(r.revenueUSD),
        prixMoyen: r.totalCommandes > 0 ? round2(r.revenue / r.totalCommandes) : 0,
        prixMoyenUSD: r.totalCommandes > 0 ? round2(r.revenueUSD / r.totalCommandes) : 0,
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

    if(!Object.prototype.hasOwnProperty.call(periodDays,period))throw fail('Période invalide');
    const now=new Date();
    if((startDate&&!endDate)||(!startDate&&endDate))throw fail('Les deux dates sont requises');
    const fromDate=startDate?new Date(startDate):new Date(+now-periodDays[period]*MS_PER_DAY);
    const toDate=endDate?new Date(endDate):now;
    if(!Number.isFinite(+fromDate)||!Number.isFinite(+toDate)||fromDate>toDate||toDate-fromDate>366*MS_PER_DAY)throw fail('Période invalide (366 jours maximum)');
    const where = {
      userId,
      ...notRefunded,
      createdAt: { [Op.gte]: fromDate, [Op.lte]: toDate },
    };

    const owner = await User.findByPk(userId);
    const safeRate = getSafeRate(owner);
    const shopCurrency = normalizeCurrency(owner?.entreprise?.devise);

    const periodByDay = new Map();
    const topProductsMap = new Map();
    const monthlyMap=new Map();
    let totalRevenue = 0;
    let totalProfit = 0;

    await scanSales(where,['articles','montantTotal','devise','tauxChange','createdAt'],s=>{
      const saleRate = Number(s.tauxChange) > 1 ? Number(s.tauxChange) : safeRate;
      const amount = toCDF(s.montantTotal, s.devise || shopCurrency, saleRate, safeRate);
      totalRevenue += amount;
      let cost = 0;

      const key = new Date(s.createdAt).toISOString().slice(0, 10);
      if(!periodByDay.has(key))periodByDay.set(key,{date:key,revenue:0,profit:0});
      const day=periodByDay.get(key);day.revenue+=amount;
      const month=key.slice(0,7);monthlyMap.set(month,(monthlyMap.get(month)||0)+amount);

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

        if(!topProductsMap.has(productKey))topProductsMap.set(productKey,{nom,quantite:0,revenu:0});
        const product=topProductsMap.get(productKey);product.quantite+=quantite;product.revenu+=revenu;
      }
      const dayProfit = amount - cost;
      day.profit += dayProfit;
      totalProfit += dayProfit;
    });

    const stockByCategoryRaw = await Product.findAll({
      where: { userId },
      attributes: [
        [Product.sequelize.fn('COALESCE', Product.sequelize.col('categorie'), 'Sans categorie'), 'label'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('stock')), 'value'],
      ],
      group: ['categorie'],
      raw: true,
    });

    const monthlyRevenueRows = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, revenue]) => ({ month, revenue: round2(revenue) }));

    const payload = {
      totals: { revenue: round2(totalRevenue), profit: round2(totalProfit) },
      periodData: Array.from(periodByDay.values()).sort((a,b)=>a.date.localeCompare(b.date)).map((p) => ({ ...p, revenue: round2(p.revenue), profit: round2(p.profit || 0) })),
      topProducts: Array.from(topProductsMap.values())
        .sort((a, b) => b.revenu - a.revenu||String(a.nom).localeCompare(String(b.nom)))
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
      coverage:{from:fromDate.toISOString(),to:toDate.toISOString(),timezone:'UTC',basis:'legacy-sales-estimate',currency:'CDF'},
    };

    return sendResponse(res, 200, payload, 'Analytiques avancees recuperees');
  } catch (error) {
    next(error);
  }
};
