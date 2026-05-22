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
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Code de récupération envoyé !');
      navigate('/verify-reset-otp', { state: { email } });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Email non trouvé ou erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="hide-scrollbar"
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px',
        position: 'relative',
        backgroundColor: theme === 'dark' ? '#09090b' : '#f8fafc',
        overflow: 'hidden'
      }}>
      
      {/* Mesh Gradient Background */}
      <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 0,
          opacity: theme === 'dark' ? 0.6 : 1
      }}>
          <div style={{
              position: 'absolute',
              top: '-10%', left: '-10%',
              width: '60%', height: '60%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
              filter: 'blur(80px)',
              animation: 'float 20s infinite alternate'
          }} />
          <div style={{
              position: 'absolute',
              bottom: '-10%', right: '-10%',
              width: '60%', height: '60%',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
              filter: 'blur(80px)',
              animation: 'float 25s infinite alternate-reverse'
          }} />
      </div>

      <style>{`
        @keyframes float {
            from { transform: translate(0, 0); }
            to { transform: translate(100px, 100px); }
        }
        input::placeholder { color: ${theme === 'dark' ? '#64748b' : '#94a3b8'} !important; opacity: 1 !important; }
      `}</style>
      
      {/* Theme Toggle */}
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
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100,
          boxShadow: 'var(--shadow-md)'
        }}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </motion.button>

      {/* Language Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
        style={{
          position: 'absolute',
          top: '32px',
          right: '98px',
          padding: '0 12px',
          height: '50px',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100,
          fontWeight: '800',
          fontSize: '0.85rem',
          gap: '8px'
        }}
      >
        <Globe size={18} />
        {language === 'fr' ? 'FR' : 'EN'}
      </motion.button>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '60px 48px',
          borderRadius: '32px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: 'var(--shadow-premium)',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          zIndex: 10,
          position: 'relative',
          textAlign: 'center'
        }}
      >
        <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Logo size={80} showText={true} />
          
          <div style={{
            marginTop: '40px',
            width: '72px',
            height: '72px',
            borderRadius: '24px',
            background: 'var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            marginBottom: '20px',
            border: '1.5px solid rgba(99, 102, 241, 0.2)'
          }}>
            <KeyRound size={36} />
          </div>
          
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.05em', color: 'var(--text-main)' }}>
            {t.forgotTitle}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.5, maxWidth: '320px' }}>
            {t.forgotSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginLeft: 4 }}>
              {t.forgotEmail}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={20}
                style={{
                  position: 'absolute',
                  left: 18,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--primary)',
                }}
              />
              <input
                type="email"
                required
                placeholder={t.phEmailForgot}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '20px 16px 20px 56px',
                  borderRadius: 20,
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: 'var(--shadow-sm)'
                }}
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="btn-premium primary"
            style={{ padding: '20px', borderRadius: '20px', fontSize: '1.1rem' }}
          >
            {loading ? t.forgotLoading : t.forgotSubmit}
            {!loading && <ArrowRight size={22} />}
          </motion.button>
        </form>

        <div style={{ marginTop: 40, paddingTop: 30, borderTop: '1px solid var(--border)' }}>
          <Link to="/login" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              color: 'var(--primary)', 
              fontWeight: 800, 
              textDecoration: 'none',
              fontSize: '1rem'
          }}>
            <ArrowLeft size={18} /> {t.forgotBack}
          </Link>
        </div>
      </motion.div>

      <div style={{ position: 'fixed', bottom: '20px', left: 0, right: 0, textAlign: 'center', zIndex: 10 }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em' }}>
        © 2026 LUMO &bull; SÉCURITÉ RENFORCÉE
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

