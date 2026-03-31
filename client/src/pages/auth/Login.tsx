import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, Lock, ArrowRight, LogIn, ShieldAlert, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { toast } from 'sonner';
import Logo from '../../components/layout/Logo';

const Login = () => {
  const navigate = useNavigate();
  const { theme, setTheme, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data } = await api.post('/auth/login', { email, motDePasse: password });
      // Le backend renvoie un objet contenant les infos utilisateur + token
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
        data.token
      );
      toast.success('Bon retour sur Lumo !');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="hide-scrollbar"
      style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'url(/lumo_bg.png) no-repeat center center fixed',
        backgroundSize: 'cover',
        padding: '20px',
        overflow: 'auto',
        position: 'relative',
        backgroundColor: theme === 'dark' ? '#09090b' : '#f8fafc'
      }}>
      <style>{`
        input::placeholder { color: ${theme === 'dark' ? '#64748b' : '#94a3b8'} !important; opacity: 1 !important; }
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
          color: theme === 'dark' ? '#f8fafc' : '#0f172a',
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
      
      {/* Decorative background elements (Behind Overlay) */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 45, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{ position: 'absolute', top: '-5%', right: '10%', width: '500px', height: '500px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)', filter: 'blur(80px)', zIndex: 0 }} 
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
        className="glass" 
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
          <Logo size={80} showText={true} textColor={theme === 'dark' ? '#f8fafc' : '#0f172a'} />
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ color: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: '1.1rem', marginTop: '20px', fontWeight: 600 }}>
            Connectez-vous à votre business
          </motion.p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.95rem', fontWeight: '700', color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginLeft: '4px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#94a3b8' : '#475569' }} />
              <input 
                type="email" 
                placeholder="votre@email.com" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '16px 16px 16px 52px', 
                  borderRadius: '16px', 
                  border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)', 
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                  outline: 'none',
                  fontSize: '1rem',
                  fontWeight: '500'
                }} 
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: '700', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Mot de passe</label>
              <Link to="/forgot-password" style={{ fontSize: '0.9rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Oublié ?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#94a3b8' : '#475569' }} />
              <input 
                type="password" 
                placeholder="••••••••" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '16px 16px 16px 52px', 
                  borderRadius: '16px', 
                  border: theme === 'dark' ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(0,0,0,0.1)', 
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                  outline: 'none',
                  fontSize: '1rem'
                }} 
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
            style={{ 
              padding: '18px', 
              borderRadius: '18px', 
              background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', 
              color: 'white', 
              border: 'none', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              fontWeight: '800',
              fontSize: '1.15rem',
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 15px 30px -8px rgba(109, 40, 217, 0.5)',
            }}
          >
            {loading ? 'Connexion en cours...' : (
              <>
                Accéder au commerce <ArrowRight size={22} />
              </>
            )}
          </motion.button>
        </form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ textAlign: 'center', marginTop: '40px', color: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: '1rem' }}>
          Besoin d'un accès ? {' '}
          <Link to="/register" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: '800', borderBottom: '2px solid var(--secondary-glow)' }}>
            Commencer maintenant
          </Link>
        </motion.div>
      </motion.div>

      {/* Footer Info */}
      <div style={{ position: 'absolute', bottom: '32px', display: 'flex', gap: '24px', color: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: '0.85rem', fontWeight: '500' }}>
        <span>© 2026 Lumo Intelligence</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>&bull; Sécurisé par SSL</span>
      </div>
    </div>
  );
};

export default Login;
