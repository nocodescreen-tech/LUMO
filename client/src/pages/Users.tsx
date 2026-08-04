import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon, Search, Plus, Phone, Mail, Shield, Edit, Trash2, X,
  RefreshCw, UserPlus, Lock, UserCheck, ShieldCheck, UserX,
  ShoppingCart, Package, DollarSign, Wallet, Check, Truck, Activity,
  Settings, CreditCard, Clock, Ban, Calendar, History, AlertTriangle,
  Gauge, BarChart3, MapPin, ChevronDown, ChevronUp, Loader2, TrendingUp
} from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import { useTranslation } from '../hooks/useTranslation';

// ─── Modules & Permissions ────────────────────────────────────────
const ALL_MODULES = [
  {
    id: 'pos', labelKey: 'settingsModulePOS', icon: ShoppingCart, color: '#155E58',
    subs: [
      { id: 'pos', labelKey: 'usersPermPosAccess' },
      { id: 'sales.add', labelKey: 'usersPermCreateSale' },
      { id: 'sales.refund', labelKey: 'settingsModuleRefundSale' },
    ]
  },
  {
    id: 'products', labelKey: 'settingsModuleProducts', icon: Package, color: '#A84420',
    subs: [
      { id: 'products', labelKey: 'usersPermViewProducts' },
      { id: 'products.add', labelKey: 'settingsModuleAddProducts' },
      { id: 'products.edit', labelKey: 'settingsModuleEditProducts' },
      { id: 'products.delete', labelKey: 'settingsModuleDeleteProducts' },
      { id: 'products.import', labelKey: 'usersPermImportProducts' },
    ]
  },
  {
    id: 'clients', labelKey: 'settingsModuleClients', icon: UsersIcon, color: '#0F9D6A',
    subs: [
      { id: 'clients', labelKey: 'usersPermViewClients' },
      { id: 'clients.add', labelKey: 'settingsModuleAddClient' },
      { id: 'clients.edit', labelKey: 'usersPermEditClient' },
      { id: 'clients.delete', labelKey: 'settingsModuleDeleteProducts' },
    ]
  },
  {
    id: 'suppliers', labelKey: 'usersModuleSuppliers', icon: Truck, color: '#C98A1B',
    subs: [
      { id: 'suppliers', labelKey: 'usersPermViewSuppliers' },
      { id: 'suppliers.add', labelKey: 'usersPermAddSupplier' },
      { id: 'suppliers.edit', labelKey: 'usersPermEditSupplier' },
    ]
  },
  {
    id: 'purchases', labelKey: 'usersModulePurchases', icon: TrendingUp, color: '#2E6E8E',
    subs: [
      { id: 'purchases', labelKey: 'usersPermViewPurchases' },
      { id: 'purchases.add', labelKey: 'usersPermCreatePurchase' },
      { id: 'purchases.refund', labelKey: 'usersPermRefundPurchase' },
    ]
  },
  {
    id: 'sales', labelKey: 'settingsModuleSales', icon: BarChart3, color: '#0F9D6A',
    subs: [
      { id: 'sales', labelKey: 'usersPermViewSales' },
    ]
  },
  {
    id: 'cash', labelKey: 'usersModuleTreasury', icon: Wallet, color: '#C07E12',
    subs: [
      { id: 'cash', labelKey: 'usersPermCashAccess' },
    ]
  },
  {
    id: 'debts', labelKey: 'usersModuleDebts', icon: CreditCard, color: '#D64545',
    subs: [
      { id: 'debts', labelKey: 'usersPermViewDebts' },
      { id: 'debts.settle', labelKey: 'usersPermSettleDebts' },
    ]
  },
  {
    id: 'stats', labelKey: 'settingsModuleStats', icon: Gauge, color: '#A84420',
    subs: [
      { id: 'stats', labelKey: 'usersPermViewStats' },
    ]
  },
  {
    id: 'activities', labelKey: 'usersModuleAudit', icon: History, color: '#C98A1B',
    subs: [
      { id: 'activities', labelKey: 'usersPermViewAudit' },
    ]
  },
  {
    id: 'settings', labelKey: 'usersModuleSettings', icon: Settings, color: '#2E6E8E',
    subs: [
      { id: 'settings.view', labelKey: 'usersPermViewSettings' },
      { id: 'settings.edit', labelKey: 'usersPermEditSettings' },
    ]
  },
];

