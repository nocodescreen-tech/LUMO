import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, ArrowRight, RefreshCcw, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

const VerifyResetOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
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
            await api.post('/auth/verify-reset-code', { email, code: verificationCode });
            toast.success('Code vérifié ! Vous pouvez maintenant changer votre mot de passe.');
            navigate('/reset-password', { state: { email, code: verificationCode } });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Code invalide ou expiré');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await api.post('/auth/forgot-password', { email });
            toast.success('Un nouveau code vous a été envoyé.');
        } catch (error: any) {
            toast.error('Erreur lors de l’envoi du code');
        }
    };

    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'radial-gradient(circle at top left, var(--primary-glow) 0%, var(--bg-main) 60%)',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
        }}>
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
                    background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)', 
                    borderRadius: '26px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white',
                    margin: '0 auto 32px',
                    boxShadow: '0 15px 35px var(--primary-glow)',
                    position: 'relative'
                }}>
                    <KeyRound size={42} />
                </div>

                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '12px', letterSpacing: '-0.05em' }}>Code de Sécurité</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '40px' }}>
                    Entrez le code envoyé à <br/>
                    <strong style={{ color: 'var(--text-main)', fontWeight: '800' }}>{email}</strong>
                </p>

                <form onSubmit={handleVerify}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '40px' }}>
                        {code.map((digit, i) => (
                            <input
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
                                    transition: 'all 0.3s',
                                    borderColor: digit ? 'var(--primary)' : 'var(--border)'
                                }}
                            />
                        ))}
                    </div>

                    <motion.button 
                        whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -10px var(--primary-glow)' }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        disabled={loading}
                        style={{ 
                            width: '100%', 
                            padding: '18px', 
                            borderRadius: '18px', 
                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', 
                            color: 'white', 
                            border: 'none', 
                            fontWeight: '900',
                            fontSize: '1.2rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            boxShadow: '0 15px 30px -5px var(--primary-glow)',
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
                            color: 'var(--text-muted)', 
                            fontSize: '1rem', 
                            cursor: 'pointer', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            fontWeight: '700',
                            opacity: 0.8
                        }}
                    >
                        <RefreshCcw size={18} /> Renvoyer le code
                    </button>
                </div>
            </motion.div>

            <div style={{ position: 'absolute', bottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
                <Sparkles size={16} /> Protection des données Lumo active
            </div>
        </div>
    );
};

export default VerifyResetOTP;
