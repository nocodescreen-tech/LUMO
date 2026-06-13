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
  ChevronDown,
  Loader2,
  Package,
  Zap,
  ArrowUpRight,
  BarChart2,
  TrendingUp,
  DollarSign,
  PieChart,
  MoreVertical,
  Trash2,
  RotateCcw,
  RefreshCcw
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../hooks/useTranslation';
import api from '../api/axios';
import { toast } from 'sonner';
import { generateInvoice, generateTicket } from '../utils/printHelpers';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
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
    vendeur?: {
        nom: string;
    };
    devise?: string;
    tauxChange?: number;
    createdAt: string;
    updatedAt: string;
    statut?: string;
}

const Sales = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { currency, user, exchangeRate } = useAuthStore();
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
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchSales();
    }, []);

    const shopCurrency = (user?.entreprise?.devise === 'FC' ? 'CDF' : user?.entreprise?.devise) || 'CDF';

    const convertAmount = (amount: number, from: string, to: string, rate: number) => {
        const safeAmount = Number(amount) || 0;
        const safeRate = Number(rate);
        if (from === to) return safeAmount;
        if (!Number.isFinite(safeRate) || safeRate <= 0) return safeAmount;
        if (from === 'USD' && to === 'CDF') return Math.round(safeAmount * safeRate);
        if (from === 'CDF' && to === 'USD') return Math.round((safeAmount / safeRate) * 100) / 100;
        return safeAmount;
    };

    const getSaleDisplayAmounts = (sale: any) => {
        const storedAmount = Number(sale?.montantTotal || 0);
        const saleCurrency = sale?.devise || shopCurrency;
        const rate = Number(sale?.tauxChange || exchangeRate);
        const altCurrency = saleCurrency === 'USD' ? 'CDF' : 'USD';

        // Backend stores montantTotal in shop currency; rebuild original amount in sale currency
        const originalAmount = convertAmount(storedAmount, shopCurrency, saleCurrency, rate);
        const convertedAmount = convertAmount(originalAmount, saleCurrency, altCurrency, rate);
        const displayCurrencyAmount = convertAmount(originalAmount, saleCurrency, currency, rate);

        return { saleCurrency, altCurrency, originalAmount, convertedAmount, displayCurrencyAmount };
    };

    const getNormalizedAmount = (sale: any) => getSaleDisplayAmounts(sale).displayCurrencyAmount;

    const fetchSales = async () => {
        try {
            const response = await api.get(`/sales?limit=200&_t=${Date.now()}`);
            const resData = response.data;
            
            let salesList = [];
            
            // Structure standard: { success, data: { data: [] } }
            if (resData.success && resData.data) {
                if (Array.isArray(resData.data.data)) {
                    salesList = resData.data.data;
                } else if (Array.isArray(resData.data)) {
                    salesList = resData.data;
                }
            }
            // Fallback
            else {
                const data = resData;
                if (Array.isArray(data)) salesList = data;
                else if (data && Array.isArray(data.data)) salesList = data.data;
                else if (data && Array.isArray(data.sales)) salesList = data.sales;
            }
            
            setSales(salesList);
        } catch (error) {
            toast.error(t('errorLoadingHistory'));
        } finally {
            setLoading(false);
        }
    };


    const handlePrint = (sale: any) => {
        toast("Génération de la facture...");
        generateInvoice(sale, user);
    };

    const handlePrintTicket = (sale: any) => {
        toast("Génération du ticket...");
        generateTicket(sale, user);
    };

    const deleteSale = async (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: t('deleteTransaction'),
            message: t('deleteTransactionMsg'),
            onConfirm: async () => {
                try {
                    await api.delete(`/sales/${id}`);
                    toast.success(t('transactionDeleted'));
                    fetchSales();
                } catch (error) {
                    toast.error(t('deletionFailed'));
                }
            }
        });
    };

    const handleAllDelete = async () => {
        setConfirmModal({
            isOpen: true,
            title: t('totalDeletion'),
            message: t('totalDeletionMsg'),
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await api.delete('/sales/all');
                    toast.success(t('salesHistoryCleared'));
                    fetchSales();
                } catch (error: any) {
                    toast.error(error.response?.data?.message || t('deletionFailed'));
                } finally {
                    setLoading(false);
                }
            }
        });
    };
    const handleRefund = async (sale: any) => {
        if (sale.statut === 'Remboursée') return;

        setConfirmModal({
            isOpen: true,
            title: t('refundSale'),
            message: `${t('refundMsg')} #${sale.id} ?`,
            onConfirm: async () => {
                try {
                    await api.post(`/sales/${sale.id}/refund`);
                    toast.success(t('saleRefunded'));
                    fetchSales();
                } catch (error: any) {
                    toast.error(error.response?.data?.message || t('refundFailed'));
                }
            }
        });
    };

    const handleExportExcel = () => {
        if (sales.length === 0) return toast.error(t('noDataExport'));
        
        const rows = filteredSales.map(s => ({
            "ID": s.id,
            "Client": s.clientInfo?.nom || 'Client de passage',
            "Date": new Date(s.createdAt).toLocaleDateString(),
            "Méthode Paiement": s.methodePaiement,
            "Nb Articles": s.articles?.length || 0,
            "Montant (Original)": `${s.montantTotal} ${s.devise}`,
            "Montant (Normalisé)": `${getNormalizedAmount(s)} ${currency}`,
            "Remise": s.remise || 0,
            "Taux": s.tauxChange || exchangeRate
        }));

        exportToExcel(rows, `Rapport_Ventes_${currency}`);
        toast.success(t('excelExportSuccess'));
    };

    const filteredSales = sales.filter(s => {
        const matchesSearch = s.id?.toString().includes(searchTerm) || 
                             s.clientInfo?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = filterDate ? s.createdAt.startsWith(filterDate) : true;
        const matchesMethod = filterMethod ? s.methodePaiement === filterMethod : true;
        
        return matchesSearch && matchesDate && matchesMethod;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterDate, filterMethod]);

    // Report Calculations
    const reportStats = {
        totalRevenue: filteredSales.reduce((acc, s) => acc + getNormalizedAmount(s), 0),
        count: filteredSales.length,
        averageValue: filteredSales.length > 0 ? filteredSales.reduce((acc, s) => acc + getNormalizedAmount(s), 0) / filteredSales.length : 0,
        methodSplit: filteredSales.reduce((acc: any, s) => {
            const normalizedAmt = getNormalizedAmount(s);
            acc[s.methodePaiement] = (acc[s.methodePaiement] || 0) + normalizedAmt;
            return acc;
        }, {})
    };

    if (loading) return (
        <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Loader2 size={40} color="var(--primary)" />
            </motion.div>
            <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{t('loadingTransactions')}</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
            <div className="responsive-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <h1 className="title-xl">{t('salesFlow').split(' ').slice(0, -1).join(' ')} <span className="text-gradient">{t('salesFlow').split(' ').slice(-1)[0]}</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>{t('salesTracking')}</p>
                </motion.div>
                <div className="responsive-flex" style={{ display: 'flex', gap: '14px' }}>
                    <button onClick={() => setShowReportModal(true)} className="btn-premium secondary"><BarChart2 size={18} /> {t('reports')}</button>
                    <button onClick={handleExportExcel} className="btn-premium secondary"><Download size={18} /> Excel</button>
                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                        <button onClick={handleAllDelete} className="btn-premium secondary" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}><Trash2 size={18} /> {t('clearAll')}</button>
                    )}
                    <button onClick={() => navigate('/pos')} className="btn-premium primary"><Zap size={18} /> {t('newSale')}</button>
                </div>
            </div>

            {/* Stats Cards Section */}
            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                <div className="premium-card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.05) 100%)', border: '1px solid rgba(99,102,241,0.2)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.3 }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'var(--grad-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px var(--primary-glow)' }}>
                            <TrendingUp size={28} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '0.02em' }}>{t('revenue')}</span>
                    </div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--text-main)', lineHeight: '1', letterSpacing: '-0.02em' }}>
                        {reportStats.totalRevenue.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 900 }}>{currency}</span>
                    </div>
                </div>

                <div className="premium-card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)', border: '1px solid rgba(16,185,129,0.2)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: 'rgba(16,185,129,0.2)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.3 }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}>
                            <DollarSign size={28} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '0.02em' }}>{t('avgBasket')}</span>
                    </div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--text-main)', lineHeight: '1', letterSpacing: '-0.02em' }}>
                        {Math.round(reportStats.averageValue).toLocaleString()} <span style={{ fontSize: '1rem', color: '#10b981', fontWeight: 900 }}>{currency}</span>
                    </div>
                </div>

                <div className="premium-card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.05) 100%)', border: '1px solid rgba(245,158,11,0.2)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: 'rgba(245,158,11,0.2)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.3 }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(245,158,11,0.3)' }}>
                            <PieChart size={28} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '0.02em' }}>{t('transactions')}</span>
                    </div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--text-main)', lineHeight: '1', letterSpacing: '-0.02em' }}>
                        {reportStats.count} <span style={{ fontSize: '1rem', color: '#f59e0b', fontWeight: 900 }}>Factures</span>
                    </div>
                </div>
            </div>

            <div className="premium-card" style={{ padding: '32px', borderRadius: '32px' }}>
                <div className="responsive-flex" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.6 }} />
                        <input 
                          type="text" 
                          placeholder={t('searchByRef')} 
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
                           <Filter size={18} /> {showFilters ? t('hideFilters') : t('showFilters')}
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
                                <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>{t('date')}</label>
                                <input 
                                    type="date" 
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 700 }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>{t('method')}</label>
                                <select 
                                    value={filterMethod}
                                    onChange={(e) => setFilterMethod(e.target.value)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 700 }}
                                >
                                    <option value="">Toutes</option>
                                    <option value="Espèces">Espèces</option>
                                    <option value="Crédit">Crédit</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button 
                                    onClick={() => { setFilterDate(''); setFilterMethod(''); }}
                                    style={{ padding: '14px 24px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    {t('reset')}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="table-responsive">
                    <table style={{ minWidth: '800px', width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                                <th style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900 }}>{t('reference')}</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900 }}>{t('dateMethod')}</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900 }}>{t('seller')}</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900, textAlign: 'right' }}>{t('totalAmount')}</th>
                                <th style={{ padding: '16px 24px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {currentItems.map((sale, i) => {
                                    const fx = getSaleDisplayAmounts(sale);

                                    return (
                                    <motion.tr 
                                        key={sale.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)', scale: 1.002 }}
                                        style={{ borderBottom: '1px solid var(--border)', cursor: 'default' }}
                                    >
                                        <td style={{ padding: '24px' }}>
                                            <div style={{ fontWeight: 950, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                                                #{sale.id?.toString().slice(-6).toUpperCase()}
                                                <ArrowUpRight size={14} style={{ opacity: 0.4 }} />
                                            </div>
                                            <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>{sale.clientInfo?.nom || 'Client de passage'}</div>
                                        </td>
                                        <td style={{ padding: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                                <Calendar size={16} color="var(--primary)" /> {new Date(sale.createdAt).toLocaleDateString()}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>{sale.methodePaiement}</div>
                                        </td>
                                        <td style={{ padding: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--grad-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 900, boxShadow: '0 4px 12px var(--primary-glow)' }}>
                                                    {sale.vendeur?.nom?.charAt(0) || 'A'}
                                                </div>
                                                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{sale.vendeur?.nom || 'Admin'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px', textAlign: 'right' }}>
                                            <div style={{ fontWeight: 950, fontSize: '1.4rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                                                {fx.originalAmount?.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 900 }}>{fx.saleCurrency}</span>
                                            </div>
                                            <div style={{ fontSize: '0.95rem', color: '#10b981', fontWeight: 950, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                                <RefreshCcw size={14} /> {fx.convertedAmount.toLocaleString()} {fx.altCurrency}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '6px' }}>
                                                {sale.articles?.length || 0} articles · <span style={{ color: sale.statut === 'Remboursée' ? '#ef4444' : '#10b981' }}>{sale.statut || 'Payé'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px' }}>
                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', position: 'relative' }}>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === sale.id ? null : sale.id); }}
                                                    className="btn-hover"
                                                    style={{ width: '46px', height: '46px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer', border: '1.5px solid var(--border)', background: 'var(--bg-main)' }}
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
                                                            <button 
                                                                onClick={() => { handlePrintTicket(sale); setActionMenuId(null); }}
                                                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 700, borderRadius: '10px' }}
                                                                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-main)'}
                                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                <Zap size={16} color="#f59e0b" /> Ticket de Caisse
                                                            </button>
                                                            {sale.statut !== 'Remboursée' && (
                                                                <button 
                                                                    onClick={() => { handleRefund(sale); setActionMenuId(null); }}
                                                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--secondary)', fontWeight: 700, borderRadius: '10px' }}
                                                                    onMouseOver={e => e.currentTarget.style.background = 'var(--secondary-glow)'}
                                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                                >
                                                                    <RotateCcw size={16} /> {t('refundSale')}
                                                                </button>
                                                            )}
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
                                    );
                                })}
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                        <button 
                            onClick={() => setCurrentPage(currentPage - 1)} 
                            disabled={currentPage === 1}
                            style={{ padding: '12px 24px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontWeight: 700 }}
                        >
                            Précédent
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button 
                                key={i} 
                                onClick={() => setCurrentPage(i + 1)}
                                style={{ 
                                    width: '48px', height: '48px',
                                    borderRadius: '14px', 
                                    background: currentPage === i + 1 ? 'var(--primary)' : 'var(--bg-card)', 
                                    color: currentPage === i + 1 ? 'white' : 'var(--text-main)',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    border: currentPage === i + 1 ? 'none' : '1px solid var(--border)'
                                }}
                            >
                                {i + 1}
                            </button>
                        ))}
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
                    Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredSales.length)} sur {filteredSales.length} transactions
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
                                <p style={{ fontWeight: 800 }}>{new Date(selectedSale.createdAt).toLocaleString('fr-FR', { hour12: false })}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</p>
                                {(() => {
                                    const fx = getSaleDisplayAmounts(selectedSale);
                                    return (
                                        <div>
                                            <p style={{ fontWeight: 950, fontSize: '1.4rem', color: 'var(--primary)', margin: 0 }}>
                                                {fx.originalAmount.toLocaleString()} {fx.saleCurrency}
                                            </p>
                                            <p style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 800, margin: '4px 0 0 0' }}>
                                                ≙ {fx.convertedAmount.toLocaleString()} {fx.altCurrency}
                                            </p>
                                        </div>
                                    );
                                })()}
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
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>{t('noData')}</p>
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
            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />
        </div>
    );
};

export default Sales;
