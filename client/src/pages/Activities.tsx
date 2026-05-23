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
    Loader2,
    Download,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useTranslation } from '../hooks';
import { exportToExcel } from '../utils/exportUtils';

const Activities = () => {
    const { t } = useTranslation();
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/activites?page=${currentPage}&limit=${itemsPerPage}&type=${filter === 'ALL' ? '' : filter}&searchTerm=${searchTerm}&_t=${Date.now()}`);
            const resData = response.data;
            
            let activityList = [];
            let total = 0;
            let pages = 1;
            
            if (resData.success && resData.data) {
                const dataObj = resData.data;
                activityList = Array.isArray(dataObj.activities) ? dataObj.activities : (Array.isArray(dataObj) ? dataObj : []);
                total = dataObj.total || 0;
                pages = dataObj.pages || 1;
            } else {
                activityList = Array.isArray(resData.activities) ? resData.activities : (Array.isArray(resData) ? resData : []);
                total = resData.total || 0;
                pages = resData.pages || 1;
            }
            
            setActivities(activityList);
            setTotalItems(total);
            setTotalPages(pages);
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [currentPage, filter]);

    // Search debounce or immediate? Let's use useEffect with a timeout for search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage !== 1) setCurrentPage(1);
            else fetchActivities();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, dateFilter]);

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

    const filtered = activities.filter(a => {
        const matchesSearch = (a.description.toLowerCase().includes(searchTerm.toLowerCase()) || a.module?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filter === 'ALL' || a.type.includes(filter);
        let matchesDate = true;
        if (dateFilter) {
            const actDate = new Date(a.createdAt).toISOString().split('T')[0];
            matchesDate = actDate === dateFilter;
        }
        return matchesSearch && matchesType && matchesDate;
    });

    const currentItems = activities;
    // const totalPages is now handled by state

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filter, dateFilter]);

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
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Historique complet des actions effectuées sur votre instance LUMO.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                        onClick={() => {
                            const rows = filtered.map(a => ({
                                "Description": a.description,
                                "Type": a.type,
                                "Module": a.module || 'Système',
                                "Utilisateur": a.userNom || 'Système',
                                "Date": new Date(a.createdAt).toLocaleString()
                            }));
                            exportToExcel(rows, 'Activites_Report');
                        }}
                        className="btn-hover"
                        style={{ padding: '16px 32px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontWeight: '950', cursor: 'pointer', background: 'var(--bg-card)', fontSize: '1rem' }}
                    >
                        <Download size={22} /> Rapport
                    </button>
                    <button
                        onClick={fetchActivities}
                        className="btn-hover primary-glow"
                        style={{ padding: '16px 32px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontWeight: '950', cursor: 'pointer', background: 'var(--bg-card)', fontSize: '1rem' }}
                    >
                        <RefreshCw size={22} className={loading ? 'animate-spin' : ''} /> Actualiser
                    </button>
                </div>
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
                <div className="premium-card" style={{ padding: '6px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', gap: '6px', background: 'var(--bg-main)', overflowX: 'auto' }}>
                    {['ALL', 'VENTE', 'PRODUIT', 'DETTE', 'CONNEXION'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: filter === f ? 'var(--primary)' : 'transparent',
                                color: filter === f ? 'white' : 'var(--text-muted)',
                                fontSize: '0.85rem',
                                fontWeight: '950',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                whiteSpace: 'nowrap',
                                boxShadow: filter === f ? '0 8px 16px -4px var(--primary-glow)' : 'none'
                            }}
                        >
                            {f === 'ALL' ? 'Toutes' : f}
                        </button>
                    ))}
                    <div style={{ width: '1px', background: 'var(--border)', margin: '0 8px' }}></div>
                    <input 
                        type="date" 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            fontSize: '0.85rem',
                            fontWeight: '800',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    />
                    {dateFilter && (
                        <button onClick={() => setDateFilter('')} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '900', fontSize: '0.8rem', padding: '0 10px' }}>
                            <X size={16} />
                        </button>
                    )}
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
                        {currentItems.map((a, index) => (
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
                                            <p style={{ fontWeight: '1000', fontSize: '1.2rem', margin: 0, color: '#0f172a' }}>{a.description}</p>
                                            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.7rem', fontWeight: '950', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {a.module || 'Système'}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.95rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '950' }}>
                                            <Clock size={16} color="#6366f1" /> {new Date(a.createdAt).toLocaleString('fr-FR', { hour12: false })}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                            <User size={14} color="var(--text-muted)" />
                                        </div>
                                        <span style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: '900' }}>{a.userNom || 'Utilisateur Système'}</span>
                                        <ChevronRight size={14} style={{ opacity: 0.2 }} />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.5, fontWeight: '600' }}>ID Action: #{a.id}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
                                <button 
                                    onClick={() => setCurrentPage(currentPage - 1)} 
                                    disabled={currentPage === 1}
                                    style={{ padding: '12px 24px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontWeight: 700 }}
                                >
                                    Précédent
                                </button>
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    if (totalPages > 7 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                                        if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>...</span>;
                                        return null;
                                    }
                                    return (
                                        <button 
                                            key={pageNum} 
                                            onClick={() => setCurrentPage(pageNum)}
                                            style={{ 
                                                width: '48px', height: '48px',
                                                borderRadius: '14px', 
                                                background: currentPage === pageNum ? 'var(--primary)' : 'var(--bg-card)', 
                                                color: currentPage === pageNum ? 'white' : 'var(--text-main)',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                border: currentPage === pageNum ? 'none' : '1px solid var(--border)'
                                            }}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button 
                                    onClick={() => setCurrentPage(currentPage + 1)} 
                                    disabled={currentPage === totalPages}
                                    style={{ padding: '12px 24px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, fontWeight: 700 }}
                                >
                                    Suivant
                                </button>
                            </div>
                        )}
                        
                         <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                              Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} événements
                         </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Activities;

