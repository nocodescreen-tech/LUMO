const crypto=require('crypto');
const startedAt=new Date().toISOString(),windowMs=60*60*1000;
const capacity=200,minuteCapacity=60;
const buckets=new Map(),errors=[];
const allowed=new Set(['auth','products','sales','clients','suppliers','fournisseurs','purchases','achats','stats','activities','activites','ai','superadmin','notifications','cash-sessions','cash','finance','workspace','platform','expenses','depenses','backup','ux','subusers','staff-payments','newsletter','search','contact','support']);
const bounds=[25,50,100,250,500,1000,2000,5000,10000];
function component(req){const part=String(req.originalUrl||'').split('?')[0].split('/').filter(Boolean);if(part[0]!=='api')return part[0]==='health'?'health':'other';const key=part[1]==='v1'?part[2]:part[1];return allowed.has(key)?key:'other';}
function trim(now){const min=Math.floor(now/60000)-minuteCapacity+1;for(const k of buckets.keys())if(k<min)buckets.delete(k);while(errors.length&&(errors[0].at<now-windowMs||errors.length>capacity))errors.shift();}
function observe(req,res,next){
 const start=process.hrtime.bigint(),id=crypto.randomUUID(),area=component(req);
 req.operationRequestId=id;res.setHeader('X-Request-ID',id);
 res.once('finish',()=>{const now=Date.now(),duration=Number(process.hrtime.bigint()-start)/1e6,key=Math.floor(now/60000);
 trim(now);let b=buckets.get(key);if(!b){b={count:0,clientErrors:0,serverErrors:0,totalMs:0,hist:Array(bounds.length+1).fill(0)};buckets.set(key,b)}
 b.count++;b.totalMs+=duration;let i=bounds.findIndex(v=>duration<=v);b.hist[i<0?bounds.length:i]++;
 if(res.statusCode>=400&&res.statusCode<500)b.clientErrors++;
 if(res.statusCode>=500){b.serverErrors++;errors.push({at:now,requestId:id,component:area,method:['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'].includes(req.method)?req.method:'OTHER',status:res.statusCode,durationMs:Math.round(duration)});trim(now);}
 });next();
}
function snapshot(now=Date.now()){
 trim(now);const values=[...buckets.values()],count=values.reduce((s,b)=>s+b.count,0),serverErrors=values.reduce((s,b)=>s+b.serverErrors,0),clientErrors=values.reduce((s,b)=>s+b.clientErrors,0),hist=bounds.concat(null).map((_,i)=>values.reduce((s,b)=>s+b.hist[i],0));
 let sum=0,p95=null;if(count){for(let i=0;i<hist.length;i++){sum+=hist[i];if(sum>=Math.ceil(count*.95)){p95=bounds[i]??null;break}}}
 return {scope:'single-process',windowMinutes:60,startedAt,generatedAt:new Date(now).toISOString(),count,serverErrors,clientErrors,averageMs:count?Math.round(values.reduce((s,b)=>s+b.totalMs,0)/count):null,p95UpperMs:p95,p95AboveRange:count>0&&p95===null,errorRate:count?serverErrors/count:null,series:[...buckets.entries()].sort((a,b)=>a[0]-b[0]).map(([minute,b])=>({at:new Date(minute*60000).toISOString(),count:b.count,serverErrors:b.serverErrors})),recentErrors:errors.slice().reverse().map(e=>({...e,at:new Date(e.at).toISOString()}))};
}
module.exports={observe,snapshot};
