import React, { useState, useRef, useEffect } from 'react';
import { 
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
  RefreshCcw
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

const InputField = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, readOnly = false }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-muted)', marginLeft: '4px' }}>{label}</label>
    <div style={{ position: 'relative' }}>
      {Icon && <Icon size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          width: '100%',
          padding: Icon ? '14px 16px 14px 48px' : '14px 16px',
          borderRadius: '16px',
          border: '1.5px solid var(--border)',
          backgroundColor: readOnly ? 'rgba(0,0,0,0.02)' : 'var(--bg-main)',
          color: 'var(--text-main)',
          fontSize: '0.95rem',
          outline: 'none',
          fontWeight: '700',
          opacity: readOnly ? 0.7 : 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: readOnly ? 'default' : 'text',
          boxSizing: 'border-box'
        }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = 'var(--primary)'; }}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  </div>
);

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
    setExchangeRate
  } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    nom: user?.nom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    typeActivite: user?.typeActivite || 'Boutique',
    entreprise: {
      nom: user?.entreprise?.nom || '',
      devise: user?.entreprise?.devise || 'FC',
      adresse: user?.entreprise?.adresse || '',
      logo: user?.entreprise?.logo || '',
    },
    motDePasse: ''
  });

  // Keep state in sync with user if store updates
  useEffect(() => {
    if (user) {
        setProfileData(prev => ({
            ...prev,
            nom: user.nom || prev.nom,
            email: user.email || prev.email,
            telephone: user.telephone || prev.telephone,
            typeActivite: user.typeActivite || prev.typeActivite,
            entreprise: {
                ...prev.entreprise,
                ...user.entreprise
            }
        }));
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
      const updated = response.data;
      updateUser(updated);
      toast.success('Photo de profil mise à jour avec succès !');
    } catch (error: any) {
      console.error("Upload Error:", error);
      toast.error(error.response?.data?.message || "Échec de l'upload de l'image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nom: profileData.nom,
        telephone: profileData.telephone,
        typeActivite: profileData.typeActivite,
        entreprise: profileData.entreprise,
        preferences: {
            theme,
            language,
            enabledModules,
            currency,
            exchangeRate
        },
        ...(profileData.motDePasse ? { motDePasse: profileData.motDePasse } : {})
      };
      
      const response = await api.put('/auth/profile', payload);
      const updatedUser = response.data;
      updateUser(updatedUser);
      
      setProfileData(prev => ({ ...prev, motDePasse: '' }));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      toast.success('✅ Paramètres enregistrés et synchronisés !');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Mon Profil', icon: UserIcon, color: 'var(--primary)' },
    { id: 'business', label: 'Mon Enseigne', icon: Store, color: 'var(--secondary)' },
    { id: 'appearance', label: 'Interface', icon: Palette, color: '#f59e0b' },
    { id: 'modules', label: 'Modules & IA', icon: Cpu, color: '#ef4444' },
    { id: 'security', label: 'Sécurité', icon: ShieldCheck, color: '#6366f1' },
  ];

  const activityTypes = ['Pharmacie', 'Boutique', 'Restaurant', 'Services', 'Épicerie', 'Quincaillerie', 'Autre'];
  const devises = ['FC', 'USD', 'EUR', 'XAF', 'NGN', 'KES'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto', padding: '10px 0 80px 0' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.05em' }}>Paramètres <span style={{ color: 'var(--primary)', opacity: 0.5 }}>Système</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>Contrôlez chaque aspect de votre plateforme HubCommerce.</p>
        </div>
        <button 
          onClick={logout}
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
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-0.03em' }}>Identité Numérique</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Gérez votre avatar et vos informations de contact professionnelles.</p>
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
                      Mettre à jour la photo
                    </button>
                  </div>
                </div>

                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <InputField label="Nom Complet" icon={UserIcon} value={profileData.nom} onChange={(e: any) => setProfileData({ ...profileData, nom: e.target.value })} placeholder="Ex: Jean Dupont" />
                  <InputField label="Email (Lecture seule)" icon={Mail} value={profileData.email} readOnly placeholder="email@example.com" />
                  <InputField label="Numéro de Téléphone" icon={Phone} value={profileData.telephone} onChange={(e: any) => setProfileData({ ...profileData, telephone: e.target.value })} placeholder="+243 xxx xxx xxx" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-muted)', marginLeft: '4px' }}>Expertise / Secteur</label>
                    <div style={{ position: 'relative' }}>
                      <Briefcase size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
                      <select
                        value={profileData.typeActivite}
                        onChange={(e) => setProfileData({ ...profileData, typeActivite: e.target.value })}
                        style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box', appearance: 'none' }}
                      >
                        {activityTypes.map(a => <option key={a} value={a}>{a}</option>)}
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
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 8px 0' }}>Configuration Enseigne</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Ces informations apparaîtront sur vos factures et rapports d'activité.</p>
                </div>

                <div style={{ padding: '24px', borderRadius: '24px', background: 'var(--secondary-glow)', border: '1.5px solid var(--secondary)', display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Store size={32} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '900', fontSize: '1.1rem', color: 'var(--secondary)' }}>{profileData.entreprise.nom || 'Commerce sans nom'}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>{profileData.typeActivite} · Système de gestion {currency}</p>
                  </div>
                </div>

                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <InputField label="Nom Commercial" icon={Store} value={profileData.entreprise.nom} onChange={(e: any) => setProfileData({ ...profileData, entreprise: { ...profileData.entreprise, nom: e.target.value } })} placeholder="Ex: Boutique Elite" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-muted)', marginLeft: '4px' }}>Devise de Travail</label>
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
                        {devises.map(d => <option key={d} value={d}>{d}</option>)}
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
                    <InputField label="Adresse Physique" icon={MapPin} value={profileData.entreprise.adresse} onChange={(e: any) => setProfileData({ ...profileData, entreprise: { ...profileData.entreprise, adresse: e.target.value } })} placeholder="Numéro, Rue, Ville, Pays" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* APPEARANCE */}
            {activeTab === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 8px 0' }}>Expérience Visuelle</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Personnalisez l'apparence du système selon vos préférences de travail.</p>
                </div>
                
                <div style={{ padding: '24px', borderRadius: '24px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <Palette size={24} />
                    </div>
                    <div>
                      <p style={{ fontWeight: '900', margin: 0 }}>Mode Sombre / Clair</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: 600 }}>Thème actuel: {theme === 'dark' ? 'Minuit / Sombre' : 'Zen / Clair'}</p>
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
                      <p style={{ fontWeight: '900', margin: 0 }}>Langue du Système</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: 600 }}>Traduction complète de l'interface.</p>
                    </div>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    style={{ padding: '12px 24px', borderRadius: '14px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '800', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="fr">🇫🇷 Français</option>
                    <option value="en">🇬🇧 English</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* MODULES */}
            {activeTab === 'modules' && (
              <motion.div key="modules" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 8px 0' }}>Hub de Modules</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Activez des puissances supplémentaires pour votre commerce.</p>
                </div>

                {[
                  { id: 'ai', label: 'Intelligence Artificielle', desc: 'Analyses Gemini 2.0 et prévisions de vente.', icon: Sparkles, color: '#6366f1', active: enabledModules.includes('ai') },
                  { id: 'suppliers', label: 'Gestion Fournisseurs', desc: 'Stocks et créances fournisseurs.', icon: Package, color: '#10b981', active: enabledModules.includes('suppliers') },
                  { id: 'debts', label: 'Crédit Client', desc: 'Suivi des impayés et relances.', icon: CreditCard, color: '#f59e0b', active: enabledModules.includes('debts') },
                  { id: 'analytics', label: 'Dashboard Avancé', desc: 'Rapports graphiques et KPI exports.', icon: BarChart2, color: '#3b82f6', active: enabledModules.includes('analytics') },
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
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 8px 0' }}>Coffre-Fort & Accès</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Renforcez la sécurité de votre compte administrateur.</p>
                </div>
                <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-muted)', marginLeft: '4px' }}>Modifier Mot de Passe</label>
                    <div style={{ position: 'relative' }}>
                      <Key size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Nouveau mot de passe (8+ car.)"
                        value={profileData.motDePasse}
                        onChange={(e) => setProfileData({ ...profileData, motDePasse: e.target.value })}
                        style={{ width: '100%', padding: '16px 56px 16px 48px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', fontWeight: '700' }}
                      />
                      <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {profileData.motDePasse && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: '0.85rem', color: profileData.motDePasse.length >= 8 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', fontWeight: 800 }}>
                        {profileData.motDePasse.length >= 8 ? <CheckCircle size={14} /> : null}
                        {profileData.motDePasse.length >= 8 ? 'Robustesse validée' : `${8 - profileData.motDePasse.length} car. restant`}
                      </motion.div>
                    )}
                  </div>
                  <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: '1.5' }}>
                    ⚠️ Les modifications de mot de passe sont irréversibles. Assurez-vous d'avoir noté votre nouvelle clé d'accès.
                  </div>
                </div>
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
              {saving ? 'Synchronisation...' : savedSuccess ? 'Modifications Appliquées' : 'Sauvegarder les changements'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
