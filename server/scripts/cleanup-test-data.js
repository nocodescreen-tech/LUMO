const { User, Product, Client, Sale } = require('../models');
const { Op } = require('sequelize');

async function cleanup() {
    try {
        const emails = ['superadmin@example.com', 'test@example.com', 'admin@sales.com'];
        const testUsers = await User.findAll({ where: { email: { [Op.in]: emails } } });
        const testUserIds = testUsers.map(u => u.id);
        const testUserParentIds = testUserIds.map(id => id);

        if (testUserIds.length > 0) {
            // Delete related data first (to avoid FK errors)
            await Sale.destroy({ where: { userId: { [Op.in]: testUserIds } }, force: true });
            await Client.destroy({ where: { userId: { [Op.in]: testUserIds } }, force: true });
            await Product.destroy({ where: { userId: { [Op.in]: testUserIds } }, force: true });
            // Delete users
            await User.destroy({ where: { id: { [Op.in]: testUserIds } }, force: true });
        }

        const remaining = await User.count();
        const remainingProducts = await Product.count();
        const remainingClients = await Client.count();
        console.log(`Cleanup done. Remaining: ${remaining} users, ${remainingProducts} products, ${remainingClients} clients.`);
    } catch (e) {
        console.error(e.message);
    }
    process.exit(0);
}

cleanup();