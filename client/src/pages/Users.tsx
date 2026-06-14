import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon, Search, Plus, Phone, Mail, Shield, Edit, Trash2, X,
  RefreshCw, UserPlus, Lock, UserCheck, ShieldCheck, UserX, TrendingDown,
  Home, Truck, Coffee, BarChart2, ShoppingCart, Package, DollarSign, Wallet, Check
} from 'lucide-react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import { useTranslation } from '../hooks/useTranslation';

// All available modules with sub-permissions
const ALL_MODULES = [
  {
    id: 'pos', labelKey: 'settingsModulePOS', icon: ShoppingCart, color: '#6366f1',
    subs: [
      { id: 'pos', labelKey: 'usersPermPosAccess' },
      { id: 'sales.add', labelKey: 'usersPermCreateSale' },
      { id: 'sales.refund', labelKey: 'settingsModuleRefundSale' },
    ]
  },
  {
    id: 'products', labelKey: 'settingsModuleProducts', icon: Package, color: '#8b5cf6',
    subs: [
      { id: 'products', labelKey: 'usersPermViewProducts' },
      { id: 'products.add', labelKey: 'settingsModuleAddProducts' },
      { id: 'products.edit', labelKey: 'settingsModuleEditProducts' },
      { id: 'products.delete', labelKey: 'settingsModuleDeleteProducts' },
    ]
  },

  {
    id: 'clients', labelKey: 'settingsModuleClients', icon: UsersIcon, color: '#10b981',
    subs: [
      { id: 'clients', labelKey: 'usersPermViewClients' },
      { id: 'clients.add', labelKey: 'settingsModuleAddClient' },
    ]
  },
  {
    id: 'cash', labelKey: 'usersModuleTreasury', icon: Wallet, color: '#f59e0b',
    subs: [
      { id: 'cash', labelKey: 'usersPermCashAccess' },
    ]
  },
  {
    id: 'sales', labelKey: 'settingsModuleSales', icon: BarChart2, color: '#06b6d4',
    subs: [
      { id: 'sales', labelKey: 'usersPermViewSales' },
    ]
  },
  {
    id: 'stats', labelKey: 'settingsModuleStats', icon: BarChart2, color: '#a855f7',
    subs: [
      { id: 'stats', labelKey: 'usersPermViewStats' },
    ]
  },
];

const ROLE_PRESETS: Record<string, string[]> = {
  caissier: ['pos', 'sales.add', 'products', 'clients'],
  manager: ['pos', 'sales.add', 'sales', 'products', 'products.add', 'products.edit', 'clients', 'clients.add', 'stats'],
};

