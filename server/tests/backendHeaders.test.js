const express=require('express'),request=require('supertest');
const headers=require('../middleware/backendHeaders'),errorHandler=require('../middleware/errorHandler');
describe('API response policy',()=>{
 const app=express();app.disable('x-powered-by');app.use(headers);app.use(express.json());app.get('/api/test',(_req,res)=>res.json({ok:true}));app.post('/api/test',(_req,res)=>res.json({ok:true}));app.use(errorHandler);
 test('strict policy on API success and malformed request',async()=>{
  const ok=await request(app).get('/api/test');expect(ok.status).toBe(200);expect(ok.headers['content-security-policy']).toContain("style-src 'none'");expect(ok.headers['content-security-policy']).toContain("script-src 'none'");expect(ok.headers['content-security-policy']).not.toContain('unsafe-inline');expect(ok.headers['x-powered-by']).toBeUndefined();
  const bad=await request(app).post('/api/test').set('Content-Type','application/json').send('{"private-marker":');expect(bad.status).toBe(400);expect(bad.body.message).toBe('Corps JSON invalide');expect(JSON.stringify(bad.body)).not.toContain('private-marker');expect(bad.headers['content-security-policy']).toContain("frame-ancestors 'none'");
 });
});
