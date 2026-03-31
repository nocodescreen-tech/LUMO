const { sequelize } = require('./config/database');
const { Sale, Product } = require('./models');
const { Op } = require('sequelize');

async function test() {
    try {
        await sequelize.authenticate();
        console.log("DB connected");

        const userId = 1;
        const interval = "7d";
        const dateExpr = sequelize.fn('DATE', sequelize.col('createdAt'));
        const periodSales = await Sale.findAll({
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
        
        console.log("Period Sales:", periodSales);

        const products = await Product.findAll({ where: { userId } });
        console.log("Total Products:", products.length);

        const categoryMap = {};
        products.forEach(p => {
            const cat = p.categorie || 'Autre';
            if (!categoryMap[cat]) categoryMap[cat] = 0;
            categoryMap[cat] += p.stock;
        });
        const stockByCategory = Object.entries(categoryMap).map(([label, value], id) => ({
            id, label, value
        }));
        console.log("Stock By Category:", stockByCategory);

    } catch (e) {
        console.error("ERROR:", e);
    }
    process.exit(0);
}
test();