const emptyUser = { nom: '', email: '', motDePasse: '', telephone: '', role: 'caissier' };

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
      const merged = [...new Set([...permissions, ...allIds])];
      onChange(merged);
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
      {ALL_MODULES.map(mod => {
        const allChecked = mod.subs.every(s => permissions.includes(s.id));
        const someChecked = mod.subs.some(s => permissions.includes(s.id));
        return (
          <div key={mod.id} style={{ borderRadius: '16px', border: `1px solid ${someChecked ? mod.color + '44' : 'var(--border)'}`, overflow: 'hidden', background: someChecked ? mod.color + '08' : 'var(--bg-main)' }}>
            <div
              onClick={() => toggleModule(mod)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', cursor: 'pointer', borderBottom: someChecked ? `1px solid ${mod.color}22` : '1px solid transparent' }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: mod.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <mod.icon size={16} color={mod.color} />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.9rem', flex: 1 }}>{t(mod.labelKey)}</span>
              <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${allChecked ? mod.color : 'var(--border)'}`, background: allChecked ? mod.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {allChecked && <Check size={12} color="white" />}
              </div>
            </div>
            {someChecked && (
              <div style={{ padding: '8px 16px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {mod.subs.map(sub => {
                  const active = permissions.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggle(sub.id)}
                      style={{ padding: '6px 12px', borderRadius: '10px', border: `1px solid ${active ? mod.color : 'var(--border)'}`, background: active ? mod.color + '22' : 'transparent', color: active ? mod.color : 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
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

const Users = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [newUser, setNewUser] = useState({ ...emptyUser });
  const [newPerms, setNewPerms] = useState<string[]>(ROLE_PRESETS.caissier);
  const [editPerms, setEditPerms] = useState<string[]>([]);

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
      await api.post('/subusers', { ...newUser, permissions: newPerms });
      toast.success(t('userAddedNamed').replace('{name}', newUser.nom));
      setShowAddModal(false);
      setNewUser({ ...emptyUser });
      setNewPerms(ROLE_PRESETS.caissier);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('userAddError'));
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/subusers/${selectedUser.id}`, { ...selectedUser, permissions: editPerms });
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
      await api.put(`/subusers/${u.id}`, { isSuspended: !u.isSuspended });
      toast.success(u.isSuspended ? t('accountReactivated') : t('accountSuspended'));
      fetchUsers();
    } catch { toast.error(t('genericError')); }
  };

  const openEdit = (u: any) => {
    setSelectedUser(u);
    setEditPerms(Array.isArray(u.permissions) ? u.permissions : []);
    setShowEditModal(true);
  };

  const roleColor: Record<string, string> = { manager: '#f59e0b', caissier: '#6366f1' };
  const filteredUsers = users.filter((u: any) =>
    u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputStyle: React.CSSProperties = { width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 700, outline: 'none', fontSize: '0.95rem' };
  const labelStyle: React.CSSProperties = { fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '0.05em' };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 900, fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase' }}>
            <ShieldCheck size={14} /> {t('usersTeamBadge')}
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0 }}>
            {t('usersTeamTitle')} <span className="text-gradient">{t('usersTeamGradient')}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '4px' }}>{t('usersTeamSubtitle')}</p>
        </div>
        <button onClick={() => { setShowAddModal(true); setNewUser({ ...emptyUser }); setNewPerms(ROLE_PRESETS.caissier); }}
          style={{ padding: '16px 32px', borderRadius: '20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 950, cursor: 'pointer', boxShadow: '0 20px 40px -10px var(--primary-glow)', fontSize: '1rem' }}>
          <UserPlus size={22} /> {t('usersNewMember')}
        </button>
      </div>

      {/* Search */}
      <div className="glass" style={{ padding: '16px', borderRadius: '24px', display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder={t('usersSearchPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '52px' }} />
        </div>
        <button onClick={fetchUsers} className="glass btn-hover" style={{ width: '52px', height: '52px', borderRadius: '16px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}>
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="premium-card skeleton" style={{ borderRadius: '32px', height: '260px', opacity: 0.1 }} />)
          : filteredUsers.length === 0 ? (
            <div className="premium-card" style={{ gridColumn: '1/-1', padding: '80px', textAlign: 'center', borderRadius: '40px' }}>
              <UsersIcon size={64} opacity={0.1} style={{ marginBottom: '20px' }} />
              <h2 style={{ fontWeight: 950 }}>Aucun membre trouvé</h2>
              <p style={{ color: 'var(--text-muted)' }}>Ajoutez des collaborateurs pour déléguer les tâches.</p>
            </div>
          ) : filteredUsers.map((u: any) => {
            const perms: string[] = Array.isArray(u.permissions) ? u.permissions : [];
            return (
              <motion.div key={u.id} layout whileHover={{ y: -6 }} className="premium-card"
                style={{ padding: '28px', borderRadius: '32px', border: u.isSuspended ? '2px solid #ef4444' : '1px solid var(--border)', opacity: u.isSuspended ? 0.7 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 950, fontSize: '1.4rem' }}>
                      {u.nom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 950, margin: 0 }}>{u.nom}</h3>
                      <span style={{ padding: '3px 10px', borderRadius: '8px', background: (roleColor[u.role] || '#6366f1') + '22', color: roleColor[u.role] || '#6366f1', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>
                        {u.role}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openEdit(u)} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit size={15} /></button>
                    <button onClick={() => toggleSuspension(u)} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: u.isSuspended ? '#10b981' : '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {u.isSuspended ? <UserCheck size={15} /> : <UserX size={15} />}
                    </button>
                    <button onClick={() => handleDeleteUser(u.id, u.nom)} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={15} /></button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', borderRadius: '14px', background: 'var(--bg-main)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}><Mail size={14} /> {u.email}</div>
                  {u.telephone && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}><Phone size={14} /> {u.telephone}</div>}
                </div>
                <div style={{ marginTop: '12px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Actif depuis le {new Date(u.createdAt).toLocaleDateString()}
                  {u.isSuspended && <span style={{ marginLeft: '8px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 900 }}>SUSPENDU</span>}
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter un Collaborateur" subtitle="Définissez le rôle et les permissions précises." maxWidth="680px" icon={UserPlus}>
        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Nom complet</label>
            <input required type="text" placeholder="ex: Patrick Mulumba" value={newUser.nom} onChange={e => setNewUser({ ...newUser, nom: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Email Professionnel</label>
              <input required type="email" placeholder="caissier@lumo.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mot de Passe Provisoire</label>
              <input required type="password" placeholder="••••••••" value={newUser.motDePasse} onChange={e => setNewUser({ ...newUser, motDePasse: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input type="text" placeholder="+243..." value={newUser.telephone} onChange={e => setNewUser({ ...newUser, telephone: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Rôle / Niveau d'accès</label>
              <select value={newUser.role} onChange={e => handleRoleChange(e.target.value)} style={inputStyle}>
                <option value="caissier">{t('usersRoleCashierSales')}</option>
                <option value="manager">{t('usersRoleManager')}</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Permissions Détaillées — cliquez pour activer/désactiver</label>
            <PermissionPanel permissions={newPerms} onChange={setNewPerms} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '14px 24px', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: 800, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" style={{ padding: '14px 32px', borderRadius: '16px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 950, cursor: 'pointer', boxShadow: '0 10px 20px -5px var(--primary-glow)' }}>
              Créer le compte
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier Collaborateur" maxWidth="680px">
        {selectedUser && (
          <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                <option value="caissier">{t('usersRoleCashier')}</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Permissions Détaillées</label>
              <PermissionPanel permissions={editPerms} onChange={setEditPerms} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '14px 24px', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: 800, cursor: 'pointer' }}>Annuler</button>
              <button type="submit" style={{ padding: '14px 32px', borderRadius: '16px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 950, cursor: 'pointer' }}>Enregistrer</button>
            </div>
          </form>
        )}
      </Modal>

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
