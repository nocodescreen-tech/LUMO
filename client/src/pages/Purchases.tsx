import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Search, 
  Plus, 
  Truck, 
  Calendar, 
  ArrowRight,
  Filter,
  MoreHorizontal,
  Download,
  X,
  Loader2,
  FileText,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { normalizeAmount } from '../utils/currencyHelpers';
import { getDisplayAmount } from '../utils/currencyHelpers';
import api from '../api/axios';
import { toast } from 'sonner';
import { exportToExcel } from '../utils/exportUtils';
import { useTranslation } from '../hooks/useTranslation';

const Purchases = () => {
    const { t } = useTranslation();
    const { currency } = useAuthStore();
    const [purchases, setPurchases] = useState<any[]>([]);
    const [fournisseurs, setFournisseurs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const [formData, setFormData] = useState({
        fournisseurId: null,
        fournisseurNom: '',
        numeroFacture: '',
        description: '',
        montantTotal: '',
        statut: 'En attente',
        devise: 'USD'
    });
    const [exchangeRate, setExchangeRate] = useState<number>(2800); // 1 USD = 2800 CDF
    const [showFournisseurSuggestions, setShowFournisseurSuggestions] = useState(false);


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [purRes, fourRes, prodRes] = await Promise.all([
                api.get(`/purchases?_t=${Date.now()}`),
                api.get(`/fournisseurs?_t=${Date.now()}`).catch(() => ({ data: { data: [] } })),
                api.get(`/products?_t=${Date.now()}`).catch(() => ({ data: { data: [] } }))
            ]);
            
            const processData = (res: any) => {
                const resData = res.data;
                
                // Structure standard: { success, data: { data: [] } }
                if (resData.success && resData.data) {
                    if (Array.isArray(resData.data.data)) return resData.data.data;
                    if (Array.isArray(resData.data)) return resData.data;
                }

                // Fallback for older/direct structures
                const data = resData;
                if (Array.isArray(data)) return data;
                if (data && Array.isArray(data.data)) return data.data;
                if (data && Array.isArray(data.purchases)) return data.purchases;
                if (data && Array.isArray(data.fournisseurs)) return data.fournisseurs;
                if (data && Array.isArray(data.products)) return data.products;
                return [];
            };

            setPurchases(processData(purRes));
            setFournisseurs(processData(fourRes));
            setAllProducts(processData(prodRes));
        } catch (error) {
            toast.error(t('dataLoadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // BUG3 Fix: Validate that at least one article is added before submitting
        if (items.length === 0) {
            toast.error(t('purchaseAddItemRequired'));
            setSubmitting(false);
            return;
        }
        
        setSubmitting(true);
        try {
            let finalFournisseurId = formData.fournisseurId;

            // If a name is typed but no ID is selected, try to find a match or create if needed
            // For now, let's check if there's an exact match in the existing list
            if (!finalFournisseurId && formData.fournisseurNom) {
                const match = fournisseurs.find(f => f.nom?.toLowerCase() === formData.fournisseurNom.toLowerCase());
                if (match) {
                    finalFournisseurId = match.id;
                } else {
                    // Create new supplier if it doesn't exist
                    const newFour = await api.post('/fournisseurs', { 
                        nom: formData.fournisseurNom,
                        entreprise: formData.fournisseurNom, // default same
                        categorie: 'Importé via Achat'
                    });
                    finalFournisseurId = newFour.data.data.id;
                }
            }

            await api.post('/purchases', {
                ...formData,
                fournisseurId: finalFournisseurId ? Number(finalFournisseurId) : null,
                montantTotal: Number(formData.montantTotal),
                articles: items.map(item => ({
                    id: item.id,
                    nom: item.nom,
                    quantite: item.quantite,
                    prixAchat: item.prixAchat
                }))
            });
            toast.success(t('purchaseRecorded'));
            setShowModal(false);
            fetchData();
            setFormData({
                fournisseurId: null,
                fournisseurNom: '',
                numeroFacture: '',
                description: '',
                montantTotal: '',
                statut: 'En attente',
                devise: 'USD'
            });
            setItems([]);
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('purchaseSaveError'));
        } finally {
            setSubmitting(false);
        }
    };

    const filteredPurchases = purchases.filter(p => 
        p.numeroFacture?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('reçu') || s.includes('payé')) return { bg: 'rgba(15, 157, 106, 0.1)', color: 'var(--success)' };
        if (s.includes('attente') || s.includes('cours')) return { bg: 'rgba(192, 126, 18, 0.1)', color: 'var(--warning)' };
        return { bg: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-muted)' };
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPurchases.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

    const handleDeletePurchase = async (id: number, facture: string) => {
        if (!confirm(`Supprimer l'achat ${facture || '#' + id} ?`)) return;
        try {
            await api.delete(`/purchases/${id}`);
            toast.success('Achat supprimé');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erreur suppression');
        }
    };

    if (loading) return (
        <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={40} color="var(--primary)" />
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="title-xl">{t('purchasesMgmtPrefix')} <span className="text-gradient">{t('purchases')}</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('purchasesSubtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button 
                    onClick={() => {
                        const rows = filteredPurchases.map(p => ({
                            "Facture": p.numeroFacture || `Achat #${p.id}`,
                            "Fournisseur": fournisseurs.find(f => f.id === p.fournisseurId)?.nom || 'Fournisseur Inconnu',
                            "Description": p.description,
                            "Date": new Date(p.createdAt).toLocaleDateString(),
                            "Statut": p.statut,
                            "Montant": p.montantTotal
                        }));
                        exportToExcel(rows, 'Achats_Report');
                    }} 
                    className="btn-hover"
                    style={{ padding: '14px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer' }}
                  >
                      <Download size={18} /> {t('report')}
                  </button>
                  <button 
                    onClick={() => setShowModal(true)} 
                    className="btn-premium primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', borderRadius: '16px', fontWeight: 800 }}
                  >
                      <Plus size={18} /> {t('registerPurchase')}
                  </button>
                </div>
            </div>

            <div className="premium-card glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div style={{ position: 'relative', width: '400px', maxWidth: '100%' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                          type="text" 
                          placeholder={t('searchPurchase')} 
                          value={searchTerm}
                          onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setCurrentPage(1);
                          }}
                          style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontWeight: 600 }} 
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('invoiceSupplierHeader')}</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('description')}</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('date')}</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('items')}</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('status')}</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>{t('totalAmount')}</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        {t('noPurchasesFoundMsg')}
                                    </td>
                                </tr>
                            ) : currentItems.map((purchase) => {
                                const fourName = fournisseurs.find(f => f.id === purchase.fournisseurId)?.nom || t('unknownSupplier');
                                const st = getStatusStyle(purchase.statut);
                                const localizedStatus = purchase.statut === 'En attente' ? (t('statusPending') || 'En attente') :
                                                        purchase.statut === 'Expédié' ? (t('statusShipping') || 'En livraison') :
                                                        purchase.statut === 'Reçu' ? (t('statusReceived') || 'Reçu en stock') :
                                                        purchase.statut || t('unknown');
                                return (
                                    <motion.tr 
                                        key={purchase.id} 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => {
                                            setSelectedPurchase(purchase);
                                            setShowDetailModal(true);
                                        }}
                                        style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s', cursor: 'pointer' }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: 800 }}>{purchase.numeroFacture || `Achat #${purchase.id}`}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Truck size={12}/> {fourName}</div>
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{purchase.description || '-'}</td>
                                        <td style={{ padding: '16px', fontSize: '0.9rem', fontWeight: 600 }}>{new Date(purchase.createdAt).toLocaleDateString('fr-FR')}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                                <Package size={14} color="var(--primary)" /> {purchase.articles?.length || 0}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', backgroundColor: st.bg, color: st.color }}>
                                                {localizedStatus}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            {(() => {
                                                const result = getDisplayAmount(purchase.montantTotal || 0, purchase.devise || 'USD', currency, exchangeRate);
                                                return (
                                                    <>
                                                        <div style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '1.1rem' }}>{result.main}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>≙ {result.sub}</div>
                                                    </>
                                                );
                                            })()}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => { setSelectedPurchase(purchase); setShowEditModal(true); }}
                                                    className="glass btn-hover"
                                                    style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Modifier"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePurchase(purchase.id, purchase.numeroFacture)}
                                                    className="glass btn-hover"
                                                    style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                        {t('showingPurchases')
                          .replace('{start}', (indexOfFirstItem + 1).toString())
                          .replace('{end}', Math.min(indexOfLastItem, filteredPurchases.length).toString())
                          .replace('{total}', filteredPurchases.length.toString())}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontWeight: 700 }}
                        >
                            {t('previous')}
                        </button>
                        {[...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            if (totalPages > 5 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                                if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} style={{ color: 'var(--text-muted)' }}>...</span>;
                                return null;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    style={{ 
                                        width: '40px', height: '40px', borderRadius: '12px', 
                                        background: currentPage === pageNum ? 'var(--primary)' : 'var(--bg-card)', 
                                        color: currentPage === pageNum ? 'white' : 'var(--text-main)', 
                                        fontWeight: 800, cursor: 'pointer', border: currentPage === pageNum ? 'none' : '1px solid var(--border)' 
                                    }}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, fontWeight: 700 }}
                        >
                            {t('next')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de création d'achat */}
            <AnimatePresence>
                {showModal && (
                    <div
                        onClick={() => setShowModal(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
                    >
                        <motion.div
                            onClick={e => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="premium-card"
                            style={{
                                width: '100%', maxWidth: '560px',
                                background: 'var(--bg-card)',
                                borderRadius: '24px',
                                display: 'flex', flexDirection: 'column',
                                maxHeight: '90vh', overflow: 'hidden'
                            }}
                        >
                            {/* ── Sticky Header ── */}
                            <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Package size={22} color="var(--primary)" /> {t('registerPurchaseTitle')}
                                </h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: 'var(--danger)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                            </div>

                            {/* ── Scrollable Body ── */}
                            <div style={{ overflowY: 'auto', flex: 1, padding: '20px 28px' }}>
                            <form id="purchase-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                                {/* Fournisseur */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('supplierHouseLabel')}</label>
                                    <div style={{ position: 'relative' }}>
                                        <Truck size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text" value={formData.fournisseurNom} autoComplete="off"
                                            onFocus={() => setShowFournisseurSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowFournisseurSuggestions(false), 200)}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const match = fournisseurs.find(f => f.nom === val);
                                                setFormData({ ...formData, fournisseurNom: val, fournisseurId: match ? match.id : null });
                                            }}
                                            placeholder={t('typeOrSelectPlaceholder')}
                                            style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontWeight: 600, boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    {showFournisseurSuggestions && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', marginTop: '4px', maxHeight: '180px', overflowY: 'auto', zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                                            {fournisseurs.filter(f => f.nom?.toLowerCase().includes(formData.fournisseurNom.toLowerCase())).length === 0 ? (
                                                <div style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>"{ formData.fournisseurNom }" — {t('newSupplierSuffix')}</div>
                                            ) : fournisseurs.filter(f => f.nom?.toLowerCase().includes(formData.fournisseurNom.toLowerCase())).map(f => (
                                                <div key={f.id} onClick={() => { setFormData({ ...formData, fournisseurNom: f.nom, fournisseurId: f.id }); setShowFournisseurSuggestions(false); }}
                                                    style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontWeight: 600 }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >{f.nom}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Facture + Statut */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('invoiceNumberLabel')}</label>
                                        <div style={{ position: 'relative' }}>
                                            <FileText size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input required type="text" value={formData.numeroFacture} onChange={e => setFormData({ ...formData, numeroFacture: e.target.value })} placeholder="FAC-001" style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontWeight: 600, boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('status')}</label>
                                        <select value={formData.statut} onChange={e => setFormData({ ...formData, statut: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontWeight: 600, appearance: 'none' }}>
                                            <option value="En attente">{t('statusPending') || 'En attente'}</option>
                                            <option value="Expédié">{t('statusShipping') || 'En livraison'}</option>
                                            <option value="Reçu">{t('statusReceived') || 'Reçu en stock'}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Devise + Taux de change */}
                                <div style={{ background: 'var(--primary-glow)', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(21,94,88,0.2)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'end' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('invoiceCurrencyLabel')}</label>
                                            <select value={formData.devise} onChange={e => setFormData({ ...formData, devise: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(21,94,88,0.3)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontWeight: 700, appearance: 'none' }}>
                                                <option value="USD">🇺🇸 USD — Dollar</option>
                                                <option value="CDF">🇨🇩 CDF — Franc Congolais</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('exchangeRateShortLabel')}</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                    type="number" min={1} value={exchangeRate}
                                                    onChange={e => setExchangeRate(Number(e.target.value) || 1)}
                                                    style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(21,94,88,0.3)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontWeight: 700 }}
                                                />
                                                <span style={{ fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>CDF</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recherche produit */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('addItemsLabel')}</label>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text" value={productSearch}
                                            onFocus={() => setShowProductSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                                            onChange={e => setProductSearch(e.target.value)}
                                            placeholder={t('searchProductPlaceholder')}
                                            style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontWeight: 600, boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    {showProductSuggestions && productSearch && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', marginTop: '4px', maxHeight: '180px', overflowY: 'auto', zIndex: 21, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                                            {allProducts.filter(p => p.nom.toLowerCase().includes(productSearch.toLowerCase())).map(p => {
                                                // Show price converted to selected invoice currency
                                                const displayPrice = formData.devise === 'USD'
                                                    ? (p.prixAchat || 0)
                                                    : normalizeAmount(p.prixAchat || 0, p.devise || currency, currency, exchangeRate);
                                                return (
                                                    <div key={p.id}
                                                        onClick={() => {
                                                            const existing = items.find((i: any) => i.id === p.id);
                                                            // Store price in invoice currency
                                                            const convertedPrice = formData.devise === 'USD'
                                                                ? (p.prixAchat || 0)
                                                                : normalizeAmount(p.prixAchat || 0, p.devise || currency, currency, exchangeRate);
                                                            if (existing) {
                                                                setItems(items.map((i: any) => i.id === p.id ? { ...i, quantite: i.quantite + 1 } : i));
                                                            } else {
                                                                setItems([...items, { id: p.id, nom: p.nom, quantite: 1, prixAchat: convertedPrice }]);
                                                            }
                                                            setProductSearch('');
                                                            setShowProductSuggestions(false);
                                                        }}
                                                        style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <span>{p.nom}</span>
                                                        <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{displayPrice.toLocaleString()} {formData.devise}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Liste des articles */}
                                {items.length > 0 && (
                                    <div style={{ background: 'var(--bg-main)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 70px 130px 32px', gap: '8px' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('product')}</span>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>{t('qty')}</span>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>{t('subtotal')}</span>
                                            <span></span>
                                        </div>
                                        {items.map((item: any, idx: number) => (
                                            <div key={idx} style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 70px 130px 32px', gap: '8px', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nom}</span>
                                                <input
                                                    type="number" min={1} value={item.quantite}
                                                    onChange={e => setItems(items.map((it: any, i: number) => i === idx ? { ...it, quantite: parseInt(e.target.value) || 1 } : it))}
                                                    style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', textAlign: 'center', fontWeight: 700, width: '100%' }}
                                                />
                                                <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.9rem' }}>
                                                    {(item.quantite * item.prixAchat).toLocaleString()}
                                                    <span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '3px' }}>{formData.devise}</span>
                                                </div>
                                                <button type="button" onClick={() => setItems(items.filter((_: any, i: number) => i !== idx))} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}><X size={15} /></button>
                                            </div>
                                        ))}
                                        {/* Totals row */}
                                        {(() => {
                                            const totalBase = items.reduce((acc: number, i: any) => acc + (i.quantite * i.prixAchat), 0);
                                            const otherDevise = formData.devise === 'USD' ? 'CDF' : 'USD';
                                            const totalConverted = formData.devise === 'USD'
                                                ? normalizeAmount(totalBase, 'USD', otherDevise, exchangeRate)
                                                : totalBase;
                                            return (
                                                <div style={{ padding: '12px 14px', background: 'var(--primary-glow)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: 'var(--primary)', fontSize: '1rem' }}>
                                                        <span>{t('totalAutoLabel')}</span>
                                                        <span>{totalBase.toLocaleString()} {formData.devise}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                        <span>{t('approxEquivalentLabel')} {otherDevise} :</span>
                                                        <span>{totalConverted.toLocaleString()} {otherDevise}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Montant final */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('finalAmountLabel')} ({formData.devise})</label>
                                    <input
                                        required type="number" value={formData.montantTotal}
                                        onChange={e => setFormData({ ...formData, montantTotal: e.target.value })}
                                        placeholder={t('totalAmountPlaceholder')}
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid var(--primary)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '1.2rem', fontWeight: 800, boxSizing: 'border-box' }}
                                    />
                                    {items.length > 0 && (
                                        <button type="button"
                                            onClick={() => setFormData({ ...formData, montantTotal: items.reduce((acc: number, i: any) => acc + (i.quantite * i.prixAchat), 0).toString() })}
                                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left', padding: 0 }}
                                        >{t('useCalculatedTotalBtn')}</button>
                                    )}
                                </div>

                                {/* Description */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('descriptionNoteLabel')}</label>
                                    <input required type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: Achat mensuel..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontWeight: 600, boxSizing: 'border-box' }} />
                                </div>

                            </form>
                            </div>

                            {/* ── Sticky Footer ── */}
                            {/* ── Sticky Footer ── */}
                            <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0, background: 'var(--bg-card)' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-premium secondary" style={{ padding: '12px 24px', borderRadius: '12px' }}>{t('cancel')}</button>
                                <button form="purchase-form" type="submit" disabled={submitting} className="btn-premium primary" style={{ padding: '12px 28px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} {t('registerPurchaseBtn')}
                                </button>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de détails d'achat */}
            <AnimatePresence>
                {showDetailModal && selectedPurchase && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="premium-card" style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-card)', padding: '32px', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <FileText size={24} color="var(--primary)" /> {t('purchaseDetailsTitle')}
                                </h2>
                                <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('invoice') || 'Facture'}</label>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedPurchase.numeroFacture || `Achat #${selectedPurchase.id}`}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('supplier') || 'Fournisseur'}</label>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{fournisseurs.find(f => f.id === selectedPurchase.fournisseurId)?.nom || t('unknownSupplier')}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('date') || 'Date'}</label>
                                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{new Date(selectedPurchase.createdAt).toLocaleString('fr-FR', { hour12: false })}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('status') || 'Statut'}</label>
                                    <div>
                                        <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: getStatusStyle(selectedPurchase.statut).bg, color: getStatusStyle(selectedPurchase.statut).color }}>
                                            {selectedPurchase.statut === 'En attente' ? (t('statusPending') || 'En attente') :
                                             selectedPurchase.statut === 'Expédié' ? (t('statusShipping') || 'En livraison') :
                                             selectedPurchase.statut === 'Reçu' ? (t('statusReceived') || 'Reçu en stock') :
                                             selectedPurchase.statut}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Package size={18} /> {t('orderedItemsTitle')}
                                </h3>
                                <div style={{ background: 'var(--bg-main)', borderRadius: '16px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                                <th style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('product')}</th>
                                                <th style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('qty')}</th>
                                                <th style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>{t('unitPriceShort')}</th>
                                                <th style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>{t('total')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedPurchase.articles && selectedPurchase.articles.length > 0 ? (
                                                selectedPurchase.articles.map((art: any, idx: number) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '12px', fontWeight: 700, fontSize: '0.9rem' }}>{art.nom}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>{art.quantite}</td>
                                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{art.prixAchat?.toLocaleString()}</td>
                                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>{(art.quantite * (art.prixAchat || 0)).toLocaleString()}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('noDetailedItemsMsg')}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(21, 94, 88, 0.05)', borderRadius: '16px', border: '1px solid rgba(21, 94, 88, 0.1)' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-muted)' }}>{t('totalAmount')}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                                    {(() => {
                                        const result = getDisplayAmount(selectedPurchase.montantTotal || 0, selectedPurchase.devise || 'USD', currency, exchangeRate);
                                        return <>{result.main}</>;
                                    })()}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    ≙ {(() => {
                                        const result = getDisplayAmount(selectedPurchase.montantTotal || 0, selectedPurchase.devise || 'USD', currency, exchangeRate);
                                        return <>{result.sub}</>;
                                    })()}
                                </div>
                            </div>

                            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowDetailModal(false)} className="btn-premium primary" style={{ padding: '12px 32px', borderRadius: '12px' }}>{t('close')}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Purchases;
