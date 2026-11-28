// Boundary checks for third-party provider inputs. No credentials or user data in logs.
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeEmailPayload(input){
 const {email,subject,html,attachments=[]}=input||{};
 if(typeof email!=='string'||email.length>254||!/^[^\s<>,;@]+@[^\s<>,;@]+\.[^\s<>,;@]+$/.test(email)||typeof subject!=='string'||subject.length>250||/[\r\n]/.test(subject)||typeof html!=='string'||Buffer.byteLength(html)>512*1024||!Array.isArray(attachments)||attachments.length>5)throw Error('Email invalide');
 let total=0;
 const files=attachments.map(a=>{
  if(!a||typeof a.filename!=='string'||!/^[a-zA-Z0-9_.-]{1,150}$/.test(a.filename)||!Buffer.isBuffer(a.content))throw Error('Pièce jointe invalide');
  total+=a.content.length;if(total>8*1024*1024)throw Error('Pièces jointes trop volumineuses');
  return {filename:a.filename,content:a.content};
 });
 return {email,subject,html,attachments:files};
}
function streamBudget(res,{maxChars=5000,timeoutMs=40000}={}){
 const controller=new AbortController();let used=0;
 const disconnect=()=>controller.abort();res.once('close',disconnect);
 const timer=setTimeout(disconnect,timeoutMs);timer.unref?.();
 return {signal:controller.signal,get full(){return used>=maxChars},take(value){if(controller.signal.aborted||typeof value!=='string')return '';const text=value.slice(0,Math.max(0,maxChars-used));used+=text.length;return text;},close(){clearTimeout(timer);res.removeListener('close',disconnect);controller.abort();}};
}
module.exports={escapeHtml,safeEmailPayload,streamBudget};
