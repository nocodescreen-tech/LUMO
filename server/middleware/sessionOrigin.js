// Exact origin policy. Preview URLs must be explicitly configured.
const native=['http://localhost','https://localhost','capacitor://localhost','tauri://localhost','http://tauri.localhost','https://tauri.localhost'];
const dev=[5173,5174,5175,5180,5181,3000,3001].map(p=>'http://localhost:'+p);
function normalized(value){
 if(typeof value!=='string'||!value.trim())return null;
 const raw=value.trim();
 if(native.includes(raw))return raw;
 try{const u=new URL(raw);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return null;return u.origin}catch{return null}
}
function allowedOrigins(env=process.env){
 const candidates=[...native,...(env.NODE_ENV==='production'?[]:dev),env.CLIENT_URL,env.BACKEND_URL,env.RAILWAY_PUBLIC_DOMAIN?'https://'+env.RAILWAY_PUBLIC_DOMAIN:null,...String(env.LUMO_ALLOWED_ORIGINS||'').split(',')];
 return new Set(candidates.map(normalized).filter(Boolean));
}
function allowedOrigin(origin,env=process.env){return typeof origin==='string'&&origin!=='null'&&allowedOrigins(env).has(origin)}
// A cookie-bearing browser refresh requires a non-simple request header.
// An attacker cannot set it from an untrusted origin without a successful CORS preflight.
// Origin-less native/CLI requests can use the header as well; body-only tokens are non-ambient.
function protectRefresh(req,res,next){
 const origin=req.get('origin');
 if(origin&&!allowedOrigin(origin))return res.status(403).json({message:'Origine non autorisée'});
 if(req.cookies?.refreshToken&&req.get('X-Lumo-Client')!=='1')return res.status(403).json({message:'En-tête de session requis'});
 next();
}
function protectBrowserMutation(req,res,next){
 if(['GET','HEAD','OPTIONS'].includes(req.method))return next();
 const origin=req.get('origin'),fetchSite=req.get('sec-fetch-site');
 if(origin&&!allowedOrigin(origin))return res.status(403).json({message:'Origine non autorisée'});
 // Origin and Fetch Metadata identify browser requests, including login CSRF
 // where an ambient session cookie may not yet exist.
 if((origin||fetchSite||req.cookies?.refreshToken)&&req.get('X-Lumo-Client')!=='1')return res.status(403).json({message:'En-tête de session requis'});
 return next();
}
module.exports={allowedOrigins,allowedOrigin,protectRefresh,protectBrowserMutation};
