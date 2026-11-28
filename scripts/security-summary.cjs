// Publish counts and scan state, never secret values, source excerpts or raw paths.
const fs=require('node:fs'),path=require('node:path');
const [mode,root]=process.argv.slice(2),read=n=>JSON.parse(fs.readFileSync(path.join(root,'raw',n+'.json'),'utf8')),status=n=>Number(fs.readFileSync(path.join(root,'raw',n+'.status'),'utf8'));
const result={mode,commit:process.env.GITHUB_SHA||null,generatedAt:new Date().toISOString(),scans:[]};
let failed=false;
function record(name,fn){try{result.scans.push({name,...fn()})}catch{result.scans.push({name,state:'unavailable'});failed=true;}}
if(mode==='secrets'){for(const kind of ['git','dir'])record(kind,()=>{const n='gitleaks-'+kind,s=status(n),rows=read(n);if(!Array.isArray(rows)||![0,23].includes(s))throw Error();const rules={};for(const row of rows){const k=String(row.RuleID||'unknown');rules[k]=(rules[k]||0)+1;}if(s===23||rows.length)failed=true;return {state:rows.length?'review-required':'completed',findings:rows.length,rules};});}
else if(mode==='sast'){for(const kind of ['commercial','legacy']){if(kind==='legacy'&&!fs.existsSync(path.join(root,'raw','semgrep-legacy.status')))continue;record(kind,()=>{const n='semgrep-'+kind,s=status(n),r=read(n);if(s!==0||!Array.isArray(r.results)||!Array.isArray(r.errors))throw Error();const severity={};for(const row of r.results){const k=String(row.extra?.severity||'UNKNOWN');severity[k]=(severity[k]||0)+1;}if(r.results.length||r.errors.length)failed=true;return {state:r.results.length||r.errors.length?'review-required':'completed',findings:r.results.length,severity,scannerErrors:r.errors.length,scannedFiles:r.paths?.scanned?.length??null};});}}
else if(mode==='sbom'){for(const kind of ['server','client'])record(kind,()=>{const r=read('sbom-'+kind);if(r.bomFormat!=='CycloneDX'||!Array.isArray(r.components))throw Error();return {state:'completed',components:r.components.length,format:r.bomFormat};});}
else throw Error('Unknown summary mode');
fs.writeFileSync(path.join(root,'summary',mode+'.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));if(failed)process.exitCode=1;
