import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Store, 
  Stethoscope, 
  UtensilsCrossed, 
  Briefcase,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Lock,
  Phone,
  Camera,
  Coins,
  Sparkles,
  MapPin,
  Target,
  ShieldCheck,
  Heart,
  Wrench,
  Shirt
} from 'lucide-react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Globe } from 'lucide-react';
import { africanCountries } from '../../constants/countries';
import { useTranslation } from '../../hooks/useTranslation';


import Logo from '../../components/layout/Logo';

const Register = () => {
  const navigate = useNavigate();
  const { theme, setTheme, language, setLanguage } = useAuthStore();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    typeActivite: '',
    nom: '',
    email: '',
    motDePasse: '',
    telephone: '',
    entrepriseNom: '',
    devise: 'CDF',
    ville: '',
    tauxDollar: '2250',
    countryCode: '+243'
  });

  const activityTypes = [
    {
      id: 'commerce-general',
      label: language === 'fr' ? 'Commerce general' : 'General commerce',
      icon: Store,
      color: '#6366f1',
      desc: language === 'fr'
        ? 'Gestion standard des ventes, stocks et clients.'
        : 'Standard management of sales, stock and customers.'
    },
    {
      id: 'pharmacie',
      label: language === 'fr' ? 'Pharmacie & sante' : 'Pharmacy & health',
      icon: Heart,
      color: '#ef4444',
      desc: language === 'fr'
        ? "Suivi des dates d'expiration, numeros de lot et ordonnances."
        : 'Track expiration dates, batch numbers and prescriptions.'
    },
    {
      id: 'quincaillerie',
      label: language === 'fr' ? 'Quincaillerie & BTP' : 'Hardware & construction',
      icon: Wrench,
      color: '#f59e0b',
      desc: language === 'fr'
        ? 'Unites de mesure speciales, poids, dimensions et marques.'
        : 'Special measurement units, weights, dimensions and brands.'
    },
    {
      id: 'boutique-mode',
      label: language === 'fr' ? 'Boutique de mode' : 'Fashion store',
      icon: Shirt,
      color: '#ec4899',
      desc: language === 'fr'
        ? 'Gestion des variantes de tailles, couleurs, genres et matieres.'
        : 'Manage size, color, gender and material variants.'
    },
  ];

  const updateForm = (fields: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
    if (error) setError(null);
  };

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Explicit validation before sending
    if (!formData.nom) {
        setError("Le nom complet du propriétaire est obligatoire.");
        toast.error(t('ownerNameMissing'));
        setStep(2);
        setLoading(false);
        return;
    }

    if (!formData.entrepriseNom) {
        setError("Le nom de votre commerce est obligatoire.");
        setLoading(false);
        return;
    }
    
    // Use FormData for multipart upload
    const data = new FormData();
    data.append('nom', formData.nom);
    data.append('email', formData.email);
    data.append('motDePasse', formData.motDePasse);
    data.append('telephone', formData.countryCode + formData.telephone);
    data.append('typeActivite', formData.typeActivite);
    data.append('entrepriseNom', formData.entrepriseNom);
    data.append('devise', formData.devise);
    data.append('ville', formData.ville);
    data.append('tauxDollar', formData.tauxDollar);
    
    if (formData.motDePasse) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,100}$/;
        if (!passwordRegex.test(formData.motDePasse)) {
            setError("Le mot de passe doit contenir entre 8 et 100 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&#).");
            toast.error(t('weakPassword'));
            setStep(2);
            setLoading(false);
            return;
        }
    }

    if (avatarFile) {
      data.append('avatar', avatarFile);
    }

    try {
      const { data: responseData } = await api.post('/auth/register', data);
      
      if (responseData.role === 'superadmin') {
        toast.success(t('superAdminWelcome'));
        if (responseData.token) {
          useAuthStore.getState().setAuth(
            {
              id: responseData.id,
              nom: responseData.nom,
              email: responseData.email,
              role: responseData.role,
              avatar: responseData.avatar,
              preferences: responseData.preferences,
            } as any, 
            responseData.token,
            responseData.refreshToken
          );
          navigate('/');
        }
      } else {
        toast.success(t('accountCreatedVerifyEmail'));
        navigate('/verify-email', { state: { email: formData.email } });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Erreur lors de l'inscription";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const StepIndicator = () => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ 
          width: i === step ? '48px' : '12px', 
          height: '10px', 
          borderRadius: '20px', 
          backgroundColor: i <= step ? 'var(--primary)' : 'rgba(0,0,0,0.1)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          boxShadow: i === step ? '0 4px 10px rgba(109, 40, 217, 0.3)' : 'none'
        }} />
      ))}
    </div>
  );

  return (
    <div 
      className="hide-scrollbar"
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'url(/lumo_bg.png) no-repeat center center fixed',
        backgroundSize: 'cover',
        padding: '80px 20px',
        position: 'relative',
        overflow: 'auto',
        backgroundColor: theme === 'dark' ? '#09090b' : '#f1f5f9'
      }}>
      <style>{`
        input::placeholder, select::placeholder { color: ${theme === 'dark' ? '#64748b' : '#94a3b8'} !important; opacity: 1 !important; }
        
        @media (max-width: 600px) {
          .auth-container { padding: 32px 20px !important; border-radius: 24px !important; }
          .auth-top-bar { 
            position: fixed !important; top: 0; left: 0; right: 0; 
            padding: 16px 20px; display: flex; justify-content: space-between; 
            z-index: 100; backdrop-filter: blur(10px);
            background: ${theme === 'dark' ? 'rgba(9,9,11,0.5)' : 'rgba(255,255,255,0.5)'};
          }
          .auth-top-btn { position: static !important; width: 44px !important; height: 44px !important; }
          .auth-back-btn { position: static !important; height: 44px !important; padding: 0 12px !important; }
          .hide-mobile { display: none; }
        }
      `}</style>

      {/* Responsive Top Bar */}
      <div className="auth-top-bar" style={{ position: 'absolute', top: '32px', left: '32px', right: '32px', display: 'flex', justifyContent: 'space-between', zIndex: 100 }}>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="auth-back-btn"
          style={{
            padding: '0 20px', height: '50px', borderRadius: '16px',
            background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            backdropFilter: 'blur(10px)', fontWeight: '800', fontSize: '0.85rem', gap: '10px'
          }}
        >
          <ArrowLeft size={18} />
          <span className="hide-mobile">{language === 'fr' ? 'Retour' : 'Back'}</span>
        </motion.button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            className="auth-top-btn"
            style={{
              padding: '0 12px', height: '50px', borderRadius: '16px',
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              color: theme === 'dark' ? '#f8fafc' : '#0f172a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              backdropFilter: 'blur(10px)', fontWeight: '800', fontSize: '0.85rem', gap: '8px'
            }}
          >
            <Globe size={18} />
            {language === 'fr' ? 'FR' : 'EN'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="auth-top-btn"
            style={{
              width: '50px', height: '50px', borderRadius: '16px',
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              color: theme === 'dark' ? '#f8fafc' : '#0f172a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
        </div>
      </div>

      {/* Background Blur Overlay */}
      <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(15px)',
          zIndex: 1
      }} />
      
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.08, 0.05] }}
        transition={{ duration: 15, repeat: Infinity }}
        style={{ position: 'absolute', top: '-10%', right: '5%', width: '600px', height: '600px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), transparent)', filter: 'blur(100px)', zIndex: 0 }} 
      />
      <motion.div 
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.05, 0.08, 0.05] }}
        transition={{ duration: 18, repeat: Infinity }}
        style={{ position: 'absolute', bottom: '-10%', left: '5%', width: '500px', height: '500px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), transparent)', filter: 'blur(90px)', zIndex: 0 }} 
      />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-container" 
        style={{ 
          padding: '50px 48px', 
          borderRadius: '36px', 
          width: '100%',
          maxWidth: '580px',
          border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.8)',
          background: theme === 'dark' ? 'rgba(18, 18, 22, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          boxShadow: theme === 'dark' ? '0 40px 100px -20px rgba(0, 0, 0, 0.6)' : '0 40px 100px -20px rgba(0, 0, 0, 0.1)',
          zIndex: 10,
          position: 'relative'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo size={60} textColor={theme === 'dark' ? '#f8fafc' : '#0f172a'} />
          </Link>
          <h2 style={{ fontSize: '2.6rem', fontWeight: '900', marginBottom: '12px', letterSpacing: '-0.05em', lineHeight: 1.1, marginTop: '24px', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
            {t.registerTitle}
          </h2>
          <p style={{ color: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: '1.05rem', fontWeight: 600 }}>{t.registerSubtitle}</p>
        </div>

        <StepIndicator />

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid var(--danger)', 
                color: 'var(--danger)', 
                padding: '16px', 
                borderRadius: '16px', 
                marginBottom: '24px',
                fontSize: '0.9rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
                <div style={{ backgroundColor: 'var(--danger)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0 }}>!</div>
                {error}
            </motion.div>
          )}

          {/* STEP 1: ACTIVITY TYPE */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "circOut" }}
            >
              <h3 style={{ marginBottom: '28px', textAlign: 'center', fontSize: '1.2rem', fontWeight: '800', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{t.registerStep1}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
                {activityTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.typeActivite === type.id;
                  return (
                    <motion.div 
                      whileHover={{ scale: 1.03, y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      key={type.id}
                      onClick={() => updateForm({ typeActivite: type.id })}
                      style={{ 
                        padding: '24px 20px',
                        borderRadius: '24px',
                        border: `2px solid ${isSelected ? type.color : 'var(--border)'}`,
                        backgroundColor: isSelected ? `${type.color}10` : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '14px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        textAlign: 'center',
                        boxShadow: isSelected ? `0 15px 30px -10px ${type.color}60` : 'none'
                      }}
                    >
                      <div style={{ 
                          width: '56px', height: '56px', borderRadius: '18px', 
                          backgroundColor: isSelected ? type.color : 'rgba(100, 116, 139, 0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isSelected ? 'white' : 'var(--text-muted)',
                          transition: 'all 0.3s'
                      }}>
                        <Icon size={28} />
                      </div>
                      <div>
                        <p style={{ fontWeight: '800', fontSize: '0.95rem', color: isSelected ? '#0f172a' : '#475569', margin: '0 0 4px 0' }}>{type.label}</p>
                        <p style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#94a3b8' : '#475569', opacity: 0.6 }}>{type.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={!formData.typeActivite}
                onClick={nextStep}
                style={{ 
                  width: '100%', 
                  padding: '18px', 
                  borderRadius: '18px', 
                  background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', 
                  color: 'white', 
                  border: 'none', 
                  fontWeight: '900', 
                  fontSize: '1.2rem',
                  marginTop: '40px',
                  cursor: formData.typeActivite ? 'pointer' : 'not-allowed',
                  opacity: formData.typeActivite ? 1 : 0.4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: formData.typeActivite ? '0 15px 35px -8px rgba(109, 40, 217, 0.5)' : 'none'
                }}
              >
                {t.registerNext} <ArrowRight size={22} />
              </motion.button>
            </motion.div>
          )}

          {/* STEP 2: PERSONAL INFO */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <h3 style={{ marginBottom: '8px', textAlign: 'center', fontSize: '1.2rem', fontWeight: '800', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{t.registerStep2Title}</h3>
              <p style={{ textAlign: 'center', color: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: '0.95rem', marginBottom: '8px' }}>{t.registerStep2Sub}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '700', color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginLeft: '4px' }}>{t.registerFullName}</label>
                    <div style={{ position: 'relative' }}>
                        <User size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#94a3b8' : '#475569' }} />
                        <input 
                            type="text" 
                            placeholder={t.phName}
                            value={formData.nom}
                            onChange={(e) => updateForm({ nom: e.target.value })}
                            style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)', backgroundColor: 'transparent', color: theme === 'dark' ? '#f8fafc' : '#0f172a', fontSize: '1rem', outline: 'none' }} 
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '700', color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginLeft: '4px' }}>{t.registerEmail}</label>
                    <div style={{ position: 'relative' }}>
                        <Mail size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#94a3b8' : '#475569' }} />
                        <input 
                            type="email" 
                            placeholder={t.phEmailReg}
                            value={formData.email}
                            onChange={(e) => updateForm({ email: e.target.value })}
                            style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)', backgroundColor: 'transparent', color: theme === 'dark' ? '#f8fafc' : '#0f172a', fontSize: '1rem', outline: 'none' }} 
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '700', color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginLeft: '4px' }}>{t.registerPhone}</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ width: '130px', position: 'relative' }}>
                            <select
                                value={formData.countryCode}
                                onChange={(e) => updateForm({ countryCode: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '16px 12px 16px 42px',
                                    borderRadius: '16px',
                                    border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)',
                                    backgroundColor: 'transparent',
                                    color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    appearance: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '800'
                                }}
                            >
                                {africanCountries.map(c => (
                                    <option key={c.code} value={c.code} style={{ background: theme === 'dark' ? '#1f2937' : '#fff' }}>
                                        {c.flag} {c.code}
                                    </option>
                                ))}
                            </select>
                            <Globe size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#94a3b8' : '#475569' }} />
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Phone size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#94a3b8' : '#475569' }} />
                            <input 
                                type="tel" 
                                placeholder={t.phPhone}
                                value={formData.telephone}
                                onChange={(e) => updateForm({ telephone: e.target.value })}
                                style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)', backgroundColor: 'transparent', color: theme === 'dark' ? '#f8fafc' : '#0f172a', fontSize: '1rem', outline: 'none', fontWeight: '600' }} 
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '700', color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginLeft: '4px' }}>{t.registerPassword}</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#94a3b8' : '#475569' }} />
                        <input 
                            type="password" 
                            placeholder={t.phPassword}
                            value={formData.motDePasse}
                            maxLength={100}
                            onChange={(e) => updateForm({ motDePasse: e.target.value })}
                            style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)', backgroundColor: 'transparent', color: theme === 'dark' ? '#f8fafc' : '#0f172a', fontSize: '1rem', outline: 'none' }} 
                        />
                    </div>
                    {formData.motDePasse && (
                      <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {[
                          { label: '8+ Caract.', met: formData.motDePasse.length >= 8 },
                          { label: 'Maj.', met: /[A-Z]/.test(formData.motDePasse) },
                          { label: 'Min.', met: /[a-z]/.test(formData.motDePasse) },
                          { label: 'Chiffre', met: /\d/.test(formData.motDePasse) },
                          { label: 'Symbole', met: /[@$!%*?&#]/.test(formData.motDePasse) },
                        ].map((req, idx) => (
                          <span key={idx} style={{ 
                            fontSize: '0.7rem', 
                            padding: '4px 8px', 
                            borderRadius: '8px', 
                            backgroundColor: req.met ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                            color: req.met ? '#10b981' : theme === 'dark' ? '#64748b' : '#94a3b8',
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
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                <button 
                  onClick={prevStep}
                  style={{ flex: 1, padding: '18px', borderRadius: '18px', border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)', background: 'none', color: theme === 'dark' ? '#f8fafc' : '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: '700' }}
                >
                  <ArrowLeft size={20} /> {t.registerBack}
                </button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!formData.nom || !formData.email || !formData.motDePasse}
                  onClick={nextStep}
                  style={{ 
                      flex: 1.5, padding: '18px', borderRadius: '18px', background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', 
                      color: 'white', border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', gap: '10px', boxShadow: '0 15px 35px -8px rgba(109, 40, 217, 0.4)' 
                  }}
                >
                  {t.registerNext} <ArrowRight size={20} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: ENTERPRISE INFO */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "circOut" }}
            >
              <h3 style={{ marginBottom: '8px', textAlign: 'center', fontSize: '1.2rem', fontWeight: '800', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{t.registerStep3Title}</h3>
              <p style={{ textAlign: 'center', color: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: '0.95rem', marginBottom: '32px' }}>{t.registerStep3Sub}</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                  />
                  <motion.div 
                    whileHover={{ scale: 1.05, borderColor: 'var(--primary)' }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                      width: '120px', height: '120px', borderRadius: '32px', border: '2px dashed var(--border)', 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: '10px', color: theme === 'dark' ? '#94a3b8' : '#475569', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.02)',
                      transition: 'all 0.3s',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <>
                          <Camera size={28} />
                          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>PHOTO PROFIL</span>
                        </>
                      )}
                  </motion.div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '800', color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginLeft: '4px' }}>{t.registerCompanyName}</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#94a3b8' : '#475569' }} />
                    <input 
                      type="text" 
                      placeholder={t.phCompany}
                      value={formData.entrepriseNom}
                      onChange={(e) => updateForm({ entrepriseNom: e.target.value })}
                      style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '18px', border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)', backgroundColor: 'transparent', color: theme === 'dark' ? '#f8fafc' : '#0f172a', outline: 'none', fontSize: '1rem', fontWeight: '600' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '800', color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginLeft: '4px' }}>{t.registerCurrency}</label>
                        <div style={{ position: 'relative' }}>
                            <Coins size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#94a3b8' : '#475569' }} />
                            <select 
                                value={formData.devise}
                                onChange={(e) => updateForm({ devise: e.target.value })}
                                style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '18px', border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)', backgroundColor: 'var(--bg-main)', color: theme === 'dark' ? '#f8fafc' : '#0f172a', appearance: 'none', outline: 'none', fontWeight: '700', cursor: 'pointer' }}
                            >
                                <option value="CDF">Franc Congolais (CDF)</option>
                                <option value="USD">Dollars (USD)</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '800', color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginLeft: '4px' }}>{t.registerExchangeRate}</label>
                        <div style={{ position: 'relative' }}>
                            <Target size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#94a3b8' : '#475569' }} />
                            <input 
                                type="number" 
                                placeholder={t.phRate}
                                value={formData.tauxDollar}
                                min="1"
                                onChange={(e) => updateForm({ tauxDollar: Math.max(1, Number(e.target.value)).toString() })}
                                style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '18px', border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)', backgroundColor: 'transparent', color: theme === 'dark' ? '#f8fafc' : '#0f172a', outline: 'none', fontSize: '1rem', fontWeight: '600' }} 
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '800', color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginLeft: '4px' }}>{t.registerCity}</label>
                        <div style={{ position: 'relative' }}>
                            <MapPin size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#94a3b8' : '#475569' }} />
                            <input 
                                type="text" 
                                placeholder={t.phCity}
                                value={formData.ville}
                                onChange={(e) => updateForm({ ville: e.target.value })}
                                style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '18px', border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)', backgroundColor: 'transparent', color: theme === 'dark' ? '#f8fafc' : '#0f172a', outline: 'none', fontSize: '1rem', fontWeight: '600' }} 
                            />
                        </div>
                    </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRegister}
                disabled={loading || !formData.entrepriseNom}
                style={{ 
                  width: '100%', padding: '20px', borderRadius: '20px', 
                  background: 'linear-gradient(135deg, var(--secondary) 0%, #059669 100%)', 
                  color: 'white', border: 'none', fontWeight: '900', fontSize: '1.3rem',
                  marginTop: '48px', cursor: (loading || !formData.entrepriseNom) ? 'not-allowed' : 'pointer', 
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '12px', boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.5)',
                  opacity: (loading || !formData.entrepriseNom) ? 0.6 : 1
                }}
              >
                {loading ? t.registerLoading : (<>{t.registerFinish} <CheckCircle2 size={26} /></>)}
              </motion.button>
              
              <button 
                onClick={prevStep}
                style={{ width: '100%', background: 'none', border: 'none', color: theme === 'dark' ? '#94a3b8' : '#475569', marginTop: '24px', cursor: 'pointer', fontSize: '1rem', fontWeight: '700', opacity: 0.8 }}
              >
                ← {t.registerBack}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ textAlign: 'center', marginTop: '48px', borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
          <p style={{ color: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: '1rem', fontWeight: '500' }}>
            {t.registerHaveAccount} <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '900', textDecoration: 'none', borderBottom: '2px solid var(--primary-glow)' }}>{t.registerLogin}</Link>
          </p>
        </div>
      </motion.div>

      {/* Trust Footer */}
      <div style={{ position: 'absolute', bottom: '24px', display: 'flex', gap: '32px', color: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: '0.85rem', fontWeight: '600', opacity: 0.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Target size={14} /> Précision Absolue</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={14} /> Sécurité Avancée</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={14} /> Intelligence Artificielle</div>
      </div>
    </div>
  );
};

export default Register;
