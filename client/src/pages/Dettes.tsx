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
import { getDisplayAmount, useCurrency, normalizeAmount } from '../utils/currencyHelpers';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/axios';
import { useTranslation } from '../hooks/useTranslation';
import { exportToExcel } from '../utils/exportUtils';
import { Download } from 'lucide-react';

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
  const { t } = useTranslation();
  const { user, enabledModules } = useAuthStore();
  const { displayCurrency: currency, exchangeRate, convert, format } = useCurrency();
  const shopCurrency = (user as any)?.entreprise?.devise || 'USD';
  const navigate = useNavigate();

  // Helper for currency conversion
  const convertAmount = useCallback((amount: number) => {
    return convert(amount, shopCurrency);
  }, [convert, shopCurrency]);

  // Data
  const [clients, setClients] = useState<ClientDebt[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clients?limit=1000&_t=${Date.now()}`);
      const resData = response.data;

      let clientsList = [];
      if (resData.success && resData.data) {
        if (Array.isArray(resData.data.data)) {
          clientsList = resData.data.data;
        } else if (Array.isArray(resData.data)) {
          clientsList = resData.data;
        }
      } else {
        if (Array.isArray(resData)) clientsList = resData;
        else if (resData && Array.isArray(resData.data)) clientsList = resData.data;
        else if (resData && Array.isArray(resData.clients)) clientsList = resData.clients;
      }

      const withDebt = clientsList
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
    } catch (err) {
      console.error(err);
      toast.error(t('errorLoadingDebts'));
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
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Debt stats ────────────────────────────
  const totalDebt = clients.reduce((s, c) => s + c.detteTotale, 0);
  const totalDebtConverted = convertAmount(totalDebt);
  const urgentLimit = normalizeAmount(50, 'USD', currency, exchangeRate);
  const urgentCount = clients.filter(c => convertAmount(c.detteTotale) > urgentLimit).length;
  const normalCount = clients.filter(c => {
    const amt = convertAmount(c.detteTotale);
    return amt > 0 && amt <= urgentLimit;
  }).length;

  // ── Filter & search list ──────────────────
  const filtered = clients.filter(c => {
    const matchSearch = c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.telephone || '').includes(searchTerm) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const amt = convertAmount(c.detteTotale);
    const matchFilter =
      filterStatus === 'all' ? true :
        filterStatus === 'urgent' ? amt > urgentLimit :
          filterStatus === 'normal' ? amt <= urgentLimit :
            amt === 0;
    return matchSearch && matchFilter;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

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
    const maxAllowed = convertAmount(settleModal.client.detteTotale);

    if (!amount || amount <= 0 || amount > maxAllowed + 0.01) {
      toast.error(t('invalidAmount'));
      return;
    }
    setSettleLoading(true);
    try {
      // Convert back to base currency for backend
      const baseAmount = normalizeAmount(amount, shopCurrency, currency, exchangeRate);

      await api.post(`/clients/${settleModal.client.id}/regler`, { montant: baseAmount });
      toast.success(t('debtSettledFor').replace('{amount}', amount.toLocaleString()).replace('{currency}', currency).replace('{name}', settleModal.client.nom));
      setSettleModal({ open: false, client: null });
      setSettleAmount('');
      fetchClients();
    } catch {
      toast.error(t('settlementError'));
    } finally {
      setSettleLoading(false);
    }
  };

  // ── Send reminder ─────────────────────────
  const handleReminder = async (client: ClientDebt) => {
    try {
      await api.post(`/clients/${client.id}/rappel`);
      toast.success(t('reminderSentTo').replace('{name}', client.nom));
    } catch {
      toast.error(t('reminderSendError'));
    }
    setActionMenu(prev => ({ ...prev, open: false }));
  };

  const getStatusColor = (amount: number) => {
    const amt = convertAmount(amount);
    if (amt > urgentLimit) return 'var(--danger)';
    if (amt > (urgentLimit * 0.3)) return 'var(--warning)';
    return 'var(--info)';
  };

  const getStatusLabel = (amount: number) => {
    const amt = convertAmount(amount);
    if (amt > urgentLimit) return t('statusUrgent');
    if (amt > (urgentLimit * 0.3)) return t('statusModerate');
    return t('statusNormal');
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '60px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 className="title-xl">{t('debtsMgmtPrefix')} <span className="text-gradient">{t('debts')}</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '6px' }}>
            {t('debtsSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-premium secondary" onClick={fetchClients} title={t('refresh')}>
            <RefreshCw size={16} />
          </button>
          <button className="btn-premium secondary" onClick={() => {
            const rows = filtered.map(c => ({
              "Client": c.nom,
              "Email": c.email || 'N/A',
              "Téléphone": c.telephone || 'N/A',
              "Dette Restante": c.detteTotale
            }));
            exportToExcel(rows, 'Dettes_Report');
          }}>
            <Download size={16} /> {t('report')}
          </button>
          <button className="btn-premium primary" onClick={() => navigate('/clients')}>
            <Plus size={16} /> {t('creditClient')}
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {[
          { label: t('totalDebtsLabel'), value: totalDebtConverted, icon: AlertCircle, color: 'var(--danger)' },
          { label: t('urgentDebtors'), value: urgentCount, icon: Clock, color: 'var(--warning)', unit: t('clientsUnit'), noFormat: true },
          { label: t('normalReceivables'), value: normalCount, icon: CheckCircle2, color: 'var(--success)', unit: t('clientsUnit'), noFormat: true },
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
              {i === 0 ? (
                (() => {
                  const display = getDisplayAmount(totalDebt, shopCurrency, currency, exchangeRate);
                  return (
                    <div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {display.main}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '4px' }}>
                        ≙ {display.sub}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {s.noFormat ? `${s.value}${s.unit || ''}` : format(s.value)}
                </div>
              )}
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
              placeholder={t('searchDebtorPlaceholder')}
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
              {filterStatus === 'all' ? t('all') : filterStatus === 'urgent' ? t('urgent') : filterStatus === 'normal' ? t('normal') : t('settled')}
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
                    { id: 'all', label: t('allClientsFilter') },
                    { id: 'urgent', label: `🔴 ${t('urgent')} (> ${urgentLimit.toLocaleString()} ${currency})` },
                    { id: 'normal', label: `🟡 ${t('normal')} (≤ ${urgentLimit.toLocaleString()} ${currency})` },
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
              {searchTerm ? t('noResultsFor').replace('{search}', searchTerm) : t('noActiveDebts')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {currentItems.map((debt, idx) => {
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
                      {(() => {
                        const display = getDisplayAmount(debt.detteTotale, shopCurrency, currency, exchangeRate);
                        return (
                          <>
                            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: statusColor }}>
                              {display.main}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                              ≙ {display.sub}
                            </div>
                          </>
                        );
                      })()}
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
                        <DollarSign size={15} /> {t('settleBtn')}
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontWeight: 700 }}
            >
              {t('previous')}
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                style={{
                  width: '40px', height: '40px',
                  borderRadius: '12px',
                  border: currentPage === i + 1 ? 'none' : '1px solid var(--border)',
                  background: currentPage === i + 1 ? 'var(--primary)' : 'var(--bg-card)',
                  color: currentPage === i + 1 ? 'white' : 'var(--text-main)',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, fontWeight: 700 }}
            >
              {t('next')}
            </button>
          </div>
        )}

        {/* Count label */}
        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            {t('showingDebtorsPrefix')} {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filtered.length)} {t('ofSuffix')} {filtered.length} {t('debtorsLabel')}
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
                  {format(convertAmount(activeClient.detteTotale))}
                </div>
              </div>

              {[
                {
                  icon: DollarSign, label: t('settleDebtAction'), color: 'var(--success)',
                  action: () => { setSettleModal({ open: true, client: activeClient }); setSettleAmount(''); setActionMenu(p => ({ ...p, open: false })); }
                },
                {
                  icon: Send, label: t('sendReminderAction'), color: 'var(--info)',
                  action: () => handleReminder(activeClient)
                },
                {
                  icon: Pencil, label: t('editClientAction'), color: 'var(--primary)',
                  action: () => { navigate('/clients'); setActionMenu(p => ({ ...p, open: false })); }
                },
                {
                  icon: Trash2, label: t('deleteClientAction'), color: 'var(--danger)',
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
              initial={{ opacity: 0, scale: 0.9, y: '-40%', x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
              exit={{ opacity: 0, scale: 0.9, y: '-40%', x: '-50%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="premium-card"
              style={{
                position: 'fixed', top: '50%', left: '50%',
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
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--success), var(--success-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 12px 28px rgba(16,185,129,0.3)' }}>
                <DollarSign size={30} color="white" />
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '6px', color: 'var(--text-main)' }}>
                {t('settleDebtTitle')}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '28px', fontWeight: 500 }}>
                {t('clientLabel')} <strong style={{ color: 'var(--text-main)' }}>{settleModal.client.nom}</strong><br />
                {t('remainingBalanceLabel')} <strong style={{ color: 'var(--danger)' }}>{format(convertAmount(settleModal.client.detteTotale))}</strong>
              </p>

              {/* Amount input */}
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('amountToSettleLabel')}
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
                  { label: t('all'), val: convertAmount(settleModal.client.detteTotale) },
                  { label: '75%', val: Math.round(convertAmount(settleModal.client.detteTotale) * 0.75 * 100) / 100 },
                  { label: '50%', val: Math.round(convertAmount(settleModal.client.detteTotale) * 0.5 * 100) / 100 },
                  { label: '25%', val: Math.round(convertAmount(settleModal.client.detteTotale) * 0.25 * 100) / 100 },
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
                  {t('cancel')}
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
                    <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('processing')}</>
                  ) : (
                    <><CheckCircle2 size={16} /> {t('confirmSettlement')}</>
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
