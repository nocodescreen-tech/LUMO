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

  return (
    <div 
      className="hide-scrollbar lumo-auth"
      style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--bg-main)',
        backgroundSize: 'cover',
        padding: '20px',
        overflow: 'auto',
        position: 'relative',
        backgroundColor: theme === 'dark' ? 'var(--bg-main)' : 'var(--text-main)'
      }}>
      <style>{`
        input::placeholder { color: ${theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)'} !important; opacity: 1 !important; }
        
        @media (max-width: 600px) {
          .auth-container { padding: 32px 24px !important; border-radius: 24px !important; }
          .auth-top-bar { 
            position: fixed !important; top: 0; left: 0; right: 0; 
            padding: 16px 20px; display: flex; justify-content: space-between; 
            z-index: 100; backdrop-filter: blur(10px);
            background: ${theme === 'dark' ? 'rgba(9,9,11,0.5)' : 'rgba(255,255,255,0.5)'};
          }
          .auth-top-btn { position: static !important; width: 44px !important; height: 44px !important; }
          .auth-back-btn { position: static !important; height: 44px !important; padding: 0 12px !important; }
        }
      `}</style>

      {/* Responsive Top Bar */}
      <div className="auth-top-bar" style={{ position: 'absolute', top: '32px', left: '32px', right: '32px', display: 'flex', justifyContent: 'space-between', zIndex: 100 }}>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="auth-back-btn"
          style={{
            padding: '0 20px', height: '50px', borderRadius: '16px',
            background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            backdropFilter: 'blur(10px)', fontWeight: '800', fontSize: '0.85rem', gap: '10px'
          }}
        >
          <ArrowLeft size={18} />
          <span className="hide-mobile">{language === 'fr' ? 'Retour' : 'Back'}</span>
        </motion.button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            className="auth-top-btn"
            style={{
              padding: '0 12px', height: '50px', borderRadius: '16px',
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              backdropFilter: 'blur(10px)', fontWeight: '800', fontSize: '0.85rem', gap: '8px'
            }}
          >
            <Globe size={18} />
            {language === 'fr' ? 'FR' : 'EN'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="auth-top-btn"
            style={{
              width: '50px', height: '50px', borderRadius: '16px',
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
        </div>
      </div>

      
      {/* Decorative background elements (Behind Overlay) */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 45, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{ position: 'absolute', top: '-5%', right: '10%', width: '500px', height: '500px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(21, 94, 88, 0.1) 0%, rgba(168, 68, 32, 0.05) 100%)', filter: 'blur(80px)', zIndex: 0 }} 
      />
      <motion.div 
        animate={{ 
          scale: [1.1, 1, 1.1],
          rotate: [0, -45, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ position: 'absolute', bottom: '5%', left: '5%', width: '450px', height: '450px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)', filter: 'blur(70px)', zIndex: 0 }} 
      />

      {/* Background Blur Overlay */}
      <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(12px)',
          zIndex: 1
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-container" 
        style={{ 
          padding: '50px 48px', 
          borderRadius: '32px', 
          width: '100%',
          maxWidth: '480px',
          boxShadow: theme === 'dark' ? '0 40px 100px -20px rgba(0, 0, 0, 0.6)' : '0 40px 100px -20px rgba(0, 0, 0, 0.15)',
          border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.8)',
          background: theme === 'dark' ? 'rgba(18, 18, 22, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          zIndex: 10,
          position: 'relative'
        }}
      >
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Logo size={80} showText={true} textColor={theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)'} />
          </Link>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)', fontSize: '1.1rem', marginTop: '20px', fontWeight: 600 }}>
            {step === '2fa' ? t.login2faTitle : t.loginTitle}
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'credentials' ? (
            <motion.form key="credentials" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label htmlFor="login-email" style={{ fontSize: '0.95rem', fontWeight: '700', color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)', marginLeft: '4px' }}>{t.loginEmail}</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)' }} />
                  <input 
                    type="email" id="login-email" autoComplete="username" 
                    placeholder={t.phEmail} 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.03)', color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)', outline: 'none', fontSize: '1rem', fontWeight: '500' }} 
                  />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <label htmlFor="login-password" style={{ fontSize: '0.95rem', fontWeight: '700', color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)' }}>{t.loginPassword}</label>
                  <Link to="/forgot-password" style={{ fontSize: '0.9rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>{t.loginForgot}</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)' }} />
                  <input 
                    type="password" id="login-password" autoComplete="current-password" 
                    placeholder="••••••••" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.03)', color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)', outline: 'none', fontSize: '1rem' }} 
                  />
                </div>
              </motion.div>

              <motion.button 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={loading}
                style={{ padding: '18px', borderRadius: '18px', background: '#155e58', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '1.15rem', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: 'var(--shadow-sm)' }}
              >
                {loading ? t.loginLoading : (<>{t.loginSubmit} <ArrowRight size={22} /></>)}
              </motion.button>
            </motion.form>
          ) : (
            <motion.form key="2fa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handle2FAVerify} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(21,94,88,0.08)', borderRadius: '20px', border: '1px solid rgba(21,94,88,0.2)' }}>
                <Shield size={40} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontWeight: 700, color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)', fontSize: '1rem' }}>{t.login2faSubtitle}</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)', fontWeight: 600 }}>{t.login2faValid}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: '700', color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)', marginLeft: '4px' }}>{t.login2faCode}</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                  <input
                    type="text"
                    inputMode="numeric" autoComplete="one-time-code" aria-label={language==="fr"?"Code de vérification":"Verification code"}
                    maxLength={6}
                    placeholder="• • • • • •"
                    required
                    autoFocus
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', padding: '20px 16px 20px 52px', borderRadius: '16px', border: '1.5px solid var(--primary)', backgroundColor: 'rgba(21,94,88,0.05)', color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)', outline: 'none', fontSize: '2rem', fontWeight: '700', letterSpacing: '0.4em', textAlign: 'center', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || twoFACode.length !== 6}
                style={{ padding: '18px', borderRadius: '18px', background: '#155e58', color: 'white', border: 'none', cursor: (loading || twoFACode.length !== 6) ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: 'var(--shadow-sm)', opacity: twoFACode.length !== 6 ? 0.6 : 1 }}
              >
                {loading ? t.verifyLoading : (<><Shield size={22} /> {t.login2faSubmit}</>)}
              </motion.button>

              <button type="button" onClick={() => { setStep('credentials'); setTwoFACode(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textAlign: 'center', fontSize: '0.9rem' }}>
                {t.login2faBack}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ textAlign: 'center', marginTop: '40px', color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)', fontSize: '1rem' }}>
          {t.loginNoAccount} {' '}
          <Link to="/register" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: '800', borderBottom: '2px solid var(--secondary-glow)' }}>
            {t.loginStart}
          </Link>
        </motion.div>
      </motion.div>

      {/* Footer Info */}
      <div style={{ position: 'absolute', bottom: '32px', display: 'flex', gap: '24px', color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
        <span>© 2026 Lumo Intelligence</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>&bull; Sécurisé par SSL</span>
      </div>
    </div>
  );
};

export default Login;
