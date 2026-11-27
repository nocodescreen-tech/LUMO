import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, TrendingUp, AlertCircle, Zap } from 'lucide-react';
import api from '../../api/axios';
import { useTranslation } from '../../hooks/useTranslation';
import { LoadFailure } from '../../design-system/LoadFailure';

const AISuggestions = () => {
    const { t, language } = useTranslation();
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadError,setLoadError]=useState(false);
    const [retry,setRetry]=useState(0);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/ai/insights?lang=${language}`);
                setAnalysis(data.analysis || '');
                
                const typeMap: any = {
                    stock: { icon: AlertCircle, color: 'var(--warning)' },
                    sales: { icon: TrendingUp, color: 'var(--success)' },
                    pricing: { icon: Zap, color: '#155E58' }
                };

                const mapped = (data.suggestions || []).map((s: any, idx: number) => ({
                    ...s,
                    id: idx,
                    icon: typeMap[s.type]?.icon || Sparkles,
                    color: typeMap[s.type]?.color || 'var(--primary)'
                }));

                setSuggestions(mapped);
                setLoadError(false);
                setLoading(false);
            } catch (error) {
                setLoadError(true);
                console.error("Erreur suggestions IA:", error);
                setLoading(false);
            }
        };
        fetchSuggestions();
    }, [language,retry]);

    if (loading) return (
        <div className="glass" style={{ padding: '32px', borderRadius: '32px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <Sparkles size={40} className="animate-pulse" style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{t('aiLoading') || 'Calcul des indicateurs en cours…'}</p>
            </div>
        </div>
    );

    if (loadError) return <LoadFailure onRetry={()=>setRetry(n=>n+1)} />;
    const getBadgeLabel = (type: string) => {
        const upper = type.toUpperCase();
        if (upper === 'STOCK') return t('stockBadge') || 'STOCK';
        if (upper === 'SALES') return t('salesBadge') || 'VENTES';
        if (upper === 'PRICING') return t('pricingBadge') || 'PRIX';
        return upper;
    };

    return (
        <div className="glass" style={{ padding: '32px', borderRadius: '32px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Sparkles size={24} color="var(--primary)" /> {language==='fr'?'Recommandations de gestion':'Business recommendations'}
                    </h3>
            </div>

            {analysis && (
                <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--primary-glow)', border: '1px solid var(--primary-glow)', marginBottom: '24px', fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: '600', lineHeight: '1.5' }}>
                    {analysis}
                </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <AnimatePresence>
                    {!suggestions.length && !analysis && <p style={{color:'var(--text-muted)'}}>{language==='fr'?'Aucune recommandation disponible':'No recommendations available'}</p>}
                    {suggestions.map((s, i) => (
                        <motion.div
                            key={s.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.04)' }}
                            style={{ 
                                padding: '20px', 
                                borderRadius: '24px', 
                                backgroundColor: 'rgba(255,255,255,0.02)', 
                                border: '1px solid var(--border)',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    borderRadius: '16px', 
                                    backgroundColor: `${s.color}15`, 
                                    color: s.color, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <s.icon size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <h4 style={{ fontWeight: '800', margin: 0 }}>{s.title}</h4>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: s.color, backgroundColor: `${s.color}10`, padding: '4px 8px', borderRadius: '8px' }}>
                                            {getBadgeLabel(s.type)}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: '1.4' }}>{s.desc}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>{s.impact}</span>
                                        <span style={{fontSize:"0.8rem",color:"var(--text-muted)"}}>{language==="fr"?"Recommandation à examiner":"Recommendation to review"}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AISuggestions;
