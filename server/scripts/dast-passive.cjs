// Fixed local request corpus, read-only and denied-mutation assertions. No crawler or active scanner.
const fs=require('node:fs'),http=require('node:http');
const {performance}=require('node:perf_hooks');
const env=process.env;
if(env.GITHUB_ACTIONS!=='true'||env.LUMO_DAST_LOCAL!=='1'||!env.LUMO_DAST_FIXTURE_FILE||!env.ZAP_LOCAL_KEY||!env.LUMO_DAST_REPORT)throw Error('Local CI scan only');
const fixtures=JSON.parse(fs.readFileSync(env.LUMO_DAST_FIXTURE_FILE,'utf8'));
const target='http://127.0.0.1:18080',proxy='http://127.0.0.1:18090';
const checks=[],errors=[];
function request(path,role,options={}){
 return new Promise((resolve,reject)=>{
  if(!path.startsWith('/')||path.startsWith('//'))return reject(Error('Invalid fixed local path'));
  const headers={Host:'127.0.0.1:18080',Accept:'application/json, text/html'};
  if(role)headers.Authorization='Bearer '+fixtures[role].token;
  Object.assign(headers,options.headers||{});
  const body=options.body===undefined?undefined:typeof options.body==='string'?options.body:JSON.stringify(options.body);
  if(body!==undefined){headers['Content-Type']='application/json';headers['Content-Length']=Buffer.byteLength(body)}
  const req=http.request({hostname:'127.0.0.1',port:18090,path:target+path,method:options.method||'GET',headers,timeout:10000},res=>{
   let size=0,chunks=[];
   res.on('data',c=>{size+=c.length;if(size>2*1024*1024)req.destroy(Error('Response limit exceeded'));else chunks.push(c)});
   res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString('utf8')}));
  });
  req.on('timeout',()=>req.destroy(Error('Local request timeout')));req.on('error',reject);req.end(body);
 });
}
async function zap(path,params={}){
 const url=new URL(path,proxy);url.searchParams.set('apikey',env.ZAP_LOCAL_KEY);for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
 const response=await fetch(url,{signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('ZAP API unavailable: '+response.status);
 return response.json();
}
async function check(path,role,expected,options={}){
 const start=performance.now(),r=await request(path,role,options),entry={role:role||'anonymous',method:options.method||'GET',path,status:r.status,expected,ms:Math.round(performance.now()-start)};
 checks.push(entry);
 if(r.status!==expected)errors.push('Status mismatch '+entry.role+' '+path);
 if(path.startsWith('/api/')&&!String(r.headers['cache-control']||'').includes('no-store'))errors.push('No-store missing '+entry.role+' '+path);
 if(r.headers['x-powered-by'])errors.push('Framework header exposed '+path);
 const csp=String(r.headers['content-security-policy']||'');if(!csp.includes("style-src 'none'")||!csp.includes("script-src 'none'")||!csp.includes("frame-ancestors 'none'")||csp.includes('unsafe-inline'))errors.push('Strict API CSP missing '+path);
 if(r.status===200&&entry.method==='GET'&&path.includes('/products')){
  if(role==='owner'||role==='staff'){if(!r.body.includes('DAST OWN CATALOG')||r.body.includes('DAST FOREIGN CATALOG'))errors.push('Catalog isolation '+role)}
  if(role==='other'&&(!r.body.includes('DAST FOREIGN CATALOG')||r.body.includes('DAST OWN CATALOG')))errors.push('Catalog isolation other');
  if(r.body.includes('Denied synthetic edit'))errors.push('Unexpected catalog change '+role);
  if(role==='staff'&&/"prixAchat"\s*:/.test(r.body))errors.push('Purchase cost field visible to staff');
 }
 if(r.status===200&&path.includes('/auth/profile')&&/"(?:motDePasse|twoFactorSecret|resetPasswordToken|verificationCode|activeSessions)"\s*:/.test(r.body))errors.push('Sensitive profile field present '+role);
}
async function main(){
 let alerts=[],scannerCompleted=false;
 try{
  await zap('/JSON/core/view/version/');
  // No spider or active-scanner calls. Only this bounded local corpus passes the proxy.
  await check('/',null,200);await check('/health',null,200);await check('/api-docs',null,404);
  for(const prefix of ['/api','/api/v1']){
   for(const endpoint of ['/auth/profile','/products','/finance/journal','/platform/billing/plans'])await check(prefix+endpoint,null,401);
   for(const role of ['owner','other','staff','platform'])await check(prefix+'/auth/profile',role,200);
   for(const role of ['owner','other','staff'])await check(prefix+'/products?limit=10',role,200);
   await check(prefix+'/finance/journal?limit=10','owner',200);await check(prefix+'/finance/journal?limit=10','staff',403);
   await check(prefix+'/platform/billing/plans','owner',403);await check(prefix+'/platform/billing/plans','staff',403);await check(prefix+'/platform/billing/plans','platform',200);
  }
  for(const prefix of ['/api','/api/v1']){
   const productBody={nom:'Denied synthetic edit',prix:11,stock:4,categorie:'Test',devise:'USD'};
   await check(prefix+'/products/'+fixtures.products.foreign,'owner',404,{method:'PUT',body:productBody});
   await check(prefix+'/products/'+fixtures.products.own,'staff',403,{method:'PUT',body:productBody});
   await check(prefix+'/products/all','owner',409,{method:'DELETE'});
   await check(prefix+'/products','owner',403,{method:'POST',headers:{Origin:'http://localhost'},body:productBody});
   await check(prefix+'/products','owner',403,{method:'POST',headers:{Origin:'https://untrusted.example','X-Lumo-Client':'1'},body:productBody});
   await check(prefix+'/products','owner',400,{method:'POST',body:'{"invalid":'});
   await check(prefix+'/products?limit=10','owner',200);
   await check(prefix+'/products?limit=10','other',200);
  }
  const deadline=Date.now()+90000;
  while(Date.now()<deadline){const p=await zap('/JSON/pscan/view/recordsToScan/');if(String(p.recordsToScan)==='0'){scannerCompleted=true;break}await new Promise(r=>setTimeout(r,1000))}
  if(!scannerCompleted)throw Error('Passive queue timeout');
  const response=await zap('/JSON/alert/view/alerts/',{baseurl:target,start:0,count:500});
  if(!Array.isArray(response.alerts))throw Error('ZAP alerts response missing');
  alerts=response.alerts.map(a=>({rule:String(a.pluginId||a.alertRef||''),name:String(a.alert||a.name||'Unknown'),risk:String(a.risk||'Unknown'),confidence:String(a.confidence||'Unknown')}));
  if(alerts.length===500)errors.push('Alert report reached fixed limit; review privately');
  if(alerts.some(a=>a.risk.toLowerCase()==='high'))errors.push('High-risk passive scanner candidate requires review');
 }catch(e){errors.push(String(e.message||e).slice(0,180))}
 const counts={};for(const a of alerts)counts[a.risk]=(counts[a.risk]||0)+1;
 const rules=[...new Map(alerts.map(a=>[a.rule+':'+a.risk,a])).values()];
 const report={commit:env.GITHUB_SHA||null,scope:'local production-mode Express, synthetic PostgreSQL accounts, fixed read and denied-mutation corpus, passive scan only',scannerCompleted,checks,alertCounts:counts,rules,errors};
 fs.writeFileSync(env.LUMO_DAST_REPORT,JSON.stringify(report,null,2));
 console.log('LUMO_DAST '+JSON.stringify({requests:checks.length,scannerCompleted,alertCounts:counts,errors}));
 if(errors.length)process.exitCode=1;
}
main().catch(()=>{console.error('Local passive scan failed');process.exitCode=1});
