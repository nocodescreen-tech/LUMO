import {readdir,readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
async function walk(dir){const out=[];for(const item of await readdir(dir,{withFileTypes:true})){const f=path.join(dir,item.name);if(item.isDirectory())out.push(...await walk(f));else out.push(f)}return out}
const assets=await Promise.all((await walk('build')).filter(p=>/\.(js|css|png|svg|webp|html)$/.test(p)).map(async file=>{const data=await readFile(file);return {file,bytes:data.length,gzipBytes:/\.(js|css|html|svg)$/.test(file)?gzipSync(data).length:null}}));
assets.sort((a,b)=>b.bytes-a.bytes);
const report={commit:process.env.GITHUB_SHA||null,generatedAt:new Date().toISOString(),totalBytes:assets.reduce((n,a)=>n+a.bytes,0),javascriptBytes:assets.filter(a=>a.file.endsWith('.js')).reduce((n,a)=>n+a.bytes,0),assets};
console.log(JSON.stringify({totalBytes:report.totalBytes,javascriptBytes:report.javascriptBytes,largest:assets.slice(0,12)}));await writeFile('bundle-report.json',JSON.stringify(report,null,2));
