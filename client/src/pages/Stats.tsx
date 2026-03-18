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
import api from '../api/axios';
import DashboardCharts from '../components/dashboard/DashboardCharts';

const COLORS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const Stats = () => {
    const { currency } = useAuthStore();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('7d');

    useEffect(() => {
        setLoading(true);
        api.get(`/stats/analytics?period=${period}`)
            .then(res => setData(res.data))
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
                    <h1 className="title-xl">Analytiques <span className="text-gradient">Avancées</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Rapports détaillés depuis vos vraies données.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <select 
                        value={period} 
                        onChange={(e) => setPeriod(e.target.value)}
                        className="glass" 
                        style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', border: '1px solid var(--border)', background: 'var(--bg-main)', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="today">Aujourd'hui</option>
                        <option value="7d">7 derniers jours</option>
                        <option value="30d">30 derniers jours</option>
                        <option value="1y">12 derniers mois</option>
                    </select>
                    <button className="btn-premium primary">
                        <Download size={18} /> Télécharger le rapport
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
                                        {period === 'today' ? "Ventes d'aujourd'hui" : period === '30d' ? 'Ventes des 30 derniers jours' : period === '1y' ? 'Ventes de l\'année' : 'Ventes des 7 derniers jours'}
                                    </h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Chiffre d'affaires</p>
                                </div>
                                <Activity size={20} color="var(--primary)" />
                            </div>
                            <div style={{ height: '250px' }}>
                                {data?.periodSales?.length > 0 ? (
                                    <DashboardCharts salesData={data.periodSales} period={period} />
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                                        <BarChart3 size={48} style={{ opacity: 0.15 }} />
                                        <p style={{ fontWeight: 700 }}>Aucune vente sur cette période</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Répartition du stock par catégorie */}
                        <div className="premium-card" style={{ padding: '28px', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Stock par catégorie</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Répartition des unités</p>
                                </div>
                                <Package size={20} color="var(--success)" />
                            </div>
                            {stockData.length === 0 ? (
                                <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                                    <Package size={48} style={{ opacity: 0.15 }} />
                                    <p style={{ fontWeight: 700 }}>Aucun produit</p>
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

                    {/* Row 2 : Revenu mensuel (barres) */}
                    <div className="premium-card" style={{ padding: '28px', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Revenu des 6 derniers mois</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Chiffre d'affaires mensuel en {currency}</p>
                            </div>
                            <TrendingUp size={20} color="var(--warning)" />
                        </div>

                        {monthlyValues.every((v: number) => v === 0) ? (
                            <div style={{ height: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                                <BarChart3 size={48} style={{ opacity: 0.15 }} />
                                <p style={{ fontWeight: 700 }}>Aucune vente enregistrée</p>
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
                                        const bH = Math.max((val / maxMonthly) * barH, val > 0 ? 4 : 0);
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
                                                        {val.toLocaleString()}
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
            )}
        </motion.div>
    );
};

export default Stats;
