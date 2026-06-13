import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Activity,
    TrendingUp,
    Download,
    Package,
    Loader2,
    BarChart3
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../hooks/useTranslation';
import api from '../api/axios';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import { exportToExcel } from '../utils/exportUtils';
import { generateMonthlyReport } from '../utils/printHelpers';
import { useCurrency, getDisplayAmount } from '../utils/currencyHelpers';

const COLORS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const Stats = () => {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const { displayCurrency, exchangeRate, convert, format } = useCurrency();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('7d');

    useEffect(() => {
        setLoading(true);
        api.get(`/stats/analytics?period=${period}&_t=${Date.now()}`)
            .then(res => {
                const resData = res.data;
                const rawData = resData.success && resData.data ? resData.data : (resData.data || resData || {});
                
                // Ensure common array fields exist and are arrays
                if (rawData) {
                    if (!Array.isArray(rawData.periodData)) rawData.periodData = [];
                    if (!Array.isArray(rawData.stockByCategory)) rawData.stockByCategory = [];
                    if (!Array.isArray(rawData.topProducts)) rawData.topProducts = [];
                    if (!rawData.monthlyRevenue) rawData.monthlyRevenue = { labels: [], values: [] };
                    if (!Array.isArray(rawData.monthlyRevenue.labels)) rawData.monthlyRevenue.labels = [];
                    if (!Array.isArray(rawData.monthlyRevenue.values)) rawData.monthlyRevenue.values = [];
                }
                setData(rawData);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [period]);

    const monthlyLabels = data?.monthlyRevenue?.labels || [];
    const monthlyValues = data?.monthlyRevenue?.values || [];
    const maxMonthly = Math.max(...monthlyValues, 1) * 1.2;
    const barH = 200;
    const barW = 600;

    const stockData: { id: number; label: string; value: number }[] = data?.stockByCategory || [];
    const totalStock = stockData.reduce((s: number, c: { value: number }) => s + c.value, 0) || 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '60px' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="title-xl">{t('advancedAnalytics').split(' ')[0]} <span className="text-gradient">{t('advancedAnalytics').split(' ').slice(1).join(' ')}</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('detailedReports')}</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <select 
                        value={period} 
                        onChange={(e) => setPeriod(e.target.value)}
                        className="glass" 
                        style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', border: '1px solid var(--border)', background: 'var(--bg-main)', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="today">{t('today')}</option>
                        <option value="7d">{t('last7Days')}</option>
                        <option value="30d">{t('last30Days')}</option>
                        <option value="1y">{t('last12Months')}</option>
                    </select>
                    <button 
                        onClick={() => {
                       if (!data) return;
                       const exportData = [
                         { Section: `Ventes (${displayCurrency})` },
                         ...(data.periodData || []).map((s: any) => ({ Date: new Date(s.date).toLocaleDateString(), Revenus: convert(s.revenue, 'CDF') })),
                         { Section: '' },
                         { Section: 'Stock Par Catégorie' },
                         ...(data.stockByCategory || []).map((s: any) => ({ Categorie: s.label, Stock: s.value })),
                         { Section: '' },
                         { Section: `Produits les plus vendus (${displayCurrency})` },
                         ...(data.topProducts || []).map((p: any) => ({ Produit: p.nom, Quantite: p.quantite, Revenu: convert(p.revenu, 'CDF') })),
                         { Section: '' },
                         { Section: `Revenus Mensuels (6 mois) - ${displayCurrency}` },
                         ...(data.monthlyRevenue?.labels || []).map((label: string, idx: number) => ({ Mois: label, Total: convert(data.monthlyRevenue.values[idx] || 0, 'CDF') }))
                       ];
                       exportToExcel(exportData, 'Statistiques_Avancees_Report');
                        }}
                        className="btn-premium"
                        style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}
                    >
                        <Download size={18} /> Excel
                    </button>
                    <button 
                        onClick={() => {
                          if (!data) return;
                          const labelsMap: any = {
                            'today': t('today'),
                            '7d': t('last7Days'),
                            '30d': t('last30Days'),
                            '1y': t('last12Months')
                          };
                          generateMonthlyReport(data, { ...user, preferences: { currency: displayCurrency } }, labelsMap[period]);
                        }}
                        className="btn-premium primary"
                    >
                        <BarChart3 size={18} /> {t('generateReport')}
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary)', opacity: 0.5 }} />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Row 1 : Line chart + Donut */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                        {/* Ventes selon période */}
                        <div className="premium-card" style={{ padding: '28px', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                                        {period === 'today' ? t('todayPerformance') : period === '30d' ? t('last30Performance') : period === '1y' ? t('yearPerformance') : t('last7Performance')}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></div> Revenus
                                        </div>

                                    </div>
                                </div>
                                <Activity size={20} color="var(--primary)" />
                            </div>
                            <div style={{ height: '250px' }}>
                                {data?.periodData?.length > 0 ? (
                                    <DashboardCharts
                                        salesData={data.periodData.map((d: any) => ({
                                            ...d,
                                            convertedRevenue: convert(d.revenue || d.total || 0, 'CDF'),
                                            convertedTotal: convert(d.revenue || d.total || 0, 'CDF'),
                                            revenue: convert(d.revenue || d.total || 0, 'CDF'),
                                            total: convert(d.revenue || d.total || 0, 'CDF')
                                        }))}
                                        period={period} 
                                    />
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                                        <BarChart3 size={48} style={{ opacity: 0.15 }} />
                                        <p style={{ fontWeight: 700 }}>{t('noData')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Répartition du stock par catégorie */}
                        <div className="premium-card" style={{ padding: '28px', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t('stockByCategory')}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{t('stockDistribution')}</p>
                                </div>
                                <Package size={20} color="var(--success)" />
                            </div>
                            {stockData.length === 0 ? (
                                <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                                    <Package size={48} style={{ opacity: 0.15 }} />
                                    <p style={{ fontWeight: 700 }}>{t('noProducts')}</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {stockData.slice(0, 6).map((cat, i) => {
                                        const pct = Math.round((cat.value / totalStock) * 100);
                                        return (
                                            <div key={i}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{cat.label}</span>
                                                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: COLORS[i % COLORS.length] }}>{cat.value} unités · {pct}%</span>
                                                </div>
                                                <div style={{ height: '8px', borderRadius: '99px', backgroundColor: 'var(--bg-main)', overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 1, delay: i * 0.1 }}
                                                        style={{ height: '100%', borderRadius: '99px', backgroundColor: COLORS[i % COLORS.length] }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 2 : Produits les plus vendus & Revenu mensuel */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                        
                        {/* Produits les plus vendus */}
                        <div className="premium-card" style={{ padding: '28px', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t('topProducts')}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{t('bestSellers')}</p>
                                </div>
                                <TrendingUp size={20} color="var(--primary)" />
                            </div>
                            {(!data?.topProducts || data.topProducts.length === 0) ? (
                                <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                                    <Package size={48} style={{ opacity: 0.15 }} />
                                    <p style={{ fontWeight: 700 }}>{t('noData')}</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {data.topProducts.map((p: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem' }}>
                                                {i + 1}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{p.nom}</h4>
                                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.quantite} {t('unitsSold')}</p>
                                            </div>
                                            <div style={{ fontWeight: 900, color: 'var(--text-main)', textAlign: 'right' }}>
                                                <div>{getDisplayAmount(p.revenu, 'CDF', displayCurrency, exchangeRate).main}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                                    ≈ {getDisplayAmount(p.revenu, 'CDF', displayCurrency, exchangeRate).sub}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Revenu mensuel (barres) */}
                    <div className="premium-card" style={{ padding: '28px', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t('monthlyRevenue')}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{t('monthlySales')} en {displayCurrency}</p>
                            </div>
                            <TrendingUp size={20} color="var(--warning)" />
                        </div>

                        {monthlyValues.every((v: number) => v === 0) ? (
                            <div style={{ height: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                                <BarChart3 size={48} style={{ opacity: 0.15 }} />
                                <p style={{ fontWeight: 700 }}>{t('noSalesRecorded')}</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <svg viewBox={`0 0 ${barW} ${barH + 50}`} style={{ width: '100%', minWidth: '400px' }}>
                                    <defs>
                                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
                                            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.5" />
                                        </linearGradient>
                                    </defs>

                                    {/* Grid lines */}
                                    {[0, 0.25, 0.5, 0.75, 1].map(f => (
                                        <line key={f} x1={0} y1={barH * (1 - f)} x2={barW} y2={barH * (1 - f)}
                                            stroke="var(--border)" strokeWidth={1} strokeDasharray="4 4"
                                        />
                                    ))}

                                    {/* Bars */}
                                    {monthlyLabels.map((label: string, i: number) => {
                                        const segW = barW / monthlyLabels.length;
                                        const bW = segW * 0.5;
                                        const xPos = segW * i + segW / 2 - bW / 2;
                                        const val = monthlyValues[i] || 0;
                                        const convertedVal = convert(val, 'CDF');
                                        const maxMonthlyConverted = Math.max(...monthlyValues.map((v: number) => convert(v, 'CDF')), 1) * 1.2;
                                        const bH = Math.max((convertedVal / maxMonthlyConverted) * barH, convertedVal > 0 ? 4 : 0);
                                        return (
                                            <g key={i}>
                                                <motion.rect
                                                    initial={{ height: 0, y: barH }}
                                                    animate={{ height: bH, y: barH - bH }}
                                                    transition={{ duration: 0.8, delay: i * 0.07 }}
                                                    x={xPos} width={bW} rx={6}
                                                    fill="url(#barGrad)"
                                                />
                                                <text x={xPos + bW / 2} y={barH + 20} textAnchor="middle"
                                                    fill="var(--text-muted)" fontSize="11" fontWeight="700">
                                                    {label}
                                                </text>
                                                {val > 0 && (
                                                    <text x={xPos + bW / 2} y={barH - bH - 6} textAnchor="middle"
                                                        fill="var(--text-main)" fontSize="10" fontWeight="800">
                                                        {Math.round(convertedVal).toLocaleString()}
                                                    </text>
                                                )}
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        )}
                    </div>

                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default Stats;
