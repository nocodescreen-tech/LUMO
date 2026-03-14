import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  ShoppingCart,
  Activity,
  Calendar,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { LineChart } from '@mui/x-charts';
import api from '../api/axios';
import { useSettingsStore } from '../store/useSettingsStore';

const Dashboard = () => {
    const { currency } = useSettingsStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/stats');
            setStats(data.summary);
        } catch (error) {
            console.error("Erreur stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const metricCards = [
        { label: 'Revenu Total', value: stats?.totalSales || 0, icon: DollarSign, trend: '+12.5%', color: 'var(--primary)', bg: 'var(--card-purple)' },
        { label: 'Dépenses', value: stats?.totalExpenses || 0, icon: Activity, trend: '-2.4%', color: 'var(--secondary)', bg: 'var(--card-blue)' },
        { label: 'Nouveaux Clients', value: stats?.clientCount || 0, icon: Users, trend: '+41.2%', color: 'var(--success)', bg: 'var(--card-green)' },
        { label: 'Produits Actifs', value: stats?.productCount || 0, icon: Package, trend: '+5.3%', color: 'var(--warning)', bg: 'var(--card-orange)' },
    ];

    const formatValue = (val: number) => {
        return val.toLocaleString() + ' ' + currency;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h2>
                    <h1 className="title-xl">Tableau de <span className="text-gradient">Bord</span></h1>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-premium glass" style={{ backgroundColor: 'var(--bg-card)' }}>
                        <Calendar size={18} /> Exporter
                    </button>
                    <button className="btn-premium btn-primary">
                        <ShoppingCart size={18} /> Nouveau POS
                    </button>
                </div>
            </div>

            {/* Metric Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                {metricCards.map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass"
                        style={{ 
                            padding: '24px', 
                            borderRadius: '28px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '16px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Soft Glow Background */}
                        <div style={{ 
                            position: 'absolute', 
                            top: '-20px', 
                            right: '-20px', 
                            width: '80px', 
                            height: '80px', 
                            borderRadius: '50%', 
                            backgroundColor: card.color, 
                            opacity: 0.1, 
                            filter: 'blur(30px)' 
                        }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ 
                                padding: '12px', 
                                borderRadius: '16px', 
                                backgroundColor: `data-theme='light' ? ${card.bg} : rgba(255,255,255,0.05)`, 
                                color: card.color 
                            }}>
                                <card.icon size={22} />
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                fontSize: '0.8rem', 
                                fontWeight: 800, 
                                color: card.trend.startsWith('+') ? 'var(--success)' : 'var(--danger)',
                                padding: '6px 10px',
                                borderRadius: '10px',
                                backgroundColor: card.trend.startsWith('+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                            }}>
                                {card.trend.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {card.trend}
                            </div>
                        </div>

                        <div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>{card.label}</span>
                            <div style={{ fontSize: '1.8rem', fontWeight: 950, marginTop: '4px', letterSpacing: '-0.02em' }}>
                                {typeof card.value === 'number' ? formatValue(card.value) : card.value}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts & Analysis */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px' }}>
                <div className="glass" style={{ padding: '32px', borderRadius: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Flux de Trésorerie</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Comparaison des revenus et dépenses mensuels</p>
                        </div>
                        <select className="glass" style={{ padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                            <option>7 derniers jours</option>
                            <option>30 derniers jours</option>
                        </select>
                    </div>
                    <div style={{ height: '350px', width: '100%' }}>
                        <LineChart
                            xAxis={[{ data: [1, 2, 3, 4, 5, 6, 7], scaleType: 'point' }]}
                            series={[
                                { data: [2400, 1398, 9800, 3908, 4800, 3800, 4300], label: 'Revenus', color: 'var(--primary)', area: true },
                                { data: [1200, 2300, 4500, 2100, 3200, 1500, 2800], label: 'Dépenses', color: 'var(--secondary)' },
                            ]}
                            height={350}
                            margin={{ left: 50, right: 20, top: 20, bottom: 40 }}
                            slotProps={{
                                legend: { direction: 'row', position: { vertical: 'bottom', horizontal: 'middle' }, padding: -10 }
                            }}
                        />
                    </div>
                </div>

                <div className="glass" style={{ padding: '32px', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Missions d'Équipe</h3>
                        <MoreHorizontal size={20} color="var(--text-muted)" />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { name: 'Adaline Horton', role: 'Sales Manager', status: 'En ligne', color: '#10b981' },
                            { name: 'Rene Huber', role: 'Owner', status: 'En réunion', color: '#f59e0b' },
                            { name: 'John Doe', role: 'Stockist', status: 'Hors ligne', color: '#94a3b8' },
                        ].map((member, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '20px', backgroundColor: 'var(--sidebar-active)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--primary)', opacity: 0.2 }}></div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{member.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member.role}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: member.color }}></div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{member.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="btn-premium glass" style={{ marginTop: 'auto', justifyContent: 'space-between', padding: '16px 20px' }}>
                        Voir tous les membres <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Bottom Section: Recent Activities */}
            <div className="glass" style={{ padding: '32px', borderRadius: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Transactions Récentes</h3>
                    <button style={{ border: 'none', background: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Voir tout</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>CLIENT / RÉFÉRENCE</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>DATE</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>STATUT</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>MÉTHODE</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>MONTANT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4].map((_, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: 700 }}>Client Anonyme</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>INV-00{i+125}</div>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '0.9rem' }}>14 Mars 2026</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>Payé</span>
                                    </td>
                                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Espèces</td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 900 }}>45,000 CDF</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
