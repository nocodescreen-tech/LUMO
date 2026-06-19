import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Lock,
  User as UserIcon,
  Store,
  Palette,
  ShieldCheck,
  Save,
  Camera,
  Loader2,
  Globe,
  Cpu,
  LogOut,
  ChevronRight,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Coins,
  Briefcase,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  Sparkles,
  Package,
  CreditCard,
  BarChart2,
  RefreshCcw,
  Download,
  Upload,
  FileJson,
  AlertTriangle,
  History,
  Clock,
  Users,
  Trash2,
  Zap,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Activity,
  Settings as SettingsIcon,
  Check,
  Truck,
  Wallet,
  TrendingDown
  ,Bell
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { africanCountries } from '../constants/countries';
import { BUSINESS_TYPES } from '../constants/businessTypes';
import ConfirmModal from '../components/common/ConfirmModal';
import Modal from '../components/common/Modal';

const InputField = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, readOnly = false, required = false }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
    </label>
    <div style={{ position: 'relative' }}>
      {Icon && <Icon size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.8, zIndex: 2 }} />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        style={{
          width: '100%',
          padding: Icon ? '15px 16px 15px 48px' : '15px 16px',
          borderRadius: '16px',
          border: '2px solid var(--border-strong)',
          backgroundColor: readOnly ? 'var(--sidebar-active)' : 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.95rem',
          outline: 'none',
          fontWeight: '700',
          opacity: readOnly ? 0.8 : 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: readOnly ? 'default' : 'text',
          boxSizing: 'border-box',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
        onFocus={e => { if (!readOnly) { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 4px var(--primary-glow)'; } }}
        onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
      />
    </div>
  </div>
);

const TwoFASection = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [loading2FA, setLoading2FA] = React.useState(false);
  const [showDisableModal, setShowDisableModal] = React.useState(false);
  const [disablePassword, setDisablePassword] = React.useState('');
  const [showSetupModal, setShowSetupModal] = React.useState(false);
  const [qrCode, setQrCode] = React.useState('');
  const [secret, setSecret] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [activating, setActivating] = React.useState(false);
  const is2FAEnabled = !!(user as any)?.twoFactorEnabled;

  const handleEnable2FA = async () => {
    setLoading2FA(true);
    try {
      const { data } = await api.get('/auth/2fa/setup');
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setOtpCode('');
      setShowSetupModal(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la configuration 2FA');
    } finally {
      setLoading2FA(false);
    }
  };

  const handleActivate2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error(t('twoFACodeError'));
      return;
    }
    setActivating(true);
    try {
      const { data } = await api.post('/auth/2fa/activate', { code: otpCode });
      updateUser({ ...(user as any), twoFactorEnabled: true });
      toast.success(data.message || 'Double authentification activée avec succès');
      setShowSetupModal(false);
      setOtpCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Code incorrect. Réessayez.');
    } finally {
      setActivating(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      toast.error(t('twoFADisablePasswordPrompt'));
      return;
    }
    setLoading2FA(true);
    try {
      const { data } = await api.post('/auth/2fa/disable', { motDePasse: disablePassword });
      updateUser({ ...(user as any), twoFactorEnabled: false });
      toast.success(data.message || t('twoFADisabledSuccess'));
      setShowDisableModal(false);
      setDisablePassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('twoFADeactivateError'));
    } finally {
      setLoading2FA(false);
    }
  };

  return (
    <>
      <div style={{
        padding: '24px',
        borderRadius: '24px',
        border: `2px solid ${is2FAEnabled ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
        background: is2FAEnabled ? 'rgba(99,102,241,0.05)' : 'var(--bg-main)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        transition: 'all 0.3s'
      }}>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '16px', backgroundColor: is2FAEnabled ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: is2FAEnabled ? 'var(--primary)' : 'var(--text-muted)' }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <p style={{ fontWeight: '900', fontSize: '1.1rem', margin: 0 }}>{t('twoFactorAuth')}</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: 600 }}>
              {is2FAEnabled
                ? t('twoFactorEnabledDesc')
                : t('twoFactorDisabledDesc')}
            </p>
          </div>
        </div>
        <button
          onClick={is2FAEnabled ? () => setShowDisableModal(true) : handleEnable2FA}
          disabled={loading2FA}
          style={{
            padding: '12px 24px', borderRadius: '14px', border: 'none', cursor: loading2FA ? 'not-allowed' : 'pointer',
            fontWeight: 800, fontSize: '0.9rem', transition: 'all 0.3s',
            background: is2FAEnabled ? 'rgba(239,68,68,0.1)' : 'var(--primary)',
            color: is2FAEnabled ? '#ef4444' : 'white',
            opacity: loading2FA ? 0.6 : 1
          }}
        >
          {loading2FA ? t('inProgress') : is2FAEnabled ? t('deactivateBtn') : t('activateBtn')}
        </button>
      </div>

      {/* TOTP Setup Modal */}
      {showSetupModal && createPortal((
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{ width: '100%', maxWidth: '480px', padding: '40px', borderRadius: '32px', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5)' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShieldCheck size={32} color="white" />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 8px' }}>{t('setup2FA')}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
                Scannez le QR Code avec Google Authenticator ou Authy
              </p>
            </div>

            {qrCode && (
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <img src={qrCode} alt="QR Code 2FA" style={{ width: '200px', height: '200px', borderRadius: '16px', border: '4px solid var(--border)', margin: '0 auto', display: 'block' }} />
                <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('manualSecretKey')}</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--primary)', margin: 0, wordBreak: 'break-all', letterSpacing: '0.1em' }}>{secret}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleActivate2FA} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Code de vérification (6 chiffres)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{
                    padding: '16px', borderRadius: '16px', border: '2px solid var(--border)',
                    backgroundColor: 'var(--bg-main)', color: 'var(--text-main)',
                    fontSize: '1.5rem', fontWeight: 900, textAlign: 'center', letterSpacing: '0.3em',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setShowSetupModal(false); setOtpCode(''); }}
                  style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={activating || otpCode.length !== 6}
                  style={{ flex: 2, padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 800, cursor: activating || otpCode.length !== 6 ? 'not-allowed' : 'pointer', opacity: activating || otpCode.length !== 6 ? 0.6 : 1 }}
                >
                  {activating ? t('verifying') : t('activate2FA')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ), document.body)}

      {/* TOTP Disable Modal */}
      {showDisableModal && createPortal((
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{ width: '100%', maxWidth: '400px', padding: '32px', borderRadius: '32px', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5)' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#ef4444' }}>
                <ShieldCheck size={32} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 8px' }}>{t('twoFADisable')}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
                {t('twoFADisablePasswordPrompt')}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="password"
                placeholder={t('currentPassword')}
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                style={{
                  padding: '16px', borderRadius: '16px', border: '2px solid var(--border)',
                  backgroundColor: 'var(--bg-main)', color: 'var(--text-main)',
                  fontSize: '1rem', fontWeight: 700, width: '100%',
                  outline: 'none', boxSizing: 'border-box'
                }}
                autoFocus
              />
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setShowDisableModal(false); setDisablePassword(''); }}
                  style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer' }}
                >
                  {t('cancelBtn')}
                </button>
                <button
                  onClick={handleDisable2FA}
                  disabled={loading2FA || !disablePassword}
                  style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 800, cursor: loading2FA || !disablePassword ? 'not-allowed' : 'pointer', opacity: loading2FA || !disablePassword ? 0.6 : 1 }}
                >
                  {loading2FA ? t('verifying') : t('confirmBtn')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ), document.body)}
    </>
  );
};

const TeamSection = () => {
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
    permissions: [
      'cash', 'cash.open', 'cash.close',
      'pos', 'pos.credit_sale', 'pos.print',
      'products', 'products.view_purchase_price', 'products.add', 'products.edit', 'products.delete', 'products.import', 'products.export',
      'clients', 'clients.add', 'clients.edit', 'clients.delete', 'clients.settle_debt', 'clients.send_reminder'
    ]
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

  const moduleDefinitions = [
    {
      id: 'cash', label: 'Caisse de session', icon: Zap, actions: [
        { id: 'cash.open', label: 'Ouvrir une session de caisse' },
        { id: 'cash.close', label: 'Fermer une session de caisse' },
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
      id: 'debts', label: 'Gestion Dettes', icon: CreditCard, actions: [
        { id: 'debts.settle', label: 'Enregistrer un règlement' },
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

    // Validation mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,100}$/;
    if (!passwordRegex.test(newUser.motDePasse)) {
      return toast.error("Le mot de passe doit contenir entre 8 et 100 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&#).");
    }

    try {
      await api.post('/subusers', newUser);
      toast.success(`Membre ${newUser.nom} ajouté !`);
      setShowAddModal(false);
      setNewUser({ nom: '', email: '', motDePasse: '', role: 'vendeur', telephone: '', permissions: ['pos', 'products', 'clients'] });
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
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '100px', backgroundColor: u.role === 'manager' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)', color: u.role === 'manager' ? 'var(--primary)' : '#10b981' }}>
                    {u.role}
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
                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
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
        title="Nouveau Collaborateur"
        subtitle="Créez un compte sécurisé avec des accès personnalisés."
        maxWidth="600px"
        icon={Users}
      >
        <form onSubmit={handleAddSubUser} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <InputField label="Nom Complet" value={newUser.nom} onChange={(e: any) => setNewUser({ ...newUser, nom: e.target.value })} placeholder="Ex: Jules Kamba" required />
            <InputField label="Téléphone" value={newUser.telephone} onChange={(e: any) => setNewUser({ ...newUser, telephone: e.target.value })} placeholder="+243..." />
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
                    background: req.met ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.03)',
                    color: req.met ? '#10b981' : 'var(--text-muted)',
                    border: `1px solid ${req.met ? '#10b981' : 'transparent'}`,
                    fontWeight: '700'
                  }}>{req.label}</span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginLeft: '4px' }}>
              Accès & Permissions - Sélection Manuelle
            </label>
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
                              background: isActionOn ? 'rgba(99,102,241,0.06)' : 'transparent',
                              border: `1px solid ${isActionOn ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
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

          <button type="submit" className="btn-premium primary" style={{ width: '100%', marginTop: '10px', padding: '18px', fontSize: '1rem' }}>
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
                      <div style={{ padding: '6px', borderRadius: '8px', background: p.type === 'SALAIRE' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)', color: p.type === 'SALAIRE' ? 'var(--primary)' : '#10b981' }}>
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
                      style={{ background: 'none', border: 'none', color: '#ef4444', opacity: 0.5, cursor: 'pointer' }}
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

const Settings = () => {
  const { t } = useTranslation();
  const {
    user,
    updateUser,
    logout,
    theme,
    setTheme,
    language,
    setLanguage,
    enabledModules,
    toggleModule,
    currency,
    setCurrency,
    exchangeRate,
    setExchangeRate,
    checkAuth
  } = useAuthStore();

  const isSavingRef = React.useRef(false);

  const [activeTab, setActiveTab] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const getBusinessTypeLabel = (type: string) => {
    const businessType = BUSINESS_TYPES[type];
    if (!businessType) return type;
    return language === 'en' ? (businessType.labelEn || businessType.label) : businessType.label;
  };

  const [autoBackupEnabled, setAutoBackupEnabled] = useState(user?.preferences?.autoBackupEnabled || false);
  const [backupTime, setBackupTime] = useState(user?.preferences?.backupTime || '00:00');
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(user?.preferences?.notificationSoundEnabled !== false);

  const [profileData, setProfileData] = useState({
    nom: user?.nom || '',
    email: user?.email || '',
    telephone: '',
    countryCode: '+243',
    typeActivite: user?.typeActivite || 'commerce-general',
    entreprise: {
      nom: user?.entreprise?.nom || '',
      devise: (user?.entreprise?.devise === 'FC' ? 'CDF' : user?.entreprise?.devise) || 'CDF',
      adresse: user?.entreprise?.adresse || '',
      logo: user?.entreprise?.logo || '',
    },
    motDePasse: ''
  });

  // Keep state in sync with user if store updates (but NOT during an active save)
  useEffect(() => {
    if (user && !isSavingRef.current) {
      let phone = user.telephone || '';
      let code = '+243';
      const found = africanCountries.find(c => phone.startsWith(c.code));
      if (found) {
        code = found.code;
        phone = phone.replace(code, '');
      }
      setProfileData(prev => ({
        ...prev,
        nom: user.nom || prev.nom,
        email: user.email || prev.email,
        telephone: phone,
        countryCode: code,
        typeActivite: user.typeActivite || prev.typeActivite,
        entreprise: {
          ...prev.entreprise,
          ...user.entreprise
        }
      }));
      setAutoBackupEnabled(user.preferences?.autoBackupEnabled || false);
      setBackupTime(user.preferences?.backupTime || '00:00');
      setNotificationSoundEnabled(user.preferences?.notificationSoundEnabled !== false);
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) return toast.error("L'image est trop lourde (max 5MB)");

    const formData = new FormData();
    formData.append('avatar', file);
    setUploading(true);

    try {
      const response = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const resData = response.data;
      const updated = resData.success && resData.data ? resData.data : resData;

      updateUser(updated);
      toast.success(t('profilePhotoUpdated'));
    } catch (error: any) {
      console.error("Upload Error:", error);
      toast.error(error.response?.data?.message || "Échec de l'upload de l'image.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) return toast.error("L'image est trop lourde (max 5MB)");

    const formData = new FormData();
    formData.append('logo', file);
    setUploadingLogo(true);

    try {
      const response = await api.post('/auth/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const resData = response.data;
      const updated = resData.success && resData.data ? resData.data : resData;

      updateUser(updated);
      toast.success("Logo de l'entreprise mis à jour avec succès !");
    } catch (error: any) {
      console.error("Upload Error:", error);
      toast.error(error.response?.data?.message || "Échec de l'upload du logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (profileData.motDePasse) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,100}$/;
      if (!passwordRegex.test(profileData.motDePasse)) {
        return toast.error("Le nouveau mot de passe doit contenir entre 8 et 100 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&#).");
      }
    }

    setSaving(true);
    isSavingRef.current = true;
    try {
      const payload = {
        nom: profileData.nom,
        telephone: profileData.countryCode + profileData.telephone,
        typeActivite: profileData.typeActivite,
        entreprise: profileData.entreprise,
        preferences: {
          theme,
          language,
          enabledModules,
          currency,
          exchangeRate,
          autoBackupEnabled,
          backupTime,
          notificationSoundEnabled
        },
        ...(profileData.motDePasse ? { motDePasse: profileData.motDePasse } : {})
      };

      await api.put('/auth/profile', payload);

      // Force update enabledModules in localStorage + store BEFORE checkAuth
      // to ensure the sidebar re-renders immediately with the correct modules
      localStorage.setItem('enabledModules', JSON.stringify(enabledModules));

      // Force-reload from server to guarantee UI reflects DB state
      await checkAuth(false);

      setProfileData(prev => ({ ...prev, motDePasse: '' }));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      toast.success(t('settingsSaved'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  };


  const [backupLoading, setBackupLoading] = React.useState(false);
  const [emailBackupLoading, setEmailBackupLoading] = React.useState(false);

  const handleBackup = async () => {
    setBackupLoading(true);
    toast('Génération de la sauvegarde en cours...');
    try {
      const response = await api.get(`/backup/export?_t=${Date.now()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lumo_sauvegarde_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('backupDownloaded'));
    } catch (error) {
      toast.error(t('backupGenerateError'));
    } finally {
      setBackupLoading(false);
    }
  };

  const handleEmailBackup = async () => {
    setEmailBackupLoading(true);
    toast('Envoi de la sauvegarde par e-mail...');
    try {
      await api.get(`/backup/email?_t=${Date.now()}`);
    } finally {
      setEmailBackupLoading(false);
    }
  };

  const [restoreLoading, setRestoreLoading] = React.useState(false);
  const [restorePreview, setRestorePreview] = React.useState<any>(null);
  const fileInputRest = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = JSON.parse(event.target?.result as string);
        const response = await api.post('/backup/preview', content);
        setRestorePreview({ ...response.data, rawData: content });
      } catch (error) {
        toast.error(t('invalidBackupFile'));
      }
    };
    reader.readAsText(file);
  };

  const confirmRestore = async () => {
    if (!restorePreview?.rawData) return;

    setRestoreLoading(true);
    toast('Restauration des données en cours...');
    try {
      const response = await api.post('/backup/import', restorePreview.rawData);
      toast.success(`Restauration réussie ! (${response.data.restored.products} produits, ${response.data.restored.clients} clients restaurés)`);
      setRestorePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast.error(t('ErreurlorsdelarMsg'));
    } finally {
      setRestoreLoading(false);
    }
  };

  const allTabs = [
    { id: 'profile', label: t('myProfile'), icon: UserIcon, color: 'var(--primary)' },
    { id: 'business', label: t('myBusiness'), icon: Store, color: 'var(--secondary)' },
    { id: 'appearance', label: t('interface'), icon: Palette, color: '#f59e0b' },
    { id: 'modules', label: t('modulesAI'), icon: Cpu, color: '#ef4444', adminOnly: true },
    { id: 'team', label: t('myTeam'), icon: Users, color: '#10b981', adminOnly: true },
    { id: 'security', label: t('security'), icon: ShieldCheck, color: '#6366f1', adminOnly: true },
  ];

  const tabs = allTabs.filter(tab => !tab.adminOnly || user?.role === 'admin' || user?.role === 'superadmin');

  const activityTypes = Object.keys(BUSINESS_TYPES);
  const devises = [
    { value: 'USD', label: 'USD (Dollar)' },
    { value: 'CDF', label: 'CDF (Franc Congolais)' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto', padding: '10px 0 80px 0' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.05em' }}>{t('settingsSystem').split(' ')[0]} <span style={{ color: 'var(--primary)', opacity: 0.5 }}>{t('settingsSystem').split(' ').slice(1).join(' ')}</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>{t('settingsSubtitle')}</p>
        </div>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="btn-premium"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}
        >
          <LogOut size={16} /> Quitter la session
        </button>
      </div>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '32px' }}>
        {/* Tab Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="premium-card" style={{ padding: '24px', borderRadius: '28px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '18px', overflow: 'hidden', border: '3px solid var(--primary)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary)', flexShrink: 0 }}>
              {user?.avatar && user.avatar !== 'default_avatar.png' ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.nom?.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ margin: 0, fontWeight: '900', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nom}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.role}</p>
            </div>
          </div>
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              whileHover={{ x: 6 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderRadius: '20px', cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: activeTab === tab.id ? `${tab.color}15` : 'transparent',
                border: `1.5px solid ${activeTab === tab.id ? `${tab.color}40` : 'transparent'}`,
                color: activeTab === tab.id ? tab.color : 'var(--text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <tab.icon size={20} />
                <span style={{ fontWeight: '800', fontSize: '1rem' }}>{tab.label}</span>
              </div>
              {activeTab === tab.id && <ChevronRight size={16} />}
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="premium-card" style={{ padding: '48px', borderRadius: '32px', boxShadow: 'var(--shadow-lg)' }}>
          <AnimatePresence mode="wait">

            {/* PROFILE */}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-0.03em' }}>{t('personalIdentity')}</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{t('personalIdentitySubtitle')}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', padding: '24px', background: 'var(--bg-main)', borderRadius: '24px', border: '1.5px solid var(--border)' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '110px', height: '110px', borderRadius: '32px', overflow: 'hidden', border: '4px solid var(--primary)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', fontWeight: '900', color: 'var(--primary)', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.2)' }}>
                      {uploading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <RefreshCcw size={32} />
                        </motion.div>
                      ) : user?.avatar && user.avatar !== 'default_avatar.png' ? (
                        <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        user?.nom?.charAt(0)
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      style={{ position: 'absolute', bottom: '-8px', right: '-8px', backgroundColor: 'var(--primary)', color: 'white', width: '38px', height: '38px', borderRadius: '14px', border: '3px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    >
                      <Camera size={18} />
                    </button>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', fontWeight: '900' }}>{user?.nom}</h3>
                    <p style={{ margin: '0 0 12px 0', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>ID Membre: #{user?.id}</p>
                    <button onClick={() => fileInputRef.current?.click()} className="btn-premium primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                      {t('updatePhoto')}
                    </button>
                  </div>
                </div>

                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <InputField label="Nom Complet" icon={UserIcon} value={profileData.nom} onChange={(e: any) => setProfileData({ ...profileData, nom: e.target.value })} placeholder="Ex: Jean Dupont" />
                  <InputField label="Email" icon={Mail} value={profileData.email} readOnly placeholder="email@example.com" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-muted)', marginLeft: '4px' }}>Numéro de Téléphone</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '130px', position: 'relative' }}>
                        <select
                          value={profileData.countryCode}
                          onChange={(e) => setProfileData({ ...profileData, countryCode: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '14px 12px 14px 42px',
                            borderRadius: '16px',
                            border: '1.5px solid var(--border)',
                            backgroundColor: 'var(--bg-main)',
                            color: 'var(--text-main)',
                            fontSize: '0.95rem',
                            outline: 'none',
                            appearance: 'none',
                            cursor: 'pointer',
                            fontWeight: '700'
                          }}
                        >
                          {africanCountries.map(c => (
                            <option key={c.code} value={c.code} style={{ background: 'var(--bg-main)' }}>
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <Globe size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
                      </div>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <Phone size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
                        <input
                          type="tel"
                          placeholder="000 000 000"
                          value={profileData.telephone}
                          onChange={(e) => setProfileData({ ...profileData, telephone: e.target.value })}
                          style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-muted)', marginLeft: '4px' }}>Expertise / Secteur</label>
                    <div style={{ position: 'relative' }}>
                      <Briefcase size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
                      <select
                        value={profileData.typeActivite}
                        onChange={(e) => setProfileData({ ...profileData, typeActivite: e.target.value })}
                        style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box', appearance: 'none' }}
                      >
                        {activityTypes.map(a => <option key={a} value={a}>{getBusinessTypeLabel(a)}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* BUSINESS */}
            {activeTab === 'business' && (
              <motion.div key="business" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 8px 0' }}>{t('businessConfig')}</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{t('businessConfigSubtitle')}</p>
                </div>

                <div style={{ padding: '24px', borderRadius: '24px', background: 'var(--secondary-glow)', border: '1.5px solid var(--secondary)', display: 'flex', alignItems: 'center', gap: '18px', position: 'relative' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {uploadingLogo ? (
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : user?.entreprise?.logo ? (
                      <img src={user.entreprise.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Store size={32} />
                    )}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '900', fontSize: '1.1rem', color: 'var(--secondary)' }}>{profileData.entreprise.nom || 'Commerce sans nom'}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>{getBusinessTypeLabel(profileData.typeActivite)} · {language === 'en' ? 'Management system' : 'Systeme de gestion'} {currency}</p>
                  </div>
                  <input type="file" ref={logoInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    style={{ position: 'absolute', right: '24px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}
                  >
                    <Camera size={16} /> {t('changeLogo')}
                  </button>
                </div>

                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <InputField label={t('commercialName')} icon={Store} value={profileData.entreprise.nom} onChange={(e: any) => setProfileData({ ...profileData, entreprise: { ...profileData.entreprise, nom: e.target.value } })} placeholder="Ex: Boutique Elite" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-muted)', marginLeft: '4px' }}>{t('workCurrency')}</label>
                    <div style={{ position: 'relative' }}>
                      <Coins size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
                      <select
                        value={profileData.entreprise.devise}
                        onChange={(e) => {
                          const newCur = e.target.value as any;
                          setProfileData({ ...profileData, entreprise: { ...profileData.entreprise, devise: newCur } });
                          setCurrency(newCur);
                        }}
                        style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                      >
                        {devises.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-muted)', marginLeft: '4px' }}>Taux de change (1 USD = X)</label>
                    <div style={{ position: 'relative' }}>
                      <RefreshCcw size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
                      <input
                        type="number"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(Number(e.target.value))}
                        placeholder="Ex: 2800"
                        style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box', appearance: 'none', fontFamily: 'inherit' }}
                      />
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <InputField label={t('physicalAddress')} icon={MapPin} value={profileData.entreprise.adresse} onChange={(e: any) => setProfileData({ ...profileData, entreprise: { ...profileData.entreprise, adresse: e.target.value } })} placeholder="Numéro, Rue, Ville, Pays" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* APPEARANCE */}
            {activeTab === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 8px 0' }}>{t('visualExperience')}</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{t('visualExperienceDesc')}</p>
                </div>

                <div style={{ padding: '24px', borderRadius: '24px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <Palette size={24} />
                    </div>
                    <div>
                      <p style={{ fontWeight: '900', margin: 0 }}>{t('darkLightMode')}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: 600 }}>{t('currentTheme')}: {theme === 'dark' ? t('midnightDark') : t('zenLight')}</p>
                    </div>
                  </div>
                  <div
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    style={{ width: '60px', height: '32px', backgroundColor: theme === 'dark' ? 'var(--primary)' : 'var(--border-strong)', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.4s' }}
                  >
                    <motion.div animate={{ x: theme === 'dark' ? 30 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} style={{ width: '26px', height: '26px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '3px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>

                <div style={{ padding: '24px', borderRadius: '24px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                      <Globe size={24} />
                    </div>
                    <div>
                      <p style={{ fontWeight: '900', margin: 0 }}>{t('systemLanguage')}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: 600 }}>{t('fullTranslation')}</p>
                    </div>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    style={{ padding: '12px 24px', borderRadius: '14px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '800', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div style={{ padding: '24px', borderRadius: '24px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: notificationSoundEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: notificationSoundEnabled ? '#10b981' : 'var(--text-muted)' }}>
                      <Bell size={24} />
                    </div>
                    <div>
                      <p style={{ fontWeight: '900', margin: 0 }}>{t('notificationSound')}</p>
                        {notificationSoundEnabled ? t('soundEnabledDesc') : t('soundDisabledDesc')}
                    </div>
                  </div>
                  <div
                    onClick={() => {
                      const newVal = !notificationSoundEnabled;
                      setNotificationSoundEnabled(newVal);
                      if (user) {
                        useAuthStore.getState().syncPreferencesToServer({ notificationSoundEnabled: newVal });
                      }
                    }}
                    style={{ width: '60px', height: '32px', backgroundColor: notificationSoundEnabled ? 'var(--success)' : 'var(--border-strong)', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.4s' }}
                  >
                    <motion.div animate={{ x: notificationSoundEnabled ? 30 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} style={{ width: '26px', height: '26px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '3px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>

              </motion.div>
            )}

            {/* MODULES */}
            {activeTab === 'modules' && (
              <motion.div key="modules" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 8px 0' }}>{t('moduleHub')}</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{t('moduleHubDesc')}</p>
                </div>

                {[
                  { id: 'ai', label: t('moduleAILabel'), desc: t('moduleAIDesc'), icon: Sparkles, color: '#6366f1', active: enabledModules.includes('ai') },
                  { id: 'suppliers', label: t('moduleSuppliersLabel'), desc: t('moduleSuppliersDesc'), icon: Package, color: '#10b981', active: enabledModules.includes('suppliers') },
                  { id: 'debts', label: t('moduleDebtsLabel'), desc: t('moduleDebtsDesc'), icon: CreditCard, color: '#f59e0b', active: enabledModules.includes('debts') },
                  { id: 'analytics', label: t('moduleStatsLabel'), desc: t('moduleStatsDesc'), icon: BarChart2, color: '#3b82f6', active: enabledModules.includes('analytics') },
                  { id: 'cash', label: t('moduleCashLabel'), desc: t('moduleCashDesc'), icon: Wallet, color: '#10b981', active: enabledModules.includes('cash') },
                  { id: 'barcode', label: t('moduleBarcodeLabel'), desc: t('moduleBarcodeDesc'), icon: Camera, color: '#ec4899', active: enabledModules.includes('barcode') },
                ].map((mod) => (
                  <div
                    key={mod.id}
                    style={{
                      padding: '24px',
                      borderRadius: '24px',
                      border: `2px solid ${mod.active ? `${mod.color}40` : 'var(--border)'}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      backgroundColor: mod.active ? `${mod.color}05` : 'var(--bg-main)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ width: '54px', height: '54px', borderRadius: '16px', backgroundColor: `${mod.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: mod.color }}>
                        <mod.icon size={26} />
                      </div>
                      <div>
                        <p style={{ fontWeight: '900', fontSize: '1.1rem', margin: 0 }}>{mod.label}</p>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: 600 }}>{mod.desc}</p>
                      </div>
                    </div>
                    <div
                      onClick={() => toggleModule(mod.id)}
                      style={{ width: '56px', height: '30px', backgroundColor: mod.active ? mod.color : 'var(--border-strong)', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.4s' }}
                    >
                      <motion.div animate={{ x: mod.active ? 28 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '3px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* SECURITY */}
            {activeTab === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 8px 0' }}>{t('vaultAccess')}</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{t('vaultAccessDesc')}</p>
                </div>

                {/* 2FA Toggle */}
                <TwoFASection />

                <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-muted)', marginLeft: '4px' }}>{t('changePassword')}</label>
                    <div style={{ position: 'relative' }}>
                      <Key size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('passwordPlaceholder')}
                        value={profileData.motDePasse}
                        maxLength={100}
                        onChange={(e) => setProfileData({ ...profileData, motDePasse: e.target.value })}
                        style={{ width: '100%', padding: '16px 56px 16px 48px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', fontWeight: '700' }}
                      />
                      <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {profileData.motDePasse && (
                      <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {[
                          { label: '8+ Caract.', met: profileData.motDePasse.length >= 8 },
                          { label: 'Maj.', met: /[A-Z]/.test(profileData.motDePasse) },
                          { label: 'Min.', met: /[a-z]/.test(profileData.motDePasse) },
                          { label: 'Chiffre', met: /\d/.test(profileData.motDePasse) },
                          { label: 'Symbole', met: /[@$!%*?&#]/.test(profileData.motDePasse) },
                        ].map((req, idx) => (
                          <span key={idx} style={{
                            fontSize: '0.7rem',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            backgroundColor: req.met ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                            color: req.met ? '#10b981' : 'var(--text-muted)',
                            border: `1px solid ${req.met ? '#10b981' : 'transparent'}`,
                            fontWeight: '700',
                            transition: 'all 0.3s'
                          }}>
                            {req.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: '1.5' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>{t('passwordWarning')}</p>
                  </div>

                  <div style={{ marginTop: '16px', paddingTop: '24px', borderTop: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Save size={20} color="var(--primary)" /> {t('dataManagement')}
                    </h3>

                    <div style={{
                      padding: '24px', borderRadius: '24px',
                      background: 'rgba(99,102,241,0.03)', border: '2px solid rgba(99,102,241,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '14px',
                          background: autoBackupEnabled ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: autoBackupEnabled ? 'var(--success)' : 'var(--text-muted)'
                        }}>
                          <Clock size={24} />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 900, fontSize: '1rem' }}>{t('autoBackupTitle')}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {autoBackupEnabled
                              ? t('autoBackupEnabled')
                              : t('autoBackupDisabled')}
                          </p>
                        </div>
                      </div>
                      <div
                        onClick={() => {
                          const newVal = !autoBackupEnabled;
                          setAutoBackupEnabled(newVal);
                          if (user) {
                            useAuthStore.getState().syncPreferencesToServer({
                              autoBackupEnabled: newVal,
                              backupTime: backupTime
                            });
                          }
                        }}
                        style={{
                          width: '54px', height: '28px', borderRadius: '50px',
                          background: autoBackupEnabled ? 'var(--success)' : 'var(--text-muted)',
                          padding: '3px', cursor: 'pointer', position: 'relative', transition: 'all 0.3s'
                        }}
                      >
                        <motion.div
                          animate={{ x: autoBackupEnabled ? 26 : 0 }}
                          style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                        />
                      </div>
                    </div>

                    {autoBackupEnabled && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          padding: '20px', borderRadius: '20px',
                          background: 'rgba(99,102,241,0.02)', border: '1.5px dashed rgba(99,102,241,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          marginTop: '-8px'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <Clock size={18} style={{ color: 'var(--primary)' }} />
                          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{t('dailyBackupTime')}</span>
                        </div>
                        <input
                          type="time"
                          value={backupTime}
                          onChange={(e) => {
                            const newTime = e.target.value;
                            setBackupTime(newTime);
                            useAuthStore.getState().syncPreferencesToServer({ backupTime: newTime });
                          }}
                          style={{
                            padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)',
                            background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 800,
                            outline: 'none', cursor: 'pointer'
                          }}
                        />
                      </motion.div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                      <motion.button
                        whileHover={!backupLoading ? { scale: 1.05, y: -2 } : {}}
                        whileTap={!backupLoading ? { scale: 0.95 } : {}}
                        onClick={handleBackup}
                        disabled={backupLoading}
                        style={{
                          flex: 1, padding: '14px 24px', borderRadius: '14px',
                          background: 'var(--bg-main)', border: '1.5px solid var(--border)',
                          color: 'var(--text-main)', fontWeight: 800, cursor: backupLoading ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.3s'
                        }}
                      >
                        {backupLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        {t('downloadJson')}
                      </motion.button>

                      <motion.button
                        whileHover={!emailBackupLoading ? { scale: 1.05, y: -2 } : {}}
                        whileTap={!emailBackupLoading ? { scale: 0.95 } : {}}
                        onClick={handleEmailBackup}
                        disabled={emailBackupLoading}
                        style={{
                          flex: 1, padding: '14px 24px', borderRadius: '14px',
                          background: 'var(--bg-main)', border: '1.5px solid var(--border)',
                          color: 'var(--text-main)', fontWeight: 800, cursor: emailBackupLoading ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.3s'
                        }}
                      >
                        {emailBackupLoading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                        {t('sendByEmail')}
                      </motion.button>
                    </div>

                    {/* Section Restauration */}
                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1.5px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RefreshCcw size={20} color="var(--secondary)" /> {t('restoreData')}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
                        {t('restoreDataDesc')}
                      </p>

                      <div style={{ position: 'relative' }}>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".json"
                          style={{ display: 'none' }}
                        />
                        <motion.button
                          whileHover={{ scale: 1.02, backgroundColor: 'rgba(99,102,241,0.08)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            width: '100%', padding: '20px', borderRadius: '18px',
                            border: '2px dashed var(--border)', background: 'transparent',
                            color: 'var(--text-main)', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                          }}
                        >
                          <Upload size={32} color="var(--text-muted)" />
                          <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{t('clickToChooseJSON')}</span>
                        </motion.button>
                      </div>

                      {/* Modal/Preview de Restauration */}
                      <AnimatePresence>
                        {restorePreview && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{
                              padding: '24px', borderRadius: '24px', background: 'var(--bg-main)',
                              border: '2px solid var(--secondary)', boxShadow: 'var(--shadow-xl)',
                              display: 'flex', flexDirection: 'column', gap: '20px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileJson size={24} color="#10b981" />
                              </div>
                              <div>
                                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Aperçu de la sauvegarde</h4>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Exportée le : {new Date(restorePreview.exportedAt).toLocaleString()}</p>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                              {[
                                { label: 'Produits', count: restorePreview.counts.products, icon: Package, color: '#6366f1' },
                                { label: 'Ventes', count: restorePreview.counts.sales, icon: CreditCard, color: '#10b981' },
                                { label: 'Clients', count: restorePreview.counts.clients, icon: UserIcon, color: '#f59e0b' }
                              ].map((item, idx) => (
                                <div key={idx} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(0,0,0,0.03)', textAlign: 'center' }}>
                                  <item.icon size={20} color={item.color} style={{ marginBottom: '8px' }} />
                                  <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{item.count}</div>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label}</div>
                                </div>
                              ))}
                            </div>

                            <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                              <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                              <p style={{ margin: 0, fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, lineHeight: 1.4 }}>
                                Cette action va fusionner ces données avec vos données actuelles. Les ventes déjà existantes ne seront pas dupliquées.
                              </p>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={confirmRestore}
                                disabled={restoreLoading}
                                style={{
                                  flex: 2, padding: '16px', borderRadius: '14px',
                                  background: 'var(--secondary)', color: '#fff', border: 'none',
                                  fontWeight: 900, fontSize: '1rem', cursor: restoreLoading ? 'not-allowed' : 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                }}
                              >
                                {restoreLoading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <History size={20} />}
                                {restoreLoading ? 'Restauration...' : 'Confirmer la restauration'}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setRestorePreview(null)}
                                style={{
                                  flex: 1, padding: '16px', borderRadius: '14px',
                                  background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', border: 'none',
                                  fontWeight: 800, cursor: 'pointer'
                                }}
                              >
                                Annuler
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {/* TEAM */}
            {activeTab === 'team' && (
              <motion.div key="team" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <TeamSection />
              </motion.div>
            )}

          </AnimatePresence>

          {/* Footer Save */}
          <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '2px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '16px 40px', borderRadius: '18px',
                backgroundColor: savedSuccess ? '#10b981' : 'var(--primary)',
                color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '12px',
                fontWeight: '900', fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: `0 12px 24px -6px ${savedSuccess ? 'rgba(16,185,129,0.5)' : 'rgba(99,102,241,0.5)'}`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: saving ? 0.8 : 1
              }}
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : savedSuccess ? <CheckCircle size={20} /> : <Save size={20} />}
              {saving ? t('syncing') : savedSuccess ? t('changesApplied') : t('saveChanges')}
            </motion.button>
          </div>
        </div>
      </div>
      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={t('logout') + ' ?'}
        subtitle={t('logoutConfirmMessage')}
        icon={LogOut}
        maxWidth="450px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
          <button
            onClick={() => {
              setShowLogoutConfirm(false);
              logout();
            }}
            style={{
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
              background: 'var(--danger)', color: 'white', fontWeight: '800',
              fontSize: '1rem', cursor: 'pointer', boxShadow: '0 8px 20px -6px rgba(239, 68, 68, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            <LogOut size={18} /> {t('yesLogout')}
          </button>
          <button
            onClick={() => setShowLogoutConfirm(false)}
            style={{
              width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid var(--border)',
              background: 'transparent', color: 'var(--text-main)', fontWeight: '700', fontSize: '1rem', cursor: 'pointer'
            }}
          >
            {t('cancelBtn')}
          </button>
        </div>
      </Modal>
    </motion.div>
  );
};

export default Settings;
