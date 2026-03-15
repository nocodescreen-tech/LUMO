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
        const stats = await Sale.findAll({
            where: {
                userId,
                createdAt: { [Op.gte]: sequelize.literal("NOW() - INTERVAL '7d'") }
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('SUM', sequelize.col('montantTotal')), 'total']
            ],
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
        });
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats, getSalesChartData };