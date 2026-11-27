import api from './axios';
import { useAuthStore } from '../store/useAuthStore';

const busy=new Set<string>();
const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const digest=async(value:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical(value)))))).map(b=>b.toString(16).padStart(2,'0')).join('');
// Persist only the operation key and payload digest, never customer names or amounts.
export async function postFinancial(url:string,body:any,operation:string){
 const actor=useAuthStore.getState().user?.id;
 if(!actor)throw new Error('Session expirée');
 if(!navigator.onLine)throw new Error('Connexion nécessaire pour valider cette transaction.');
 const storageKey='lumo-financial:'+actor+':'+operation;
 if(busy.has(storageKey))throw new Error('Transaction déjà en cours.');
 busy.add(storageKey);
 try{
  const hash=await digest({url,body});
  const raw=sessionStorage.getItem(storageKey);
  let pending=raw?JSON.parse(raw):null;
  if(pending&&pending.hash!==hash){
   const {data}=await api.get('/finance/operations/'+operation+'/'+pending.key);
   if(data?.data?.committed===true){
    sessionStorage.removeItem(storageKey);
    throw new Error('La transaction précédente est déjà enregistrée. Vérifiez l’historique avant de continuer.');
   }
   throw new Error('Transaction précédente non confirmée. Rétablissez les mêmes informations et réessayez.');
  }
  if(!pending){pending={key:crypto.randomUUID(),hash};sessionStorage.setItem(storageKey,JSON.stringify(pending));}
  try{
   if(useAuthStore.getState().user?.id!==actor)throw new Error('Compte modifié pendant la transaction.');
   const response=await api.post(url,{...body,operationId:pending.key});
   sessionStorage.removeItem(storageKey);return response;
  }catch(error:any){
   if(!raw&&[400,403,404,409,422].includes(error.response?.status))sessionStorage.removeItem(storageKey);
   throw error;
  }
 }finally{busy.delete(storageKey);}
}
