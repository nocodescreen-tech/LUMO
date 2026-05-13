const request = require('supertest');
const app = require('../server');

describe('Health Check API', () => {
    it('Should return 200 and operational status', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('API HubCommerce Pro (PostgreSQL) opérationnelle !');
    });

    it('Should return 404 for an unknown endpoint', async () => {
        const res = await request(app).get('/api/unknown-endpoint-testing');
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('message', 'Non trouvé - /api/unknown-endpoint-testing');
    });
});
