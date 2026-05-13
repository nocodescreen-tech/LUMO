import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
    Layers, 
    ArrowUpRight, 
    ArrowDownRight, 
    Search, 
    Filter, 
    RefreshCw, 
    Download,
    Package,
    Calendar,
    ChevronRight,
    Loader2,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { exportToExcel } from '../utils/exportUtils';
import { toast } from 'sonner';

const StockHistory = () => {
    const { currency } = useAuthStore();
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);

    const fetchMovements = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/products/all/history?_t=${Date.now()}`);
            const resData = response.data;
            
            let movementsList = [];
            if (resData.success && resData.data) {
                movementsList = Array.isArray(resData.data) ? resData.data : (Array.isArray(resData.data.data) ? resData.data.data : []);
            } else {
                movementsList = Array.isArray(resData) ? resData : (Array.isArray(resData.data) ? resData.data : []);
            }
            
            setMovements(movementsList);
        } catch (error) {
            toast.error("Erreur lors du chargement de l'historique");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovements();
    }, []);

    const filtered = movements.filter(m => {
        const matchesSearch = (
            m.product?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            m.raison?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
        let matchesDate = true;
        if (dateFilter) {
            const moveDate = new Date(m.createdAt).toISOString().split('T')[0];
            matchesDate = moveDate === dateFilter;
        }
        return matchesSearch && matchesType && matchesDate;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const getIcon = (type: string) => {
        if (type === 'ENTREE') return <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px', borderRadius: '12px' }}><ArrowUpRight size={20} /></div>;
        if (type === 'SORTIE') return <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '12px' }}><ArrowDownRight size={20} /></div>;
        return <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '10px', borderRadius: '12px' }}><Layers size={20} /></div>;
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="title-xl">Mouvements de <span className="text-gradient">Stock</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Traçabilité complète de vos entrées et sorties de marchandises.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button 
                        onClick={() => {
                            const rows = filtered.map(m => ({
                                "Date": new Date(m.createdAt).toLocaleString(),
                                "Produit": m.product?.nom || 'N/A',
                                "Type": m.type,
                                "Quantité": m.quantite,
                                "Ancien Stock": m.ancienStock,
                                "Nouveau Stock": m.nouveauStock,
                                "Raison": m.raison
                            }));
                            exportToExcel(rows, 'Historique_Stock');
                        }}
                        className="btn-premium"
                        style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}
                    >
                        <Download size={18} /> Exporter Excel
                    </button>
                    <button onClick={fetchMovements} className="btn-premium primary">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Actualiser
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="premium-card" style={{ padding: '16px', borderRadius: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Rechercher un produit ou une raison..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontWeight: 700 }}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-main)', padding: '4px', borderRadius: '14px', border: '1.5px solid var(--border)' }}>
                    {['ALL', 'ENTREE', 'SORTIE', 'AJUSTEMENT'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: typeFilter === t ? 'var(--primary)' : 'transparent',
                                color: typeFilter === t ? 'white' : 'var(--text-muted)',
                                fontWeight: 800,
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            {t === 'ALL' ? 'Tout' : t}
                        </button>
                    ))}
                </div>

                <div style={{ position: 'relative' }}>
                    <input 
                        type="date" 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={{ padding: '12px 16px', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 700, outline: 'none' }}
                    />
                    {dateFilter && (
                        <button onClick={() => setDateFilter('')} style={{ position: 'absolute', right: '-10px', top: '-10px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="premium-card" style={{ padding: '32px', borderRadius: '32px' }}>
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                <th style={{ padding: '0 24px' }}>Date & Produit</th>
                                <th style={{ padding: '0 24px' }}>Mouvement</th>
                                <th style={{ padding: '0 24px' }}>Ancien Stock</th>
                                <th style={{ padding: '0 24px' }}>Nouveau Stock</th>
                                <th style={{ padding: '0 24px' }}>Raison / Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '100px' }}>
                                            <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto', opacity: 0.5 }} />
                                        </td>
                                    </tr>
                                ) : currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '100px' }}>
                                            <Package size={60} style={{ margin: '0 auto 20px', opacity: 0.1 }} />
                                            <h3 style={{ fontWeight: 800, opacity: 0.5 }}>Aucun mouvement trouvé</h3>
                                        </td>
                                    </tr>
                                ) : currentItems.map((m, i) => (
                                    <motion.tr 
                                        key={m.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        style={{ background: 'var(--bg-main)', borderRadius: '16px' }}
                                    >
                                        <td style={{ padding: '20px 24px', borderRadius: '16px 0 0 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {m.product?.image ? <img src={m.product.image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} /> : <Package size={20} style={{ opacity: 0.3 }} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{m.product?.nom || 'Produit supprimé'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Calendar size={12} /> {new Date(m.createdAt).toLocaleString('fr-FR', { hour12: false })}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {getIcon(m.type)}
                                                <span style={{ 
                                                    fontWeight: 900, 
                                                    fontSize: '1.1rem',
                                                    color: m.type === 'ENTREE' ? '#10b981' : m.type === 'SORTIE' ? '#ef4444' : 'var(--primary)'
                                                }}>
                                                    {m.type === 'ENTREE' ? '+' : '-'}{m.quantite}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', fontWeight: 700, color: 'var(--text-muted)' }}>{m.ancienStock}</td>
                                        <td style={{ padding: '20px 24px', fontWeight: 900 }}>{m.nouveauStock}</td>
                                        <td style={{ padding: '20px 24px', borderRadius: '0 16px 16px 0' }}>
                                            <div style={{ 
                                                display: 'inline-flex', 
                                                padding: '6px 12px', 
                                                borderRadius: '8px', 
                                                background: 'var(--bg-card)', 
                                                border: '1px solid var(--border)',
                                                fontSize: '0.8rem',
                                                fontWeight: 800,
                                                color: 'var(--text-muted)'
                                            }}>
                                                {m.raison}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="btn-premium" style={{ opacity: currentPage === 1 ? 0.5 : 1 }}>Précédent</button>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0 16px', fontWeight: 800 }}>
                            Page {currentPage} sur {totalPages}
                        </div>
                        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="btn-premium" style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}>Suivant</button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default StockHistory;
