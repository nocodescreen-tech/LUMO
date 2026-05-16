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
    const { t } = useTranslation();
    const email = location.state?.email;
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            navigate('/login');
        }
    }, [email, navigate]);

    const handleChange = (index: number, value: string) => {
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
        const verificationCode = code.join('');
        if (verificationCode.length < 6) return toast.error('Veuillez entrer le code complet');

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
                } as any,
                data.token,
                data.refreshToken
            );
            toast.success('Compte vérifié ! Bienvenue sur Lumo.');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Code invalide');
        } finally {
            setLoading(false);
        }
    };

    const [resendLoading, setResendLoading] = useState(false);

    const handleResendCode = async () => {
        if (!email) return;
        setResendLoading(true);
        try {
            await api.post('/auth/resend-code', { email });
            toast.success('Un nouveau code a été envoyé à votre adresse email.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors du renvoi du code');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'radial-gradient(circle at top left, var(--secondary-glow) 0%, var(--bg-main) 60%)',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background elements */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '450px', height: '450px', borderRadius: '50%', background: 'var(--secondary)', opacity: 0.04, filter: 'blur(100px)' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--primary)', opacity: 0.04, filter: 'blur(100px)' }} />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass" 
                style={{ 
                    padding: '60px 40px', 
                    borderRadius: '32px', 
                    width: '100%',
                    maxWidth: '520px',
                    textAlign: 'center',
                    border: '1px solid var(--border)',
                    boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.4)',
                    zIndex: 10
                }}
            >
                <div style={{ 
                    width: '84px', 
                    height: '84px', 
                    background: 'linear-gradient(135deg, var(--secondary) 0%, #059669 100%)', 
                    borderRadius: '26px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white',
                    margin: '0 auto 32px',
                    boxShadow: '0 15px 35px rgba(16, 185, 129, 0.3)',
                    position: 'relative'
                }}>
                    <ShieldCheck size={42} />
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '26px', border: '4px solid var(--secondary)', top: 0, left: 0 }} 
                    />
                </div>

                <h2 style={{ fontSize: '2.8rem', fontWeight: '900', marginBottom: '12px', letterSpacing: '-0.05em' }}>{t.verifyTitle}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '40px' }}>
                    {t.verifySubtitle} <br/>
                    <strong style={{ color: 'var(--text-main)', fontWeight: '800' }}>{email}</strong>
                </p>

                <form onSubmit={handleVerify}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '40px' }}>
                        {code.map((digit, i) => (
                            <motion.input
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 * i }}
                                key={i}
                                id={`code-${i}`}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e: any) => {
                                    if (e.key === 'Backspace' && !digit && i > 0) {
                                        document.getElementById(`code-${i - 1}`)?.focus();
                                    }
                                }}
                                style={{
                                    width: '54px',
                                    height: '74px',
                                    textAlign: 'center',
                                    fontSize: '2rem',
                                    fontWeight: '900',
                                    borderRadius: '18px',
                                    border: '2px solid var(--border)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                    color: 'var(--text-main)',
                                    outline: 'none',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: digit ? '0 10px 20px -5px var(--secondary-glow)' : 'none',
                                    borderColor: digit ? 'var(--secondary)' : 'var(--border)'
                                }}
                            />
                        ))}
                    </div>

                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        disabled={loading}
                        style={{ 
                            width: '100%', 
                            padding: '18px', 
                            borderRadius: '18px', 
                            background: 'linear-gradient(135deg, var(--secondary) 0%, #059669 100%)', 
                            color: 'white', 
                            border: 'none', 
                            fontWeight: '900',
                            fontSize: '1.2rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.4)'
                        }}
                    >
                        {loading ? t.verifyLoading : (
                            <>{t.verifySubmit} <ArrowRight size={24} /></>
                        )}
                    </motion.button>
                </form>

                <div style={{ marginTop: '40px' }}>
                    <button 
                        onClick={handleResendCode}
                        disabled={resendLoading}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--text-muted)', 
                            fontSize: '1rem', 
                            cursor: resendLoading ? 'not-allowed' : 'pointer', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            fontWeight: '700',
                            opacity: resendLoading ? 0.5 : 0.8
                        }}>
                        <RefreshCcw size={18} className={resendLoading ? "spin" : ""} /> 
                        {resendLoading ? "Envoi en cours..." : t.verifyResend}
                    </button>
                </div>
            </motion.div>

            {/* Support indication */}
            <div style={{ position: 'absolute', bottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
                <Sparkles size={16} /> Système de vérification intelligent activé
            </div>
        </div>
    );
};

export default VerifyEmail;
