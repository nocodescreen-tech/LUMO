import React, { useState, useEffect } from 'react';
import {
  Users, TrendingUp, ShoppingCart, Package, DollarSign,
  Search, Calendar, ChevronRight, ArrowLeft, Loader2,
  Activity, Clock, User, Filter, X, BarChart3, FileText,
  Edit, Trash2, Plus, AlertCircle, RefreshCw, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { TeamSection } from '../components/team/TeamSection';
import { normalizeAmount, getEffectiveRate } from '../utils/currencyHelpers';

// Icônes par type d'activité (adapté aux permissions)
const activityIcons: Record<string, any> = {
  VENTE: ShoppingCart,
  PRODUIT: Package,
  CLIENT: Users,
  ACHAT: FileText,
  CAISSE: DollarSign,
  REMBOURSEMENT: RefreshCw,
  FOURNISSEUR: Truck,
  DETTE: AlertCircle,
  IMPERSONATE: User,
  MODIFICATION_PRIX: Edit,
};
const activityColors: Record<string, string> = {
  VENTE: 'var(--success)',
  PRODUIT: 'var(--primary)',
  CLIENT: 'var(--secondary)',
  ACHAT: 'var(--warning)',
  CAISSE: '#C07E12',
  REMBOURSEMENT: 'var(--danger)',
  FOURNISSEUR: '#2E6E8E',
  DETTE: '#C98A1B',
  IMPERSONATE: '#155E58',
  MODIFICATION_PRIX: '#C07E12',
};

const SubusersPage = () => {
  const { t, language } = useTranslation();
  const { user, currency, exchangeRate } = useAuthStore();
  const navigate = useNavigate();

  const [subusers, setSubusers] = useState<any[]>([]);
  const [allSales, setAllSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [showTeamManager, setShowTeamManager] = useState(false);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Charger subusers + ventes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [subRes, salesRes] = await Promise.all([
          api.get(`/subusers?_t=${Date.now()}`),
          api.get(`/sales?limit=500&_t=${Date.now()}`)
        ]);
        const subs = Array.isArray(subRes.data) ? subRes.data : (subRes.data?.data || []);
        const sales = Array.isArray(salesRes.data) ? salesRes.data
          : (Array.isArray(salesRes.data?.data) ? salesRes.data.data
            : (Array.isArray(salesRes.data?.sales) ? salesRes.data.sales
              : (Array.isArray(salesRes.data?.data?.sales) ? salesRes.data.data.sales
                : [])));
        setSubusers(subs);
        setAllSales(sales);
      } catch (err) {
        console.error('Erreur chargement subusers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Charger activités quand un utilisateur est sélectionné
  const fetchUserActivities = async (userId: number) => {
    setActivitiesLoading(true);
    try {
      const { data } = await api.get(`/subusers/${userId}/activity?_t=${Date.now()}`);
      const activities = Array.isArray(data) ? data : (data?.data || []);
      setUserActivities(activities);
    } catch (err) {
      console.error('Erreur activités:', err);
      setUserActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Sélectionner un utilisateur → charger ses activités
  const selectUser = (sub: any) => {
    setSelectedUser(sub);
    fetchUserActivities(sub.id);
  };

  // Filtrer ventes par période
  const filterByPeriod = (sales: any[]) => {
    if (!sales.length) return [];
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay.getTime() - startOfDay.getDay() * 86400000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    switch (periodFilter) {
      case 'today': return sales.filter(s => new Date(s.createdAt) >= startOfDay);
      case 'week': return sales.filter(s => new Date(s.createdAt) >= startOfWeek);
      case 'month': return sales.filter(s => new Date(s.createdAt) >= startOfMonth);
      default: return sales;
    }
  };

  const getSubuserSales = (subuserId: number) => {
    return allSales.filter(s => s.userId === subuserId || s.sellerId === subuserId);
  };

  const getSubuserStats = (subuserId: number) => {
    const sales = getSubuserSales(subuserId);
    const filtered = filterByPeriod(sales);
    const totalRevenue = filtered.reduce((sum, s) => sum + (s.montantCDF || s.montantTotal || 0), 0);
    const totalProducts = filtered.reduce((sum, s) => sum + ((s.items || s.articles || []).reduce((acc: number, i: any) => acc + (i.quantite || 1), 0)), 0);
    return {
      totalSales: filtered.length,
      totalRevenue,
      totalProducts,
      lastActivity: sales.length > 0 ? sales[0].createdAt : null
    };
  };

  const filteredSubusers = subusers.filter(u =>
    u.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const convertPrice = (price: number, devise: string) => {
    const rate = getEffectiveRate();
    if (devise === currency) return `${price.toLocaleString()} ${currency}`;
    if (devise !== currency) price = normalizeAmount(price, devise, currency, rate);
    return `${price.toLocaleString()} ${currency}`;
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatTime = (d: string) => {
    return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Traduire le type d'activité
  const getActivityLabel = (type: string) => {
    const map: Record<string, string> = {
      VENTE: 'Vente',
      PRODUIT: 'Produit',
      CLIENT: 'Client',
      ACHAT: 'Achat',
      CAISSE: 'Caisse',
      REMBOURSEMENT: 'Remboursement',
      FOURNISSEUR: 'Fournisseur',
      DETTE: 'Dette',
      IMPERSONATE: 'Connexion en tant que',
      MODIFICATION_PRIX: 'Modification prix',
      SYSTEM: 'Système',
    };
    return map[type] || type;
  };

  // Filtrer activités par période
  const filteredActivities = filterByPeriod(userActivities);

  // ─── VUE DÉTAIL ───
  if (selectedUser) {
    const sales = getSubuserSales(selectedUser.id);
    const filtered = filterByPeriod(sales);
    const stats = getSubuserStats(selectedUser.id);

    // Compter activités par type
    const activityCounts: Record<string, number> = {};
    filteredActivities.forEach((a: any) => {
      const t = a.type || 'SYSTEM';
      activityCounts[t] = (activityCounts[t] || 0) + 1;
    });

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
        <button onClick={() => setSelectedUser(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', padding: 0, width: 'fit-content' }}>
          <ArrowLeft size={20} /> {language === 'fr' ? 'Retour à l\'équipe' : 'Back to team'}
        </button>

        {/* Profil header */}
        <div className="glass" style={{ padding: '28px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.5rem' }}>
              {selectedUser.nom?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>{selectedUser.nom}</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.8rem', padding: '3px 10px', borderRadius: '100px', background: selectedUser.role === 'gerant' ? 'rgba(21,94,88,0.1)' : 'rgba(16,185,129,0.1)', color: selectedUser.role === 'gerant' ? 'var(--primary)' : 'var(--success)', fontWeight: 800, textTransform: 'capitalize' }}>
                  {selectedUser.role === 'gerant' ? 'Gérant' : selectedUser.role === 'caissier' ? 'Caissier' : 'Vendeur'}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedUser.email}</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>{language === 'fr' ? 'Dernière activité' : 'Last activity'}</div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{stats.lastActivity ? formatDate(stats.lastActivity) : '—'}</div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          {[
            { label: language === 'fr' ? 'Ventes' : 'Sales', value: stats.totalSales, icon: ShoppingCart, color: 'var(--primary)' },
            { label: language === 'fr' ? 'CA' : 'Revenue', value: `${(stats.totalRevenue).toLocaleString()} ${currency}`, icon: DollarSign, color: 'var(--success)' },
            { label: language === 'fr' ? 'Produits' : 'Products', value: stats.totalProducts, icon: Package, color: 'var(--secondary)' },
            { label: language === 'fr' ? 'Panier moy.' : 'Avg cart', value: stats.totalSales > 0 ? `${Math.round(stats.totalRevenue / stats.totalSales).toLocaleString()} ${currency}` : `0 ${currency}`, icon: TrendingUp, color: 'var(--warning)' },
            { label: language === 'fr' ? 'Actions' : 'Actions', value: filteredActivities.length, icon: Activity, color: '#155E58' },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="premium-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                <kpi.icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{kpi.value}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filtres période */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: language === 'fr' ? 'Tout' : 'All' },
            { key: 'today', label: language === 'fr' ? 'Aujourd\'hui' : 'Today' },
            { key: 'week', label: language === 'fr' ? 'Cette semaine' : 'This week' },
            { key: 'month', label: language === 'fr' ? 'Ce mois' : 'This month' },
          ].map(f => (
            <button key={f.key} onClick={() => setPeriodFilter(f.key)}
              style={{
                padding: '8px 18px', borderRadius: '100px', border: periodFilter === f.key ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: periodFilter === f.key ? 'var(--primary-glow)' : 'var(--bg-card)', color: periodFilter === f.key ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s'
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Tableau des ventes */}
        <div className="glass" style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <h3 style={{ padding: '16px 20px', margin: 0, fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid var(--border)' }}>
            {language === 'fr' ? 'Ventes' : 'Sales'} ({filtered.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left' }}>N° Facture</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left' }}>Client</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left' }}>Produits</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Montant</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left' }}>Paiement</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left' }}>Date & Heure</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucune vente trouvée pour cette période
                  </td></tr>
                ) : filtered.map((sale, i) => (
                  <motion.tr key={sale.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid var(--border)' }} className="hover-row">
                    <td style={{ padding: '14px 20px', fontWeight: 700 }}>#{sale.id?.toString()?.slice(-6) || '—'}</td>
                    <td style={{ padding: '14px 20px' }}>{sale.clientInfo?.nom || sale.clientNom || 'Client comptoir'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {(sale.items || sale.articles || []).slice(0, 3).map((item: any, j: number) => (
                          <span key={j} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {item.nom} ×{item.quantite || 1}
                          </span>
                        ))}
                        {(sale.items || sale.articles || []).length > 3 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                            +{(sale.items || sale.articles).length - 3} autres
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 800, color: 'var(--success)' }}>
                      {convertPrice(sale.montantCDF || sale.montantTotal || 0, sale.devise || 'CDF')}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '8px', background: sale.methodePaiement === 'Espèces' ? 'rgba(16,185,129,0.1)' : 'rgba(192,126,18,0.1)', color: sale.methodePaiement === 'Espèces' ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>
                        {sale.methodePaiement || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {formatDate(sale.createdAt)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Flux d'activités */}
        <div className="glass" style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <h3 style={{ padding: '16px 20px', margin: 0, fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{language === 'fr' ? 'Flux d\'activités' : 'Activity Feed'} ({filteredActivities.length})</span>
            <button onClick={() => fetchUserActivities(selectedUser.id)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}>
              <RefreshCw size={16} className={activitiesLoading ? 'animate-spin' : ''} />
            </button>
          </h3>
          {activitiesLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} /></div>
          ) : filteredActivities.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Activity size={32} opacity={0.2} />
              <p style={{ fontWeight: 600, marginTop: '8px' }}>Aucune activité enregistrée pour cette période</p>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredActivities.map((act: any, i: number) => {
                const IconComp = activityIcons[act.type] || Activity;
                const color = activityColors[act.type] || 'var(--text-muted)';
                return (
                  <div key={act.id || i} style={{
                    display: 'flex', gap: '14px', padding: '14px 20px',
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'flex-start', transition: 'background 0.2s'
                  }} className="hover-row">
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color
                    }}>
                      <IconComp size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px',
                          background: `${color}15`, color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                          {getActivityLabel(act.type)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatDate(act.createdAt)}
                        </span>
                      </div>
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                        {act.description}
                      </p>
                      {act.module && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'inline-block' }}>
                          Module: {act.module}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ─── VUE LISTE ───
  if (loading) return (
    <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 900, fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase' }}>
          <Users size={14} /> {language === 'fr' ? 'Gestion Équipe' : 'Team Management'}
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}>
          <span className="text-gradient">{language === 'fr' ? 'Activité des collaborateurs' : 'Staff Activity'}</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
          {language === 'fr' ? 'Suivez les performances de chaque membre de votre équipe' : 'Track each team member\'s performance'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowTeamManager(!showTeamManager)}
          className="btn-premium"
          style={{
            padding: '10px 20px', borderRadius: '14px', border: '1.5px solid var(--border)',
            background: showTeamManager ? 'var(--primary)' : 'var(--bg-card)',
            color: showTeamManager ? 'white' : 'var(--text-main)',
            fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
          }}
        >
          {showTeamManager ? 'Fermer' : 'Gerer l\'equipe'}
        </button>
        {!showTeamManager && (
          <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={language === 'fr' ? 'Rechercher un membre...' : 'Search team member...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
            />
          </div>
        )}
      </div>

      {showTeamManager && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <TeamSection />
        </motion.div>
      )}

      <div style={{ display: 'grid', gap: '12px' }}>
        {filteredSubusers.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: '20px', color: 'var(--text-muted)' }}>
            <Users size={48} opacity={0.15} />
            <p style={{ fontWeight: 700, marginTop: '12px' }}>Aucun membre trouvé</p>
          </div>
        ) : filteredSubusers.map(sub => {
          const stats = getSubuserStats(sub.id);
          return (
            <motion.div
              key={sub.id}
              whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
              onClick={() => selectUser(sub)}
              className="premium-card"
              style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.2rem', flexShrink: 0 }}>
                  {sub.nom?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {sub.nom}
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '100px', background: sub.role === 'gerant' ? 'rgba(21,94,88,0.1)' : 'rgba(16,185,129,0.1)', color: sub.role === 'gerant' ? 'var(--primary)' : 'var(--success)', fontWeight: 800, textTransform: 'capitalize' }}>
                      {sub.role === 'gerant' ? 'Gérant' : sub.role === 'caissier' ? 'Caissier' : 'Vendeur'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{sub.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.totalSales}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ventes</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>{(stats.totalRevenue).toLocaleString()} {currency}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CA</div>
                </div>
                <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SubusersPage;
