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
  FileText
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';
import { toast } from 'sonner';
import { exportToExcel } from '../utils/exportUtils';

const Purchases = () => {
    const { currency } = useAuthStore();
    const [purchases, setPurchases] = useState<any[]>([]);
    const [fournisseurs, setFournisseurs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        fournisseurId: '',
        numeroFacture: '',
        description: '',
        montantTotal: '',
        statut: 'En attente'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [purRes, fourRes] = await Promise.all([
                api.get('/purchases'),
                api.get('/fournisseurs').catch(() => ({ data: [] }))
            ]);
            setPurchases(purRes.data || []);
            setFournisseurs(fourRes.data || []);
        } catch (error) {
            toast.error("Erreur lors de la récupération des données");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/purchases', {
                ...formData,
                fournisseurId: formData.fournisseurId ? Number(formData.fournisseurId) : null,
                montantTotal: Number(formData.montantTotal)
            });
            toast.success("Achat enregistré avec succès !");
            setShowModal(false);
            fetchData();
            setFormData({
                fournisseurId: '',
                numeroFacture: '',
                description: '',
                montantTotal: '',
                statut: 'En attente'
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement de l'achat");
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
        if (s.includes('reçu') || s.includes('payé')) return { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' };
        if (s.includes('attente') || s.includes('cours')) return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
        return { bg: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-muted)' };
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
                    <h1 className="title-xl">Gestion des <span className="text-gradient">Achats</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Commandes fournisseurs et suivi des marchandises entrantes.</p>
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
                      <Download size={18} /> Rapport
                  </button>
                  <button 
                    onClick={() => setShowModal(true)} 
                    className="btn-premium primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', borderRadius: '16px', fontWeight: 800 }}
                  >
                      <Plus size={18} /> Nouvel Achat
                  </button>
                </div>
            </div>

            <div className="premium-card" style={{ padding: '32px', borderRadius: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div style={{ position: 'relative', width: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                          type="text" 
                          placeholder="Rechercher par facture, description..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontWeight: 600 }} 
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>FACTURE / FOURNISSEUR</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>DESCRIPTION</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>DATE</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>STATUT</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>MONTANT TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        Aucun achat trouvé.
                                    </td>
                                </tr>
                            ) : filteredPurchases.map((purchase) => {
                                const fourName = fournisseurs.find(f => f.id === purchase.fournisseurId)?.nom || 'Fournisseur Inconnu';
                                const st = getStatusStyle(purchase.statut);
                                return (
                                    <motion.tr 
                                        key={purchase.id} 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s', cursor: 'pointer' }}
                                    >
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: 800 }}>{purchase.numeroFacture || `Achat #${purchase.id}`}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Truck size={12}/> {fourName}</div>
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{purchase.description || '-'}</td>
                                        <td style={{ padding: '16px', fontSize: '0.9rem', fontWeight: 600 }}>{new Date(purchase.createdAt).toLocaleDateString('fr-FR')}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', backgroundColor: st.bg, color: st.color }}>
                                                {purchase.statut || 'Inconnu'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: 900, color: 'var(--text-main)', fontSize: '1.1rem' }}>{purchase.montantTotal?.toLocaleString() || 0} {currency}</td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de création d'achat */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="premium-card" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card)', padding: '32px', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <Package size={24} color="var(--primary)" /> Enregistrer un Achat
                                </h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>Maison / Fournisseur (Optionnel)</label>
                                    <select 
                                        value={formData.fournisseurId} 
                                        onChange={e => setFormData({...formData, fournisseurId: e.target.value})}
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '0.95rem', fontWeight: 600, appearance: 'none' }}
                                    >
                                        <option value="">-- Sélectionnez un fournisseur --</option>
                                        {fournisseurs.map(f => (
                                            <option key={f.id} value={f.id}>{f.nom}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>N° Facture/Reçu</label>
                                        <div style={{ position: 'relative' }}>
                                            <FileText size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input required type="text" value={formData.numeroFacture} onChange={e => setFormData({...formData, numeroFacture: e.target.value})} placeholder="Fac-XX" style={{ width: '100%', padding: '14px 14px 14px 38px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '0.95rem', fontWeight: 600, boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>Montant Total ({currency})</label>
                                        <input required type="number" min="0" value={formData.montantTotal} onChange={e => setFormData({...formData, montantTotal: e.target.value})} placeholder="Ex: 50000" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '0.95rem', fontWeight: 600, boxSizing: 'border-box' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>Description de l'achat</label>
                                    <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Achat de 50 cartons de lait..." style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '0.95rem', fontWeight: 600, boxSizing: 'border-box' }} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>Statut de l'achat</label>
                                    <select 
                                        value={formData.statut} 
                                        onChange={e => setFormData({...formData, statut: e.target.value})}
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '0.95rem', fontWeight: 600, appearance: 'none' }}
                                    >
                                        <option value="En attente">En attente d'expédition</option>
                                        <option value="Expédié">En cours de livraison</option>
                                        <option value="Reçu">Reçu dans le stock</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-premium secondary" style={{ padding: '12px 24px', borderRadius: '12px' }}>Annuler</button>
                                    <button type="submit" disabled={submitting} className="btn-premium primary" style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Enregistrer
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Purchases;
