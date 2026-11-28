import './service-commercial.css';
import {Link} from 'react-router-dom';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import BackupCenter from './BackupCenter';
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
import InputField from '../components/common/InputField';
import api from '../api/axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { africanCountries } from '../constants/countries';
import { BUSINESS_TYPES } from '../constants/businessTypes';
import ConfirmModal from '../components/common/ConfirmModal';
import Modal from '../components/common/Modal';


const TwoFASection = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [loading2FA, setLoading2FA] = React.useState(false);
  const [showSetupPassword,setShowSetupPassword]=React.useState(false);
  const [setupPassword,setSetupPassword]=React.useState('');
  const [disableCode,setDisableCode]=React.useState('');
  const [showDisableModal, setShowDisableModal] = React.useState(false);
  const [disablePassword, setDisablePassword] = React.useState('');
  const [showSetupModal, setShowSetupModal] = React.useState(false);
  const [qrCode, setQrCode] = React.useState('');
  const [secret, setSecret] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [activating, setActivating] = React.useState(false);
  const is2FAEnabled = !!(user as any)?.twoFactorEnabled;

  const handleEnable2FA = async () => {
    if(!setupPassword||loading2FA)return;
    setLoading2FA(true);
    try {
      const { data } = await api.post('/auth/2fa/setup',{currentPassword:setupPassword});
      setSetupPassword('');setShowSetupPassword(false);
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
      setOtpCode('');setQrCode('');setSecret('');
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
      const { data } = await api.post('/auth/2fa/disable', { motDePasse: disablePassword,code:disableCode });
      updateUser({ ...(user as any), twoFactorEnabled: false });
      toast.success(data.message || t('twoFADisabledSuccess'));
      setShowDisableModal(false);
      setDisablePassword('');setDisableCode('');
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
        border: `2px solid ${is2FAEnabled ? 'rgba(21,94,88,0.3)' : 'var(--border)'}`,
        background: is2FAEnabled ? 'rgba(21,94,88,0.05)' : 'var(--bg-main)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        transition: 'all 0.3s'
      }}>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '16px', backgroundColor: is2FAEnabled ? 'rgba(21,94,88,0.15)' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: is2FAEnabled ? 'var(--primary)' : 'var(--text-muted)' }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <p style={{ fontWeight: '900', fontSize: '0.95rem', margin: 0 }}>{t('twoFactorAuth')}</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: 600 }}>
              {is2FAEnabled
                ? t('twoFactorEnabledDesc')
                : t('twoFactorDisabledDesc')}
            </p>
          </div>
        </div>
        <button
          onClick={is2FAEnabled ? () => setShowDisableModal(true) : ()=>setShowSetupPassword(true)}
          disabled={loading2FA}
          style={{
            padding: '12px 24px', borderRadius: '14px', border: 'none', cursor: loading2FA ? 'not-allowed' : 'pointer',
            fontWeight: 800, fontSize: '0.9rem', transition: 'all 0.3s',
            background: is2FAEnabled ? 'rgba(239,68,68,0.1)' : 'var(--primary)',
            color: is2FAEnabled ? 'var(--danger)' : 'white',
            opacity: loading2FA ? 0.6 : 1
          }}
        >
          {loading2FA ? t('inProgress') : is2FAEnabled ? t('deactivateBtn') : t('activateBtn')}
        </button>
      </div>

      <Modal isOpen={showSetupPassword} onClose={()=>{if(!loading2FA){setShowSetupPassword(false);setSetupPassword('')}}} title="Confirmer votre identité">
        <form onSubmit={e=>{e.preventDefault();void handleEnable2FA()}} style={{display:'grid',gap:16}}>
          <label style={{display:'grid',gap:8}}>{t('currentPassword')}<input type="password" autoComplete="current-password" value={setupPassword} onChange={e=>setSetupPassword(e.target.value)} required style={{padding:14,borderRadius:12,border:'1px solid var(--border)',background:'var(--bg-main)',color:'var(--text-main)'}}/></label>
          <button type="submit" className="btn-premium" disabled={loading2FA||!setupPassword}>{loading2FA?t('inProgress'):t('confirmBtn')}</button>
        </form>
      </Modal>
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
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(214, 69, 69, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--danger)' }}>
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
              
              <label style={{display:'grid',gap:8}}>Code authentificateur (si configuré)<input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={disableCode} onChange={e=>setDisableCode(e.target.value.replace(/\D/g,''))} style={{padding:14,borderRadius:12,border:'1px solid var(--border)',background:'var(--bg-main)',color:'var(--text-main)'}}/></label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setShowDisableModal(false); setDisablePassword('');setDisableCode(''); }}
                  style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer' }}
                >
                  {t('cancelBtn')}
                </button>
                <button
                  onClick={handleDisable2FA}
                  disabled={loading2FA || !disablePassword}
                  style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 800, cursor: loading2FA || !disablePassword ? 'not-allowed' : 'pointer', opacity: loading2FA || !disablePassword ? 0.6 : 1 }}
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
  const [currentPassword,setCurrentPassword]=useState('');
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
    if(saving)return;
    if (profileData.motDePasse) {
      if(!currentPassword)return toast.error(language==='en'?'Current password required':'Mot de passe actuel requis');
      if(new TextEncoder().encode(profileData.motDePasse).length>72)return toast.error(language==='en'?'Password exceeds 72 bytes':'Le mot de passe dépasse 72 octets');
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
        ...(profileData.motDePasse ? { motDePasse: profileData.motDePasse,currentPassword } : {})
      };

      await api.put('/auth/profile', payload);

      // SECURITY: no redundant localStorage preference keys. checkAuth() below
      // re-fetches the user from the server and updates the store in memory,
      // which re-renders the sidebar with the correct modules.
      await checkAuth(false);

      setProfileData(prev => ({ ...prev, motDePasse: '' }));setCurrentPassword('');
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


  const allTabs = [
    { id: 'profile', label: t('myProfile'), icon: UserIcon, color: 'var(--primary)' },
    { id: 'business', label: t('myBusiness'), icon: Store, color: 'var(--secondary)' },
    { id: 'appearance', label: t('interface'), icon: Palette, color: 'var(--warning)' },
    { id: 'modules', label: t('modulesAI'), icon: Cpu, color: 'var(--danger)', adminOnly: true },
    { id: 'security', label: t('security'), icon: ShieldCheck, color: 'var(--primary)', adminOnly: true },
    { id:'backup',label:language==='en'?'Data protection':'Protection des données',icon:Download,color:'var(--primary)',adminOnly:true },
  ];

  const tabs = allTabs.filter(tab => (!tab.adminOnly || user?.role === 'admin' || user?.role === 'superadmin')&&(tab.id!=='backup'||user?.role==='admin'));

  const activityTypes = Object.keys(BUSINESS_TYPES);
  const devises = [
    { value: 'USD', label: 'USD (Dollar)' },
    { value: 'CDF', label: 'CDF (Franc Congolais)' }
  ];

  return (
    <motion.div className="service-settings"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto', padding: '10px 0 80px 0' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, letterSpacing: '-0.05em' }}>{t('settingsSystem').split(' ')[0]} <span style={{ color: 'var(--primary)', opacity: 0.5 }}>{t('settingsSystem').split(' ').slice(1).join(' ')}</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>{t('settingsSubtitle')}</p>
        </div>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="btn-premium"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '16px', background: 'rgba(214, 69, 69, 0.1)', color: 'var(--danger)', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem', border: '1px solid rgba(214, 69, 69, 0.2)' }}
        >
          <LogOut size={16} /> {t('endSession')}
        </button>
      </div>

      <div className="responsive-grid lumo-settings-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) minmax(0, 3fr)', gap: '20px' }}>
        {/* Tab Sidebar */}
        <div className="lumo-settings-nav" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
            <button type="button" className="service-setting-tab"
              key={tab.id} aria-current={activeTab===tab.id?'page':undefined}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderRadius: '20px', cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: activeTab === tab.id ? 'var(--primary-glow)' : 'transparent',
                border: '1px solid '+(activeTab===tab.id?'var(--primary)':'transparent'),
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <tab.icon size={20} />
                <span style={{ fontWeight: '800', fontSize: '1rem' }}>{tab.label}</span>
              </div>
              {activeTab === tab.id && <ChevronRight size={16} />}
            </button>
          ))}<div className="service-settings-links"><Link to="/notifications"><Bell size={16}/>{language==='en'?'Notifications':'Notifications'}</Link>{user?.role==='admin'&&<><Link to="/subscription"><CreditCard size={16}/>{language==='en'?'Subscription':'Abonnement'}</Link><Link to="/support"><ShieldCheck size={16}/>{language==='en'?'Support':'Assistance'}</Link></>}</div>
        </div>

        {/* Main Content */}
        <div className="premium-card service-settings-content" style={{ padding: '48px', borderRadius: '32px', boxShadow: 'var(--shadow-lg)' }}>
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
                    <div style={{ width: '110px', height: '110px', borderRadius: '32px', overflow: 'hidden', border: '4px solid var(--primary)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', fontWeight: '900', color: 'var(--primary)', boxShadow: '0 10px 25px rgba(21, 94, 88, 0.2)' }}>
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
                    <p style={{ margin: 0, fontWeight: '900', fontSize: '0.95rem', color: 'var(--secondary)' }}>{profileData.entreprise.nom || 'Commerce sans nom'}</p>
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
                    <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: theme === 'dark' ? 'rgba(21, 94, 88, 0.1)' : 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
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
                    <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: 'rgba(62, 110, 142, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E6E8E' }}>
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
                  { id: 'ai', label: t('moduleAILabel'), desc: t('moduleAIDesc'), icon: Sparkles, color: '#155E58', active: enabledModules.includes('ai') },
                  { id: 'suppliers', label: t('moduleSuppliersLabel'), desc: t('moduleSuppliersDesc'), icon: Truck, color: '#0F9D6A', active: enabledModules.includes('suppliers') },
                  { id: 'debts', label: t('moduleDebtsLabel'), desc: t('moduleDebtsDesc'), icon: CreditCard, color: '#C07E12', active: enabledModules.includes('debts') },
                  { id: 'analytics', label: t('moduleStatsLabel'), desc: t('moduleStatsDesc'), icon: BarChart2, color: '#2E6E8E', active: enabledModules.includes('analytics') },
                  { id: 'cash', label: t('moduleCashLabel'), desc: t('moduleCashDesc'), icon: Wallet, color: '#0F9D6A', active: enabledModules.includes('cash') },
                  { id: 'barcode', label: t('moduleBarcodeLabel'), desc: t('moduleBarcodeDesc'), icon: Camera, color: '#C98A1B', active: enabledModules.includes('barcode') },
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
                        <p style={{ fontWeight: '900', fontSize: '0.95rem', margin: 0 }}>{mod.label}</p>
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
                        type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                        placeholder={t('passwordPlaceholder')}
                        value={profileData.motDePasse}
                        maxLength={100}
                        onChange={(e) => setProfileData({ ...profileData, motDePasse: e.target.value })}
                        style={{ width: '100%', padding: '16px 56px 16px 48px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', fontWeight: '700' }}
                      />
                      <button type="button" aria-label={language==='en'?'Toggle password visibility':'Afficher ou masquer le mot de passe'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {profileData.motDePasse&&<label style={{display:'grid',gap:8,fontWeight:700,fontSize:'.88rem'}}>{language==='en'?'Current password':'Mot de passe actuel'}<input type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} style={{padding:14,borderRadius:12,border:'1px solid var(--border)',background:'var(--bg-main)',color:'var(--text-main)'}}/><small style={{color:'var(--text-muted)'}}>{language==='en'?'Other sessions will be revoked.':'Les autres sessions seront révoquées.'}</small></label>}
                    {profileData.motDePasse && (
                      <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {[
                          { label: t('pwdReq8Chars'), met: profileData.motDePasse.length >= 8 },
                          { label: t('pwdReqUpper'), met: /[A-Z]/.test(profileData.motDePasse) },
                          { label: t('pwdReqLower'), met: /[a-z]/.test(profileData.motDePasse) },
                          { label: t('pwdReqDigit'), met: /\d/.test(profileData.motDePasse) },
                          { label: t('pwdReqSymbol'), met: /[@$!%*?&#]/.test(profileData.motDePasse) },
                        ].map((req, idx) => (
                          <span key={idx} style={{
                            fontSize: '0.7rem',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            backgroundColor: req.met ? 'rgba(15, 157, 106, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                            color: req.met ? 'var(--success)' : 'var(--text-muted)',
                            border: `1px solid ${req.met ? 'var(--success)' : 'transparent'}`,
                            fontWeight: '700',
                            transition: 'all 0.3s'
                          }}>
                            {req.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(21, 94, 88, 0.05)', border: '1px solid rgba(21, 94, 88, 0.2)', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: '1.5' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>{t('passwordWarning')}</p>
                  </div>



                </div>
              </motion.div>
            )}


            {activeTab==='backup'&&user?.role==='admin'&&<motion.div key="backup"><BackupCenter/></motion.div>}
          </AnimatePresence>

          {/* Footer Save */}
          {activeTab!=='backup'&&<div className="service-save" style={{ marginTop: '48px', paddingTop: '32px', borderTop: '2px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '16px 40px', borderRadius: '18px',
                backgroundColor: savedSuccess ? 'var(--success)' : 'var(--primary)',
                color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '12px',
                fontWeight: '900', fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: `0 12px 24px -6px ${savedSuccess ? 'rgba(16,185,129,0.5)' : 'rgba(21,94,88,0.5)'}`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: saving ? 0.8 : 1
              }}
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : savedSuccess ? <CheckCircle size={20} /> : <Save size={20} />}
              {saving ? t('syncing') : savedSuccess ? t('changesApplied') : t('saveChanges')}
            </motion.button>
          </div>}
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
              fontSize: '1rem', cursor: 'pointer', boxShadow: '0 8px 20px -6px rgba(214, 69, 69, 0.4)',
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
