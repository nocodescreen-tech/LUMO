import {useEffect,useState} from 'react';
import api from '../api/axios';
export type WarehouseOption={id:number;name:string;code:string;active:boolean};
export function useWarehouseOptions(owner:boolean,actor?:number|string){
 const [options,setOptions]=useState<WarehouseOption[]>([]),[failed,setFailed]=useState(false),[loading,setLoading]=useState(owner),[version,setVersion]=useState(0);
 useEffect(()=>{const ctl=new AbortController();setOptions([]);setFailed(false);if(!owner){setLoading(false);return;}setLoading(true);api.get('/workspace/warehouses',{signal:ctl.signal}).then(r=>{if(!ctl.signal.aborted)setOptions((r.data.data||[]).filter((w:WarehouseOption)=>w.active))}).catch(()=>{if(!ctl.signal.aborted)setFailed(true)}).finally(()=>{if(!ctl.signal.aborted)setLoading(false)});return()=>ctl.abort()},[owner,actor,version]);
 return {options,failed,loading,retry:()=>setVersion(v=>v+1)};
}
