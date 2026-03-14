import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Shield, 
  Bell, 
  Globe, 
  CreditCard,
  Trash2,
  Camera,
  Check,
  ChevronRight,
  Database,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';

const Settings = () => {
    const { theme, toggleTheme, language, setLanguage, currency, setCurrency, modules, toggleModule } = useSettingsStore();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'modules' | 'appearance' | 'security'>('profile');

    const tabs = [
        { id: 'profile', label: 'Profil', icon: User },
        { id: 'modules', label: 'Modules', icon: Database },
        { id: 'appearance', label: 'Apparence', icon: Sun },
        { id: 'security', label: 'Sécurité', icon: Shield },
    ];

    const handleReset = () => {
        if (window.confirm("Êtes-vous sûr de vouloir remettre à zéro toutes vos données ? Cette action est irréversible.")) {
            toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
                loading: 'Réinitialisation en cours...',
                success: 'Données remises à zéro avec succès',
                error: 'Erreur lors de la réinitialisation'
            });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="title-xl">Configuration <span className="text-gradient">Système</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Gérez vos préférences et paramètres globaux.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px' }}>
                {/* Tabs Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className="glass btn-hover"
                            style={{ 
                                padding: '16px 24px', 
                                border: 'none',
                                borderRadius: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'var(--bg-card)',
                                color: activeTab === tab.id ? 'white' : 'var(--text-main)',
                                fontWeight: 800,
                                cursor: 'pointer',
                                textAlign: 'left'
                            }}
                        >
                            <tab.icon size={20} />
                            {tab.label}
                        </button>
                    ))}
                    <div style={{ marginTop: '24px', padding: '24px', borderRadius: '24px', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px dashed var(--danger)' }}>
                        <h4 style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Trash2 size={16} /> Danger Zone
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Supprimer définitivement toutes les données du serveur.</p>
                        <button 
                            onClick={handleReset}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', fontWeight: 800, cursor: 'pointer' }}
                        >
                            Remise à zéro
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="glass" style={{ padding: '40px', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {activeTab === 'profile' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 950, marginBottom: '24px' }}>Mon Profil</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '40px' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: '120px', height: '120px', borderRadius: '40px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 900, color: 'white' }}>
                                        {user?.nom?.[0] || 'R'}
                                    </div>
                                    <button className="glass" style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '40px', height: '40px', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', cursor: 'pointer' }}>
                                        <Camera size={20} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 950 }}>{user?.nom || 'René Huber'}</div>
                                    <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{user?.email || 'rene@hubcommerce.pro'}</div>
                                    <span style={{ padding: '4px 12px', borderRadius: '8px', backgroundColor: 'var(--primary)', color: 'white', fontSize: '0.75rem', fontWeight: 800, width: 'fit-content' }}>
                                        SUPER ADMIN
                                    </span>
                                </div>
                            </div>
                            
                            <div className="glass" style={{ padding: '32px', borderRadius: '24px', backgroundColor: 'var(--sidebar-active)', marginTop: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div>
                                        <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Sauvegarde & Export</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Téléchargez une copie complète de vos données (JSON).</p>
                                    </div>
                                    <button 
                                        onClick={() => toast.success("Sauvegarde générée avec succès")}
                                        className="btn-premium btn-primary"
                                    >
                                        <Database size={18} /> Lancer le Backup
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)' }}>NOM COMPLET</label>
                                    <input type="text" className="glass" defaultValue={user?.nom} style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)' }}>TÉLÉPHONE</label>
                                    <input type="text" className="glass" placeholder="+243..." style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none' }} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'modules' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 950 }}>Activation des Modules</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Personnalisez l'interface en activant ou désactivant les fonctionnalités avancées.</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    { id: 'fournisseurs', name: 'Gestion Fournisseurs', desc: 'Gestion des stocks, achats et relations fournisseurs.', icon: Truck },
                                    { id: 'dettes', name: 'Suivi des Dettes', desc: 'Gestion des crédits clients et règlements différés.', icon: CreditCard }
                                ].map((mod) => (
                                    <div key={mod.id} className="glass" style={{ padding: '24px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ width: '56px', height: '56px', borderRadius: '18px', backgroundColor: 'var(--sidebar-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                <mod.icon size={24} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{mod.name}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{mod.desc}</div>
                                            </div>
                                        </div>
                                        <div 
                                            onClick={() => toggleModule(mod.id as any)}
                                            style={{ 
                                                width: '60px', 
                                                height: '32px', 
                                                borderRadius: '32px', 
                                                backgroundColor: (modules as any)[mod.id] ? 'var(--primary)' : 'var(--text-muted)', 
                                                position: 'relative',
                                                cursor: 'pointer',
                                                transition: 'var(--transition)'
                                            }}
                                        >
                                            <div style={{ 
                                                position: 'absolute', 
                                                top: '4px', 
                                                left: (modules as any)[mod.id] ? '32px' : '4px',
                                                width: '24px', 
                                                height: '24px', 
                                                borderRadius: '50%', 
                                                backgroundColor: 'white',
                                                transition: 'var(--transition)'
                                            }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'appearance' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 950, marginBottom: '24px' }}>Thème Visuel</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    {[
                                        { id: 'light', name: 'Clair', icon: Sun },
                                        { id: 'dark', name: 'Sombre', icon: Moon },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => theme !== t.id && toggleTheme()}
                                            className="glass btn-hover"
                                            style={{ 
                                                padding: '24px', 
                                                borderRadius: '24px', 
                                                border: theme === t.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '12px',
                                                backgroundColor: 'transparent',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <t.icon size={24} color={theme === t.id ? 'var(--primary)' : 'var(--text-muted)'} />
                                            <span style={{ fontWeight: 800, color: theme === t.id ? 'var(--text-main)' : 'var(--text-muted)' }}>{t.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Devise Globale</h3>
                                    <div style={{ display: 'flex', gap: '8px', padding: '6px', backgroundColor: 'var(--sidebar-active)', borderRadius: '16px' }}>
                                        {['USD', 'CDF'].map((curr) => (
                                            <button
                                                key={curr}
                                                onClick={() => setCurrency(curr as any)}
                                                style={{ 
                                                    flex: 1, 
                                                    padding: '12px', 
                                                    borderRadius: '12px', 
                                                    border: 'none',
                                                    backgroundColor: currency === curr ? 'var(--bg-card)' : 'transparent',
                                                    color: currency === curr ? 'var(--primary)' : 'var(--text-muted)',
                                                    fontWeight: 800,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {curr}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Langue</h3>
                                    <div style={{ display: 'flex', gap: '8px', padding: '6px', backgroundColor: 'var(--sidebar-active)', borderRadius: '16px' }}>
                                        {['fr', 'en'].map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => setLanguage(lang as any)}
                                                style={{ 
                                                    flex: 1, 
                                                    padding: '12px', 
                                                    borderRadius: '12px', 
                                                    border: 'none',
                                                    backgroundColor: language === lang ? 'var(--bg-card)' : 'transparent',
                                                    color: language === lang ? 'var(--primary)' : 'var(--text-muted)',
                                                    fontWeight: 800,
                                                    cursor: 'pointer',
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                {lang}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
