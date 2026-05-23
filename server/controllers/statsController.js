const { Sale, Product, Client, User, StaffPayment } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 0 : 0;
    return Math.round(((current - previous) / previous) * 100);
};

const getDashboardStats = async (req, res, next) => {
    try {
        const userId = req.user.tenantId;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

        // Toutes les valeurs dans la DB sont en CDF, pas de conversion nécessaire
        const sumRev = `SUM("montantTotal")`;
        const sumProf = `SUM("profitNet")`;

        // 1. Charger toutes les stats en parallèle
        const [
            currentStats,
            previousStats,
            allTimeStats,
            stockStats,
            clientStats,
            previousClientStats,
            lowStockProducts,
            expStats,
            expiringProductsRaw
        ] = await Promise.all([
            // Stats période actuelle (30 jours)
            Sale.findOne({
                where: { userId, createdAt: { [Op.gte]: thirtyDaysAgo } },
                attributes: [
                    [sequelize.literal(sumRev), 'rev'],
                    [sequelize.literal(sumProf), 'prof']
                ],
                raw: true
            }),
            // Stats période précédente (30 jours avant ça)
            Sale.findOne({
                where: { userId, createdAt: { [Op.between]: [sixtyDaysAgo, thirtyDaysAgo] } },
                attributes: [
                    [sequelize.literal(sumRev), 'rev'],
                    [sequelize.literal(sumProf), 'prof']
                ],
                raw: true
            }),
            // Stats totales (tout l'historique)
            Sale.findOne({
                where: { userId },
                attributes: [
                    [sequelize.literal(sumRev), 'rev'],
                    [sequelize.literal(sumProf), 'prof']
                ],
                raw: true
            }),
            // Stock total / valeur
            Product.findOne({
                where: { userId },
                attributes: [
                    [sequelize.literal('SUM(CAST("prix" AS NUMERIC) * "stock")'), 'totalValue'],
                    [sequelize.literal('SUM(CAST("prixAchat" AS NUMERIC) * "stock")'), 'totalCost'],
                    [sequelize.literal('COUNT(CASE WHEN "stock" <= "stockAlerte" THEN 1 END)'), 'lowStock']
                ],
                raw: true
            }),
            // Clients actuels
            Client.count({ where: { userId } }),
            // Clients période précédente
            Client.count({ where: { userId, createdAt: { [Op.lt]: thirtyDaysAgo } } }),
            // Produits en stock critique
            Product.findAll({
                where: { userId, stock: { [Op.lte]: sequelize.col('stockAlerte') } },
                attributes: ['nom', 'stock'],
                limit: 3,
                raw: true
            }),
            // Dépenses totales (Staff Payments)
            StaffPayment.findOne({
                where: { userId },
                attributes: [[sequelize.literal('SUM("amount")'), 'total']],
                raw: true
            }),
            // Produits avec date d'expiration
            Product.findAll({
                where: { userId },
                attributes: ['nom', 'metadata'],
                raw: true
            })
        ]);

        const revAll = parseFloat(allTimeStats?.rev || 0);
        const profAll = parseFloat(allTimeStats?.prof || 0);
        const stockCostAll = parseFloat(stockStats?.totalCost || 0);
        const expAll = parseFloat(expStats?.total || 0);

        // Marge nette = profit total enregistré (Ventes - Coût des ventes)
        // Toutes les valeurs sont en CDF
        const netMargin = profAll;
        // Calcul du pourcentage de marge nette
        const marginPercent = revAll > 0 ? Math.round((profAll / revAll) * 10000) / 100 : 0;

        // Produits expirant d'ici 30 jours
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        const expiringProducts = expiringProductsRaw
            .filter(p => {
                if (!p.metadata || !p.metadata.dateExpiration) return false;
                const expDate = new Date(p.metadata.dateExpiration);
                return expDate <= thirtyDaysFromNow;
            })
            .map(p => ({
                nom: p.nom,
                dateExpiration: p.metadata.dateExpiration,
                isExpired: new Date(p.metadata.dateExpiration) < now
            }));

        // Dernières ventes
        const rawRecentSales = await Sale.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        // Tous montants sont déjà en CDF, pas de conversion nécessaire
        const recentSales = rawRecentSales.map(sale => ({
            ...sale.toJSON(),
            montantCDF: Number(sale.montantTotal || 0),
            profitCDF: Number(sale.profitNet || 0)
        }));

        res.json({
            summary: {
                revenue: revAll,
                profitNetEstimation: netMargin,
                marginPercent: marginPercent,
                totalExpenses: expAll,
                stockValue: parseFloat(stockStats?.totalValue || 0),
                stockCost: stockCostAll,
                lowStockCount: parseInt(stockStats?.lowStock || 0),
                lowStockProducts,
                expiringProductsCount: expiringProducts.length,
                expiringProducts,
                totalClients: clientStats,
                revenueTrend: calculateGrowth(parseFloat(currentStats?.rev || 0), parseFloat(previousStats?.rev || 0)),
                profitTrend: calculateGrowth(parseFloat(currentStats?.prof || 0), parseFloat(previousStats?.prof || 0)),
                clientsTrend: calculateGrowth(clientStats, previousClientStats)
            },
            recentSales
        });
    } catch (error) {
        next(error);
    }
};

