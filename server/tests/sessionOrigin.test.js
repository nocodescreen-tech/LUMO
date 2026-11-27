const {allowedOrigin,protectRefresh,protectBrowserMutation}=require('../middleware/sessionOrigin');
describe('Explicit origins and cookie refresh',()=>{
 test('production rejects unknown Railway previews and localhost dev ports',()=>{
  const e={NODE_ENV:'production',CLIENT_URL:'https://erp.example.com/',LUMO_ALLOWED_ORIGINS:'https://preview.example.com'};
  expect(allowedOrigin('https://erp.example.com',e)).toBe(true);expect(allowedOrigin('https://preview.example.com',e)).toBe(true);
  expect(allowedOrigin('https://random.up.railway.app',e)).toBe(false);expect(allowedOrigin('http://localhost:5173',e)).toBe(false);expect(allowedOrigin('null',e)).toBe(false);
  expect(allowedOrigin('capacitor://localhost',e)).toBe(true);
 });
 test('cookie refresh rejects requests without explicit client header',()=>{
  const req={cookies:{refreshToken:'test'},get:()=>undefined},res={status:jest.fn().mockReturnThis(),json:jest.fn()},next=jest.fn();
  protectRefresh(req,res,next);expect(res.status).toHaveBeenCalledWith(403);expect(next).not.toHaveBeenCalled();
  req.get=k=>k==='X-Lumo-Client'?'1':undefined;protectRefresh(req,res,next);expect(next).toHaveBeenCalledTimes(1);
 });
});

describe('browser mutation protection',()=>{
 test.each([{method:'POST',headers:{origin:'http://localhost:3001'},status:403},{method:'POST',headers:{origin:'https://untrusted.example','X-Lumo-Client':'1'},status:403},{method:'POST',headers:{'sec-fetch-site':'cross-site'},status:403},{method:'POST',headers:{origin:'http://localhost:3001','X-Lumo-Client':'1'},status:200},{method:'POST',headers:{},status:200},{method:'GET',headers:{},status:200},{method:'DELETE',headers:{},cookie:true,status:403}])('validates $method $headers',({method,headers,cookie,status})=>{const req={method,get:k=>headers[k],cookies:cookie?{refreshToken:'test'}:{}},res={status:jest.fn().mockReturnThis(),json:jest.fn()},next=jest.fn();protectBrowserMutation(req,res,next);if(status===200)expect(next).toHaveBeenCalledTimes(1);else{expect(res.status).toHaveBeenCalledWith(status);expect(next).not.toHaveBeenCalled()}});
});
