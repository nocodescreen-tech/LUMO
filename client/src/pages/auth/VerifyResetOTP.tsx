import AuthFrame,{PasswordField,CodeField} from './AuthFrame';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, ArrowRight, RefreshCcw, Sun, Moon, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';
import Logo from '../../components/layout/Logo';
import { useTranslation } from '../../hooks/useTranslation';

const VerifyResetOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, setTheme } = useAuthStore();
    const { t, language } = useTranslation();
    const email = location.state?.email;
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading,setResendLoading]=useState(false);

    useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
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
            // Adding a clear timeout-aware request
            const response = await api.post('/auth/verify-reset-code', { email, code: verificationCode });
            toast.success(t('codeVerified'));
            navigate('/reset-password', { state: { email, code: verificationCode } });
        } catch (error: any) {
            console.error('OTP Verification Error:', error);
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                toast.error(t('serverTimeout'));
            } else if (!error.response) {
                toast.error(t('networkError'));
            } else {
                toast.error(error.response?.data?.message || t('invalidOrExpiredCode'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if(!email||loading||resendLoading)return;setResendLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            toast.success(t('newCodeSent'));
        } catch (error: any) {
            toast.error(t('codeResendError'));
        }finally{setResendLoading(false)}
    };

    return <AuthFrame title={language==='fr'?'Code de récupération':'Recovery code'} description={email||''} back="/forgot-password"><form className="ac-form" onSubmit={handleVerify}><CodeField value={code.join('')} onChange={v=>setCode(Array.from({length:6},(_,i)=>v[i]||''))}/><button className="ac-primary" disabled={loading||resendLoading||code.join('').length!==6}>{loading?t('verifyLoading'):(language==='fr'?'Vérifier le code':'Verify code')}<ArrowRight size={18}/></button><button type="button" className="ac-secondary" disabled={loading||resendLoading} onClick={handleResend}>{resendLoading?(language==='fr'?'Envoi…':'Sending…'):(language==='fr'?'Renvoyer le code':'Resend code')}</button></form></AuthFrame>;
};
export default VerifyResetOTP;
