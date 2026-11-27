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
    const { theme, setTheme } = useAuthStore();
    const { t } = useTranslation();
    const email = location.state?.email;
    const code = location.state?.code;
    
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    // Sécurité: Si on arrive ici sans passer par la vérification OTP
    if (!email || !code) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme === 'dark' ? 'var(--bg-main)' : 'var(--text-main)', padding: '20px' }}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass" 
                    style={{ 
                        padding: '50px 40px', 
                        borderRadius: '32px', 
                        textAlign: 'center', 
                        maxWidth: '450px',
                        border: theme === 'dark' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(239, 68, 68, 0.1)',
                        background: theme === 'dark' ? 'rgba(18, 18, 22, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                        boxShadow: '0 30px 60px -12px rgba(239, 68, 68, 0.15)'
                    }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', margin: '0 auto 24px' }}>
                        <ShieldAlert size={40} />
                    </div>
                    <h2 style={{ marginBottom: '12px', fontSize: '1.8rem', fontWeight: 700, color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)' }}>{t('sessionExpired')}</h2>
                    <p style={{ color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)', marginBottom: '32px', fontSize: '1.05rem', fontWeight: 500 }}>{t('sessionExpiredDesc')}</p>
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/forgot-password')} 
                        style={{ width: '100%', padding: '18px', borderRadius: '18px', background: '#ef4444', color: 'white', border: 'none', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer' }}>
                        {t('restartProcedure')}
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
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
        style={{ position: 'absolute', top: '-5%', left: '10%', width: '500px', height: '500px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)', filter: 'blur(80px)', zIndex: 0 }} 
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass auth-container"
        style={{
          padding: '50px 48px',
          borderRadius: '32px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: theme === 'dark' ? '0 40px 100px -20px rgba(0, 0, 0, 0.6)' : '0 40px 100px -20px rgba(0, 0, 0, 0.15)',
          border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.8)',
          background: theme === 'dark' ? 'rgba(18, 18, 22, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          zIndex: 10,
          position: 'relative'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Logo size={70} showText={true} textColor={theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)'} />
          <div style={{
            marginTop: '32px',
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--success)',
            marginBottom: '20px'
          }}>
            <CheckCircle2 size={36} />
          </div>
          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 700,
              marginBottom: '12px',
              letterSpacing: '-0.04em',
              color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)',
            }}
          >
            Nouveau mot de passe
          </h1>
          <p style={{ color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.5 }}>
            Choisissez un mot de passe robuste pour protéger vos données commerciales.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label htmlFor="new-password"
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)',
                marginLeft: 4,
              }}
            >
              Nouveau mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={19}
                style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)',
                }}
              />
              <input
                type="password" id="new-password" autoComplete="new-password"
                required
                value={password}
                maxLength={100}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '18px 16px 18px 52px',
                  borderRadius: 18,
                  border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)',
                  outline: 'none',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              />
            </div>
            {password && (
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { label: '8+ Caract.', met: password.length >= 8 },
                  { label: 'Maj.', met: /[A-Z]/.test(password) },
                  { label: 'Min.', met: /[a-z]/.test(password) },
                  { label: 'Chiffre', met: /\d/.test(password) },
                  { label: 'Symbole', met: /[@$!%*?&#]/.test(password) },
                ].map((req, idx) => (
                  <span key={idx} style={{ 
                    fontSize: '0.7rem', 
                    padding: '4px 8px', 
                    borderRadius: '8px', 
                    backgroundColor: req.met ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                    color: req.met ? '#10b981' : theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)',
                    border: `1px solid ${req.met ? '#10b981' : 'transparent'}`,
                    fontWeight: '700',
                    transition: 'all 0.3s'
                  }}>
                    {req.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label htmlFor="confirm-password"
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)',
                marginLeft: 4,
              }}
            >
              Confirmer le mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={19}
                style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)',
                }}
              />
              <input
                type="password" id="confirm-password" autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '18px 16px 18px 52px',
                  borderRadius: 18,
                  border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-main)',
                  outline: 'none',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02, boxShadow: '0 20px 40px -12px rgba(16, 185, 129, 0.4)' }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              padding: 20,
              borderRadius: 20,
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 15px 30px -8px rgba(16, 185, 129, 0.5)',
              marginTop: '8px'
            }}
          >
            {loading ? 'Mise à jour...' : 'Enregistrer le mot de passe'}
            {!loading && <ArrowRight size={22} />}
          </motion.button>
        </form>

        <div
          style={{
            marginTop: 40,
            textAlign: 'center',
            fontSize: '1rem',
            color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)',
            fontWeight: 500
          }}
        >
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none', borderBottom: '2px solid rgba(21, 94, 88, 0.2)' }}>
            Annuler et revenir à la connexion
          </Link>
        </div>
      </motion.div>

      {/* Footer Info */}
      <div style={{ position: 'absolute', bottom: '32px', display: 'flex', gap: '24px', color: theme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500', zIndex: 5 }}>
        <span>© 2026 Lumo Intelligence</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>&bull; Sécurisé par Lumo Guard</span>
      </div>
    </div>
  );
};

export default ResetPassword;


