import AuthFrame,{PasswordField,CodeField} from './AuthFrame';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, ArrowRight, RefreshCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../api/axios';
import { toast } from 'sonner';
import { useTranslation } from '../../hooks/useTranslation';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const setAuth = useAuthStore(state => state.setAuth);
    const { t, language } = useTranslation();
    const email = location.state?.email;
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            navigate('/login');
        }
    }, [email, navigate]);

    const handleChange = (index: number, value: string) => {
        value = value.replace(/[^0-9]/g, '');
        if (value.length === 6) { setCode(value.split('')); document.getElementById('code-5')?.focus(); return; }
        if (value.length > 1) value = value.slice(-1);
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if(loading||resendLoading||!email)return;
        const verificationCode = code.join('');
        if (verificationCode.length < 6) return toast.error(t('enterFullCode'));

        setLoading(true);
        try {
            const { data } = await api.post('/auth/verify-email', { email, code: verificationCode });
            // Le backend renvoie l'utilisateur vérifié + token
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
                    permissions:data.permissions,
                    twoFactorEnabled:data.twoFactorEnabled,
                } as any,
                data.token,
                data.refreshToken
            );
            toast.success(t('accountVerified'));
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('invalidCode'));
        } finally {
            setLoading(false);
        }
    };

    const [resendLoading, setResendLoading] = useState(false);

    const handleResendCode = async () => {
        if (!email||resendLoading||loading) return;
        setResendLoading(true);
        try {
            await api.post('/auth/resend-code', { email });
            toast.success(t('newCodeSent'));
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('codeResendError'));
        } finally {
            setResendLoading(false);
        }
    };

    return <AuthFrame title={language==='fr'?'Vérifiez votre email':'Verify your email'} description={email||''} back="/login"><form className="ac-form" onSubmit={handleVerify}><CodeField value={code.join('')} onChange={v=>setCode(Array.from({length:6},(_,i)=>v[i]||''))}/><button className="ac-primary" disabled={loading||resendLoading||code.join('').length!==6}>{loading?t('verifyLoading'):(language==='fr'?'Confirmer mon compte':'Confirm account')}<ArrowRight size={18}/></button><button type="button" className="ac-secondary" disabled={loading||resendLoading} onClick={handleResendCode}>{resendLoading?(language==='fr'?'Envoi…':'Sending…'):(language==='fr'?'Renvoyer le code':'Resend code')}</button></form></AuthFrame>;
};
export default VerifyEmail;
