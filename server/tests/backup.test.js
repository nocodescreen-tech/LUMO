const request = require('supertest');
const app = require('../server');
const { sequelize } = require('../config/database');
const { User } = require('../models');
const crypto = require('crypto');

// Mock email service
jest.mock('../utils/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

describe('Backup & Restore Controller', () => {
  let adminUser;
  let authToken;

  beforeAll(async () => {
    await sequelize.sync({ alter: true });
    
    // Create admin user
    const email = `admin_backup_${Date.now()}@example.com`;
    adminUser = await User.create({
      nom: 'Backup Admin',
      email,
      motDePasse: 'BackupPassword123!',
      entrepriseNom: 'Backup Enterprise',
      isVerified: true,
      isAdminValidated: true,
      role: 'admin'
    });

    // Login to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, motDePasse: 'BackupPassword123!' });

    authToken = res.body.token;
  });

  afterAll(async () => {
    if (adminUser) await adminUser.destroy();
    await sequelize.close();
  });

  test('Should preview a plain JSON backup successfully', async () => {
    const backupData = {
      version: '1.2',
      exportedAt: new Date().toISOString(),
      user: adminUser.id,
      data: {
        products: [{ nom: 'Product A', prix: 10, stock: 5 }],
        clients: [{ nom: 'Client A', telephone: '123456789' }]
      }
    };

    const res = await request(app)
      .post('/api/backup/preview')
      .set('Authorization', `Bearer ${authToken}`)
      .send(backupData);

    expect(res.statusCode).toBe(200);
    expect(res.body.counts.products).toBe(1);
    expect(res.body.counts.clients).toBe(1);
  });

  test('Should preview an encrypted backup file successfully', async () => {
    const backupData = {
      version: '1.2',
      exportedAt: new Date().toISOString(),
      user: adminUser.id,
      data: {
        products: [{ nom: 'Product B', prix: 15, stock: 2 }],
        clients: [{ nom: 'Client B', telephone: '987654321' }]
      }
    };

    // Encrypt backupData
    const algorithm = 'aes-256-ctr';
    const secretKey = (process.env.BACKUP_ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    const encrypted = Buffer.concat([iv, cipher.update(JSON.stringify(backupData)), cipher.final()]);
    const base64Data = encrypted.toString('base64');

    const res = await request(app)
      .post('/api/backup/preview')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ encryptedData: base64Data });

    expect(res.statusCode).toBe(200);
    expect(res.body.counts.products).toBe(1);
    expect(res.body.counts.clients).toBe(1);
  });
});
