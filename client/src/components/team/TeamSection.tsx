import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Mail, Phone, Trash2, Wallet, DollarSign,
  Check, Key, Loader2, Package, ShoppingCart, TrendingUp, Download, History,
  CreditCard, BarChart2, Activity, Zap, Truck, UserCheck, Settings as SettingsIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../api/axios';
import { useTranslation } from '../../hooks/useTranslation';
import Modal from '../common/Modal';
import ConfirmModal from '../common/ConfirmModal';
import InputField from '../common/InputField';

export const TeamSection = () => {
  const { t } = useTranslation();
  const [subUsers, setSubUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    role: 'vendeur',
    telephone: '',
    permissions: []
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    type: 'SALAIRE',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [staffPayments, setStaffPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null; name: string }>({ isOpen: false, id: null, name: '' });

  const roleLabels: Record<string, string> = {
    caissier: 'Caissier',
    vendeur: 'Vendeur',
    gerant: 'Gérant',
    manager: 'Manager',
    superviseur: 'Superviseur',
    inventoriste: 'Inventoriste'
  };

  const moduleDefinitions = [
    {
      id: 'cash', label: 'Caisse de session', icon: Zap, actions: [
        { id: 'cash.open', label: 'Ouvrir une session de caisse' },
        { id: 'cash.close', label: 'Fermer une session de caisse' },
        { id: 'cash.view', label: 'Voir historique de caisse' },
        { id: 'cash.delete_session', label: 'Supprimer une session' },
      ]
    },
    {
      id: 'pos', label: 'Point de Vente (POS)', icon: ShoppingCart, actions: [
        { id: 'pos.credit_sale', label: 'Vente à crédit (client)' },
        { id: 'pos.print', label: 'Imprimer ticket / facture' },
      ]
    },
    {
      id: 'products', label: 'Stocks & Produits', icon: Package, actions: [
        { id: 'products.view_purchase_price', label: 'Voir prix d\'achat' },
        { id: 'products.add', label: 'Ajouter des produits' },
        { id: 'products.edit', label: 'Modifier des produits' },
        { id: 'products.delete', label: 'Supprimer des produits' },
        { id: 'products.import', label: 'Importer via Excel / texte' },
        { id: 'products.export', label: 'Exporter le catalogue' },
      ]
    },
    {
      id: 'sales', label: 'Historique Ventes', icon: TrendingUp, actions: [
        { id: 'sales.edit', label: 'Modifier une vente' },
        { id: 'sales.refund', label: 'Rembourser une vente' },
        { id: 'sales.delete', label: 'Supprimer une vente' },
        { id: 'sales.export', label: 'Exporter les ventes' },
      ]
    },
    {
      id: 'clients', label: 'Clients & CRM', icon: Users, actions: [
        { id: 'clients.add', label: 'Ajouter un client' },
        { id: 'clients.edit', label: 'Modifier un client' },
        { id: 'clients.delete', label: 'Supprimer un client' },
        { id: 'clients.settle_debt', label: 'Régler une dette client' },
        { id: 'clients.send_reminder', label: 'Envoyer un rappel de paiement' },
      ]
    },
    {
      id: 'suppliers', label: 'Fournisseurs (Partenaires)', icon: Truck, actions: [
        { id: 'suppliers.add', label: 'Ajouter un fournisseur' },
        { id: 'suppliers.edit', label: 'Modifier un fournisseur' },
        { id: 'suppliers.delete', label: 'Supprimer un fournisseur' },
      ]
    },
    {
      id: 'purchases', label: 'Achats (Bons de commande)', icon: Download, actions: [
        { id: 'purchases.add', label: 'Créer un bon d\'achat' },
        { id: 'purchases.edit', label: 'Modifier un achat' },
        { id: 'purchases.delete', label: 'Supprimer un achat' },
      ]
    },
    {
      id: 'stock-history', label: 'Historique Stock', icon: History, actions: [
        { id: 'stock-history.view', label: 'Consulter les mouvements' },
        { id: 'stock-history.export', label: 'Exporter l\'historique' },
      ]
    },

    {
      id: 'debts', label: 'Gestion Dettes', icon: CreditCard, actions: [
        { id: 'debts.settle', label: 'Enregistrer un règlement' },
        { id: 'debts.delete', label: 'Supprimer une dette' },
        { id: 'debts.send_reminder', label: 'Envoyer rappel de paiement' },
      ]
    },
    { id: 'stats', label: 'Statistiques', icon: BarChart2, actions: [] },
    { id: 'activities', label: 'Journal d\'Activités', icon: Activity, actions: [] },
    {
      id: 'settings', label: 'Paramètres (limités)', icon: SettingsIcon, actions: [
        { id: 'settings.profile', label: 'Modifier son profil' },
        { id: 'settings.appearance', label: 'Changer l\'apparence (thème/langue)' },
        { id: 'settings.exchange_rate', label: 'Modifier le taux de change' },
      ]
    },
    {
      id: 'team', label: 'Gestion Équipe', icon: UserPlus, actions: [
        { id: 'team.add', label: 'Ajouter un membre' },
        { id: 'team.edit', label: 'Modifier un membre' },
        { id: 'team.delete', label: 'Supprimer un membre' },
        { id: 'team.view_activity', label: 'Voir activités des membres' },
      ]
    },
  ];


  // Toggle a top-level module and ALL its sub-actions
  const toggleModule = (moduleId: string) => {
    const mod = moduleDefinitions.find(m => m.id === moduleId);
    if (!mod) return;
    const allIds = [moduleId, ...mod.actions.map(a => a.id)];
    const isEnabled = newUser.permissions.includes(moduleId);
    setNewUser(prev => ({
      ...prev,
      permissions: isEnabled
        ? prev.permissions.filter(id => !allIds.includes(id))
        : [...prev.permissions, ...allIds.filter(id => !prev.permissions.includes(id))]
    }));
  };

  // Toggle a single sub-action permission
  const togglePermission = (permId: string) => {
    setNewUser(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const fetchSubUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/subusers?_t=${Date.now()}`);
      // Backend wraps response in { success, data: [...], meta }
      const members = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setSubUsers(members);
    } catch (err) {
      toast.error("Erreur lors de la récupération de l'équipe");
      setSubUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubUsers();
  }, []);

  const handleAddSubUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation permissions choisies manuellement
    if (!Array.isArray(newUser.permissions) || newUser.permissions.length === 0) {
      return toast.error("Sélectionnez au moins une permission pour ce membre.");
    }

    // Validation mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,100}$/;
    if (!passwordRegex.test(newUser.motDePasse)) {
      return toast.error("Le mot de passe doit contenir entre 8 et 100 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&#).");
    }

    try {
      await api.post('/subusers', newUser);
      toast.success(`Membre ${newUser.nom} ajouté !`);
      setShowAddModal(false);
      setNewUser({ nom: '', email: '', motDePasse: '', role: 'vendeur', telephone: '', permissions: [] });
      fetchSubUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de l'ajout");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await api.delete(`/subusers/${confirmDelete.id}`);
      toast.success(t('memberDeleted'));
      setConfirmDelete({ isOpen: false, id: null, name: '' });
      fetchSubUsers();
    } catch (err) {
      toast.error(t('memberDeleteError'));
    }
  };

  const openPaymentModal = async (staff: any) => {
    setSelectedStaff(staff);
    setShowPaymentModal(true);
    setLoadingPayments(true);
    try {
      const { data } = await api.get(`/staff-payments?staffId=${staff.id}`);
      setStaffPayments(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      toast.error(t('ErreurlorsdelarMsg'));
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      await api.post('/staff-payments', {
        staffId: selectedStaff.id,
        ...paymentData
      });
      toast.success(t('paymentRecorded'));
      setPaymentData({ amount: '', type: 'SALAIRE', note: '', date: new Date().toISOString().split('T')[0] });
      openPaymentModal(selectedStaff); // Refresh list
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 8px 0' }}>{t('teamManagement')}</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{t('teamManagementDesc')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-premium primary"
          style={{ padding: '12px 24px' }}
        >
          {t('addMember')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} />
          </div>
        ) : subUsers.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: '24px' }}>
            <Users size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p style={{ fontWeight: 800, color: 'var(--text-muted)' }}>{t('noTeamMembers')}</p>
          </div>
        ) : subUsers.map(u => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="premium-card"
            style={{ padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--bg-main)', position: 'relative' }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>
                {u.nom.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 900 }}>{u.nom}</p>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '100px', backgroundColor: u.role === 'manager' ? 'rgba(21,94,88,0.1)' : 'rgba(16,185,129,0.1)', color: u.role === 'manager' ? 'var(--primary)' : 'var(--success)' }}>
                    {roleLabels[u.role] || u.role}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => openPaymentModal(u)}
                  style={{ background: 'var(--primary-glow)', border: 'none', color: 'var(--primary)', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
                  title={t('managePayments')}
                >
                  <Wallet size={18} />
                </button>
                <button
                  onClick={() => setConfirmDelete({ isOpen: true, id: u.id, name: u.nom })}
                  style={{ background: 'rgba(214, 69, 69, 0.1)', border: 'none', color: 'var(--danger)', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} /> {u.email}
              </div>
              {u.telephone && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} /> {u.telephone}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Nouveau membre"
        subtitle="Créez un compte employé sécurisé avec accès personnalisés."
        maxWidth="600px"
        icon={Users}
      >
        <form onSubmit={handleAddSubUser} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <InputField label="Nom Complet" value={newUser.nom} onChange={(e: any) => setNewUser({ ...newUser, nom: e.target.value })} placeholder="Ex: Jules Kamba" required />
            <InputField label="Téléphone" value={newUser.telephone} onChange={(e: any) => setNewUser({ ...newUser, telephone: e.target.value })} placeholder="+243..." />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginLeft: '4px' }}>Rôle</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700, outline: 'none', cursor: 'pointer', appearance: 'none' }}
            >
              <option value="vendeur">Vendeur — POS, produits, clients</option>
              <option value="gerant">Gérant — Dashboard, stats, gestion équipe</option>
              <option value="caissier">Caissier — POS uniquement</option>
            </select>
          </div>

          <InputField label="Email / Identifiant" type="email" value={newUser.email} onChange={(e: any) => setNewUser({ ...newUser, email: e.target.value })} placeholder="jules@example.com" required icon={Mail} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <InputField label="Mot de passe initial" type="password" value={newUser.motDePasse} onChange={(e: any) => setNewUser({ ...newUser, motDePasse: e.target.value })} placeholder="Min. 8 caractères + symboles" required icon={Key} />
            {newUser.motDePasse && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {[
                  { label: '8+ Car.', met: newUser.motDePasse.length >= 8 },
                  { label: 'Maj.', met: /[A-Z]/.test(newUser.motDePasse) },
                  { label: 'Min.', met: /[a-z]/.test(newUser.motDePasse) },
                  { label: 'Chiffre', met: /\d/.test(newUser.motDePasse) },
                  { label: 'Symbole', met: /[@$!%*?&#]/.test(newUser.motDePasse) },
                ].map((req, idx) => (
                  <span key={idx} style={{
                    fontSize: '0.65rem', padding: '2px 6px', borderRadius: '6px',
                    background: req.met ? 'rgba(15, 157, 106, 0.1)' : 'rgba(0,0,0,0.03)',
                    color: req.met ? 'var(--success)' : 'var(--text-muted)',
                    border: `1px solid ${req.met ? 'var(--success)' : 'transparent'}`,
                    fontWeight: '700'
                  }}>{req.label}</span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginLeft: '4px' }}>
              Accès & Permissions - Sélection manuelle
            </label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                {newUser.permissions.length} permission(s) sélectionnée(s)
              </span>
              {newUser.permissions.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 700 }}>
                  Choisissez au moins une permission
                </span>
              )}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '16px',
              background: 'rgba(0,0,0,0.02)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              maxHeight: '340px',
              overflowY: 'auto'
            }}>
              {moduleDefinitions.map(m => {
                const isModuleOn = newUser.permissions.includes(m.id);
                return (
                  <div key={m.id}>
                    {/* Module row */}
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                      borderRadius: '12px', cursor: 'pointer',
                      background: isModuleOn ? 'var(--primary-glow)' : 'transparent',
                      border: `1.5px solid ${isModuleOn ? 'var(--primary)' : 'transparent'}`,
                      transition: 'all 0.2s'
                    }}>
                      <input type="checkbox" checked={isModuleOn} onChange={() => toggleModule(m.id)} style={{ display: 'none' }} />
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                        border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isModuleOn ? 'var(--primary)' : 'transparent'
                      }}>
                        {isModuleOn && <Check size={14} color="white" />}
                      </div>
                      <m.icon size={15} style={{ color: isModuleOn ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: '800', color: isModuleOn ? 'var(--primary)' : 'var(--text-main)', flex: 1 }}>{m.label}</span>
                      {m.actions.length > 0 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{newUser.permissions.filter(p => m.actions.some(a => a.id === p)).length}/{m.actions.length} actions</span>}
                    </label>
                    {/* Sub-actions (shown only when module is enabled) */}
                    {isModuleOn && m.actions.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '6px 6px 6px 32px' }}>
                        {m.actions.map(action => {
                          const isActionOn = newUser.permissions.includes(action.id);
                          return (
                            <label key={action.id} style={{
                              display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px',
                              borderRadius: '10px', cursor: 'pointer',
                              background: isActionOn ? 'rgba(21,94,88,0.06)' : 'transparent',
                              border: `1px solid ${isActionOn ? 'rgba(21,94,88,0.2)' : 'transparent'}`,
                              transition: 'all 0.15s'
                            }}>
                              <input type="checkbox" checked={isActionOn} onChange={() => togglePermission(action.id)} style={{ display: 'none' }} />
                              <div style={{
                                width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                                border: `2px solid ${isActionOn ? 'var(--primary)' : 'var(--border-strong)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isActionOn ? 'var(--primary)' : 'transparent'
                              }}>
                                {isActionOn && <Check size={11} color="white" />}
                              </div>
                              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: isActionOn ? 'var(--text-main)' : 'var(--text-muted)' }}>{action.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={newUser.permissions.length === 0}
            className="btn-premium primary"
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '18px',
              fontSize: '1rem',
              opacity: newUser.permissions.length === 0 ? 0.6 : 1,
              cursor: newUser.permissions.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Finaliser l'enregistrement
          </button>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Supprimer un membre"
        message={`Voulez-vous vraiment supprimer l'accès pour ${confirmDelete.name} ?`}
      />

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={`Paiements : ${selectedStaff?.nom}`}
        subtitle="Historique des salaires, primes et transport."
        maxWidth="800px"
        icon={Wallet}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <form onSubmit={handleAddPayment} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', padding: '20px', background: 'rgba(0,0,0,0.02)', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <InputField label="Montant" type="number" value={paymentData.amount} onChange={(e: any) => setPaymentData({ ...paymentData, amount: e.target.value })} placeholder="Ex: 500" required icon={DollarSign} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800 }}>Type</label>
              <select
                value={paymentData.type}
                onChange={(e) => setPaymentData({ ...paymentData, type: e.target.value })}
                style={{ padding: '12px', borderRadius: '12px', border: '2px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 700 }}
              >
                <option value="SALAIRE">Salaire</option>
                <option value="TRANSPORT">Transport</option>
                <option value="PRIME">Prime</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <InputField label="Date" type="date" value={paymentData.date} onChange={(e: any) => setPaymentData({ ...paymentData, date: e.target.value })} required />
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <InputField label="Note / Commentaire" value={paymentData.note} onChange={(e: any) => setPaymentData({ ...paymentData, note: e.target.value })} placeholder="Ex: Prime de vente" />
              </div>
              <button type="submit" className="btn-premium primary" style={{ padding: '14px 24px', height: 'fit-content' }}>Enregistrer</button>
            </div>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: 0, fontWeight: 900 }}>Historique Récent</h4>
            {loadingPayments ? (
              <Loader2 size={24} className="animate-spin" style={{ margin: '20px auto' }} />
            ) : staffPayments.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontWeight: 600 }}>Aucun historique trouvé.</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {staffPayments.map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ padding: '6px', borderRadius: '8px', background: p.type === 'SALAIRE' ? 'rgba(21,94,88,0.1)' : 'rgba(16,185,129,0.1)', color: p.type === 'SALAIRE' ? 'var(--primary)' : 'var(--success)' }}>
                        <DollarSign size={16} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem' }}>{p.type} - {Number(p.amount).toLocaleString()} {p.devise}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(p.date).toLocaleDateString()} {p.note && `· ${p.note}`}</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('Supprimer ce paiement ?')) {
                          await api.delete(`/staff-payments/${p.id}`);
                          openPaymentModal(selectedStaff);
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', opacity: 0.5, cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};