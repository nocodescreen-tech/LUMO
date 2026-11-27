import AuthFrame,{PasswordField,CodeField} from './AuthFrame';
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldAlert, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';
import Logo from '../../components/layout/Logo';
import { useTranslation } from '../../hooks/useTranslation';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, setTheme, language } = useAuthStore();
    const { t } = useTranslation();
    const email = location.state?.email;
    const code = location.state?.code;
    
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(loading||!email||!code)return;
        
        // Validation stricte
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,100}$/;
        if (!passwordRegex.test(password)) {
            return toast.error(t('passwordRequirements'));
        }
        
        if (password !== confirm) return toast.error(t('passwordMismatch'));

        setLoading(true);
        try {
            await api.post('/auth/reset-password', { email, code, motDePasse: password });
            toast.success(t('passwordUpdated'));
            navigate('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('passwordUpdateError'));
        } finally {
            setLoading(false);
        }
    };

  return <AuthFrame title={language==='fr'?'Nouveau mot de passe':'New password'} description={language==='fr'?'Choisissez un mot de passe distinct et robuste.':'Choose a strong, unique password.'} back="/login">{!email||!code?<div className="ac-form"><p role="alert" className="ac-error">{t('sessionExpiredDesc')}</p><Link className="ac-primary" to="/forgot-password">{language==='fr'?'Recommencer la récupération':'Restart recovery'}</Link></div>:<form className="ac-form" onSubmit={handleSubmit}><PasswordField label={language==='fr'?'Nouveau mot de passe':'New password'} value={password} onChange={setPassword} autoComplete="new-password"/><PasswordField label={language==='fr'?'Confirmer':'Confirm'} value={confirm} onChange={setConfirm} autoComplete="new-password"/><small>{t('passwordRequirements')}</small><button className="ac-primary" disabled={loading||!password||password!==confirm}>{loading?(language==='fr'?'Enregistrement…':'Saving…'):(language==='fr'?'Modifier le mot de passe':'Update password')}<ArrowRight size={18}/></button></form>}</AuthFrame>;
};
export default ResetPassword;
