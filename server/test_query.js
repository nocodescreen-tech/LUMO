const { sequelize } = require('./config/database');
const { Sale, Product } = require('./models');

async function test() {
    try {
        await sequelize.authenticate();
        console.log("DB connected");

        const sales = await Sale.findAll({ raw: true });
        console.log("Total sales:", sales.length);
        if (sales.length > 0) {
           console.log("Sample sale user:", sales[0].userId);
           console.log("Sample sale createdAt:", sales[0].createdAt);
        }

        const products = await Product.findAll({ raw: true });
        console.log("Total products:", products.length);
        if (products.length > 0) {
           console.log("Sample product user:", products[0].userId);
        }

        // Test the group query
        const userId = sales[0]?.userId || 1;
        const periodSales = await Sale.findAll({
            where: { userId },
            attributes: [
                [sequelize.literal("DATE_TRUNC('hour', \"createdAt\")"), 'date'],
                [sequelize.fn('SUM', sequelize.col('montantTotal')), 'total']
            ],
            group: [sequelize.literal("DATE_TRUNC('hour', \"createdAt\")")],
            order: [[sequelize.literal("DATE_TRUNC('hour', \"createdAt\")"), 'ASC']],
            raw: true
        });
        console.log("Group query success:", periodSales);

    } catch (e) {
        console.error("ERROR:", e);
    }
    process.exit(0);
}
test();
