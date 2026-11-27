import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
export function LoadFailure({onRetry}:{onRetry:()=>void|Promise<void>}) {
 const {language}=useTranslation();
 return <section className="lumo-error-state" role="alert">
 <AlertCircle size={30} aria-hidden="true" style={{color:'var(--danger)'}}/>
 <h2>{language==='fr'?'Impossible de charger les données':'Unable to load data'}</h2>
 <p>{language==='fr'?'Les données ne sont pas disponibles. Vérifiez votre connexion ou vos autorisations, puis réessayez.':'Data is unavailable. Check your connection or permissions and try again.'}</p>
 <button type="button" className="btn-premium primary" onClick={()=>{void onRetry()}}><RefreshCw size={16}/>{language==='fr'?'Réessayer':'Retry'}</button>
 </section>;
}