const getSalesChartData = async (req, res, next) => {
    try {
        const userId = req.user.tenantId;
        const period = req.query.period || '7d';

        let interval = "7d";
        let dateExpr = sequelize.fn('DATE', sequelize.col('createdAt'));

        if (period === 'today') {
            interval = "1d";
            dateExpr = sequelize.literal("DATE_TRUNC('hour', \"createdAt\")");
        } else if (period === '30d') {
            interval = "30d";
        }

        // Toutes les ventes sont en CDF dans la DB
        const stats = await Sale.findAll({
            where: {
                userId,
                createdAt: { [Op.gte]: sequelize.literal(`NOW() - INTERVAL '${interval}'`) }
            },
            attributes: [
                [dateExpr, 'date'],
                [sequelize.literal('SUM("montantTotal")'), 'total']
            ],
            group: [dateExpr],
            order: [[dateExpr, 'ASC']]
        });
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

const getAnalytics = async (req, res, next) => {
    try {
        const userId = req.user.tenantId;
        const now = new Date();

        const period = req.query.period || '7d';

        let interval = "7d";
        let dateExpr = sequelize.fn('DATE', sequelize.col('createdAt'));

        if (period === 'today') {
            interval = "1d";
            dateExpr = sequelize.literal("DATE_TRUNC('hour', \"createdAt\")");
        } else if (period === '30d') {
            interval = "30d";
        } else if (period === '1y') {
            interval = "1y";
            dateExpr = sequelize.literal("DATE_TRUNC('month', \"createdAt\")");
        }

        // Toutes les ventes sont en CDF dans la DB
        const periodSales = await Sale.findAll({
            where: {
                userId,
                createdAt: { [Op.gte]: sequelize.literal(`NOW() - INTERVAL '${interval}'`) }
            },
            attributes: [
                [dateExpr, 'date'],
                [sequelize.literal('SUM("montantTotal")'), 'total']
            ],
            group: [dateExpr],
            order: [[dateExpr, 'ASC']]
        });

        const dateMap = {};
        periodSales.forEach(s => {
            dateMap[s.dataValues.date] = { date: s.dataValues.date, revenue: parseFloat(s.dataValues.total) || 0, expenses: 0 };
        });
        const periodData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Répartition du stock par catégorie
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

        // Revenu par mois (6 derniers mois)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const monthlyRevenueRaw = await Sale.findAll({
            where: {
                userId,
                createdAt: { [Op.gte]: sixMonthsAgo }
            },
            attributes: [
                [sequelize.literal("DATE_TRUNC('month', \"createdAt\")"), 'month'],
                [sequelize.literal('SUM("montantTotal")'), 'total']
            ],
            group: [sequelize.literal("DATE_TRUNC('month', \"createdAt\")")],
            order: [[sequelize.literal("DATE_TRUNC('month', \"createdAt\")"), 'ASC']],
            raw: true
        });

        const monthlyLabels = [];
        const monthlyValues = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            monthlyLabels.push(key);

            const match = monthlyRevenueRaw.find(m => {
                const mDate = new Date(m.month);
                return mDate.getMonth() === d.getMonth() && mDate.getFullYear() === d.getFullYear();
            });
            monthlyValues.push(match ? parseFloat(match.total) : 0);
        }

        // Produits les plus vendus (montants déjà en CDF)
        let topProducts = [];
        try {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            const recentSales = await Sale.findAll({
                where: {
                    userId,
                    createdAt: { [Op.gte]: oneMonthAgo }
                },
                attributes: ['articles', 'profitNet']
            });

            const productStats = {};

            recentSales.forEach(sale => {
                const articles = sale.articles || [];
                const saleProfit = Number(sale.profitNet || 0);

                articles.forEach(item => {
                    const nom = item.nom || 'Inconnu';
                    const quantite = Number(item.quantite) || 0;
                    const prixUnitaire = Number(item.prixUnitaire) || 0;
                    const prixAchat = Number(item.prixAchat) || 0;

                    // Articles stockés en CDF depuis la création de vente
                    const revenuCDF = prixUnitaire * quantite;
                    const coutAchatCDF = prixAchat * quantite;

                    if (!productStats[nom]) {
                        productStats[nom] = { nom, quantite: 0, revenu: 0, margeNette: 0 };
                    }
                    productStats[nom].quantite += quantite;
                    productStats[nom].revenu += revenuCDF;
                    productStats[nom].margeNette += (revenuCDF - coutAchatCDF);
                });
            });

            topProducts = Object.values(productStats)
                .sort((a, b) => b.quantite - a.quantite)
                .slice(0, 5);
        } catch (error) {
            console.warn('[LUMO_STATS] topProducts calculation failed:', error.message);
            topProducts = [];
        }

        res.json({
            periodData,
            stockByCategory,
            monthlyRevenue: {
                labels: monthlyLabels,
                values: monthlyValues
            },
            topProducts
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats, getSalesChartData, getAnalytics };
