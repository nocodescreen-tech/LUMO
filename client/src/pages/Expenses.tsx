import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  ArrowDownCircle, 
  ArrowUpCircle,
  ShoppingBag,
  Zap,
  Coffee,
  Truck,
  MoreHorizontal,
  Download,
  RefreshCw,
  Trash2,
  Edit,
  X,
  FileText
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { exportToExcel } from '../utils/exportUtils';
import api from '../api/axios';
import { toast } from 'sonner';
import { normalizeAmount, formatMontant } from '../utils/currencyHelpers';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';

const Expenses = () => {
    const { currency, exchangeRate } = useAuthStore();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [allExpenses, setAllExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<any>(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const [newExpense, setNewExpense] = useState({
        titre: '',
        montant: 0,
        categorie: 'Autres',
        description: '',
        date: new Date().toISOString().split('T')[0],
        devise: 'CDF'
    });

    const categories = ['Loyer', 'Logistique', 'Bureau', 'Marketing', 'Salaire', 'Impôts', 'Autres'];

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/depenses?_t=${Date.now()}`);
            const resData = response.data;
            
            let expensesList = [];
            
            // Structure standard: { success, data: { data: [] } }
            if (resData.success && resData.data) {
                if (Array.isArray(resData.data.data)) {
                    expensesList = resData.data.data;
                } else if (Array.isArray(resData.data)) {
                    expensesList = resData.data;
                }
            }
            // Fallback
            else {
                const data = resData;
                if (Array.isArray(data)) expensesList = data;
                else if (data && Array.isArray(data.data)) expensesList = data.data;
                else if (data && Array.isArray(data.expenses)) expensesList = data.expenses;
            }

            setExpenses(expensesList);
            setAllExpenses(expensesList);
        } catch (error) {
            toast.error("Erreur lors du chargement des dépenses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    useEffect(() => {
        const filtered = allExpenses.filter(e => 
            e.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.categorie.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setExpenses(filtered);
        setCurrentPage(1);
    }, [searchTerm, allExpenses]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = expenses.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(expenses.length / itemsPerPage);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/depenses', newExpense);
            toast.success("Dépense enregistrée !");
            setShowAddModal(false);
            setNewExpense({ titre: '', montant: 0, categorie: 'Autres', description: '', date: new Date().toISOString().split('T')[0], devise: 'CDF' });
            fetchExpenses();
        } catch (error) {
            toast.error("Erreur d'enregistrement");
        }
    };

    const handleUpdateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/depenses/${selectedExpense.id}`, selectedExpense);
            toast.success("Dépense mise à jour !");
            setShowEditModal(false);
            fetchExpenses();
        } catch (error) {
            toast.error("Erreur de modification");
        }
    };

    const handleDeleteExpense = (id: number, title: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Supprimer Dépense",
            message: `Voulez-vous supprimer la dépense "${title}" ?`,
            onConfirm: async () => {
                try {
                    await api.delete(`/depenses/${id}`);
                    toast.success("Dépense supprimée");
                    fetchExpenses();
                } catch (error) {
                    toast.error("Erreur de suppression");
                }
            }
        });
    };

    const getIcon = (cat: string) => {
        switch(cat) {
            case 'Loyer': return Zap;
            case 'Logistique': return Truck;
            case 'Bureau': return Coffee;
            case 'Marketing': return DollarSign;
            default: return ShoppingBag;
        }
    };

    const getNormalizedAmount = (exp: any) => {
        return normalizeAmount(parseFloat(exp.montant), exp.devise || 'CDF', currency, exchangeRate);
    };

    const totalStats = {
        total: expenses.reduce((acc, curr) => acc + getNormalizedAmount(curr), 0),
        fixes: expenses.filter(e => e.categorie === 'Loyer').reduce((acc, curr) => acc + getNormalizedAmount(curr), 0),
        variables: expenses.filter(e => e.categorie !== 'Loyer').reduce((acc, curr) => acc + getNormalizedAmount(curr), 0)
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="title-xl">Suivi des <span className="text-gradient">Dépenses</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Contrôlez vos sorties de trésorerie.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button 
                      onClick={() => exportToExcel(expenses, 'Depenses_Report')}
                      className="btn-hover"
                      style={{ padding: '12px 20px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 800 }}
                    >
                        <Download size={18} /> Rapport
                    </button>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="btn-premium primary" style={{ padding: '12px 20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 800 }}>
                        <Plus size={18} /> Nouvelle Dépense
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                {[
                    { label: 'Total Période', value: totalStats.total, icon: ArrowDownCircle, color: 'var(--danger)' },
                    { label: 'Dépenses Fixes', value: totalStats.fixes, icon: Zap, color: 'var(--primary)' },
                    { label: 'Dépenses Var.', value: totalStats.variables, icon: Zap, color: 'var(--secondary)' },
                    { label: 'Moyenne / Dép.', value: expenses.length ? totalStats.total / expenses.length : 0, icon: ArrowUpCircle, color: 'var(--success)' },
                ].map((s, i) => (
                    <div key={i} className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                             <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: s.color, opacity: 0.1, color: s.color }}>
                                <s.icon size={20} />
                             </div>
                             <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</span>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 950 }}>{s.value.toLocaleString()} {currency}</div>
                    </div>
                ))}
            </div>

            <div className="glass" style={{ padding: '32px', borderRadius: '32px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div style={{ position: 'relative', width: '350px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Rechercher une dépense..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="glass" 
                            style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none' }} 
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={fetchExpenses} className="glass" style={{ width: '48px', height: '48px', borderRadius: '14px', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>DÉPENSE / CATÉGORIE</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>DATE</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>MONTANT</th>
                                <th style={{ padding: '16px', width: '120px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</td></tr>
                            ) : currentItems.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Aucune dépense trouvée.</td></tr>
                            ) : currentItems.map((exp) => {
                                const Icon = getIcon(exp.categorie);
                                return (
                                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--sidebar-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                    <Icon size={18} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800 }}>{exp.titre}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{exp.categorie}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(exp.date).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: 900, color: 'var(--danger)' }}>
                                            -{formatMontant(parseFloat(exp.montant), exp.devise || 'CDF', currency, exchangeRate)}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => { setSelectedExpense(exp); setShowEditModal(true); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><Edit size={18} /></button>
                                                <button onClick={() => handleDeleteExpense(exp.id, exp.titre)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                        <button 
                            onClick={() => setCurrentPage(currentPage - 1)} 
                            disabled={currentPage === 1}
                            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                            Précédent
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button 
                                key={i} 
                                onClick={() => setCurrentPage(i + 1)}
                                style={{ 
                                    padding: '8px 16px', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--border)', 
                                    background: currentPage === i + 1 ? 'var(--primary)' : 'var(--bg-card)', 
                                    color: currentPage === i + 1 ? 'white' : 'var(--text-main)',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button 
                            onClick={() => setCurrentPage(currentPage + 1)} 
                            disabled={currentPage === totalPages}
                            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                        >
                            Suivant
                        </button>
                    </div>
                )}
            </div>

            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nouvelle Dépense" icon={Plus}>
                <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Titre de la dépense</label>
                        <input required type="text" value={newExpense.titre} onChange={e => setNewExpense({...newExpense, titre: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Montant</label>
                            <input required type="number" value={newExpense.montant} onChange={e => setNewExpense({...newExpense, montant: parseFloat(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Catégorie</label>
                            <select value={newExpense.categorie} onChange={e => setNewExpense({...newExpense, categorie: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Date</label>
                            <input type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Devise</label>
                            <select value={newExpense.devise} onChange={e => setNewExpense({...newExpense, devise: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                                <option value="CDF">CDF (Franc Congolais)</option>
                                <option value="USD">USD (Dollar)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Description (Optionnel)</label>
                        <textarea value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100px' }} />
                    </div>
                    <button type="submit" className="btn-premium primary" style={{ padding: '16px', borderRadius: '16px', fontWeight: 800 }}>Enregistrer</button>
                </form>
            </Modal>

            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier Dépense" icon={Edit}>
                {selectedExpense && (
                    <form onSubmit={handleUpdateExpense} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Titre</label>
                            <input required type="text" value={selectedExpense.titre} onChange={e => setSelectedExpense({...selectedExpense, titre: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Montant</label>
                                <input required type="number" value={selectedExpense.montant} onChange={e => setSelectedExpense({...selectedExpense, montant: parseFloat(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Catégorie</label>
                                <select value={selectedExpense.categorie} onChange={e => setSelectedExpense({...selectedExpense, categorie: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Devise</label>
                            <select value={selectedExpense.devise || 'CDF'} onChange={e => setSelectedExpense({...selectedExpense, devise: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                                <option value="CDF">CDF (Franc Congolais)</option>
                                <option value="USD">USD (Dollar)</option>
                            </select>
                        </div>
                        <button type="submit" className="btn-premium primary" style={{ padding: '16px', borderRadius: '16px', fontWeight: 800 }}>Mettre à jour</button>
                    </form>
                )}
            </Modal>

            <ConfirmModal 
                isOpen={confirmModal.isOpen} 
                onClose={() => setConfirmModal({...confirmModal, isOpen: false})} 
                title={confirmModal.title} 
                message={confirmModal.message} 
                onConfirm={confirmModal.onConfirm} 
            />
        </div>
    );
};

export default Expenses;
