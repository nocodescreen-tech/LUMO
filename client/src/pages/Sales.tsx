import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  Eye, 
  Clock,
  Printer,
  ChevronRight,
  Loader2,
  Package,
  Zap,
  ArrowUpRight,
  BarChart2,
  TrendingUp,
  DollarSign,
  PieChart,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';
import { toast } from 'sonner';
import { generateInvoice } from '../utils/printHelpers';
import Modal from '../components/common/Modal';
import { exportToExcel } from '../utils/exportUtils';

interface Sale {
    id: number;
    userId: number;
    clientId: number | null;
    articles: any[];
    montantTotal: number;
    remise: number;
    methodePaiement: string;
    clientInfo: {
        nom: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

const Sales = () => {
    const navigate = useNavigate();
    const { currency, user } = useAuthStore();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const [filterMethod, setFilterMethod] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [actionMenuId, setActionMenuId] = useState<number | null>(null);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const { data } = await api.get('/sales');
            setSales(data);
        } catch (error) {
            toast.error("Impossible de charger l'historique");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (sale: any) => {
        toast("Génération de la facture...");
        generateInvoice(sale, user);
    };

    const deleteSale = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible.")) return;
        try {
            await api.delete(`/sales/${id}`);
            toast.success("Transaction supprimée");
            fetchSales();
        } catch (error) {
            toast.error("Échec de la suppression");
        }
    };

    const handleExportExcel = () => {
        if (sales.length === 0) return toast.error("Aucune donnée à exporter");
        
        const rows = filteredSales.map(s => ({
            "ID": s.id,
            "Client": s.clientInfo?.nom || 'Client de passage',
            "Date": new Date(s.createdAt).toLocaleDateString(),
            "Méthode Paiement": s.methodePaiement,
            "Nb Articles": s.articles?.length || 0,
            "Montant Total": s.montantTotal,
            "Remise": s.remise || 0
        }));

        exportToExcel(rows, 'Ventes_Report');
        toast.success("Exportation Excel réussie");
    };

    const filteredSales = sales.filter(s => {
        const matchesSearch = s.id?.toString().includes(searchTerm) || 
                             s.clientInfo?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = filterDate ? s.createdAt.startsWith(filterDate) : true;
        const matchesMethod = filterMethod ? s.methodePaiement === filterMethod : true;
        
        return matchesSearch && matchesDate && matchesMethod;
    });

    // Report Calculations
    const reportStats = {
        totalRevenue: filteredSales.reduce((acc, s) => acc + s.montantTotal, 0),
        count: filteredSales.length,
        averageValue: filteredSales.length > 0 ? filteredSales.reduce((acc, s) => acc + s.montantTotal, 0) / filteredSales.length : 0,
        methodSplit: filteredSales.reduce((acc: any, s) => {
            acc[s.methodePaiement] = (acc[s.methodePaiement] || 0) + s.montantTotal;
            return acc;
        }, {})
    };

    if (loading) return (
        <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Loader2 size={40} color="var(--primary)" />
            </motion.div>
            <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Chargement des transactions...</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
            <div className="responsive-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <h1 className="title-xl">Flux des <span className="text-gradient">Ventes</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>Suivi analytique de toutes vos transactions commerciales.</p>
                </motion.div>
                <div className="responsive-flex" style={{ display: 'flex', gap: '14px' }}>
                    <button onClick={() => setShowReportModal(true)} className="btn-premium secondary"><BarChart2 size={18} /> Rapports Financiers</button>
                    <button onClick={handleExportCSV} className="btn-premium secondary"><Download size={18} /> Exporter CSV</button>
                    <button onClick={() => navigate('/pos')} className="btn-premium primary"><Zap size={18} /> Nouvelle Vente</button>
                </div>
            </div>

            <div className="premium-card" style={{ padding: '32px', borderRadius: '32px' }}>
                <div className="responsive-flex" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.6 }} />
                        <input 
                          type="text" 
                          placeholder="Rechercher par référence ou client..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ width: '100%', padding: '18px 20px 18px 60px', borderRadius: '20px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontWeight: '600', fontSize: '0.95rem' }} 
                        />
                    </div>
                     <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            style={{ 
                                padding: '14px 24px', 
                                borderRadius: '16px', 
                                background: showFilters ? 'var(--primary-glow)' : 'var(--bg-main)', 
                                border: `1.5px solid ${showFilters ? 'var(--primary)' : 'var(--border)'}`, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px', 
                                fontWeight: 800, 
                                cursor: 'pointer', 
                                color: showFilters ? 'var(--primary)' : 'var(--text-main)',
                                transition: 'all 0.3s'
                            }}
                        >
                           <Filter size={18} /> {showFilters ? 'Masquer Filtres' : 'Filtre Avancé'}
                        </button>
                     </div>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="responsive-flex"
                            style={{ overflow: 'hidden', paddingBottom: '32px', display: 'flex', gap: '20px', borderBottom: '1.5px solid var(--border)', marginBottom: '32px' }}
                        >
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>DATE DE TRANSACTION</label>
                                <input 
                                    type="date" 
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 700 }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>MÉTHODE DE PAIEMENT</label>
                                <select 
                                    value={filterMethod}
                                    onChange={(e) => setFilterMethod(e.target.value)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 700 }}
                                >
                                    <option value="">Toutes les méthodes</option>
                                    <option value="Espèces">Espèces</option>
                                    <option value="Carte">Carte</option>
                                    <option value="Mobile Money">Mobile Money</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button 
                                    onClick={() => { setFilterDate(''); setFilterMethod(''); }}
                                    style={{ padding: '14px 24px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    Réinitialiser
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="table-responsive">
                    <table style={{ minWidth: '800px', width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left' }}>
                                <th style={{ padding: '0 24px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Référence / Client</th>
                                <th style={{ padding: '0 24px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Date & Méthode</th>
                                <th style={{ padding: '0 24px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Statut</th>
                                <th style={{ padding: '0 24px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, textAlign: 'right' }}>Montant Total</th>
                                <th style={{ padding: '0 24px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filteredSales.map((sale, i) => (
                                    <motion.tr 
                                        key={sale.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ backgroundColor: 'var(--sidebar-active)', scale: 1.002 }}
                                        style={{ border: '1px solid var(--border)', cursor: 'default' }}
                                    >
                                        <td style={{ padding: '24px', borderRadius: '24px 0 0 24px' }}>
                                            <div style={{ fontWeight: 950, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                #{sale.id?.toString().slice(-6).toUpperCase()}
                                                <ArrowUpRight size={14} style={{ opacity: 0.4 }} />
                                            </div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>{sale.clientInfo?.nom || 'Client de passage'}</div>
                                        </td>
                                        <td style={{ padding: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                                <Clock size={16} color="var(--primary)" /> {new Date(sale.createdAt).toLocaleDateString()} · {new Date(sale.createdAt).toLocaleTimeString()}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>{sale.methodePaiement}</div>
                                        </td>
                                        <td style={{ padding: '24px' }}>
                                            <span style={{ 
                                                padding: '8px 16px', 
                                                borderRadius: '12px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 900, 
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                                color: '#10b981',
                                                border: '1px solid rgba(16, 185, 129, 0.2)'
                                            }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                                                VALIDÉE
                                            </span>
                                        </td>
                                        <td style={{ padding: '24px', textAlign: 'right' }}>
                                            <div style={{ fontWeight: 950, fontSize: '1.3rem', color: 'var(--text-main)' }}>{(sale.montantTotal || sale.articles?.reduce((acc: number, art: any) => acc + ((art.quantite || 1) * (art.prixUnitaire || 0)), 0))?.toLocaleString()} {currency}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '2px' }}>{sale.articles?.length || 0} articles</div>
                                        </td>
                                        <td style={{ padding: '24px', borderRadius: '0 24px 24px 0' }}>
                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', position: 'relative' }}>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === sale.id ? null : sale.id); }}
                                                    className="glass"
                                                    style={{ width: '46px', height: '46px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer', border: '1px solid var(--border)' }}
                                                >
                                                    <MoreVertical size={20} />
                                                </button>

                                                <AnimatePresence>
                                                    {actionMenuId === sale.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            style={{ position: 'absolute', right: 0, top: '55px', zIndex: 50, background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '16px', padding: '8px', boxShadow: 'var(--shadow-lg)', minWidth: '180px' }}
                                                        >
                                                            <button 
                                                                onClick={() => { setShowDetailsModal(true); setSelectedSale(sale); setActionMenuId(null); }}
                                                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 700, borderRadius: '10px' }}
                                                                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-main)'}
                                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                <Eye size={16} color="var(--primary)" /> Détails complets
                                                            </button>
                                                            <button 
                                                                onClick={() => { handlePrint(sale); setActionMenuId(null); }}
                                                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 700, borderRadius: '10px' }}
                                                                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-main)'}
                                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                <Printer size={16} color="var(--primary)" /> Imprimer Facture
                                                            </button>
                                                            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }}></div>
                                                            <button 
                                                                onClick={() => { deleteSale(sale.id); setActionMenuId(null); }}
                                                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontWeight: 700, borderRadius: '10px' }}
                                                                onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                <Trash2 size={16} /> Supprimer Vente
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                    {!filteredSales.length && !loading && (
                        <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
                            <Package size={80} style={{ margin: '0 auto 24px' }} />
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Aucune transaction trouvée</h3>
                            <p style={{ fontWeight: 600 }}>Ajustez vos filtres ou lancez une recherche différente.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sale Details Modal */}
            <Modal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                title={`Vente #${selectedSale?.id?.toString().slice(-6).toUpperCase()}`}
                subtitle="Détails complets de la transaction commerciale."
                icon={ShoppingBag}
                maxWidth="700px"
            >
                {selectedSale && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', background: 'var(--bg-main)', borderRadius: '20px' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Client</p>
                                <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedSale.clientInfo?.nom || 'Client de passage'}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Méthode</p>
                                <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedSale.methodePaiement}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</p>
                                <p style={{ fontWeight: 800 }}>{new Date(selectedSale.createdAt).toLocaleString()}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</p>
                                <p style={{ fontWeight: 950, fontSize: '1.4rem', color: 'var(--primary)' }}>{(selectedSale.montantTotal || selectedSale.articles?.reduce((acc: number, art: any) => acc + ((art.quantite || 1) * (art.prixUnitaire || 0)), 0))?.toLocaleString()} {currency}</p>
                            </div>
                        </div>

                        <div>
                            <h4 style={{ marginBottom: '16px' }}>Articles ({selectedSale.articles?.length || 0})</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {selectedSale.articles?.map((art: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderRadius: '14px', border: '1.5px solid var(--border)' }}>
                                        <div>
                                            <p style={{ fontWeight: 800, color: 'var(--text-main)' }}>{art.nom}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{art.quantite} x {art.prixUnitaire?.toLocaleString()} {currency}</p>
                                        </div>
                                        <p style={{ fontWeight: 900 }}>{(art.quantite * art.prixUnitaire)?.toLocaleString()} {currency}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                            <button 
                                onClick={() => handlePrint(selectedSale)}
                                className="btn-premium primary" 
                                style={{ flex: 1 }}
                            >
                                <Printer size={18} /> Imprimer Reçu
                            </button>
                            <button 
                                onClick={() => setShowDetailsModal(false)}
                                className="btn-premium secondary"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Financial Report Modal */}
            <Modal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                title="Bilan Financier Réel"
                subtitle="Analyse basée sur les transactions filtrées actuellement."
                icon={PieChart}
                maxWidth="600px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                       <div className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--primary-glow)', background: 'var(--primary-glow)' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                             <TrendingUp size={20} />
                          </div>
                          <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Chiffre d'Affaires</p>
                          <h3 style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--primary)' }}>{reportStats.totalRevenue.toLocaleString()} {currency}</h3>
                       </div>
                       <div className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid var(--border)' }}>
                             <ShoppingBag size={20} />
                          </div>
                          <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Transactions</p>
                          <h3 style={{ fontSize: '1.8rem', fontWeight: 950 }}>{reportStats.count}</h3>
                       </div>
                    </div>

                    <div className="premium-card" style={{ padding: '24px' }}>
                        <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><DollarSign size={18} /> Répartition par Mode de Paiement</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {Object.entries(reportStats.methodSplit).map(([method, amount]: [string, any]) => (
                                <div key={method}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 800 }}>
                                        <span>{method}</span>
                                        <span>{amount.toLocaleString()} {currency}</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--bg-main)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(amount / reportStats.totalRevenue) * 100}%` }}
                                            style={{ height: '100%', background: 'var(--primary)', borderRadius: '10px' }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {Object.keys(reportStats.methodSplit).length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Aucune donnée disponible</p>
                            )}
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-main)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
                        <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Moyenne par panier: <span style={{ color: 'var(--text-main)' }}>{reportStats.averageValue.toLocaleString()} {currency}</span></p>
                    </div>

                    <button className="btn-premium primary" style={{ width: '100%' }} onClick={() => setShowReportModal(false)}>
                        Fermer le Rapport
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Sales;
