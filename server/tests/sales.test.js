const request = require('supertest');
const app = require('../server');
const { sequelize } = require('../config/database');
const { User, Product, Sale, Client } = require('../models');
const generateToken = require('../utils/generateToken');

describe('Sales & Stock Logic', () => {
  let token = '';
  let adminId = 0;

  beforeAll(async () => {
    await sequelize.sync({ alter: true });
    
    // Create admin user
    const user = await User.create({
      nom: 'Admin',
      email: 'admin@sales.com',
      motDePasse: 'StrongPassword123!',
      isVerified: true,
      isAdminValidated: true,
      role: 'admin',
      entreprise: { nom: 'Test Sales', devise: 'USD', exchangeRate: 2500 }
    });
    adminId = user.id;
    const { accessToken } = generateToken(user.id);
    token = accessToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Sale Business Logic', () => {
    let productId = 0;
    let clientId = 0;

    it('should create a test product and client', async () => {
      const product = await Product.create({
        nom: 'Laptop',
        prix: 1000,
        stock: 10,
        stockAlerte: 2,
        userId: adminId
      });
      productId = product.id;

      const client = await Client.create({
        nom: 'John Doe',
        email: 'john@doe.com',
        telephone: '123456',
        userId: adminId
      });
      clientId = client.id;

      expect(productId).toBeGreaterThan(0);
      expect(clientId).toBeGreaterThan(0);
    });

    it('should decrement stock after a sale', async () => {
      const saleData = {
        clientId: clientId,
        items: [
          { id: productId, nom: 'Laptop', quantite: 2, prix: 1000 }
        ],
        montantTotal: 2000,
        methodePaiement: 'Cash',
        statutPaiement: 'Payé',
        devise: 'USD',
        tauxChange: 2500
      };

      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${token}`)
        .send(saleData);

      expect(res.statusCode).toEqual(201);
      
      const updatedProduct = await Product.findByPk(productId);
      expect(updatedProduct.stock).toEqual(8); // 10 - 2
    });

    it('should increment client debt on credit sale', async () => {
      const saleData = {
        clientId: clientId,
        items: [
          { id: productId, nom: 'Laptop', quantite: 1, prix: 1000 }
        ],
        montantTotal: 1000,
        methodePaiement: 'Crédit',
        statutPaiement: 'En attente',
        devise: 'USD',
        tauxChange: 2500
      };

      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${token}`)
        .send(saleData);

      expect(res.statusCode).toEqual(201);

      const updatedClient = await Client.findByPk(clientId);
      // Assuming the debt logic is implemented in the controller
      // If it's not yet implemented (as per user request ❌), this test will fail
      // but it serves as a TDD step.
      expect(Number(updatedClient.detteTotale)).toEqual(1000);
    });
  });
});
