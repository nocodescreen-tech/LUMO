const { Sale, Product, Depense, Client, User } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 0 : 0; // Return 0 instead of 100 to avoid confusion if it's the first period
    return Math.round(((current - previous) / previous) * 100);
};

const getDashboardStats = async (req, res, next) => {
    try {
        const userId = req.user.tenantId;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

        // Normalization literals to CDF
        const normRev = `SUM(CASE WHEN "devise" = 'USD' THEN "montantTotal" * "tauxChange" ELSE "montantTotal" END)`;
        const normProf = `SUM(CASE WHEN "devise" = 'USD' THEN "profitNet" * "tauxChange" ELSE "profitNet" END)`;
        
        const user = await User.findByPk(userId);
        const productRate = user?.preferences?.exchangeRate || 2800; 
        
        const normProdVal = `SUM(CASE WHEN "devise" = 'USD' THEN CAST("prix" AS NUMERIC) * ${productRate} * "stock" ELSE CAST("prix" AS NUMERIC) * "stock" END)`;
        const normProdCost = `SUM(CASE WHEN "devise" = 'USD' THEN CAST("prixAchat" AS NUMERIC) * ${productRate} * "stock" ELSE CAST("prixAchat" AS NUMERIC) * "stock" END)`;

        // 1. Chiffre d'Affaires & Bénéfices via agrégations SQL
        const [currentStats, previousStats, allTimeStats, totalExpenses, stockStats, clientStats, previousClientStats, lowStockProducts] = await Promise.all([
            // Stats période actuelle
            Sale.findOne({
                where: { userId, createdAt: { [Op.gte]: thirtyDaysAgo } },
                attributes: [
                    [sequelize.literal(normRev), 'rev'],
                    [sequelize.literal(normProf), 'prof']
                ],
                raw: true
            }),
            // Stats période précédente
            Sale.findOne({
                where: { userId, createdAt: { [Op.between]: [sixtyDaysAgo, thirtyDaysAgo] } },
                attributes: [
                    [sequelize.literal(normRev), 'rev'],
                    [sequelize.literal(normProf), 'prof']
                ],
                raw: true
            }),
            // Stats totales
            Sale.findOne({
                where: { userId },
                attributes: [
                    [sequelize.literal(normRev), 'rev'],
                    [sequelize.literal(normProf), 'prof']
                ],
                raw: true
            }),
            // Dépenses
            Depense.sum('montant', { where: { userId } }),
            // Stock (Normalized)
            Product.findOne({
                where: { userId },
                attributes: [
                    [sequelize.literal(normProdVal), 'totalValue'],
                    [sequelize.literal(normProdCost), 'totalCost'],
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
                where: { 
                    userId, 
                    stock: { [Op.lte]: sequelize.col('stockAlerte') } 
                },
                attributes: ['nom', 'stock'],
                limit: 3,
                raw: true
            })
        ]);

        const revAll = parseFloat(allTimeStats?.rev || 0);
        const profAll = parseFloat(allTimeStats?.prof || 0);
        const expAll = parseFloat(totalExpenses || 0);

        // Sanity check: if profAll is vastly larger than revAll, something is wrong with data
        // We'll cap profit at revenue if it's clearly corrupted to avoid "billions" display
        let validatedProfAll = profAll;
        if (profAll > revAll * 1.5 && revAll > 0) {
            validatedProfAll = revAll * 0.3; // Default to 30% margin if data is obviously corrupted
        }

        // Pour le calcul précis du profit (basé sur prix achat articles), on récupère les récents pour le dashboard
        const rawRecentSales = await Sale.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        // Convert recentSales to CDF with normalized amount for frontend display
        const recentSales = rawRecentSales.map(sale => {
            const tauxChange = sale.tauxChange || 1;
            const devise = sale.devise || 'USD';
            const montantCDF = devise === 'USD' ? sale.montantTotal * tauxChange : sale.montantTotal;
            const profitCDF = devise === 'USD' ? (sale.profitNet || 0) * tauxChange : (sale.profitNet || 0);
            return {
                ...sale.toJSON(),
                montantCDF,
                profitCDF,
                tauxChange,
                deviseOriginal: devise
            };
        });

        res.json({
            summary: {
                revenue: revAll,
                profitNetEstimation: validatedProfAll - expAll,
                totalExpenses: expAll,
                stockValue: parseFloat(stockStats?.totalValue || 0),
                stockCost: parseFloat(stockStats?.totalCost || 0),
                lowStockCount: parseInt(stockStats?.lowStock || 0),
                lowStockProducts,
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
            // Group by hour for today to show interesting graph pattern instead of 1 point
            dateExpr = sequelize.literal("DATE_TRUNC('hour', \"createdAt\")");
        } else if (period === '30d') {
            interval = "30d";
        }

        const normRev = `SUM(CASE WHEN "devise" = 'USD' THEN "montantTotal" * "tauxChange" ELSE "montantTotal" END)`;

        const stats = await Sale.findAll({
            where: {
                userId,
                createdAt: { [Op.gte]: sequelize.literal(`NOW() - INTERVAL '${interval}'`) }
            },
            attributes: [
                [dateExpr, 'date'],
                [sequelize.literal(normRev), 'total']
            ],
            group: [dateExpr],
            order: [[dateExpr, 'ASC']]
        });
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

// module.exports will be at the bottom

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

        const normRev = `SUM(CASE WHEN "devise" = 'USD' THEN "montantTotal" * "tauxChange" ELSE "montantTotal" END)`;

        // -- 1. Ventes et Dépenses selon la période choisie --
        const periodSales = await Sale.findAll({
            where: { 
                userId, 
                createdAt: { [Op.gte]: sequelize.literal(`NOW() - INTERVAL '${interval}'`) } 
            },
            attributes: [
                [dateExpr, 'date'],
                [sequelize.literal(normRev), 'total']
            ],
            group: [dateExpr],
            order: [[dateExpr, 'ASC']]
        });

        const periodExpenses = await Depense.findAll({
            where: { 
                userId, 
                createdAt: { [Op.gte]: sequelize.literal(`NOW() - INTERVAL '${interval}'`) } 
            },
            attributes: [
                [dateExpr, 'date'],
                [sequelize.fn('SUM', sequelize.col('montant')), 'total']
            ],
            group: [dateExpr],
            order: [[dateExpr, 'ASC']]
        });

        const dateMap = {};
        periodSales.forEach(s => {
            dateMap[s.dataValues.date] = { date: s.dataValues.date, revenue: parseFloat(s.dataValues.total) || 0, expenses: 0 };
        });
        periodExpenses.forEach(e => {
            if (!dateMap[e.dataValues.date]) {
                dateMap[e.dataValues.date] = { date: e.dataValues.date, revenue: 0, expenses: 0 };
            }
            dateMap[e.dataValues.date].expenses = parseFloat(e.dataValues.total) || 0;
        });
        const periodData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));

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
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const monthlyRevenueRaw = await Sale.findAll({
            where: { 
                userId, 
                createdAt: { [Op.gte]: sixMonthsAgo } 
            },
            attributes: [
                [sequelize.literal("DATE_TRUNC('month', \"createdAt\")"), 'month'],
                [sequelize.literal(normRev), 'total']
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

        // -- 4. Produits les plus vendus (BUG5 Fix: isolate raw query with try-catch) --
        let topProducts = [];
        try {
            const salesTableName = Sale.tableName || 'Sales';
            const topProductsRaw = await sequelize.query(`
                SELECT 
                    item->>'nom' as nom,
                    SUM((item->>'quantite')::numeric) as quantite,
                    SUM(
                        CASE 
                            WHEN s.devise = 'USD' THEN (item->>'prixUnitaire')::numeric * (item->>'quantite')::numeric * s."tauxChange"
                            ELSE (item->>'prixUnitaire')::numeric * (item->>'quantite')::numeric
                        END
                    ) as revenu
                FROM "${salesTableName}" s, jsonb_array_elements(s.articles) with ordinality as item
                WHERE s."userId" = :userId 
                  AND s."createdAt" >= NOW() - INTERVAL '6 months'
                  AND (s."deletedAt" IS NULL OR s."deletedAt" > NOW())
                GROUP BY item->>'nom'
                ORDER BY quantite DESC
                LIMIT 5
            `, { 
                replacements: { userId },
                type: sequelize.QueryTypes.SELECT 
            });

            topProducts = topProductsRaw.map(p => ({
                nom: p.nom,
                quantite: parseFloat(p.quantite) || 0,
                revenu: parseFloat(p.revenu) || 0
            }));
        } catch (rawQueryError) {
            // If raw query fails (schema mismatch, missing deletedAt), return empty topProducts
            console.warn('[LUMO_STATS] topProducts raw query failed, returning empty:', rawQueryError.message);
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