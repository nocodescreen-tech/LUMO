import AuthFrame,{PasswordField,CodeField} from './AuthFrame';
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, Lock, ArrowRight, ArrowLeft, LogIn, ShieldAlert, Sun, Moon, Shield, KeyRound, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import { toast } from 'sonner';
import Logo from '../../components/layout/Logo';
import { useTranslation } from '../../hooks/useTranslation';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, language, setLanguage, setAuth } = useAuthStore();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      toast.error(t('sessionExpiredLogin'));
    }
  }, [location]);

  // 2FA state
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [twoFAUserId, setTwoFAUserId] = useState<number | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [challenge,setChallenge]=useState('');

  const persistAuth = (data: any) => {
    // Let setAuth be the ONLY writer of hub-auth to avoid stale user data contamination
    setAuth(
      {
        id: data.id,
        nom: data.nom,
        email: data.email,
        role: data.role,
        avatar: data.avatar,
        telephone: data.telephone,
        typeActivite: data.typeActivite,
        entreprise: data.entreprise,
        preferences: data.preferences,
        twoFactorEnabled: data.twoFactorEnabled,
        permissions: data.permissions,
      } as any,
      data.token,
      data.refreshToken
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if(loading)return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, motDePasse: password });
      if (data.requires2FA) {
        setTwoFAUserId(data.userId);
        setChallenge(data.challenge);
        setStep('2fa');
        toast.info(t('code2FASent'));
        return;
      }
      persistAuth(data);
      toast.success(t('welcomeBack'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if(loading)return;
    if (twoFACode.length !== 6) return toast.error(t('enter6DigitCode'));
    setLoading(true);
    try {
      const { data } = await api.post('/auth/2fa/verify', { userId: twoFAUserId, code: twoFACode, challenge });
      persistAuth(data);
      toast.success(t('login2FASuccess'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('invalidOrExpiredCode'));
    } finally {
      setLoading(false);
    }
  };

  return <AuthFrame title={step==='2fa'?(language==='fr'?'Vérifiez votre identité':'Verify your identity'):(language==='fr'?'Connectez-vous':'Sign in')} description={step==='2fa'?t('code2FASent'):(language==='fr'?'Accédez à votre espace de gestion.':'Access your business workspace.')} back="/">{step==='credentials'?<form onSubmit={handleLogin} className="ac-form"><label>Email<input type="email" autoComplete="username" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label><PasswordField label={language==='fr'?'Mot de passe':'Password'} value={password} onChange={setPassword} autoComplete="current-password"/><Link className="ac-link" to="/forgot-password">{language==='fr'?'Mot de passe oublié ?':'Forgot password?'}</Link><button className="ac-primary" disabled={loading}>{loading?t('loginLoading'):(language==='fr'?'Se connecter':'Sign in')}<ArrowRight size={18}/></button><p className="ac-foot">{language==='fr'?'Nouveau sur LUMO ?':'New to LUMO?'} <Link to="/register">{language==='fr'?'Créer un compte':'Create an account'}</Link></p></form>:<form className="ac-form" onSubmit={handle2FAVerify}><CodeField value={twoFACode} onChange={setTwoFACode}/><button className="ac-primary" disabled={loading||twoFACode.length!==6}>{loading?t('verifyLoading'):(language==='fr'?'Vérifier le code':'Verify code')}<ArrowRight size={18}/></button><button type="button" className="ac-secondary" disabled={loading} onClick={()=>{setStep('credentials');setTwoFACode('');setChallenge('');setTwoFAUserId(null)}}>{language==='fr'?'Retour à la connexion':'Back to sign in'}</button></form>}</AuthFrame>;
};
export default Login;
