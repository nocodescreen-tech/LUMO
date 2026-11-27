import React, { useState, useEffect } from 'react';
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
  Loader2, AlertCircle,
  Trophy,
  ArrowLeftRight,
  Boxes
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
import { PageSkeleton } from '../design-system/PageSkeleton';
import { exportToPDF } from '../utils/reportPDF';
import { getDisplayAmount, normalizeAmount, getEffectiveRate } from '../utils/currencyHelpers';

const KpiCard = ({ title, value, subValue, icon: Icon, trend, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="premium-card" 
    style={{
      flex: 1,
      minWidth: 'min(260px, 100%)',
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
          backgroundColor: trend >= 0 ? 'rgba(15, 157, 106, 0.1)' : 'rgba(214, 69, 69, 0.1)',
          borderRadius: '12px'
        }}>
          {trend >= 0 ? <Plus size={14} /> : <TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '6px', fontWeight: '600' }}>{title}</p>
      <h3 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--text-main)' }}>{value}</h3>
      {subValue && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '4px' }}>≙ {subValue}</p>}
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { t, language } = useTranslation();
  const { user, currency, exchangeRate, enabledModules } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  // Taux affiché : celui configuré par l'utilisateur dans Paramètres (préférences)
  const widgetRate = getEffectiveRate();
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [chartPeriod, setChartPeriod] = useState('7d');

  const altCurrency = currency === 'CDF' ? 'USD' : 'CDF';

  const getDisplayValues = (rawAmount: number, rawAmountUSD?: number) => {
    if (!rawAmount && !rawAmountUSD) return { main: `0 ${currency}`, sub: `0 ${altCurrency}` };

    if (rawAmountUSD !== undefined && rawAmountUSD !== null) {
      if (currency === 'USD') {
        return {
          main: `${getDisplayAmount(rawAmountUSD, 'USD', 'USD', exchangeRate).main.replace(' USD', '')} USD`,
          sub: `${getDisplayAmount(rawAmount, 'CDF', 'CDF', exchangeRate).main.replace(' CDF', '')} CDF`,
          mainDevise: 'USD',
          subDevise: 'CDF'
        };
      } else {
        return {
          main: `${getDisplayAmount(rawAmount, 'CDF', 'CDF', exchangeRate).main.replace(' CDF', '')} CDF`,
          sub: `${getDisplayAmount(rawAmountUSD, 'USD', 'USD', exchangeRate).main.replace(' USD', '')} USD`,
          mainDevise: 'CDF',
          subDevise: 'USD'
        };
      }
    }

    // Since the backend sends all summary stats normalized to CDF, fallback to dynamic conversion if rawAmountUSD is missing
    const result = getDisplayAmount(rawAmount, 'CDF', currency, exchangeRate);
    return result;
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchDashboardData = async () => {
      try {
        const [statsRes, chartRes] = await Promise.all([
          api.get(`/stats/dashboard?_t=${Date.now()}`),
          api.get(`/stats/sales-chart?period=${chartPeriod}&_t=${Date.now()}`)
        ]);
        if (isMounted) {
          // Standardize access: { success: true, data: { ... } }
          const sData = statsRes.data;
          setStats(sData.success && sData.data ? sData.data : sData);
          
          const cData = chartRes.data;
          let chartList = [];
          
          if (cData.success && cData.data) {
            chartList = Array.isArray(cData.data.data) ? cData.data.data : (Array.isArray(cData.data) ? cData.data : []);
          } else {
            if (Array.isArray(cData)) chartList = cData;
            else if (cData && Array.isArray(cData.data)) chartList = cData.data;
          }
          
          setChartData(chartList);
          setLoadError(false);
          setLastUpdated(new Date());
        }
      } catch (error) {
        if (isMounted) setLoadError(true);
        console.error("Failed to fetch real-time dashboard data", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    const intervalId = setInterval(fetchDashboardData, 30000); // Actualisation toutes les 30s
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [chartPeriod, retry]);

  // Top produits — chargé depuis /stats/analytics (déjà fourni par le backend)
  useEffect(() => {
    let isMounted = true;
    api.get(`/stats/analytics?_t=${Date.now()}`)
      .then((res) => {
        if (!isMounted) return;
        const d = res.data;
        const payload = d && d.success && d.data ? d.data : d;
        const list = (payload && payload.topProducts) || [];
        setTopProducts(Array.isArray(list) ? list.slice(0, 5) : []);
      })
      .catch(() => { });
    return () => { isMounted = false; };
  }, []);

  const allActions = [
    { id: 'pos', label: t('quickSale'), icon: Zap, path: '/pos', color: 'var(--primary)', desc: t('quickSaleDesc') },
    { id: 'products', label: t('products'), icon: Package, path: '/products', color: 'var(--success)', desc: t('productsDesc') },
    { id: 'suppliers', label: t('suppliers'), icon: Download, path: '/fournisseurs', color: 'var(--warning)', desc: t('suppliersDesc') },
    { id: 'debts', label: t('debts'), icon: Users, path: '/dettes', color: 'var(--info)', desc: t('debtsDesc') }
  ];

  const quickActions = allActions.filter(action => {
    if (action.id === 'pos' || action.id === 'products') return true;
    return enabledModules.includes(action.id);
  });

  if (loading) return <PageSkeleton />;
  if (loadError && !stats) return <section className="lumo-error-state" role="alert"><h2>{language==='fr'?'Données indisponibles':'Data unavailable'}</h2><p>{language==='fr'?'Vérifiez votre connexion et réessayez.':'Check your connection and try again.'}</p><button className="btn-premium primary" onClick={()=>{setLoading(true);setRetry(n=>n+1);}}>{language==='fr'?'Réessayer':'Retry'}</button></section>;
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px' }}
    >
      {/* Hero Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
             <span className="badge badge-success" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }}></div>
               {t('systemActive')}
             </span>
             <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '700', opacity: 0.8 }}>{loadError ? (language === 'fr' ? 'Données non actualisées' : 'Data not refreshed') : t('updatedAt')} {lastUpdated?.toLocaleTimeString()}</span>
          </div>
          <h1 className="title-xl" style={{ fontSize: 'clamp(1.65rem, 4vw, 2.4rem)', marginBottom: '16px', letterSpacing: '-0.06em' }}>
            <span className="text-gradient">{t('highPerfDashboard')}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.95rem, 2.5vw, 1.25rem)', fontWeight: '500', maxWidth: '700px', lineHeight: 1.5 }}>
            {t('poweredBy')} <strong style={{ color: 'var(--primary)', fontWeight: 800 }}>LUMO Intelligence</strong>. 
            {language === 'fr' ? 'Bienvenue' : 'Welcome'}, {user?.nom}. {t('readyForGrowth')}
          </p>
        </motion.div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={() => {
                if (!stats) return;
                const rows = [
                    { Key: 'CA Total Période', Value: stats?.summary?.revenue || 0 },
                    { Key: 'Estimation Profits', Value: stats?.summary?.profitNetEstimation || 0 },
                    { Key: 'Nombre de Clients', Value: String(stats?.summary?.totalClients || 0) },
                    { Key: 'Alertes Stock', Value: String(stats?.summary?.lowStockCount || 0) },
                    { Key: 'Généré le', Value: new Date().toLocaleString() }
                ];
                exportToPDF(rows, user?.preferences?.language === 'en' ? 'Dashboard Analytics' : 'Analyse du Tableau de Bord', user, { moneyKeys: ['Value'] });
            }} 
            className="btn-premium secondary" 
            style={{ padding: '16px 28px', borderRadius: '18px' }}
          >
            <Download size={20} /> {t('report')}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/pos')} className="btn-premium primary" style={{ padding: '16px 32px', borderRadius: '18px', boxShadow: '0 20px 40px -10px rgba(21, 94, 88, 0.4)' }}>
            <Plus size={22} /> {t('newSale')}
          </motion.button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '24px' }}>
        <KpiCard 
          title={t('revenuePeriod')} 
          value={getDisplayValues(stats?.summary?.revenue || 0, stats?.summary?.revenueUSD).main} 
          subValue={getDisplayValues(stats?.summary?.revenue || 0, stats?.summary?.revenueUSD).sub}
          icon={TrendingUp} 
          trend={stats?.summary?.revenueTrend} 
          color="var(--primary)"
          delay={0.1}
        />
        {(user?.role === 'superadmin' || user?.role === 'admin') && (
          <KpiCard 
            title={t('netMargin')} 
            value={getDisplayValues(stats?.summary?.profitNetEstimation || 0, stats?.summary?.profitNetEstimationUSD).main} 
            subValue={getDisplayValues(stats?.summary?.profitNetEstimation || 0, stats?.summary?.profitNetEstimationUSD).sub}
            icon={DollarSign} 
            trend={stats?.summary?.marginPercent} 
            color="var(--success)"
            delay={0.2}
          />
        )}
        <KpiCard 
          title={t('clientLoyalty')} 
          value={stats?.summary?.totalClients || 0} 
          icon={Users} 
          trend={stats?.summary?.clientsTrend} 
          color="var(--info)"
          delay={0.3}
        />
        <KpiCard 
          title={t('stockLevel')} 
          value={stats?.summary?.lowStockCount || 0} 
          icon={AlertTriangle} 
          color="var(--warning)"
          delay={0.4}
        />
      </div>

      {/* Main Grid: Charts & Activities */}
      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="premium-card" style={{ padding: '24px', borderRadius: '24px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.04em' }}>{t('financialTrajectory')}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
                {t('financialDesc')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select 
                value={chartPeriod} 
                onChange={(e) => setChartPeriod(e.target.value)}
                className="glass" 
                style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', border: '1px solid var(--border)', background: 'var(--bg-main)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="today">{t('today')}</option>
                <option value="7d">{t('last7days')}</option>
                <option value="30d">{t('last30days')}</option>
              </select>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 2s infinite' }}></div>
              {t('realTime')}
            </div>
          </div>
          <div style={{ height: 'clamp(200px, 45vw, 280px)', width: '100%' }}>
            <DashboardCharts
              salesData={chartData.map((d: any) => ({
                ...d,
                convertedRevenue: currency === 'USD' && d.revenueUSD !== undefined ? d.revenueUSD : normalizeAmount(parseFloat(d.revenue || d.total) || 0, 'CDF', currency, exchangeRate),
                convertedTotal: currency === 'USD' && d.revenueUSD !== undefined ? d.revenueUSD : normalizeAmount(parseFloat(d.revenue || d.total) || 0, 'CDF', currency, exchangeRate),
                revenue: currency === 'USD' && d.revenueUSD !== undefined ? d.revenueUSD : normalizeAmount(parseFloat(d.revenue || d.total) || 0, 'CDF', currency, exchangeRate),
                total: currency === 'USD' && d.revenueUSD !== undefined ? d.revenueUSD : normalizeAmount(parseFloat(d.revenue || d.total) || 0, 'CDF', currency, exchangeRate)
              }))}
              period={chartPeriod}
            />
          </div>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
           {/* Quick Actions Vertical */}
           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="premium-card" style={{ padding: '32px', borderRadius: '32px' }}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '24px', fontWeight: 800 }}>{t('strategicShortcuts')}</h3>
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

           {enabledModules.includes('ai') && <AISuggestions />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '32px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="premium-card" style={{ padding: '40px', borderRadius: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '14px', letterSpacing: '-0.03em' }}>
              <Activity size={28} color="var(--primary)" /> {t('activityFlow')}
            </h3>
            <button onClick={() => navigate('/sales')} style={{ background: 'var(--primary-glow)', border: 'none', color: 'var(--primary)', fontWeight: '800', cursor: 'pointer', padding: '10px 20px', borderRadius: '12px', fontSize: '0.9rem' }}>
              {t('fullHistory')}
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
                    <p style={{ fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0', fontSize: '1.2rem' }}>{t('saleNumber')}{(sale.id?.toString() || '').slice(-4)}</p>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: '900', margin: 0 }}>{new Date(sale.createdAt).toLocaleTimeString()} · {sale.methodePaiement}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {(() => {
                    // statsController.js sends montantCDF which is ALWAYS the value in CDF
                    const saleAmount = sale.montantCDF || sale.montantTotal;
                    const result = getDisplayAmount(saleAmount, 'CDF', currency, exchangeRate);
                    return (
                      <>
                        <p style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.4rem', margin: 0 }}>+{result.main}</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 800, margin: 0 }}>≙ {result.sub}</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
            {!stats?.recentSales?.length && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <Package size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <p style={{ fontWeight: 700 }}>{t('noSales')}</p>
              </div>
            )}
          </div>
        </motion.div>

        <DashboardAlerts 
          lowStockCount={stats?.summary?.lowStockCount} 
          lowStockProducts={stats?.summary?.lowStockProducts}
          debtsTotal={stats?.summary?.debtToCollect}
          expiringProductsCount={stats?.summary?.expiringProductsCount}
          expiringProducts={stats?.summary?.expiringProducts}
        />
      </div>

      {/* Widgets : Top produits + Taux de change + Vue d'ensemble */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: '24px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="premium-card" style={{ padding: '28px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{'Top produits'}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>{'Meilleurs vendeurs de la période'}</p>
            </div>
          </div>
          {topProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
              <Package size={36} style={{ opacity: 0.25, marginBottom: '10px' }} />
              <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{'Pas encore de données'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {topProducts.map((p, i) => {
                const maxRev = Math.max(...topProducts.map((x) => Number(x.revenu) || 0), 1);
                const pct = Math.max(((Number(p.revenu) || 0) / maxRev) * 100, 4);
                const money = getDisplayValues(Number(p.revenu) || 0);
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px', gap: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 900, marginRight: '8px' }}>#{i + 1}</span>{p.nom || 'Produit'}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{money.main}</span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '100px', background: 'var(--sidebar-active)', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        style={{ height: '100%', borderRadius: '100px', background: `linear-gradient(90deg, var(--primary), ${i === 0 ? 'var(--secondary)' : 'var(--primary)'})` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.82 }} className="premium-card" style={{ padding: '28px', borderRadius: '24px', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--secondary-glow)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeftRight size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{'Taux de change'}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>{'Conversion instantanée'}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ padding: '12px 8px', borderRadius: '16px', background: 'var(--bg-main)', border: '1px solid var(--border)', textAlign: 'center', minWidth: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>1 USD</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{widgetRate.toLocaleString('fr-FR')}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>CDF</div>
            </div>
            <ArrowLeftRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <div style={{ padding: '12px 8px', borderRadius: '16px', background: 'var(--bg-main)', border: '1px solid var(--border)', textAlign: 'center', minWidth: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>1 CDF</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{Number(1 / widgetRate).toFixed(4)}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>USD</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="number"
              defaultValue="1000"
              min={0}
              style={{ flex: 1, minWidth: '80px', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 700, fontSize: '1rem' }}
              onInput={(e: any) => {
                const v = parseFloat(e.target.value) || 0;
                const out = e.target.nextElementSibling as HTMLElement;
                if (out) out.textContent = `${(v / widgetRate).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} USD`;
              }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>CDF → USD</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="premium-card" style={{ padding: '28px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Boxes size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{"Vue d'ensemble"}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Chiffres clés de votre activité</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {[
              { label: 'Produits', value: stats?.summary?.totalProducts || 0, color: 'var(--primary)' },
              { label: 'Ventes Totales', value: stats?.summary?.totalSales || 0, color: 'var(--success)' },
              { label: 'Panier moyen', value: getDisplayValues(stats?.summary?.averageOrderValue || 0, stats?.summary?.averageOrderValueUSD).main, color: 'var(--secondary)' },
              { label: 'CA encaissé', value: getDisplayValues(stats?.summary?.completedRevenue || 0, stats?.summary?.completedRevenueUSD).main, color: 'var(--info)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{s.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {enabledModules.includes('ai') && <AIChat />}
    </motion.div>
  );
};

export default Dashboard;
