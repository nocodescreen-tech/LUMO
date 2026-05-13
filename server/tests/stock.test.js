const { Product, StockMovement, User } = require('../models');
const { sequelize } = require('../config/database');

describe('Stock Management Logic', () => {
  let testUser;
  let testProduct;

  beforeAll(async () => {
    // Sync DB (assuming test DB is configured or using main for this demo)
    // In a real env, we use a separate test DB
    testUser = await User.create({
      nom: 'Test User',
      email: `test_${Date.now()}@example.com`,
      motDePasse: 'Password123!',
      role: 'admin'
    });
  });

  afterAll(async () => {
    if (testUser) await testUser.destroy();
    await sequelize.close();
  });

  test('Should create a StockMovement when product stock changes', async () => {
    testProduct = await Product.create({
      nom: 'Test Item',
      prix: 100,
      stock: 10,
      userId: testUser.id
    });

    // Change stock
    testProduct.stock = 15;
    await testProduct.save();

    const movement = await StockMovement.findOne({
      where: { productId: testProduct.id, quantite: 5 }
    });

    expect(movement).toBeDefined();
    expect(movement.type).toBe('ENTREE');
    expect(Number(movement.quantite)).toBe(5);
    expect(Number(movement.nouveauStock)).toBe(15);
  });

  test('Should trigger low stock alert', async () => {
    testProduct.stock = 2; // Below default alerte of 5
    await testProduct.save();

    const { Notification } = require('../models');
    const notification = await Notification.findOne({
      where: { userId: testUser.id, titre: 'Stock Faible' }
    });

    expect(notification).toBeDefined();
    expect(notification.contenu).toContain('Test Item');
  });
});
