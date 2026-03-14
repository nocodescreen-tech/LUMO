import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck, 
  Smartphone,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import api from '../api/axios';

const Login = () => {
    const [step, setStep] = useState<'credentials' | 'otp' | 'pending'>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [authMethod, setAuthMethod] = useState<'otp' | 'admin'>('otp');
    const { login } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const handleInitialLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Simulation ou appel API réel pour initier
            if (authMethod === 'otp') {
                // await api.post('/auth/request-otp', { email, password });
                setStep('otp');
                toast.success("Code OTP envoyé sur votre mail");
            } else {
                // await api.post('/auth/request-admin-validation', { email, password });
                setStep('pending');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // const { data } = await api.post('/auth/verify-otp', { email, otp });
            // login(data.token, data.user);
            // Simu pour démo instantanée
            setTimeout(() => {
                login('fake-token', { id: 1, nom: 'René', email: email, role: 'Admin' });
                toast.success("Bienvenue !");
            }, 1000);
        } catch (error) {
            toast.error("Code invalide");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', position: 'relative', overflow: 'hidden' }}>
            {/* Background Decorations */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', borderRadius: '50%', background: 'var(--primary)', opacity: 0.1, filter: 'blur(100px)' }}></div>
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', borderRadius: '50%', background: 'var(--secondary)', opacity: 0.1, filter: 'blur(100px)' }}></div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass"
                style={{ 
                    width: '100%', 
                    maxWidth: '450px', 
                    padding: '48px', 
                    borderRadius: '40px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '32px',
                    zIndex: 10
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '20px', 
                        background: 'var(--grad-primary)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        color: 'white'
                    }}>
                        <ShieldCheck size={32} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 950, marginBottom: '8px' }}>Lumo<span className="text-gradient">Commerce</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Espace de gestion sécurisé</p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'credentials' && (
                        <motion.form 
                            key="creds"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleInitialLogin}
                            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                        >
                            <div style={{ display: 'flex', gap: '8px', padding: '6px', backgroundColor: 'var(--sidebar-active)', borderRadius: '16px' }}>
                                <button 
                                    type="button"
                                    onClick={() => setAuthMethod('otp')}
                                    style={{ 
                                        flex: 1, 
                                        padding: '10px', 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        backgroundColor: authMethod === 'otp' ? 'var(--bg-card)' : 'transparent',
                                        color: authMethod === 'otp' ? 'var(--primary)' : 'var(--text-muted)',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        transition: 'var(--transition)'
                                    }}
                                >
                                    OTP Mail
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setAuthMethod('admin')}
                                    style={{ 
                                        flex: 1, 
                                        padding: '10px', 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        backgroundColor: authMethod === 'admin' ? 'var(--bg-card)' : 'transparent',
                                        color: authMethod === 'admin' ? 'var(--primary)' : 'var(--text-muted)',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        transition: 'var(--transition)'
                                    }}
                                >
                                    Validation Admin
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input 
                                        type="email" 
                                        placeholder="Votre email" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none' }}
                                    />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input 
                                        type="password" 
                                        placeholder="Mot de passe" 
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <button className="btn-premium btn-primary" style={{ height: '56px', justifyContent: 'center' }} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : <>Se connecter <ArrowRight size={20} /></>}
                            </button>

                            <button type="button" style={{ border: 'none', background: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                                Mot de passe oublié ?
                            </button>
                        </motion.form>
                    )}

                    {step === 'otp' && (
                        <motion.form 
                            key="otp"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={verifyOtp}
                            style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}
                        >
                            <button onClick={() => setStep('credentials')} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ChevronLeft size={16} /> Retour
                            </button>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>Vérification OTP</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Entrez le code envoyé à {email}</p>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Smartphone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="text" 
                                    placeholder="Code à 6 chiffres" 
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none', textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 900 }}
                                />
                            </div>
                            <button className="btn-premium btn-primary" style={{ height: '56px', justifyContent: 'center' }}>
                                Vérifier le code <UserCheck size={20} />
                            </button>
                        </motion.form>
                    )}

                    {step === 'pending' && (
                        <motion.div 
                            key="pending"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' }}
                        >
                             <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--warning)', opacity: 0.1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                <Loader2 className="animate-spin" size={32} color="var(--warning)" />
                             </div>
                             <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>En attente de validation</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Un administrateur doit valider votre connexion. Vous recevrez une notification par mail.</p>
                             </div>
                             <button onClick={() => setStep('credentials')} className="btn-premium glass" style={{ justifyContent: 'center' }}>
                                Annuler la demande
                             </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default Login;
