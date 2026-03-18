const { Sale, Product, Depense, Client } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
};

const getDashboardStats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

        // 1. Chiffre d'Affaires & Bénéfices (Current Period)
        const sales = await Sale.findAll({ where: { userId } });
        const currentSales = sales.filter(s => new Date(s.createdAt) >= thirtyDaysAgo);
        const previousSales = sales.filter(s => {
            const date = new Date(s.createdAt);
            return date >= sixtyDaysAgo && date < thirtyDaysAgo;
        });

        const getStatsFromSales = (salesList) => {
            let rev = 0;
            let prof = 0;
            salesList.forEach(sale => {
                rev += sale.montantTotal;
                let saleProfit = 0;
                if (Array.isArray(sale.articles)) {
                    sale.articles.forEach(art => {
                        const buyPrice = art.prixAchat || 0;
                        const sellPrice = art.prixUnitaire || 0;
                        saleProfit += (sellPrice - buyPrice) * art.quantite;
                    });
                }
                prof += (saleProfit - (sale.remise || 0));
            });
            return { rev, prof };
        };

        const currentTotals = getStatsFromSales(currentSales);
        const previousTotals = getStatsFromSales(previousSales);
        const allTimeTotals = getStatsFromSales(sales);

        // 2. Dépenses totales
        const expenses = await Depense.findAll({ where: { userId } });
        const totalExpenses = expenses.reduce((acc, curr) => acc + curr.montant, 0);

        // 3. Valeur du Stock
        const products = await Product.findAll({ where: { userId } });
        const totalStockValue = products.reduce((acc, p) => acc + (p.prix * p.stock), 0);
        const totalStockCost = products.reduce((acc, p) => acc + (p.prixAchat * p.stock), 0);
        const lowStockCount = products.filter(p => p.stock <= p.stockAlerte).length;

        // 4. Nombre de clients
        const clients = await Client.findAll({ where: { userId } });
        const currentClientsCount = clients.length;
        const previousClientsCount = clients.filter(c => new Date(c.createdAt) < thirtyDaysAgo).length;

        res.json({
            summary: {
                revenue: allTimeTotals.rev,
                profitNetEstimation: allTimeTotals.prof - totalExpenses,
                totalExpenses,
                stockValue: totalStockValue,
                stockCost: totalStockCost,
                lowStockCount,
                totalClients: clients.length,
                revenueTrend: calculateGrowth(currentTotals.rev, previousTotals.rev),
                profitTrend: calculateGrowth(currentTotals.prof, previousTotals.prof),
                clientsTrend: calculateGrowth(currentClientsCount, previousClientsCount)
            },
            recentSales: sales.slice(-5).reverse()
        });
    } catch (error) {
        next(error);
    }
};

const getSalesChartData = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const period = req.query.period || '7d';

        let interval = "7d";
        let dateExpr = sequelize.fn('DATE', sequelize.col('createdAt'));

        if (period === 'today') {
            interval = "1d";
            // Group by hour for today to show interesting graph pattern instead of 1 point
            dateExpr = sequelize.literal("DATE_TRUNC('hour', \"createdAt\")");
        } else if (period === '30d') {
            interval = "30d";
        }

        const stats = await Sale.findAll({
            where: {
                userId,
                createdAt: { [Op.gte]: sequelize.literal(`NOW() - INTERVAL '${interval}'`) }
            },
            attributes: [
                [dateExpr, 'date'],
                [sequelize.fn('SUM', sequelize.col('montantTotal')), 'total']
            ],
            group: [dateExpr],
            order: [[dateExpr, 'ASC']]
        });
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats, getSalesChartData, getAnalytics };

const getAnalytics = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        // -- 1. Ventes des 7 derniers jours (pour graph linéaire) --
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weeklySales = await Sale.findAll({
            where: { userId, createdAt: { [Op.gte]: sevenDaysAgo } },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('SUM', sequelize.col('montantTotal')), 'total']
            ],
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
        });

        // -- 2. Répartition du stock par catégorie --
        const products = await Product.findAll({ where: { userId } });
        const categoryMap = {};
        products.forEach(p => {
            const cat = p.categorie || 'Autre';
            if (!categoryMap[cat]) categoryMap[cat] = 0;
            categoryMap[cat] += p.stock;
        });
        const stockByCategory = Object.entries(categoryMap).map(([label, value], id) => ({
            id, label, value
        }));

        // -- 3. Revenu par mois (6 derniers mois) --
        const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        const allSales = await Sale.findAll({ where: { userId, createdAt: { [Op.gte]: sixMonthsAgo } } });

        const monthlyMap = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            monthlyMap[key] = 0;
        }
        allSales.forEach(s => {
            const d = new Date(s.createdAt);
            const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            if (monthlyMap[key] !== undefined) {
                monthlyMap[key] += parseFloat(s.montantTotal) || 0;
            }
        });

        res.json({
            weeklySales: weeklySales.map(s => ({ date: s.dataValues.date, total: parseFloat(s.dataValues.total) || 0 })),
            stockByCategory,
            monthlyRevenue: {
                labels: Object.keys(monthlyMap),
                values: Object.values(monthlyMap)
            }
        });
    } catch (error) {
        next(error);
    }
};