import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { toast } from 'sonner';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    const code = location.state?.code;
    
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    // Sécurité: Si on arrive ici sans passer par la vérification OTP
    if (!email || !code) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
                <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: '400px' }}>
                    <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 20px' }} />
                    <h2 style={{ marginBottom: '16px' }}>Session expirée</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Veuillez recommencer la procédure de récupération.</p>
                    <button onClick={() => navigate('/forgot-password')} style={{ width: '100%', padding: '14px', borderRadius: '14px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: '700' }}>
                        Recommencer
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) return toast.error('Le mot de passe doit faire au moins 8 caractères');
        if (password !== confirm) return toast.error('Les mots de passe ne correspondent pas');

        setLoading(true);
        try {
            await api.post('/auth/reset-password', { email, code, motDePasse: password });
            toast.success('Mot de passe mis à jour avec succès !');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top right, var(--secondary-glow) 0%, var(--bg-main) 60%)',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{
          padding: '40px 36px',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '480px',
          border: '1px solid var(--border)',
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.4)',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 900,
            marginBottom: 8,
            letterSpacing: '-0.04em',
          }}
        >
          Nouveau mot de passe
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Choisissez un mot de passe sécurisé pour votre compte.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-main)',
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
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 52px',
                  borderRadius: 16,
                  border: '1.5px solid var(--border)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '1rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-main)',
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
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 52px',
                  borderRadius: 16,
                  border: '1.5px solid var(--border)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '1rem',
                }}
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              padding: 16,
              borderRadius: 18,
              border: 'none',
              background: 'linear-gradient(135deg, var(--secondary) 0%, #059669 100%)',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.05rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Mise à jour...' : 'Enregistrer le mot de passe'}
            {!loading && <ArrowRight size={20} />}
          </motion.button>
        </form>

        <div
          style={{
            marginTop: 24,
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
          }}
        >
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Retour à la connexion
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;