// ─── Rôles prédéfinis enrichis ────────────────────────────────────
const ROLE_PRESETS: Record<string, string[]> = {
  caissier: ['pos', 'sales.add', 'products', 'clients'],
  vendeur: ['pos', 'sales.add', 'products', 'clients', 'clients.add', 'sales'],
  inventoriste: ['products', 'products.add', 'products.edit', 'products.import', 'suppliers', 'suppliers.add', 'purchases', 'purchases.add'],
  superviseur: ['pos', 'sales.add', 'sales', 'products', 'products.add', 'products.edit', 'products.import',
    'clients', 'clients.add', 'clients.edit', 'suppliers', 'purchases', 'cash', 'debts', 'stats', 'activities', 'settings.view'],
  manager: ['pos', 'sales.add', 'sales.refund', 'sales', 'products', 'products.add', 'products.edit', 'products.delete', 'products.import',
    'clients', 'clients.add', 'clients.edit', 'clients.delete', 'suppliers', 'suppliers.add', 'suppliers.edit',
    'purchases', 'purchases.add', 'purchases.refund', 'cash', 'debts', 'debts.settle', 'stats', 'activities', 'settings.view', 'settings.edit'],
};

const ROLE_LABELS: Record<string, string> = {
  caissier: 'Caissier(ère)',
  vendeur: 'Vendeur(se)',
  inventoriste: 'Inventoriste',
  superviseur: 'Superviseur',
  manager: 'Manager',
};

const ROLE_DESC: Record<string, string> = {
  caissier: 'Encaissement & produits',
  vendeur: 'Vente, clients & stats',
  inventoriste: 'Stock & approvisionnements',
  superviseur: 'Tout voir, modifier (pas supprimer)',
  manager: 'Accès complet',
};

