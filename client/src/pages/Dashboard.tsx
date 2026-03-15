import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Package, 
  Users, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Calendar,
  ChevronRight,
  ShoppingCart,
  Zap,
  Download,
  Activity,
  Plus,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import AISuggestions from '../components/dashboard/AISuggestions';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import DashboardAlerts from '../components/dashboard/DashboardAlerts';
import AIChat from '../components/dashboard/AIChat';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const KpiCard = ({ title, value, icon: Icon, trend, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="premium-card" 
    style={{
      flex: 1,
      minWidth: '260px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'relative',
      overflow: 'hidden',
      padding: '28px'
    }}
  >
    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '120px', height: '120px', borderRadius: '50%', background: color, filter: 'blur(60px)', opacity: 0.1 }}></div>
    
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ 
        width: '56px',
        height: '56px',
        borderRadius: '16px', 
        backgroundColor: `${color}10`, 
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${color}20`
       }}>
        <Icon size={26} strokeWidth={2.5} />
      </div>
      {trend !== undefined && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px', 
          color: trend >= 0 ? 'var(--success)' : 'var(--danger)',
          fontSize: '0.85rem',
          fontWeight: '800',
          padding: '6px 12px',
          backgroundColor: trend >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderRadius: '12px'
        }}>
          {trend >= 0 ? <Plus size={14} /> : <TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '6px', fontWeight: '600' }}>{title}</p>
      <h3 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--text-main)' }}>{value}</h3>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { t, language } = useTranslation();
  const { user, currency, enabledModules } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/stats/dashboard');
        setStats(data);
        const chartRes = await api.get('/stats/sales-chart');
        setChartData(chartRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const allActions = [
    { id: 'pos', label: 'Vente Rapide', icon: Zap, path: '/pos', color: 'var(--primary)', desc: 'Terminal de vente' },
    { id: 'products', label: 'Produits', icon: Package, path: '/products', color: 'var(--success)', desc: 'Gestion du stock' },
    { id: 'suppliers', label: 'Fournisseurs', icon: Download, path: '/fournisseurs', color: 'var(--warning)', desc: 'Gestion fournisseurs' },
    { id: 'debts', label: 'Dettes & Crédits', icon: Users, path: '/dettes', color: 'var(--info)', desc: 'Suivi des paiements' }
  ];

  const quickActions = allActions.filter(action => {
    if (action.id === 'pos' || action.id === 'products') return true;
    return enabledModules.includes(action.id);
  });

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '32px' }}>
      <motion.div 
        animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px -10px var(--primary-glow)' }}
      >
        <Zap size={40} color="white" />
      </motion.div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', fontSize: '1.5rem' }}>Synchronisation de Lumo</h2>
        <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Préparation de votre console de contrôle...</p>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '60px' }}
    >
      {/* Hero Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
             <span className="badge badge-success" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }}></div>
               Système Actif
             </span>
             <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '700', opacity: 0.8 }}>Actualisé à {new Date().toLocaleTimeString()}</span>
          </div>
          <h1 className="title-xl" style={{ fontSize: '3.6rem', marginBottom: '16px', letterSpacing: '-0.06em' }}>
            Tableau de <span className="text-gradient">Bord Haute Performance</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: '500', maxWidth: '700px', lineHeight: 1.5 }}>
            Propulsé par <strong style={{ color: 'var(--primary)', fontWeight: 800 }}>Lumo Intelligence</strong>. 
            Bienvenue, {user?.nom}. Prêt pour la croissance aujourd'hui ?
          </p>
        </motion.div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => window.print()} className="btn-premium secondary" style={{ padding: '16px 28px', borderRadius: '18px' }}>
            <Download size={20} /> Rapport Analytique
          </motion.button>
          <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/pos')} className="btn-premium primary" style={{ padding: '16px 32px', borderRadius: '18px', boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.4)' }}>
            <Plus size={22} /> Nouvelle Vente
          </motion.button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <KpiCard 
          title="CA de la Période" 
          value={`${stats?.summary?.revenue?.toLocaleString() || 0} ${currency}`} 
          icon={TrendingUp} 
          trend={stats?.summary?.revenueTrend || 12} 
          color="var(--primary)"
          delay={0.1}
        />
        <KpiCard 
          title="Marge Nette" 
          value={`${stats?.summary?.profitNetEstimation?.toLocaleString() || 0} ${currency}`} 
          icon={DollarSign} 
          trend={stats?.summary?.profitTrend || 8} 
          color="var(--success)"
          delay={0.2}
        />
        <KpiCard 
          title="Fidélité Clients" 
          value={stats?.summary?.totalClients || 0} 
          icon={Users} 
          trend={stats?.summary?.clientsTrend || 5} 
          color="var(--info)"
          delay={0.3}
        />
        <KpiCard 
          title="Niveau de Stock" 
          value={stats?.summary?.lowStockCount || 0} 
          icon={AlertTriangle} 
          color="var(--warning)"
          delay={0.4}
        />
      </div>

      {/* Main Grid: Charts & Activities */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', minHeight: '500px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="premium-card" style={{ padding: '40px', borderRadius: '32px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
             <div>
               <h3 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.04em' }}>Trajectoire Financière</h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>Évolution de vos revenus sur les 7 derniers jours.</p>
             </div>
             <div className="glass" style={{ padding: '10px 20px', borderRadius: '14px', fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)', border: '1px solid var(--primary-glow)' }}>Temps Réel</div>
          </div>
          <div style={{ height: '420px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DashboardCharts salesData={chartData} />
          </div>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
           {/* Quick Actions Vertical */}
           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="premium-card" style={{ padding: '32px', borderRadius: '32px' }}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '24px', fontWeight: 800 }}>Raccourcis Stratégiques</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {quickActions.map((action, i) => (
                  <button 
                    key={i}
                    onClick={() => navigate(action.path)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '18px', 
                      padding: '20px', 
                      borderRadius: '20px', 
                      border: '1px solid var(--border)', 
                      background: 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      textAlign: 'left',
                      width: '100%',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateX(8px)';
                      e.currentTarget.style.borderColor = action.color;
                      e.currentTarget.style.backgroundColor = `${action.color}05`;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                    }}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: `${action.color}15`, color: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px -4px ${action.color}20` }}>
                      <action.icon size={24} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--text-main)' }}>{action.label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', opacity: 0.7 }}>{action.desc}</div>
                    </div>
                    <ChevronRight size={18} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                  </button>
                ))}
              </div>
           </motion.div>

           <AISuggestions />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="premium-card" style={{ padding: '40px', borderRadius: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '14px', letterSpacing: '-0.03em' }}>
              <Activity size={28} color="var(--primary)" /> Flux d'Activité
            </h3>
            <button onClick={() => navigate('/sales')} style={{ background: 'var(--primary-glow)', border: 'none', color: 'var(--primary)', fontWeight: '800', cursor: 'pointer', padding: '10px 20px', borderRadius: '12px', fontSize: '0.9rem' }}>
              Historique complet
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(stats?.recentSales?.length > 0 ? stats.recentSales : []).map((sale: any) => (
              <div 
                key={sale.id} 
                className="glass"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px', borderRadius: '24px', border: '1px solid var(--border)', transition: 'transform 0.2s' }}
              >
                <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                  <div style={{ width: '54px', height: '54px', borderRadius: '16px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingCart size={24} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 900, color: 'var(--text-main)', margin: '0 0 4px 0', fontSize: '1.05rem' }}>Vente #{(sale.id?.toString() || '').slice(-4)}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', margin: 0 }}>{new Date(sale.createdAt).toLocaleTimeString()} · {sale.methodePaiement}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 900, color: 'var(--success)', fontSize: '1.3rem', margin: 0 }}>+{sale.montantTotal?.toLocaleString()} {currency}</p>
                </div>
              </div>
            ))}
            {!stats?.recentSales?.length && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <Package size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <p style={{ fontWeight: 700 }}>Aucune vente détectée pour le moment.</p>
              </div>
            )}
          </div>
        </motion.div>

        <DashboardAlerts 
          lowStockCount={stats?.summary?.lowStockCount} 
          debtsTotal={stats?.summary?.debtToCollect} 
        />
      </div>

      <AIChat />
    </motion.div>
  );
};

export default Dashboard;
