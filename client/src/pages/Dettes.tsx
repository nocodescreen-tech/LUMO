import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  MoreVertical,
  Filter,
  X,
  DollarSign,
  Send,
  Pencil,
  Trash2,
  ChevronDown,
  RefreshCw,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Activity,
  Wallet,
  ArrowUpDown,
  Truck,
  Building2,
  TrendingUp,
  Bell,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios';

// ──────────────────────────────────────────────
// Global App Search Config
// ──────────────────────────────────────────────
const APP_ROUTES = [
  { label: 'Tableau de Bord', icon: LayoutDashboard, path: '/dashboard', desc: 'Vue générale de votre commerce', tags: ['accueil', 'dashboard', 'tableau'] },
  { label: 'Caisse (POS)', icon: ShoppingCart, path: '/pos', desc: 'Terminal de vente rapide', tags: ['pos', 'caisse', 'vente', 'paiement'] },
  { label: 'Produits & Stocks', icon: Package, path: '/products', desc: 'Gestion des produits et inventaire', tags: ['produits', 'stock', 'inventaire', 'articles'] },
  { label: 'Clients', icon: Users, path: '/clients', desc: 'Gestion de votre clientèle', tags: ['clients', 'acheteurs', 'contact'] },
  { label: 'Ventes', icon: Wallet, path: '/sales', desc: 'Historique des transactions', tags: ['ventes', 'transactions', 'historique'] },
  { label: 'Achats', icon: TrendingUp, path: '/purchases', desc: 'Factures et achats fournisseurs', tags: ['achats', 'factures', 'fournisseurs'] },
  { label: 'Dettes & Crédits', icon: CreditCard, path: '/dettes', desc: 'Suivi des dettes clients et fournisseurs', tags: ['dettes', 'crédit', 'remboursement'] },
  { label: 'Fournisseurs', icon: Truck, path: '/fournisseurs', desc: 'Gestion des fournisseurs', tags: ['fournisseurs', 'approvisionnement', 'livraison'] },
  { label: 'Statistiques', icon: BarChart3, path: '/stats', desc: 'Analyses et rapports', tags: ['stats', 'statistiques', 'rapports', 'analyses'] },
  { label: 'Activités', icon: Activity, path: '/activities', desc: 'Journal des activités', tags: ['activités', 'journal', 'logs'] },
  { label: 'Paramètres', icon: Settings, path: '/settings', desc: 'Configuration du compte et des modules', tags: ['paramètres', 'settings', 'configuration', 'profil'] },
  { label: 'Notifications', icon: Bell, path: '/settings', desc: 'Gérer les notifications', tags: ['notifications', 'alertes', 'messages'] },
  { label: 'SuperAdmin', icon: ShieldCheck, path: '/superadmin', desc: 'Panneau d\'administration global', tags: ['admin', 'superadmin', 'administration'] },
];

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface ClientDebt {
  id: number;
  nom: string;
  email?: string;
  telephone?: string;
  detteTotale: number;
  type: 'client';
}

