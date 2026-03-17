import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Store, 
  Stethoscope, 
  UtensilsCrossed, 
  Briefcase,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Lock,
  Phone,
  Camera,
  Coins,
  Sparkles,
  MapPin,
  Target,
  ShieldCheck
} from 'lucide-react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import Logo from '../../components/layout/Logo';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    typeActivite: '',
    nom: '',
    email: '',
    motDePasse: '',
    telephone: '',
    entrepriseNom: '',
    devise: 'FC',
    ville: ''
  });

  const activityTypes = [
    { id: 'Boutique', label: 'Magasin / Boutique', icon: Store, color: '#6d28d9', desc: 'Gestion de stocks et ventes' },
    { id: 'Pharmacie', label: 'Pharmacie', icon: Stethoscope, color: '#10b981', desc: 'Produits médicaux et ordonnances' },
    { id: 'Restaurant', label: 'Restaurant / Café', icon: UtensilsCrossed, color: '#f59e0b', desc: 'Menu et service en salle' },
    { id: 'Services', label: 'Services Pro', icon: Briefcase, color: '#ef4444', desc: 'Prestations et facturation' },
  ];

  const updateForm = (fields: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
    if (error) setError(null);
  };

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Explicit validation before sending
    if (!formData.nom) {
        setError("Le nom complet du propriétaire est obligatoire.");
        toast.error("Le nom du propriétaire manque (Étape 2)");
        setStep(2);
        setLoading(false);
        return;
    }

    if (!formData.entrepriseNom) {
        setError("Le nom de votre commerce est obligatoire.");
        setLoading(false);
        return;
    }
    
    // Use FormData for multipart upload
    const data = new FormData();
    data.append('nom', formData.nom);
    data.append('email', formData.email);
    data.append('motDePasse', formData.motDePasse);
    data.append('telephone', formData.telephone);
    data.append('typeActivite', formData.typeActivite);
    data.append('entrepriseNom', formData.entrepriseNom);
    data.append('devise', formData.devise);
    data.append('ville', formData.ville);
    
    if (avatarFile) {
      data.append('avatar', avatarFile);
    }

    try {
      const { data: responseData } = await api.post('/auth/register', data);
      
      if (responseData.role === 'superadmin') {
        toast.success('Bienvenue, SuperAdmin ! Prêt à transformer le commerce.');
        if (responseData.token) {
          useAuthStore.getState().setAuth(
            {
              id: responseData.id,
              nom: responseData.nom,
              email: responseData.email,
              role: responseData.role,
              avatar: responseData.avatar,
              preferences: responseData.preferences,
            } as any, 
            responseData.token
          );
          navigate('/');
        }
      } else {
        toast.success('Compte créé ! Veuillez vérifier votre email.');
        navigate('/verify-email', { state: { email: formData.email } });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Erreur lors de l'inscription";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const StepIndicator = () => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ 
          width: i === step ? '48px' : '12px', 
          height: '10px', 
          borderRadius: '20px', 
          backgroundColor: i <= step ? 'var(--primary)' : 'var(--border)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          boxShadow: i === step ? '0 4px 10px rgba(109, 40, 217, 0.3)' : 'none'
        }} />
      ))}
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at top right, var(--primary-glow) 0%, var(--bg-main) 60%), radial-gradient(circle at bottom left, var(--secondary-glow) 0%, var(--bg-main) 60%)',
      padding: '80px 20px',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background blobs */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.05, 0.03] }}
        transition={{ duration: 10, repeat: Infinity }}
        style={{ position: 'absolute', top: '-10%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'var(--primary)', filter: 'blur(120px)' }} 
      />
      <motion.div 
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.03, 0.05, 0.03] }}
        transition={{ duration: 12, repeat: Infinity }}
        style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'var(--secondary)', filter: 'blur(100px)' }} 
      />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass" 
        style={{ 
          padding: '60px 48px', 
          borderRadius: '36px', 
          width: '100%',
          maxWidth: '580px',
          border: '1px solid var(--border)',
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.4)',
          zIndex: 10
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Logo size={60} />
          <h2 style={{ fontSize: '2.6rem', fontWeight: '900', marginBottom: '12px', letterSpacing: '-0.05em', lineHeight: 1.1, marginTop: '24px', color: 'var(--text-main)' }}>
            Propulsez votre <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Commerce</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Une configuration rapide pour une gestion sans limite.</p>
        </div>

        <StepIndicator />

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid var(--danger)', 
                color: 'var(--danger)', 
                padding: '16px', 
                borderRadius: '16px', 
                marginBottom: '24px',
                fontSize: '0.9rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
                <div style={{ backgroundColor: 'var(--danger)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0 }}>!</div>
                {error}
            </motion.div>
          )}

          {/* STEP 1: ACTIVITY TYPE */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "circOut" }}
            >
              <h3 style={{ marginBottom: '28px', textAlign: 'center', fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>Quel est votre domaine ?</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
                {activityTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.typeActivite === type.id;
                  return (
                    <motion.div 
                      whileHover={{ scale: 1.03, y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      key={type.id}
                      onClick={() => updateForm({ typeActivite: type.id })}
                      style={{ 
                        padding: '24px 20px',
                        borderRadius: '24px',
                        border: `2px solid ${isSelected ? type.color : 'var(--border)'}`,
                        backgroundColor: isSelected ? `${type.color}10` : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '14px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        textAlign: 'center',
                        boxShadow: isSelected ? `0 15px 30px -10px ${type.color}60` : 'none'
                      }}
                    >
                      <div style={{ 
                          width: '56px', height: '56px', borderRadius: '18px', 
                          backgroundColor: isSelected ? type.color : 'rgba(100, 116, 139, 0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isSelected ? 'white' : 'var(--text-muted)',
                          transition: 'all 0.3s'
                      }}>
                        <Icon size={28} />
                      </div>
                      <div>
                        <p style={{ fontWeight: '800', fontSize: '0.95rem', color: isSelected ? 'var(--text-main)' : 'var(--text-muted)', margin: '0 0 4px 0' }}>{type.label}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.6 }}>{type.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={!formData.typeActivite}
                onClick={nextStep}
                style={{ 
                  width: '100%', 
                  padding: '18px', 
                  borderRadius: '18px', 
                  background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', 
                  color: 'white', 
                  border: 'none', 
                  fontWeight: '900', 
                  fontSize: '1.2rem',
                  marginTop: '40px',
                  cursor: formData.typeActivite ? 'pointer' : 'not-allowed',
                  opacity: formData.typeActivite ? 1 : 0.4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: formData.typeActivite ? '0 15px 35px -8px rgba(109, 40, 217, 0.5)' : 'none'
                }}
              >
                Suivant <ArrowRight size={22} />
              </motion.button>
            </motion.div>
          )}

          {/* STEP 2: PERSONAL INFO */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <h3 style={{ marginBottom: '8px', textAlign: 'center', fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>Identité du Propriétaire</h3>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '8px' }}>Ces informations sont nécessaires pour sécuriser votre accès.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginLeft: '4px' }}>Nom Complet</label>
                    <div style={{ position: 'relative' }}>
                        <User size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Ex: Jean Mukendi" 
                            value={formData.nom}
                            onChange={(e) => updateForm({ nom: e.target.value })}
                            style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} 
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginLeft: '4px' }}>Email Professionnel</label>
                    <div style={{ position: 'relative' }}>
                        <Mail size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="email" 
                            placeholder="jean@commerce.com" 
                            value={formData.email}
                            onChange={(e) => updateForm({ email: e.target.value })}
                            style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} 
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginLeft: '4px' }}>Téléphone</label>
                    <div style={{ position: 'relative' }}>
                        <Phone size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="tel" 
                            placeholder="+243 ..." 
                            value={formData.telephone}
                            onChange={(e) => updateForm({ telephone: e.target.value })}
                            style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} 
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginLeft: '4px' }}>Mot de Passe</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="password" 
                            placeholder="Min. 8 caractères" 
                            value={formData.motDePasse}
                            onChange={(e) => updateForm({ motDePasse: e.target.value })}
                            style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} 
                        />
                    </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                <button 
                  onClick={prevStep}
                  style={{ flex: 1, padding: '18px', borderRadius: '18px', border: '1.5px solid var(--border)', background: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: '700' }}
                >
                  <ArrowLeft size={20} /> Retour
                </button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!formData.nom || !formData.email || !formData.motDePasse}
                  onClick={nextStep}
                  style={{ 
                      flex: 1.5, padding: '18px', borderRadius: '18px', background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', 
                      color: 'white', border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', gap: '10px', boxShadow: '0 15px 35px -8px rgba(109, 40, 217, 0.4)' 
                  }}
                >
                  Suivant <ArrowRight size={20} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: ENTERPRISE INFO */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "circOut" }}
            >
              <h3 style={{ marginBottom: '8px', textAlign: 'center', fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>Détails du Commerce</h3>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '32px' }}>Finalisez le profil de votre enseigne.</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                  />
                  <motion.div 
                    whileHover={{ scale: 1.05, borderColor: 'var(--primary)' }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                      width: '120px', height: '120px', borderRadius: '32px', border: '2px dashed var(--border)', 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: '10px', color: 'var(--text-muted)', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.02)',
                      transition: 'all 0.3s',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <>
                          <Camera size={28} />
                          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)' }}>PHOTO PROFIL</span>
                        </>
                      )}
                  </motion.div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginLeft: '4px' }}>Nom de l'Enseigne</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Ex: L'Élégance de Kinshasa" 
                      value={formData.entrepriseNom}
                      onChange={(e) => updateForm({ entrepriseNom: e.target.value })}
                      style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '18px', border: '1.5px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none', fontSize: '1rem', fontWeight: '600' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginLeft: '4px' }}>Devise</label>
                        <div style={{ position: 'relative' }}>
                            <Coins size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select 
                                value={formData.devise}
                                onChange={(e) => updateForm({ devise: e.target.value })}
                                style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '18px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', appearance: 'none', outline: 'none', fontWeight: '700', cursor: 'pointer' }}
                            >
                                <option value="FC">Francs CFA (FC)</option>
                                <option value="USD">Dollars (USD)</option>
                                <option value="EUR">Euros (EUR)</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginLeft: '4px' }}>Ville</label>
                        <div style={{ position: 'relative' }}>
                            <MapPin size={19} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Kinshasa" 
                                value={formData.ville}
                                onChange={(e) => updateForm({ ville: e.target.value })}
                                style={{ width: '100%', padding: '16px 16px 16px 52px', borderRadius: '18px', border: '1.5px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none', fontSize: '1rem', fontWeight: '600' }} 
                            />
                        </div>
                    </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRegister}
                disabled={loading || !formData.entrepriseNom}
                style={{ 
                  width: '100%', padding: '20px', borderRadius: '20px', 
                  background: 'linear-gradient(135deg, var(--secondary) 0%, #059669 100%)', 
                  color: 'white', border: 'none', fontWeight: '900', fontSize: '1.3rem',
                  marginTop: '48px', cursor: (loading || !formData.entrepriseNom) ? 'not-allowed' : 'pointer', 
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '12px', boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.5)',
                  opacity: (loading || !formData.entrepriseNom) ? 0.6 : 1
                }}
              >
                {loading ? 'Création en cours...' : (<>Finaliser mon Compte <CheckCircle2 size={26} /></>)}
              </motion.button>
              
              <button 
                onClick={prevStep}
                style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', marginTop: '24px', cursor: 'pointer', fontSize: '1rem', fontWeight: '700', opacity: 0.8 }}
              >
                Retour à l'étape précédente
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ textAlign: 'center', marginTop: '48px', borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '500' }}>
            Déjà partenaire Lumo ? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '900', textDecoration: 'none', borderBottom: '2px solid var(--primary-glow)' }}>Se connecter ici</Link>
          </p>
        </div>
      </motion.div>

      {/* Trust Footer */}
      <div style={{ position: 'absolute', bottom: '24px', display: 'flex', gap: '32px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', opacity: 0.7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Target size={14} /> Précision Absolue</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={14} /> Sécurité Bancaire</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={14} /> Intelligence Artificielle</div>
      </div>
    </div>
  );
};

export default Register;
