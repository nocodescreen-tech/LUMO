import React from 'react';
import { motion } from 'framer-motion';
import { 
    BarChart3, 
    Calendar,
    PieChart,
    Activity,
    TrendingUp,
    Download
} from 'lucide-react';
import { LineChart, BarChart, PieChart as MUIPieChart } from '@mui/x-charts';

import { useAuthStore } from '../store/useAuthStore';

const Stats = () => {
    const { currency } = useAuthStore();
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="title-xl">Analytiques <span className="text-gradient">Avancées</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Rapports détaillés et intelligence commerciale.</p>
                </div>
                <button className="btn-premium primary">
                    <Download size={18} /> Télécharger le rapport
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div className="premium-card" style={{ padding: '32px', borderRadius: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Ventes vs Objectifs</h3>
                        <Activity size={20} color="#6366f1" />
                    </div>
                    <div style={{ height: '350px', width: '100%' }}>
                        <LineChart
                            xAxis={[{ data: [1, 2, 3, 4, 5, 6, 7], label: 'Semaine' }]}
                            series={[
                                { data: [4000, 3000, 2000, 2780, 1890, 2390, 3490], label: `Actuel (${currency})`, color: '#6366f1', area: true },
                                { data: [2400, 1398, 9800, 3908, 4800, 3800, 4300], label: `Objectif (${currency})`, color: '#a855f7' },
                            ]}
                            height={350}
                        />
                    </div>
                </div>

                <div className="premium-card" style={{ padding: '32px', borderRadius: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Répartition du Stock</h3>
                        <PieChart size={20} color="#10b981" />
                    </div>
                    <div style={{ height: '350px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <MUIPieChart
                            series={[{
                                data: [
                                    { id: 0, value: 35, label: 'Électronique', color: '#6366f1' },
                                    { id: 1, value: 25, label: 'Vêtements', color: '#a855f7' },
                                    { id: 2, value: 20, label: 'Alimentation', color: '#10b981' },
                                    { id: 3, value: 20, label: 'Maison', color: '#f59e0b' },
                                ],
                                innerRadius: 80,
                                outerRadius: 120,
                                paddingAngle: 5,
                                cornerRadius: 10,
                            }]}
                            width={400}
                            height={350}
                        />
                    </div>
                </div>
            </div>

            <div className="premium-card" style={{ padding: '32px', borderRadius: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Revenu Mensuel par Catégorie</h3>
                    <TrendingUp size={20} color="#f59e0b" />
                </div>
                <div style={{ height: '400px', width: '100%' }}>
                    <BarChart
                        xAxis={[{ scaleType: 'band', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] }]}
                        series={[
                            { data: [44, 55, 41, 67, 22, 43], label: `Produits (${currency})`, color: '#6366f1' },
                            { data: [13, 23, 20, 8, 13, 27], label: `Services (${currency})`, color: '#a855f7' },
                        ]}
                        height={400}
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default Stats;
