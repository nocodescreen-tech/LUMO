import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, Lock, ArrowRight, LogIn, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { toast } from 'sonner';
import Logo from '../../components/layout/Logo';

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
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
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at top left, var(--primary-glow) 0%, var(--bg-main) 60%)',
      padding: '20px',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Decorative background elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', opacity: 0.05, filter: 'blur(100px)' }} 
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          rotate: [0, -90, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '350px', height: '350px', borderRadius: '50%', background: 'var(--secondary)', opacity: 0.05, filter: 'blur(80px)' }} 
      />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass" 
        style={{ 
          padding: '60px 50px', 
          borderRadius: '32px', 
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border)',
          zIndex: 10
        }}
      >
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Logo size={80} showText={true} />
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '24px' }}>
            Prêt à transformer votre gestion ?
          </motion.p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', marginLeft: '4px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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
                  border: '1.5px solid var(--border)', 
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-main)',
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
              <label style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>Mot de passe</label>
              <Link to="/forgot-password" style={{ fontSize: '0.9rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Oublié ?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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
                  border: '1.5px solid var(--border)', 
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-main)',
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
          style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)', fontSize: '1rem' }}>
          Besoin d'un accès ? {' '}
          <Link to="/register" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: '800', borderBottom: '2px solid var(--secondary-glow)' }}>
            Commencer maintenant
          </Link>
        </motion.div>
      </motion.div>

      {/* Footer Info */}
      <div style={{ position: 'absolute', bottom: '32px', display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
        <span>© 2026 Lumo Intelligence</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>&bull; Sécurisé par SSL</span>
      </div>
    </div>
  );
};

export default Login;