interface ActionMenuState {
  open: boolean;
  id: number | null;
  x: number;
  y: number;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
const Dettes = () => {
  const { currency, enabledModules } = useAuthStore();
  const navigate = useNavigate();

  // Data
  const [clients, setClients] = useState<ClientDebt[]>([]);
  const [loading, setLoading] = useState(true);

  // Global search
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debt list search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'urgent' | 'normal' | 'zero'>('all');
  const [showFilter, setShowFilter] = useState(false);

  // Action menu
  const [actionMenu, setActionMenu] = useState<ActionMenuState>({ open: false, id: null, x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // Settle modal
  const [settleModal, setSettleModal] = useState<{ open: boolean; client: ClientDebt | null }>({ open: false, client: null });
  const [settleAmount, setSettleAmount] = useState('');
  const [settleLoading, setSettleLoading] = useState(false);

  // ── Fetch clients ──────────────────────────
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/clients');
      const withDebt = (data as any[])
        .filter((c: any) => parseFloat(c.detteTotale) > 0)
        .map((c: any) => ({
          id: c.id,
          nom: c.nom,
          email: c.email,
          telephone: c.telephone,
          detteTotale: parseFloat(c.detteTotale),
          type: 'client' as const,
        }));
      setClients(withDebt);
    } catch {
      toast.error('Impossible de charger les dettes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // ── Close menus on outside click ──────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenu(prev => ({ ...prev, open: false }));
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Global search results ─────────────────
  const searchResults = globalSearch.trim().length > 0
    ? APP_ROUTES.filter(r => {
        const q = globalSearch.toLowerCase();
        return r.label.toLowerCase().includes(q) ||
          r.desc.toLowerCase().includes(q) ||
          r.tags.some(t => t.includes(q));
      }).slice(0, 6)
    : [];

  // ── Debt stats ────────────────────────────
  const totalDebt = clients.reduce((s, c) => s + c.detteTotale, 0);
  const urgentCount = clients.filter(c => c.detteTotale > 100000).length;
  const normalCount = clients.filter(c => c.detteTotale > 0 && c.detteTotale <= 100000).length;

  // ── Filter & search list ──────────────────
  const filtered = clients.filter(c => {
    const matchSearch = c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.telephone || '').includes(searchTerm) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter =
      filterStatus === 'all' ? true :
      filterStatus === 'urgent' ? c.detteTotale > 100000 :
      filterStatus === 'normal' ? c.detteTotale <= 100000 :
      c.detteTotale === 0;
    return matchSearch && matchFilter;
  });

  // ── Action menu open ──────────────────────
  const openActionMenu = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActionMenu({ open: true, id, x: rect.left - 160, y: rect.bottom + 8 });
  };

  const activeClient = clients.find(c => c.id === actionMenu.id) ?? null;

  // ── Settle debt ───────────────────────────
  const handleSettle = async () => {
    if (!settleModal.client) return;
    const amount = parseFloat(settleAmount);
    if (!amount || amount <= 0 || amount > settleModal.client.detteTotale) {
      toast.error('Montant invalide');
      return;
    }
    setSettleLoading(true);
    try {
      await api.post(`/clients/${settleModal.client.id}/regler`, { montant: amount });
      toast.success(`${amount.toLocaleString()} ${currency} réglés pour ${settleModal.client.nom} ✅`);
      setSettleModal({ open: false, client: null });
      setSettleAmount('');
      fetchClients();
    } catch {
      toast.error('Erreur lors du règlement');
    } finally {
      setSettleLoading(false);
    }
  };

  // ── Send reminder ─────────────────────────
  const handleReminder = async (client: ClientDebt) => {
    try {
      await api.post(`/clients/${client.id}/rappel`);
      toast.success(`Rappel envoyé à ${client.nom}`);
    } catch {
      toast.error('Impossible d\'envoyer le rappel');
    }
    setActionMenu(prev => ({ ...prev, open: false }));
  };

  const getStatusColor = (amount: number) => {
    if (amount > 100000) return 'var(--danger)';
    if (amount > 30000) return 'var(--warning)';
    return 'var(--info)';
  };

  const getStatusLabel = (amount: number) => {
    if (amount > 100000) return 'Urgent';
    if (amount > 30000) return 'Modéré';
    return 'Normal';
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '60px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 className="title-xl">Suivi des <span className="text-gradient">Dettes</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '6px' }}>
            Crédits clients, remboursements et échéances en temps réel.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Global App Search */}
          <div ref={searchRef} style={{ position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
              <input
                id="global-app-search"
                type="text"
                value={globalSearch}
                onChange={e => { setGlobalSearch(e.target.value); setShowSearchResults(true); }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Rechercher une fonctionnalité..."
                style={{
                  padding: '10px 14px 10px 40px',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  width: '260px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s'
                }}
              />
              {globalSearch && (
                <button onClick={() => { setGlobalSearch(''); setShowSearchResults(false); }} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <AnimatePresence>
              {showSearchResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  className="premium-card"
                  style={{
                    position: 'absolute',
                    top: '52px',
                    left: 0,
                    right: 0,
                    borderRadius: '20px',
                    padding: '8px',
                    zIndex: 2000,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    border: '1px solid var(--border)',
                    minWidth: '280px'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', padding: '6px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Fonctionnalités
                  </div>
                  {searchResults.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => { navigate(r.path); setGlobalSearch(''); setShowSearchResults(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-glow)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <r.icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{r.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
              {showSearchResults && globalSearch.trim().length > 0 && searchResults.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="premium-card"
                  style={{ position: 'absolute', top: '52px', left: 0, right: 0, padding: '20px', textAlign: 'center', borderRadius: '16px', border: '1px solid var(--border)' }}
                >
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Aucun résultat pour « {globalSearch} »</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="btn-premium secondary" onClick={fetchClients} title="Actualiser">
            <RefreshCw size={16} />
          </button>
          <button className="btn-premium secondary">
            <Calendar size={16} /> Rapports
          </button>
          <button className="btn-premium primary" onClick={() => navigate('/clients')}>
            <Plus size={16} /> Crédit Client
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {[
          { label: 'Total des Dettes', value: totalDebt, icon: AlertCircle, color: 'var(--danger)' },
          { label: 'Débiteurs Urgents', value: urgentCount, icon: Clock, color: 'var(--warning)', unit: ' clients', noFormat: true },
          { label: 'Créances Normales', value: normalCount, icon: CheckCircle2, color: 'var(--success)', unit: ' clients', noFormat: true },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="premium-card"
            style={{ padding: '28px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: s.color, filter: 'blur(60px)', opacity: 0.08 }} />
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--text-main)' }}>
                {s.noFormat ? `${s.value}${s.unit || ''}` : `${s.value.toLocaleString()} ${currency}`}
              </div>
            </div>
            <div style={{ padding: '14px', borderRadius: '18px', backgroundColor: `${s.color}15`, color: s.color, border: `1px solid ${s.color}25` }}>
              <s.icon size={28} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Debt List ── */}
      <div className="premium-card" style={{ padding: '32px', borderRadius: '32px' }}>

        {/* Table header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search within debts */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Rechercher un client, téléphone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '13px 13px 13px 46px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '0.95rem', fontFamily: 'inherit' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter button */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn-premium secondary"
              onClick={() => setShowFilter(!showFilter)}
              style={{ gap: '8px' }}
            >
              <Filter size={16} />
              {filterStatus === 'all' ? 'Tous' : filterStatus === 'urgent' ? 'Urgent' : filterStatus === 'normal' ? 'Normal' : 'Réglés'}
              <ChevronDown size={14} style={{ transform: showFilter ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            <AnimatePresence>
              {showFilter && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  className="premium-card"
                  style={{ position: 'absolute', right: 0, top: '52px', width: '180px', borderRadius: '16px', padding: '8px', zIndex: 100, border: '1px solid var(--border)' }}
                >
                  {[
                    { id: 'all', label: 'Tous les clients' },
                    { id: 'urgent', label: '🔴 Urgent (> 100k)' },
                    { id: 'normal', label: '🟡 Normal (≤ 100k)' },
                  ].map(f => (
                    <div
                      key={f.id}
                      onClick={() => { setFilterStatus(f.id as any); setShowFilter(false); }}
                      style={{ padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.87rem', color: filterStatus === f.id ? 'var(--primary)' : 'var(--text-main)', background: filterStatus === f.id ? 'var(--primary-glow)' : 'transparent', transition: 'all 0.15s' }}
                    >
                      {f.label}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Debt rows */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '88px', borderRadius: '20px', background: 'var(--bg-main)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <CreditCard size={48} style={{ opacity: 0.15, marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.05rem' }}>
              {searchTerm ? `Aucun résultat pour « ${searchTerm} »` : 'Aucune dette en cours 🎉'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filtered.map((debt, idx) => {
              const statusColor = getStatusColor(debt.detteTotale);
              const statusLabel = getStatusLabel(debt.detteTotale);
              return (
                <motion.div
                  key={debt.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                  className="premium-card"
                  style={{ padding: '20px 24px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)', transition: 'box-shadow 0.2s' }}
                >
                  {/* Left: avatar + info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
                      background: `linear-gradient(135deg, ${statusColor}20, ${statusColor}40)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusColor
                    }}>
                      <User size={22} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{debt.nom}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                        {debt.telephone || debt.email || 'Crédit Client'}
                      </div>
                    </div>
                  </div>

                  {/* Middle: status badge */}
                  <div style={{ display: 'none' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}25` }}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Right: amount + actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 950, fontSize: '1.2rem', color: statusColor }}>
                        {debt.detteTotale.toLocaleString()} {currency}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>
                        {statusLabel}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="btn-premium primary"
                        style={{ padding: '9px 18px', fontSize: '0.87rem', borderRadius: '12px' }}
                        onClick={() => { setSettleModal({ open: true, client: debt }); setSettleAmount(''); }}
                      >
                        <DollarSign size={15} /> Régler
                      </motion.button>

                      <button
                        id={`action-btn-${debt.id}`}
                        onClick={e => openActionMenu(e, debt.id)}
                        style={{
                          width: '40px', height: '40px', borderRadius: '12px',
                          background: 'var(--bg-main)', border: '1px solid var(--border)',
                          color: 'var(--text-muted)', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-glow)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Count label */}
        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            {filtered.length}/{clients.length} débiteur{clients.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── Action Menu (floating) ── */}
      <AnimatePresence>
        {actionMenu.open && activeClient && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1998 }} onClick={() => setActionMenu(p => ({ ...p, open: false }))} />
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.92, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -8 }}
              transition={{ duration: 0.15 }}
              className="premium-card"
              style={{
                position: 'fixed',
                top: actionMenu.y,
                left: Math.max(8, actionMenu.x),
                width: '200px',
                borderRadius: '18px',
                padding: '8px',
                zIndex: 1999,
                boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ padding: '8px 14px 6px', borderBottom: '1px solid var(--border)', marginBottom: '6px' }}>
                <div style={{ fontWeight: 900, fontSize: '0.85rem', color: 'var(--text-main)' }}>{activeClient.nom}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {activeClient.detteTotale.toLocaleString()} {currency}
                </div>
              </div>

              {[
                {
                  icon: DollarSign, label: 'Régler la dette', color: 'var(--success)',
                  action: () => { setSettleModal({ open: true, client: activeClient }); setSettleAmount(''); setActionMenu(p => ({ ...p, open: false })); }
                },
                {
                  icon: Send, label: 'Envoyer un rappel', color: 'var(--info)',
                  action: () => handleReminder(activeClient)
                },
                {
                  icon: Pencil, label: 'Modifier le client', color: 'var(--primary)',
                  action: () => { navigate('/clients'); setActionMenu(p => ({ ...p, open: false })); }
                },
                {
                  icon: Trash2, label: 'Supprimer client', color: 'var(--danger)',
                  action: () => { navigate('/clients'); setActionMenu(p => ({ ...p, open: false })); }
                },
              ].map((item, i) => (
                <div
                  key={i}
                  onClick={item.action}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                    borderRadius: '12px', cursor: 'pointer', color: item.color,
                    fontWeight: 700, fontSize: '0.87rem', transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `${item.color}10`}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <item.icon size={16} />
                  {item.label}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Settle Modal ── */}
      <AnimatePresence>
        {settleModal.open && settleModal.client && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', zIndex: 3000 }}
              onClick={() => setSettleModal({ open: false, client: null })}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="premium-card"
              style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '460px', maxWidth: '95vw',
                borderRadius: '28px', padding: '36px',
                zIndex: 3001, border: '1px solid var(--border)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.35)'
              }}
            >
              {/* Close */}
              <button
                onClick={() => setSettleModal({ open: false, client: null })}
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={20} />
              </button>

              {/* Icon */}
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--success), #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 12px 28px rgba(16,185,129,0.3)' }}>
                <DollarSign size={30} color="white" />
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '6px', color: 'var(--text-main)' }}>
                Régler la dette
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '28px', fontWeight: 500 }}>
                Client : <strong style={{ color: 'var(--text-main)' }}>{settleModal.client.nom}</strong><br />
                Solde restant : <strong style={{ color: 'var(--danger)' }}>{settleModal.client.detteTotale.toLocaleString()} {currency}</strong>
              </p>

              {/* Amount input */}
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Montant à régler
              </label>
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.95rem' }}>
                  {currency}
                </span>
                <input
                  type="number"
                  autoFocus
                  value={settleAmount}
                  onChange={e => setSettleAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSettle()}
                  min={1}
                  max={settleModal.client.detteTotale}
                  placeholder="0"
                  style={{
                    width: '100%', padding: '16px 16px 16px 56px',
                    borderRadius: '16px', border: '2px solid var(--border)',
                    background: 'var(--bg-main)', color: 'var(--text-main)',
                    fontSize: '1.2rem', fontWeight: 800, outline: 'none',
                    fontFamily: 'inherit', transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                />
              </div>

              {/* Quick amounts */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Tout', val: settleModal.client.detteTotale },
                  { label: '75%', val: Math.round(settleModal.client.detteTotale * 0.75) },
                  { label: '50%', val: Math.round(settleModal.client.detteTotale * 0.5) },
                  { label: '25%', val: Math.round(settleModal.client.detteTotale * 0.25) },
                ].map(q => (
                  <button
                    key={q.label}
                    onClick={() => setSettleAmount(q.val.toString())}
                    style={{
                      padding: '6px 14px', borderRadius: '50px', border: '1px solid var(--border)',
                      background: parseFloat(settleAmount) === q.val ? 'var(--primary)' : 'var(--bg-card)',
                      color: parseFloat(settleAmount) === q.val ? 'white' : 'var(--text-muted)',
                      cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit',
                      transition: 'all 0.15s'
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setSettleModal({ open: false, client: null })}
                  className="btn-premium secondary"
                  style={{ flex: 1 }}
                >
                  Annuler
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSettle}
                  disabled={settleLoading || !settleAmount}
                  className="btn-premium primary"
                  style={{ flex: 2, opacity: settleLoading || !settleAmount ? 0.6 : 1 }}
                >
                  {settleLoading ? (
                    <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Traitement...</>
                  ) : (
                    <><CheckCircle2 size={16} /> Confirmer le règlement</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dettes;
