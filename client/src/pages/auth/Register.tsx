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
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,72}$/;
        if (!passwordRegex.test(formData.motDePasse)||new TextEncoder().encode(formData.motDePasse).length>72) {
            setError("Le mot de passe doit contenir entre 8 et 72 caractères (72 octets maximum), une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&#).");
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

  const fr=language==='fr';const tr=(a:string,b:string)=>fr?a:b;
return <AuthFrame wide title={tr('Créez votre espace','Create your workspace')} description={tr('Configurez votre entreprise en trois étapes.','Set up your business in three steps.')} back="/"><ol className="ac-steps">{[tr('Activité','Business type'),tr('Compte','Account'),tr('Entreprise','Company')].map((v,i)=><li key={i} aria-current={step===i+1?'step':undefined} className={step>=i+1?'active':''}><span>{i+1}</span>{v}</li>)}</ol>{error&&<p role="alert" className="ac-error">{error}</p>}
{step===1?<div className="ac-form"><div className="ac-options">{activityTypes.map(a=><button type="button" key={a.id} aria-pressed={formData.typeActivite===a.id} className={formData.typeActivite===a.id?'selected':''} onClick={()=>updateForm({typeActivite:a.id})}><a.icon size={22}/><span><strong>{a.label}</strong><small>{a.desc}</small></span></button>)}</div><button className="ac-primary" disabled={!formData.typeActivite} onClick={nextStep}>{tr('Continuer','Continue')}<ArrowRight size={18}/></button></div>:step===2?<form className="ac-form" onSubmit={e=>{e.preventDefault();if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,100}$/.test(formData.motDePasse)){setError(tr('Mot de passe non conforme.','Password does not meet requirements.'));return}nextStep()}}><label>{tr('Nom complet','Full name')}<input required autoComplete="name" maxLength={120} value={formData.nom} onChange={e=>updateForm({nom:e.target.value})}/></label><label>Email<input required type="email" autoComplete="email" maxLength={254} value={formData.email} onChange={e=>updateForm({email:e.target.value})}/></label><label>{tr('Téléphone','Phone')}<span className="ac-phone"><select aria-label={tr('Indicatif','Country code')} value={formData.countryCode} onChange={e=>updateForm({countryCode:e.target.value})}>{africanCountries.map(c=><option key={c.name} value={c.code}>{c.name} {c.code}</option>)}</select><input type="tel" autoComplete="tel-national" value={formData.telephone} onChange={e=>updateForm({telephone:e.target.value})}/></span></label><PasswordField label={tr('Mot de passe','Password')} value={formData.motDePasse} onChange={v=>updateForm({motDePasse:v})} autoComplete="new-password"/><small>{tr('8–100 caractères, majuscule, minuscule, chiffre et symbole (@$!%*?&#).','8–100 characters, uppercase, lowercase, digit and symbol (@$!%*?&#).')}</small><div className="ac-buttons"><button type="button" className="ac-secondary" onClick={prevStep}>{tr('Retour','Back')}</button><button className="ac-primary">{tr('Continuer','Continue')}<ArrowRight size={18}/></button></div></form>:<form className="ac-form" onSubmit={handleRegister}><label>{tr('Nom de l’entreprise','Business name')}<input required maxLength={150} value={formData.entrepriseNom} onChange={e=>updateForm({entrepriseNom:e.target.value})}/></label><label>{tr('Ville','City')}<input value={formData.ville} onChange={e=>updateForm({ville:e.target.value})}/></label><div className="ac-phone"><label>{tr('Devise','Currency')}<select value={formData.devise} onChange={e=>updateForm({devise:e.target.value})}><option>CDF</option><option>USD</option></select></label><label>{tr('1 USD en CDF','1 USD in CDF')}<input required type="number" min="1.01" step="0.01" value={formData.tauxDollar} onChange={e=>updateForm({tauxDollar:e.target.value})}/></label></div><label>{tr('Photo ou logo (facultatif)','Photo or logo (optional)')}<input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange}/></label>{avatarPreview&&<img className="ac-avatar" src={avatarPreview} alt={tr('Aperçu de la photo','Photo preview')}/>}<div className="ac-buttons"><button type="button" className="ac-secondary" disabled={loading} onClick={prevStep}>{tr('Retour','Back')}</button><button className="ac-primary" disabled={loading}>{loading?tr('Création…','Creating…'):tr('Créer mon compte','Create my account')}<ArrowRight size={18}/></button></div></form>}
<p className="ac-foot">{tr('Déjà inscrit ?','Already registered?')} <Link to="/login">{tr('Se connecter','Sign in')}</Link></p></AuthFrame>;
};
export default Register;
