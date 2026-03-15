import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    Activity,
    Clock,
    User,
    Shield,
    Package,
    ShoppingCart,
    ArrowUpRight,
    Trash2,
    Edit,
    PlusCircle,
    Search,
    Filter,
    RefreshCw,
    AlertTriangle,
    FileText,
    CreditCard,
    Building2,
    Calendar,
    Layers,
    ChevronRight,
    Database,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useTranslation } from '../hooks';

const Activities = () => {
    const { t } = useTranslation();
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('ALL');

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/activites');
            setActivities(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const getIcon = (type: string) => {
        const style = { size: 20 };
        switch (type) {
            case 'VENTE': return <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', ...iconBox }}><ShoppingCart {...style} /></div>;
            case 'CREATION_PRODUIT': return <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.2)', ...iconBox }}><PlusCircle {...style} /></div>;
            case 'MODIF_PRODUIT': return <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', ...iconBox }}><Edit {...style} /></div>;
            case 'SUPPRESSION_PRODUIT': return <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', ...iconBox }}><Trash2 {...style} /></div>;
            case 'DETTE': return <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', ...iconBox }}><AlertTriangle {...style} /></div>;
            case 'DETTE_REGLEMENT': return <div style={{ background: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6', border: '1px solid rgba(20, 184, 166, 0.2)', ...iconBox }}><CreditCard {...style} /></div>;
            case 'IMPORT_EXCEL': return <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.2)', ...iconBox }}><FileText {...style} /></div>;
            default: return <div style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)', ...iconBox }}><Activity {...style} /></div>;
        }
    };

    const iconBox = {
        width: '52px',
        height: '52px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
    };

    const filtered = activities.filter(a =>
        (a.description.toLowerCase().includes(searchTerm.toLowerCase()) || a.module?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filter === 'ALL' || a.type.includes(filter))
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '900', fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                        <Database size={14} /> Audit & Traçabilité
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0 }}>Journal d'<span className="text-gradient">Activités</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Historique complet des actions effectuées sur votre instance HubCommerce.</p>
                </div>
                <button
                    onClick={fetchActivities}
                    className="glass btn-hover"
                    style={{ padding: '16px 32px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontWeight: '950', cursor: 'pointer', background: 'var(--bg-card)', fontSize: '1rem' }}
                >
                    <RefreshCw size={22} className={loading ? 'animate-spin' : ''} /> Actualiser les logs
                </button>
            </div>

            {/* Controls */}
            <div className="premium-card" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Filtrer par module, action ou mot-clé..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '16px 16px 16px 60px', borderRadius: '18px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', fontWeight: '700' }}
                    />
                </div>
                <div className="premium-card" style={{ padding: '6px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', gap: '6px', background: 'var(--bg-main)' }}>
                    {['ALL', 'VENTE', 'PRODUIT', 'DETTE'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: filter === f ? 'var(--primary)' : 'transparent',
                                color: filter === f ? 'white' : 'var(--text-muted)',
                                fontSize: '0.85rem',
                                fontWeight: '950',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: filter === f ? '0 8px 16px -4px var(--primary-glow)' : 'none'
                            }}
                        >
                            {f === 'ALL' ? 'Toutes' : f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="premium-card" style={{ padding: '48px', borderRadius: '44px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '120px' }}>
                        <Loader2 size={60} className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)', opacity: 0.5 }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '120px' }}>
                        <Database size={100} style={{ margin: '0 auto 32px', opacity: 0.1, color: 'var(--text-muted)' }} />
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '950' }}>Aucun enregistrement</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '600' }}>Aucun log ne correspond à vos critères de filtrage actuels.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {filtered.map((a, index) => (
                            <motion.div
                                key={a.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                style={{
                                    display: 'flex',
                                    gap: '28px',
                                    padding: '32px 0',
                                    borderBottom: index === filtered.length - 1 ? 'none' : '1px solid var(--border)',
                                    alignItems: 'center'
                                }}
                            >
                                {getIcon(a.type)}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <p style={{ fontWeight: '900', fontSize: '1.15rem', margin: 0, color: 'white' }}>{a.description}</p>
                                            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.7rem', fontWeight: '950', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {a.module || 'Système'}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                                            <Clock size={16} color="var(--primary)" /> {new Date(a.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                            <User size={14} color="var(--text-muted)" />
                                        </div>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700' }}>{a.userNom || 'Utilisateur Système'}</span>
                                        <ChevronRight size={14} style={{ opacity: 0.2 }} />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.5, fontWeight: '600' }}>ID Action: #{a.id}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Activities;
