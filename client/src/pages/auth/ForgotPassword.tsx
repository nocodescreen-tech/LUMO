import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const navigate = useNavigate();
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
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top left, var(--primary-glow) 0%, var(--bg-main) 60%)',
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
        <button
          style={{
            border: 'none',
            background: 'none',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
            cursor: 'pointer',
            fontWeight: 600,
          }}
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={18} /> Retour
        </button>

        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 900,
            marginBottom: 8,
            letterSpacing: '-0.04em',
            color: 'var(--text-main)',
          }}
        >
          Mot de passe oublié ?
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Entrez votre email pour recevoir un lien sécurisé de réinitialisation.
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
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
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
                type="email"
                required
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
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
            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
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
          <span>Vous vous souvenez de votre mot de passe ? </span>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Revenir à la connexion
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

