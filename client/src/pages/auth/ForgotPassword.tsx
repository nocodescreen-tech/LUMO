import AuthFrame,{PasswordField,CodeField} from './AuthFrame';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, Sun, Moon, KeyRound, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';
import Logo from '../../components/layout/Logo';
import { useTranslation } from '../../hooks/useTranslation';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { theme, setTheme, language, setLanguage } = useAuthStore();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(loading)return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success(t('recoveryCodeSent'));
      navigate('/verify-reset-otp', { state: { email } });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('emailNotFound'));
    } finally {
      setLoading(false);
    }
  };

  return <AuthFrame title={language==='fr'?'Mot de passe oublié':'Forgot password'} description={language==='fr'?'Indiquez l’adresse associée à votre compte.':'Enter the email associated with your account.'} back="/login"><form className="ac-form" onSubmit={handleSubmit}><label>Email<input required type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label><button className="ac-primary" disabled={loading}>{loading?(language==='fr'?'Envoi…':'Sending…'):(language==='fr'?'Demander un code':'Request code')}<ArrowRight size={18}/></button></form></AuthFrame>;
};
export default ForgotPassword;
