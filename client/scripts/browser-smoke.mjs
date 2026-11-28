// Real browser, local static build and synthetic public/role API fixtures.
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
const root=path.resolve('build'),out=path.resolve('browser-evidence');
await mkdir(out,{recursive:true});
const profile=await mkdtemp(path.join(tmpdir(),'lumo-chrome-'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.woff2':'font/woff2'};
let role=null;const requests=[];
const server=createServer(async(req,res)=>{
 try{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 if(pathname.startsWith('/api/')){
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body))};
  const endpoint=pathname.replace(/^\/api\//,'');requests.push({role,endpoint,method:req.method,clientHeader:req.headers['x-lumo-client']||null,bearer:!!req.headers.authorization});
  if(!role)return send(401,{message:'Synthetic unauthenticated API'});
  if(endpoint==='auth/refresh')return req.headers['x-lumo-client']==='1'?send(200,{token:'synthetic-browser-token-'+role}):send(403,{message:'Missing client header'});
  if(req.headers.authorization!=='Bearer synthetic-browser-token-'+role)return send(401,{message:'Synthetic token required'});
  const user={id:role==='admin'?101:102,nom:'CI '+role,email:role+'@example.invalid',role,permissions:role==='admin'?[]:['products'],entreprise:{nom:'Synthetic company',devise:'CDF'},preferences:{theme:'light',language:'fr',currency:'CDF',exchangeRate:2500,enabledModules:['products']}};
  if(endpoint==='auth/profile')return send(200,{user});
  if(endpoint==='auth/logout'){role=null;return send(200,{success:true})}
  if(endpoint==='notifications/summary')return send(200,{success:true,data:{unread:0}});
  if(endpoint==='notifications/refresh')return send(200,{success:true,data:{created:0}});
  if(endpoint==='activites'&&role==='admin')return send(200,{success:true,data:{activities:[],total:0,pages:1,currentPage:1}});
  return send(403,{message:'Synthetic route not enabled'});
 }
 const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end()}
 const asset=path.extname(file)?file:path.join(root,'index.html');
 const body=await readFile(asset);res.writeHead(200,{'Content-Type':mime[path.extname(asset)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const chrome=spawn(process.env.CHROME_BIN||'google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(fn,limit=20000){const end=Date.now()+limit;let last;while(Date.now()<end){try{last=await fn();if(last)return last}catch{}await sleep(100)}throw Error('Timeout waiting for browser state: '+String(last))}
const results=[],exceptions=[];let ws;
try{
 const port=await wait(async()=>Number((await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]));
 const targets=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json(),target=targets.find(t=>t.type==='page');
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
 let seq=0;const pending=new Map();
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.text+': '+(m.params.exceptionDetails.exception?.description||''))});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},15000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}))});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value};
 await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
 await call('Network.setBlockedURLs',{urls:['https://fonts.googleapis.com/*','https://fonts.gstatic.com/*']});
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const width of [360,768,1440]){
  const height=width===1440?900:850;
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  if(width===360)await call('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:125000,uploadThroughput:62500});
  else await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  for(const [route,selector] of [['/','.lc-hero h1'],['/login','input[type=email]'],['/register','.ac-steps']]){
   const start=performance.now();
   await call('Page.navigate',{url:origin+route});
   try{await wait(()=>evaluate('location.pathname==='+JSON.stringify(route)+'&&!!document.querySelector('+JSON.stringify(selector)+')'),45000)}catch(e){const state=await evaluate('({url:location.href,text:document.body.innerText.slice(0,400)})');throw Error('Route '+route+' width '+width+': '+JSON.stringify(state)+' '+e.message)}
   await sleep(250);
   const metrics=await evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,heading:document.querySelector("h1")?.textContent||"",title:document.title})');
   const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   const name=(route==='/'?'landing':route.slice(1))+'-'+width;
   await writeFile(path.join(out,name+'.png'),Buffer.from(capture.data,'base64'));
   results.push({route,width,elapsedMs:Math.round(performance.now()-start),...metrics,horizontalOverflow:metrics.scrollWidth>metrics.width+2});
  }
 }
 // Exercise the real router and in-memory auth hydration against a mock API.
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 for(const scenario of [{role:'admin',route:'/activities',expected:'/activities',selector:'.lumo-sidebar'},{role:'vendeur',route:'/accounting',expected:'/',selector:'.dc h1'}]){
  role=scenario.role;const offset=requests.length,start=performance.now();
  await call('Page.navigate',{url:origin+scenario.route+'?browserRole='+role});
  await wait(()=>evaluate('location.pathname==='+JSON.stringify(scenario.expected)+'&&!!document.querySelector('+JSON.stringify(scenario.selector)+')'),45000);
  await wait(async()=>requests.slice(offset).some(x=>x.endpoint==='auth/profile'&&x.bearer));
  if(role==='admin')await wait(async()=>requests.slice(offset).some(x=>x.endpoint==='activites'&&x.bearer));
  await sleep(300);
  const state=await evaluate('({path:location.pathname,keys:Object.keys(localStorage),privateLink:!!document.querySelector("a[href=\\\"/accounting\\\"]"),width:innerWidth,scrollWidth:document.documentElement.scrollWidth})');
  if(state.keys.some(k=>['lumo-token','lumo-token-superadmin','lumo-auth','token','refreshToken'].includes(k)))throw Error('Auth persisted to localStorage');
  const calls=requests.slice(offset);
  if(!calls.some(x=>x.endpoint==='auth/refresh'&&x.clientHeader==='1'))throw Error('Refresh client header missing');
  if(role==='vendeur'&&(state.privateLink||calls.some(x=>x.endpoint.startsWith('finance/')||x.endpoint.startsWith('stats/'))))throw Error('Staff attempted owner-only routes');
  const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(path.join(out,'authenticated-'+role+'.png'),Buffer.from(capture.data,'base64'));
  results.push({role,route:scenario.route,expectedPath:scenario.expected,actualPath:state.path,elapsedMs:Math.round(performance.now()-start),horizontalOverflow:state.scrollWidth>state.width+2,checks:'passed'});
 }
 if(exceptions.length)throw Error('Uncaught browser exceptions: '+exceptions.join('; ').slice(0,1000));
 if(results.some(r=>r.horizontalOverflow))throw Error('Horizontal overflow detected; inspect screenshots');
}finally{
 await writeFile(path.join(out,'report.json'),JSON.stringify({commit:process.env.GITHUB_SHA||null,scope:'public and synthetic authenticated role routes, mocked API, local Chromium',results,exceptions},null,2));
 ws?.close();chrome.kill();await new Promise(r=>server.close(r));await sleep(300);await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
