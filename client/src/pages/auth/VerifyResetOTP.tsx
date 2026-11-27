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
        try {
            await api.post('/auth/forgot-password', { email });
            toast.success(t('newCodeSent'));
        } catch (error: any) {
            toast.error(t('codeResendError'));
        }
    };

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
            padding: '20px',
            position: 'relative',
            backgroundColor: theme === 'dark' ? 'var(--bg-main)' : 'var(--text-main)'
          }}>
          <style>{`
            input::placeholder { color: ${theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)'} !important; opacity: 1 !important; }
          `}</style>
          
          {/* Theme Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              position: 'absolute',
              top: '32px',
              right: '32px',
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 100,
              backdropFilter: 'blur(10px)'
            }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
          
          {/* Background Blur Overlay */}
          <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              zIndex: 1
          }} />

          {/* Decorative elements */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            style={{ position: 'absolute', bottom: '5%', left: '5%', width: '450px', height: '450px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)', filter: 'blur(70px)', zIndex: 0 }} 
          />

          <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass auth-container" 
                style={{ 
                    padding: '50px 48px', 
                    borderRadius: '32px', 
                    width: '100%',
                    maxWidth: '520px',
                    textAlign: 'center',
                    boxShadow: theme === 'dark' ? '0 40px 100px -20px rgba(0, 0, 0, 0.6)' : '0 40px 100px -20px rgba(0, 0, 0, 0.15)',
                    border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.8)',
                    background: theme === 'dark' ? 'rgba(18, 18, 22, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                    zIndex: 10,
                    position: 'relative'
                }}
            >
                <button
                    style={{
                        border: 'none',
                        background: 'rgba(21, 94, 88, 0.1)',
                        color: 'var(--primary)',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 32,
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                        margin: '0 auto 32px'
                    }}
                    onClick={() => navigate('/forgot-password')}
                >
                    <ArrowLeft size={16} /> Retour
                </button>

                <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Logo size={70} showText={true} textColor={theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)'} />
                    <div style={{ 
                        width: '84px', 
                        height: '84px', 
                        background: 'rgba(21, 94, 88, 0.1)', 
                        borderRadius: '26px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'var(--primary)',
                        marginTop: '32px',
                        marginBottom: '24px'
                    }}>
                        <KeyRound size={42} />
                    </div>

                    <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.05em', color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)' }}>Code de Sécurité</h2>
                    <p style={{ color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '40px', fontWeight: 500 }}>
                        Entrez le code à 6 chiffres envoyé à <br/>
                        <strong style={{ color: 'var(--primary)', fontWeight: '800' }}>{email}</strong>
                    </p>
                </div>

                <form onSubmit={handleVerify}>
                    <div className="lumo-otp-grid" onPaste={(event)=>{const digits=event.clipboardData.getData('text').replace(/[^0-9]/g,''); if(digits.length===6){event.preventDefault();setCode(digits.split(''));document.getElementById('code-5')?.focus();}}} style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                        {code.map((digit, i) => (
                            <input
                                key={i}
                                id={`code-${i}`}
                                type="text"
                                inputMode="numeric"
                                aria-label={`${language==='fr'?'Chiffre':'Digit'} ${i+1}`}
                                autoComplete={i===0?"one-time-code":"off"}
                                maxLength={i===0?6:1}
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
                                    fontWeight: '700',
                                    borderRadius: '18px',
                                    border: theme === 'dark' ? '2.3px solid rgba(255,255,255,0.1)' : '2.3px solid rgba(0,0,0,0.1)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                    color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)',
                                    outline: 'none',
                                    transition: 'all 0.3s',
                                    borderColor: digit ? 'var(--primary)' : undefined
                                }}
                            />
                        ))}
                    </div>

                    <motion.button 
                        whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(168, 68, 32, 0.4)' }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        disabled={loading}
                        style={{ 
                            width: '100%', 
                            padding: '20px', 
                            borderRadius: '20px', 
                            background: 'linear-gradient(135deg, var(--primary) 0%, #8A3A1E 100%)', 
                            color: 'white', 
                            border: 'none', 
                            fontWeight: '700',
                            fontSize: '1.2rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            boxShadow: '0 15px 30px -5px rgba(168, 68, 32, 0.5)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {loading ? 'Vérification...' : (
                            <>Vérifier le code <ArrowRight size={24} /></>
                        )}
                    </motion.button>
                </form>

                <div style={{ marginTop: '40px' }}>
                    <button 
                        onClick={handleResend}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)', 
                            fontSize: '1rem', 
                            cursor: 'pointer', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            fontWeight: '700',
                            opacity: 0.8,
                            transition: 'all 0.2s'
                        }}
                    >
                        <RefreshCcw size={18} /> Renvoyer le code
                    </button>
                </div>
            </motion.div>

            {/* Footer Info */}
            <div style={{ position: 'absolute', bottom: '32px', display: 'flex', gap: '24px', color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500', zIndex: 5 }}>
                <span>© 2026 Lumo Intelligence</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>&bull; Protection des données active</span>
            </div>
        </div>
    );
};

export default VerifyResetOTP;

