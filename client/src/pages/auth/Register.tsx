import AuthFrame,{PasswordField,CodeField} from './AuthFrame';
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
    tauxDollar: '',
    countryCode: '+243'
  });

  const activityTypes = [
    {
      id: 'commerce-general',
      label: language === 'fr' ? 'Commerce general' : 'General commerce',
      icon: Store,
      color: 'var(--primary)',
      desc: language === 'fr'
        ? 'Gestion standard des ventes, stocks et clients.'
        : 'Standard management of sales, stock and customers.'
    },
    {
      id: 'pharmacie',
      label: language === 'fr' ? 'Pharmacie & sante' : 'Pharmacy & health',
      icon: Heart,
      color: 'var(--danger)',
      desc: language === 'fr'
        ? "Suivi des dates d'expiration, numeros de lot et ordonnances."
        : 'Track expiration dates, batch numbers and prescriptions.'
    },
    {
      id: 'quincaillerie',
      label: language === 'fr' ? 'Quincaillerie & BTP' : 'Hardware & construction',
      icon: Wrench,
      color: 'var(--warning)',
      desc: language === 'fr'
        ? 'Unites de mesure speciales, poids, dimensions et marques.'
        : 'Special measurement units, weights, dimensions and brands.'
    },
    {
      id: 'boutique-mode',
      label: language === 'fr' ? 'Boutique de mode' : 'Fashion store',
      icon: Shirt,
      color: '#C98A1B',
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
    if(loading)return;
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
          boxShadow: i === step ? '0 4px 10px rgba(168, 68, 32, 0.3)' : 'none'
        }} />
      ))}
    </div>
  );

  return (
    <div 
      className="hide-scrollbar lumo-auth"
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--bg-main)',
        backgroundSize: 'cover',
        padding: '80px 20px',
        position: 'relative',
        overflow: 'auto',
        backgroundColor: theme === 'dark' ? 'var(--bg-main)' : '#f1f5f9'
      }}>
      <style>{`
        input::placeholder, select::placeholder { color: ${theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)'} !important; opacity: 1 !important; }
        
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
            color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)',
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
              color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)',
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
              color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)',
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
        style={{ position: 'absolute', top: '-10%', right: '5%', width: '600px', height: '600px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(21, 94, 88, 0.15), transparent)', filter: 'blur(100px)', zIndex: 0 }} 
      />
      <motion.div 
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.05, 0.08, 0.05] }}
        transition={{ duration: 18, repeat: Infinity }}
        style={{ position: 'absolute', bottom: '-10%', left: '5%', width: '500px', height: '500px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(168, 68, 32, 0.15), transparent)', filter: 'blur(90px)', zIndex: 0 }} 
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
            <Logo size={60} textColor={theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)'} />
          </Link>
          <h2 style={{ fontSize: '2.6rem', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.05em', lineHeight: 1.1, marginTop: '24px', color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)' }}>
            {t.registerTitle}
          </h2>
          <p style={{ color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 600 }}>{t.registerSubtitle}</p>
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
              <h3 style={{ marginBottom: '28px', textAlign: 'center', fontSize: '1.2rem', fontWeight: '800', color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)' }}>{t.registerStep1}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
                {activityTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.typeActivite === type.id;
                  const fr=language==='fr';const tr=(a:string,b:string)=>fr?a:b;
return <AuthFrame wide title={tr('Créez votre espace','Create your workspace')} description={tr('Configurez votre entreprise en trois étapes.','Set up your business in three steps.')} back="/"><ol className="ac-steps">{[tr('Activité','Business type'),tr('Compte','Account'),tr('Entreprise','Company')].map((v,i)=><li key={i} aria-current={step===i+1?'step':undefined} className={step>=i+1?'active':''}><span>{i+1}</span>{v}</li>)}</ol>{error&&<p role="alert" className="ac-error">{error}</p>}
{step===1?<div className="ac-form"><div className="ac-options">{activityTypes.map(a=><button type="button" key={a.id} aria-pressed={formData.typeActivite===a.id} className={formData.typeActivite===a.id?'selected':''} onClick={()=>updateForm({typeActivite:a.id})}><a.icon size={22}/><span><strong>{a.label}</strong><small>{a.desc}</small></span></button>)}</div><button className="ac-primary" disabled={!formData.typeActivite} onClick={nextStep}>{tr('Continuer','Continue')}<ArrowRight size={18}/></button></div>:step===2?<form className="ac-form" onSubmit={e=>{e.preventDefault();if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,100}$/.test(formData.motDePasse)){setError(tr('Mot de passe non conforme.','Password does not meet requirements.'));return}nextStep()}}><label>{tr('Nom complet','Full name')}<input required autoComplete="name" maxLength={120} value={formData.nom} onChange={e=>updateForm({nom:e.target.value})}/></label><label>Email<input required type="email" autoComplete="email" maxLength={254} value={formData.email} onChange={e=>updateForm({email:e.target.value})}/></label><label>{tr('Téléphone','Phone')}<span className="ac-phone"><select aria-label={tr('Indicatif','Country code')} value={formData.countryCode} onChange={e=>updateForm({countryCode:e.target.value})}>{africanCountries.map(c=><option key={c.name} value={c.code}>{c.name} {c.code}</option>)}</select><input type="tel" autoComplete="tel-national" value={formData.telephone} onChange={e=>updateForm({telephone:e.target.value})}/></span></label><PasswordField label={tr('Mot de passe','Password')} value={formData.motDePasse} onChange={v=>updateForm({motDePasse:v})} autoComplete="new-password"/><small>{tr('8–100 caractères, majuscule, minuscule, chiffre et symbole (@$!%*?&#).','8–100 characters, uppercase, lowercase, digit and symbol (@$!%*?&#).')}</small><div className="ac-buttons"><button type="button" className="ac-secondary" onClick={prevStep}>{tr('Retour','Back')}</button><button className="ac-primary">{tr('Continuer','Continue')}<ArrowRight size={18}/></button></div></form>:<form className="ac-form" onSubmit={handleRegister}><label>{tr('Nom de l’entreprise','Business name')}<input required maxLength={150} value={formData.entrepriseNom} onChange={e=>updateForm({entrepriseNom:e.target.value})}/></label><label>{tr('Ville','City')}<input value={formData.ville} onChange={e=>updateForm({ville:e.target.value})}/></label><div className="ac-phone"><label>{tr('Devise','Currency')}<select value={formData.devise} onChange={e=>updateForm({devise:e.target.value})}><option>CDF</option><option>USD</option></select></label><label>{tr('1 USD en CDF','1 USD in CDF')}<input required type="number" min="1.01" step="0.01" value={formData.tauxDollar} onChange={e=>updateForm({tauxDollar:e.target.value})}/></label></div><label>{tr('Photo ou logo (facultatif)','Photo or logo (optional)')}<input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange}/></label>{avatarPreview&&<img className="ac-avatar" src={avatarPreview} alt={tr('Aperçu de la photo','Photo preview')}/>}<div className="ac-buttons"><button type="button" className="ac-secondary" disabled={loading} onClick={prevStep}>{tr('Retour','Back')}</button><button className="ac-primary" disabled={loading}>{loading?tr('Création…','Creating…'):tr('Créer mon compte','Create my account')}<ArrowRight size={18}/></button></div></form>}
<p className="ac-foot">{tr('Déjà inscrit ?','Already registered?')} <Link to="/login">{tr('Se connecter','Sign in')}</Link></p></AuthFrame>;
};
export default Register;