// ─── Composant Panneau de Permissions ────────────────────────────
const PermissionPanel = ({ permissions, onChange }: { permissions: string[], onChange: (p: string[]) => void }) => {
  const { t } = useTranslation();
  const toggle = (id: string) => {
    onChange(permissions.includes(id) ? permissions.filter(p => p !== id) : [...permissions, id]);
  };
  const toggleModule = (mod: typeof ALL_MODULES[0]) => {
    const allIds = mod.subs.map(s => s.id);
    const allChecked = allIds.every(id => permissions.includes(id));
    if (allChecked) {
      onChange(permissions.filter(p => !allIds.includes(p)));
    } else {
      onChange([...new Set([...permissions, ...allIds])]);
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
      {ALL_MODULES.map(mod => {
        const allChecked = mod.subs.every(s => permissions.includes(s.id));
        const someChecked = mod.subs.some(s => permissions.includes(s.id));
        return (
          <div key={mod.id} style={{ borderRadius: '14px', border: `1px solid ${someChecked ? mod.color + '44' : 'var(--border)'}`, overflow: 'hidden', background: someChecked ? mod.color + '08' : 'var(--bg-main)' }}>
            <div onClick={() => toggleModule(mod)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: someChecked ? `1px solid ${mod.color}22` : '1px solid transparent' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: mod.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <mod.icon size={15} color={mod.color} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', flex: 1 }}>{t(mod.labelKey)}</span>
              <div style={{ width: '18px', height: '18px', borderRadius: '5px', border: `2px solid ${allChecked ? mod.color : 'var(--border)'}`, background: allChecked ? mod.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {allChecked && <Check size={10} color="white" />}
              </div>
            </div>
            {someChecked && (
              <div style={{ padding: '6px 14px 10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {mod.subs.map(sub => {
                  const active = permissions.includes(sub.id);
                  return (
                    <button key={sub.id} type="button" onClick={() => toggle(sub.id)}
                      style={{ padding: '5px 10px', borderRadius: '8px', border: `1px solid ${active ? mod.color : 'var(--border)'}`, background: active ? mod.color + '22' : 'transparent', color: active ? mod.color : 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                      {t(sub.labelKey)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Composant Journal d'Audit ────────────────────────────────────
const ActivityLog = ({ userId }: { userId: number }) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/subusers/${userId}/activity?_t=${Date.now()}`);
        const list = Array.isArray(data) ? data : (data.data || []);
        setActivities(list.slice(0, 20));
      } catch { setActivities([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [userId]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'VENTE': return <ShoppingCart size={14} color="var(--success)" />;
      case 'REMBOURSEMENT': return <Ban size={14} color="var(--danger)" />;
      case 'CREATION_PRODUIT': return <Package size={14} color="var(--primary)" />;
      case 'SUPPRESSION_PRODUIT': return <Trash2 size={14} color="var(--danger)" />;
      case 'MODIF_PRODUIT': return <Edit size={14} color="var(--info)" />;
      case 'CONNEXION': return <UserCheck size={14} color="var(--success)" />;
      default: return <Activity size={14} color="var(--text-muted)" />;
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="animate-spin" size={24} style={{ color: 'var(--primary)' }} /></div>;
  if (activities.length === 0) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px', fontSize: '0.9rem' }}>Aucune activité enregistrée.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '280px', overflowY: 'auto' }}>
      {activities.map((a: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: i % 2 === 0 ? 'var(--bg-main)' : 'transparent' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--sidebar-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {getIcon(a.type)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.description}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{new Date(a.createdAt).toLocaleString('fr-FR', { hour12: false })}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Page Principale ──────────────────────────────────────────────
const emptyUser = { nom: '', email: '', motDePasse: '', telephone: '', role: 'caissier' };
const emptyLimits = { maxRemise: 15, maxCaisse: 0, allowRefund: true, allowDelete: false, heureDebut: '', heureFin: '' };

const Users = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [newUser, setNewUser] = useState({ ...emptyUser });
  const [newPerms, setNewPerms] = useState<string[]>(ROLE_PRESETS.caissier);
  const [newLimits, setNewLimits] = useState({ ...emptyLimits });
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [editLimits, setEditLimits] = useState({ ...emptyLimits });
  const [editTab, setEditTab] = useState<'info' | 'permissions' | 'activity' | 'limits'>('info');
  const [showSuspendPanel, setShowSuspendPanel] = useState(false);
  const [suspendDate, setSuspendDate] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/subusers?_t=${Date.now()}`);
      const d = res.data;
      let list = [];
      if (d.success && d.data) list = Array.isArray(d.data) ? d.data : d.data.data || [];
      else list = Array.isArray(d) ? d : d.data || [];
      setUsers(list);
    } catch { toast.error(t('usersLoadError')); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = (role: string) => {
    setNewUser(p => ({ ...p, role }));
    setNewPerms(ROLE_PRESETS[role] || []);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/subusers', { ...newUser, permissions: newPerms, limits: newLimits });
      toast.success(t('userAddedNamed').replace('{name}', newUser.nom));
      setShowAddModal(false);
      setNewUser({ ...emptyUser });
      setNewPerms(ROLE_PRESETS.caissier);
      setNewLimits({ ...emptyLimits });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('userAddError'));
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/subusers/${selectedUser.id}`, { ...selectedUser, permissions: editPerms, limits: editLimits });
      toast.success(t('userUpdated'));
      setShowEditModal(false);
      fetchUsers();
    } catch { toast.error(t('userUpdateError')); }
  };

  const handleDeleteUser = (id: number, name: string) => {
    setConfirmModal({
      isOpen: true, title: "Supprimer Membre",
      message: `Supprimer définitivement l'accès pour ${name} ?`,
      onConfirm: async () => {
        try { await api.delete(`/subusers/${id}`); toast.success(t('userDeleted')); fetchUsers(); }
        catch (err: any) { toast.error(err.response?.data?.message || t('userDeleteError')); }
      }
    });
  };

  const toggleSuspension = async (u: any) => {
    try {
      await api.put(`/subusers/${u.id}`, { isSuspended: !u.isSuspended, suspendUntil: null, suspendReason: null });
      toast.success(u.isSuspended ? t('accountReactivated') : t('accountSuspended'));
      fetchUsers();
    } catch { toast.error(t('genericError')); }
  };

  const handleSuspendWithDate = async (u: any) => {
    try {
      await api.put(`/subusers/${u.id}`, { isSuspended: true, suspendUntil: suspendDate || null, suspendReason: suspendReason || null });
      toast.success(suspendDate ? `Suspendu jusqu'au ${new Date(suspendDate).toLocaleDateString()}` : 'Compte suspendu');
      setShowSuspendPanel(false);
      setSuspendDate('');
      setSuspendReason('');
      fetchUsers();
    } catch { toast.error(t('genericError')); }
  };

  const openEdit = (u: any) => {
    setSelectedUser(u);
    setEditPerms(Array.isArray(u.permissions) ? u.permissions : []);
    setEditLimits(u.limits || { ...emptyLimits });
    setEditTab('info');
    setShowEditModal(true);
  };

  // ─── Helpers d'affichage ────────────────────────────────────────
  const getOnlineStatus = (u: any): { color: string; label: string; bg: string } => {
    if (u.isSuspended) return { color: 'var(--danger)', label: 'Suspendu', bg: 'rgba(214,69,69,0.1)' };
    const lastSeen = u.lastSeen ? new Date(u.lastSeen) : null;
    if (!lastSeen) return { color: 'var(--text-muted)', label: 'Jamais connecté', bg: 'var(--sidebar-active)' };
    const mins = (Date.now() - lastSeen.getTime()) / 60000;
    if (mins < 5) return { color: 'var(--success)', label: 'En ligne', bg: 'rgba(15,157,106,0.1)' };
    if (mins < 60) return { color: 'var(--accent)', label: `Vu il y a ${Math.round(mins)} min`, bg: 'rgba(201,138,27,0.1)' };
    if (mins < 1440) return { color: 'var(--warning)', label: `Vu il y a ${Math.round(mins / 60)}h`, bg: 'rgba(192,126,18,0.1)' };
    return { color: 'var(--text-muted)', label: `Vu le ${lastSeen.toLocaleDateString()}`, bg: 'var(--sidebar-active)' };
  };

  const roleColor: Record<string, string> = {
    caissier: '#155E58', vendeur: '#0F9D6A', inventoriste: '#C98A1B', superviseur: '#2E6E8E', manager: '#A84420'
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '13px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 600, outline: 'none', fontSize: '0.9rem' };
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block', letterSpacing: '0.05em' };

  const filteredUsers = users.filter((u: any) =>
    u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Rendu ──────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase' }}>
            <ShieldCheck size={14} /> {t('usersTeamBadge')}
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}>
            {t('usersTeamTitle')} <span className="text-gradient">{t('usersTeamGradient')}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '4px' }}>{t('usersTeamSubtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className="glass" style={{ padding: '12px 18px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <UsersIcon size={18} color="var(--primary)" />
            <div><span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Équipe</span>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{users.length} membres</div>
            </div>
          </div>
          <button onClick={() => { setShowAddModal(true); setNewUser({ ...emptyUser }); setNewPerms(ROLE_PRESETS.caissier); setNewLimits({ ...emptyLimits }); }}
            style={{ padding: '14px 28px', borderRadius: '18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 16px 32px -8px var(--primary-glow)', fontSize: '0.95rem' }}>
            <UserPlus size={20} /> {t('usersNewMember')}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="glass" style={{ padding: '14px', borderRadius: '22px', display: 'flex', gap: '14px', alignItems: 'center', border: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder={t('usersSearchPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '48px' }} />
        </div>
        <button onClick={fetchUsers} className="glass btn-hover" style={{ width: '48px', height: '48px', borderRadius: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Grille Utilisateurs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 370px), 1fr))', gap: '22px' }}>
        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="premium-card" style={{ borderRadius: '28px', height: '240px', opacity: 0.08 }} />)
          : filteredUsers.length === 0 ? (
            <div className="premium-card" style={{ gridColumn: '1/-1', padding: '80px', textAlign: 'center', borderRadius: '36px' }}>
              <UsersIcon size={60} opacity={0.08} style={{ marginBottom: '20px' }} />
              <h2 style={{ fontWeight: 800, fontSize: '1.3rem' }}>Aucun membre trouvé</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Ajoutez des collaborateurs pour déléguer les tâches.</p>
            </div>
          ) : filteredUsers.map((u: any) => {
            const status = getOnlineStatus(u);
            const perms: string[] = Array.isArray(u.permissions) ? u.permissions : [];
            const limits = u.limits || {};
            const isExpanded = expandedUserId === u.id;
            return (
              <motion.div key={u.id} layout whileHover={{ y: -4 }} className="premium-card"
                style={{ padding: '24px', borderRadius: '28px', border: u.isSuspended ? '2px solid var(--danger)' : '1px solid var(--border)', opacity: u.isSuspended ? 0.72 : 1 }}>
                {/* Top row: avatar + name + status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.3rem', position: 'relative' }}>
                      {u.nom.charAt(0).toUpperCase()}
                      <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '14px', height: '14px', borderRadius: '50%', background: status.color, border: '2px solid var(--bg-card)' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>{u.nom}</h3>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: (roleColor[u.role] || '#155E58') + '22', color: roleColor[u.role] || '#155E58', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: status.color, background: status.bg, padding: '2px 8px', borderRadius: '6px' }}>{status.label}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => openEdit(u)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit size={14} /></button>
                    <button onClick={u.isSuspended ? () => toggleSuspension(u) : () => { setSelectedUser(u); setShowSuspendPanel(true); }}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: u.isSuspended ? 'var(--success)' : 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {u.isSuspended ? <UserCheck size={14} /> : <Ban size={14} />}
                    </button>
                    <button onClick={() => handleDeleteUser(u.id, u.nom)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Contact info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}><Mail size={13} /> {u.email}</div>
                  {u.telephone && <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}><Phone size={13} /> {u.telephone}</div>}
                  {u.lastSeen && <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}><Clock size={13} /> Dernière connexion : {new Date(u.lastSeen).toLocaleString('fr-FR', { hour12: false })}</div>}
                </div>

                {/* Permissions badges rapides */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                  {perms.slice(0, 4).map(p => (
                    <span key={p} style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'var(--sidebar-active)', color: 'var(--text-muted)' }}>{p}</span>
                  ))}
                  {perms.length > 4 && <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'var(--primary-glow)', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => { setExpandedUserId(isExpanded ? null : u.id); openEdit(u); }}>
                    +{perms.length - 4} permissions
                  </span>}
                </div>

                {/* Suspension info */}
                {u.isSuspended && u.suspendUntil && (
                  <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(214,69,69,0.08)', marginTop: '4px' }}>
                    <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--danger)' }}>
                      <Calendar size={12} style={{ marginRight: '4px' }} />
                      Suspendu jusqu'au {new Date(u.suspendUntil).toLocaleDateString()}
                    </p>
                    {u.suspendReason && <p style={{ margin: '3px 0 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>Motif : {u.suspendReason}</p>}
                  </div>
                )}

                {/* Limites visibles */}
                {(limits.maxRemise || limits.maxCaisse || limits.allowRefund === false || limits.allowDelete === false || limits.heureDebut) && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {limits.maxRemise > 0 && <span style={{ fontSize: '0.62rem', padding: '2px 7px', borderRadius: '5px', background: 'rgba(201,138,27,0.1)', color: 'var(--accent)', fontWeight: 700 }}>Remise max {limits.maxRemise}%</span>}
                    {limits.maxCaisse > 0 && <span style={{ fontSize: '0.62rem', padding: '2px 7px', borderRadius: '5px', background: 'rgba(214,69,69,0.08)', color: 'var(--danger)', fontWeight: 700 }}>Plafond {limits.maxCaisse.toLocaleString()} FC</span>}
                    {limits.allowRefund === false && <span style={{ fontSize: '0.62rem', padding: '2px 7px', borderRadius: '5px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', fontWeight: 700 }}>Remboursement interdit</span>}
                    {limits.allowDelete === false && <span style={{ fontSize: '0.62rem', padding: '2px 7px', borderRadius: '5px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', fontWeight: 700 }}>Suppression interdite</span>}
                    {limits.heureDebut && <span style={{ fontSize: '0.62rem', padding: '2px 7px', borderRadius: '5px', background: 'var(--sidebar-active)', color: 'var(--text-muted)', fontWeight: 700 }}>🕐 {limits.heureDebut}–{limits.heureFin || '…'}</span>}
                  </div>
                )}

                <div style={{ marginTop: '10px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Membre depuis le {new Date(u.createdAt).toLocaleDateString()}
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* ─── MODAL AJOUT ─────────────────────────────────────────── */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter un Collaborateur" subtitle="Définissez le rôle, les permissions et les limites." maxWidth="720px" icon={UserPlus}>
        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Nom complet *</label>
            <input required type="text" placeholder="ex: Patrick Mulumba" value={newUser.nom} onChange={e => setNewUser({ ...newUser, nom: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Email *</label>
              <input required type="email" placeholder="caissier@lumo.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mot de passe *</label>
              <input required type="password" placeholder="••••••••" value={newUser.motDePasse} onChange={e => setNewUser({ ...newUser, motDePasse: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input type="text" placeholder="+243..." value={newUser.telephone} onChange={e => setNewUser({ ...newUser, telephone: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Rôle</label>
              <select value={newUser.role} onChange={e => handleRoleChange(e.target.value)} style={inputStyle}>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label} — {ROLE_DESC[key]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Permissions — {newPerms.length} activée(s)</label>
            <PermissionPanel permissions={newPerms} onChange={setNewPerms} />
          </div>

          {/* Limites opérationnelles */}
          <details style={{ marginTop: '4px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', padding: '8px 0' }}>⚙️ Limites opérationnelles (optionnel)</summary>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
              <div>
                <label style={labelStyle}>Remise max (%)</label>
                <input type="number" min={0} max={100} value={newLimits.maxRemise} onChange={e => setNewLimits({ ...newLimits, maxRemise: Number(e.target.value) })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Plafond caisse (FC)</label>
                <input type="number" min={0} placeholder="0 = illimité" value={newLimits.maxCaisse} onChange={e => setNewLimits({ ...newLimits, maxCaisse: Number(e.target.value) })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Heure début</label>
                <input type="time" value={newLimits.heureDebut} onChange={e => setNewLimits({ ...newLimits, heureDebut: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Heure fin</label>
                <input type="time" value={newLimits.heureFin} onChange={e => setNewLimits({ ...newLimits, heureFin: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                <input type="checkbox" checked={!newLimits.allowRefund} onChange={e => setNewLimits({ ...newLimits, allowRefund: !e.target.checked })} />
                Remboursement interdit
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                <input type="checkbox" checked={!newLimits.allowDelete} onChange={e => setNewLimits({ ...newLimits, allowDelete: !e.target.checked })} />
                Suppression interdite
              </label>
            </div>
          </details>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
            <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '13px 22px', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" style={{ padding: '13px 28px', borderRadius: '14px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 16px -4px var(--primary-glow)' }}>
              Créer le compte
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL ÉDITION AVEC ONGLETS ──────────────────────────── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Modifier : ${selectedUser?.nom || ''}`} maxWidth="720px">
        {selectedUser && (
          <div>
            {/* Onglets */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-main)', borderRadius: '14px', padding: '4px' }}>
              {(['info', 'permissions', 'activity', 'limits'] as const).map(tab => (
                <button key={tab} onClick={() => setEditTab(tab)}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '11px', border: 'none',
                    background: editTab === tab ? 'var(--bg-card)' : 'transparent',
                    color: editTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: editTab === tab ? 'var(--shadow-sm)' : 'none'
                  }}>
                  {tab === 'info' ? '📋 Infos' : tab === 'permissions' ? '🔐 Permissions' : tab === 'activity' ? '📊 Activité' : '⚙️ Limites'}
                </button>
              ))}
            </div>

            {editTab === 'info' && (
              <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Nom complet</label>
                    <input required type="text" value={selectedUser.nom} onChange={e => setSelectedUser({ ...selectedUser, nom: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Téléphone</label>
                    <input type="text" value={selectedUser.telephone || ''} onChange={e => setSelectedUser({ ...selectedUser, telephone: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input required type="email" value={selectedUser.email} onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Rôle</label>
                  <select value={selectedUser.role} onChange={e => { setSelectedUser({ ...selectedUser, role: e.target.value }); setEditPerms(ROLE_PRESETS[e.target.value] || []); }} style={inputStyle}>
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label} — {ROLE_DESC[key]}</option>
                    ))}
                  </select>
                </div>

                {/* Statut */}
                <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getOnlineStatus(selectedUser).color }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>{getOnlineStatus(selectedUser).label}</p>
                    {selectedUser.lastSeen && <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Dernière activité : {new Date(selectedUser.lastSeen).toLocaleString('fr-FR', { hour12: false })}
                    </p>}
                  </div>
                  {selectedUser.isSuspended && (
                    <span style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: '8px', background: 'rgba(214,69,69,0.1)', color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 700 }}>SUSPENDU</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                  <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '13px 22px', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                  <button type="submit" style={{ padding: '13px 28px', borderRadius: '14px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Enregistrer</button>
                </div>
              </form>
            )}

            {editTab === 'permissions' && (
              <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Permissions Détaillées — {editPerms.length} activée(s)</label>
                  <PermissionPanel permissions={editPerms} onChange={setEditPerms} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '13px 22px', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                  <button type="submit" style={{ padding: '13px 28px', borderRadius: '14px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Enregistrer</button>
                </div>
              </form>
            )}

            {editTab === 'activity' && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>20 dernières actions de {selectedUser.nom}</p>
                <ActivityLog userId={selectedUser.id} />
              </div>
            )}

            {editTab === 'limits' && (
              <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Remise max (%)</label>
                    <input type="number" min={0} max={100} value={editLimits.maxRemise || 15} onChange={e => setEditLimits({ ...editLimits, maxRemise: Number(e.target.value) })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Plafond caisse (FC)</label>
                    <input type="number" min={0} placeholder="0 = illimité" value={editLimits.maxCaisse || 0} onChange={e => setEditLimits({ ...editLimits, maxCaisse: Number(e.target.value) })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Heure début</label>
                    <input type="time" value={editLimits.heureDebut || ''} onChange={e => setEditLimits({ ...editLimits, heureDebut: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Heure fin</label>
                    <input type="time" value={editLimits.heureFin || ''} onChange={e => setEditLimits({ ...editLimits, heureFin: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={editLimits.allowRefund === false} onChange={e => setEditLimits({ ...editLimits, allowRefund: !e.target.checked })} />
                    Remboursement interdit
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={editLimits.allowDelete === false} onChange={e => setEditLimits({ ...editLimits, allowDelete: !e.target.checked })} />
                    Suppression interdite
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                  <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '13px 22px', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                  <button type="submit" style={{ padding: '13px 28px', borderRadius: '14px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Enregistrer</button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>

      {/* ─── MODAL SUSPENSION PROGRAMMÉE ──────────────────────────── */}
      {showSuspendPanel && selectedUser && (
        <Modal isOpen={showSuspendPanel} onClose={() => setShowSuspendPanel(false)} title={`Suspendre ${selectedUser.nom}`} maxWidth="480px" icon={Ban}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Choisissez une date de réactivation automatique (optionnel). Si laissé vide, la suspension sera permanente.</p>
            <div>
              <label style={labelStyle}>Réactiver le</label>
              <input type="date" value={suspendDate} onChange={e => setSuspendDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Motif</label>
              <input type="text" placeholder="ex: Congés, absence..." value={suspendReason} onChange={e => setSuspendReason(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
              <button onClick={() => setShowSuspendPanel(false)} style={{ padding: '13px 22px', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => handleSuspendWithDate(selectedUser)} style={{ padding: '13px 28px', borderRadius: '14px', background: 'var(--danger)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                Suspendre
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </motion.div>
  );
};

export default Users;
