const request = require('supertest');
const app = require('../server');
const { sequelize } = require('../config/database');
const { User } = require('../models');
const bcrypt = require('bcryptjs');

// Mock email service
jest.mock('../utils/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  getVerificationTemplate: jest.fn().mockReturnValue('<html>Verification</html>'),
  getResetPasswordTemplate: jest.fn().mockReturnValue('<html>Reset</html>')
}));

describe('Auth Controller & Routes', () => {
  beforeAll(async () => {
    // Synchroniser la DB de test
    await sequelize.sync({ alter: true });
    // Cleanup radical désactivé pour protéger la base de données réelle
    // await User.destroy({ where: {}, force: true, cascade: true });
    
    // Create first user (superadmin) to clear the "first user" auto-verify logic
    await User.create({
      nom: 'SuperAdmin',
      email: 'superadmin@example.com',
      motDePasse: 'SuperAdmin123!',
      entrepriseNom: 'Main',
      isVerified: true,
      isAdminValidated: true,
      role: 'superadmin'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const testUser = {
    nom: 'Test User',
    email: 'test@example.com',
    motDePasse: 'StrongPassword123!',
    entrepriseNom: 'Test Enterprise',
    typeActivite: 'Boutique'
  };

  let verificationCode = '211110'; // Fixed code via Math.random mock

  describe('POST /api/auth/register', () => {
    beforeAll(() => {
      jest.spyOn(Math, 'random').mockReturnValue(0.123456);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should register a new admin user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      if (res.statusCode !== 201) throw new Error(JSON.stringify(res.body));
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('id');
      
      const user = await User.findOne({ where: { email: testUser.email } });
      expect(user).toBeTruthy();
    });

    it('should not register a user with an existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('déjà utilisé');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify the user with the correct code', async () => {
      const { sendEmail } = require('../utils/emailService');
      const call = sendEmail.mock.calls.find(c => c[0] && c[0].html && c[0].html.includes('code de vérification'));
      
      let code = verificationCode;
      if (call) {
        const codeMatch = call[0].html.match(/\d{6}/);
        if (codeMatch) code = codeMatch[0];
      }

      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: testUser.email,
          code: code
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('vérifié');

      const user = await User.findOne({ where: { email: testUser.email } });
      expect(user.isVerified).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login and return a token', async () => {
      // Manual validation because superadmin isn't automatically validated in this test flow
      const user = await User.findOne({ where: { email: testUser.email } });
      if (user) {
        user.isAdminValidated = true;
        user.isVerified = true;
        await user.save();
      }

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          motDePasse: testUser.motDePasse
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('nom', testUser.nom);
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          motDePasse: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('Protected Routes', () => {
    let token = '';

    beforeAll(async () => {
      const user = await User.findOne({ where: { email: testUser.email } });
      if (user) {
        user.isAdminValidated = true;
        user.isVerified = true;
        await user.save();
      }

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          motDePasse: testUser.motDePasse
        });
      token = res.body.token;
    });

    it('should access /api/auth/profile with a valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toHaveProperty('email', testUser.email);
    });

    it('should fail to access /api/auth/profile without a token', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.statusCode).toEqual(401);
    });
  });
});
