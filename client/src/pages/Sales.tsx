import './service-commercial.css';
import { PageSkeleton } from '../design-system/PageSkeleton';
import { LoadFailure } from '../design-system/LoadFailure';
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
import { getEffectiveRate } from '../utils/currencyHelpers';
import { useTranslation } from '../hooks/useTranslation';
import api from '../api/axios';
import { toast } from 'sonner';
import { generateInvoice, generateTicket } from '../utils/printHelpers';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import { exportToPDF } from '../utils/reportPDF';

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
    const [loadError, setLoadError] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const [saleStatus,setSaleStatus]=useState(''),[saleCurrencyFilter,setSaleCurrencyFilter]=useState('');
    const [filterMethod, setFilterMethod] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [actionMenuId, setActionMenuId] = useState<number | null>(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

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
        const rate = Number(sale?.tauxChange || getEffectiveRate());
        const altCurrency = saleCurrency === 'USD' ? 'CDF' : 'USD';

        // The backend stores montantTotal directly in the saleCurrency. No need to reconstruct it from shopCurrency.
        const originalAmount = storedAmount;
        const convertedAmount = convertAmount(originalAmount, saleCurrency, altCurrency, rate);
        const displayCurrencyAmount = convertAmount(originalAmount, saleCurrency, currency, rate);

        return { saleCurrency, altCurrency, originalAmount, convertedAmount, displayCurrencyAmount };
    };

    const getNormalizedAmount = (sale: any) => getSaleDisplayAmounts(sale).displayCurrencyAmount;

    const fetchSales = async () => {
        setLoading(true);
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
            setLoadError(false);
        } catch (error) {
            setLoadError(true); toast.error(t('salesLoadError'));
        } finally {
            setLoading(false);
        }
    };


    const handlePrint = (sale: any) => {
        toast.success(t('printInvoiceToast'));
        generateInvoice(sale, user);
    };

    const handlePrintTicket = (sale: any) => {
        toast.success(t('printReceiptToast'));
        generateTicket(sale, user);
    };

    const deleteSale = async (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: t('deleteSaleTitle'),
            message: t('deleteSaleMessage'),
            onConfirm: async () => {
                try {
                    await api.delete(`/sales/${id}`);
                    toast.success(t('saleDeleted'));
                    fetchSales();
                } catch (error) {
                    toast.error(t('deleteFailed'));
                }
            }
        });
    };

    const handleAllDelete = async () => {
        setConfirmModal({
            isOpen: true,
            title: t('deleteAllSalesTitle'),
            message: t('deleteAllSalesMessage'),
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await api.delete('/sales/all');
                    toast.success(t('salesHistoryCleared'));
                    fetchSales();
                } catch (error: any) {
                    toast.error(error.response?.data?.message || t('deleteAllFailed'));
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
            title: t('refundSaleTitle'),
            message: t('refundSaleMessage'),
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

    const handleExportExcel = async () => {
        if (filteredSales.length === 0) return toast.error(t('noDataToExport'));

        const rows = filteredSales.map(s => ({
            [t('salesExcelReference')]: s.id,
            [t('salesExcelCustomer')]: s.clientInfo?.nom || t('walkInCustomer'),
            [t('date')]: new Date(s.createdAt).toLocaleDateString(),
            [t('salesExcelPaymentMethod')]: s.methodePaiement,
            [t('salesExcelItems')]: s.articles?.length || 0,
            [t('salesExcelOriginalAmount')]: `${s.montantTotal} ${s.devise}`,
            [t('salesExcelNormalizedAmount')]: `${getNormalizedAmount(s)} ${currency}`,
            [t('salesExcelRate')]: s.tauxChange || '', Statut:s.statut||'Non renseigné'
        }));

        try{const X=await import('xlsx'),wb=X.utils.book_new();X.utils.book_append_sheet(wb,X.utils.json_to_sheet(rows),'Ventes');X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet([['Périmètre','Historique filtré parmi les ventes chargées uniquement'],['Montants convertis','Indicatifs ; taux historique ou taux de repli'],['Date du filtre',filterDate||'Toutes dates chargées'],['Fuseau du filtre','Africa/Kinshasa'],['Statut',saleStatus||'Tous']]),'Périmètre');X.writeFile(wb,'LUMO-ventes-'+new Date().toISOString().slice(0,10)+'.xlsx');toast.success(t('excelExportSuccess'))}catch{toast.error('Export Excel indisponible')}
    };

    const filteredSales = sales.filter(s => {
        const matchesSearch = s.id?.toString().includes(searchTerm) ||
            s.clientInfo?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
        const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Kinshasa',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(s.createdAt));const day=['year','month','day'].map(k=>parts.find(p=>p.type===k)?.value).join('-');const matchesDate=!filterDate||day===filterDate;
        const matchesMethod = filterMethod ? s.methodePaiement === filterMethod : true;

        return matchesSearch && matchesDate && matchesMethod&&(!saleStatus||s.statut===saleStatus)&&(!saleCurrencyFilter||s.devise===saleCurrencyFilter);
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.max(1,Math.ceil(filteredSales.length / itemsPerPage));
    useEffect(()=>{if(currentPage>totalPages)setCurrentPage(totalPages)},[currentPage,totalPages]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterDate, filterMethod,saleStatus,saleCurrencyFilter]);

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

    if (!loading && loadError) return <LoadFailure onRetry={fetchSales} />;
    if (loading) return <PageSkeleton />;

    return (
        <div className="service-sales" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
            <div className="responsive-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <h1 className="title-xl"><span className="text-gradient">{t('salesTitle')}</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>{t('salesSubtitle')}</p>
                </motion.div>
                <div className="responsive-flex" style={{ display: 'flex', gap: '14px' }}>
                    <button onClick={() => setShowReportModal(true)} className="btn-premium secondary"><BarChart2 size={18} /> {t('reports')}</button>
                    <button onClick={handleExportExcel} className="btn-premium secondary"><Download size={18} /> {t('excel')}</button>

                    <button onClick={() => navigate('/pos')} className="btn-premium primary"><Zap size={18} /> {t('newSale')}</button>
                </div>
            </div>

            <div className="service-disclosure">Historique chargé : {sales.length} vente(s), maximum demandé 200. Les montants convertis sont indicatifs, incluant les opérations remboursées si elles correspondent aux filtres. Consultez la comptabilité pour les résultats nets enregistrés.</div><div className="service-filter"><label>Statut<select value={saleStatus} onChange={e=>setSaleStatus(e.target.value)}><option value="">Tous</option>{Array.from(new Set(sales.map(s=>s.statut).filter(Boolean))).map(k=><option key={k} value={k}>{k}</option>)}</select></label><label>Devise d’origine<select value={saleCurrencyFilter} onChange={e=>setSaleCurrencyFilter(e.target.value)}><option value="">Toutes</option><option>USD</option><option>CDF</option></select></label></div>
            {/* Stats Cards Section */}
            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '24px' }}>
                <div className="premium-card" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(21,94,88,0.1) 0%, rgba(168,85,247,0.05) 100%)', border: '1px solid rgba(21,94,88,0.2)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.3 }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'var(--grad-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px var(--primary-glow)' }}>
                            <TrendingUp size={28} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '0.02em' }}>Total historique filtré</span>
                    </div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1', letterSpacing: '-0.02em' }}>
                        {reportStats.totalRevenue.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 700 }}>{currency}</span>
                    </div>
                </div>

                <div className="premium-card" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)', border: '1px solid rgba(16,185,129,0.2)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: 'rgba(16,185,129,0.2)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.3 }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'linear-gradient(135deg, var(--success), var(--success-dark))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}>
                            <DollarSign size={28} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '0.02em' }}>{t('averageBasket')}</span>
                    </div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1', letterSpacing: '-0.02em' }}>
                        {Math.round(reportStats.averageValue).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--success)', fontWeight: 700 }}>{currency}</span>
                    </div>
                </div>

                <div className="premium-card" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.05) 100%)', border: '1px solid rgba(245,158,11,0.2)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: 'rgba(245,158,11,0.2)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.3 }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'linear-gradient(135deg, var(--warning), #d97706)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(245,158,11,0.3)' }}>
                            <PieChart size={28} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '0.02em' }}>{t('transactionsLabel')}</span>
                    </div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1', letterSpacing: '-0.02em' }}>
                        {reportStats.count} <span style={{ fontSize: '1rem', color: 'var(--warning)', fontWeight: 700 }}>{t('invoices')}</span>
                    </div>
                </div>
            </div>

            <div className="premium-card glass" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div className="responsive-flex" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.6 }} />
                        <input
                            type="text"
                            placeholder={t('searchSale')}
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
                            <Filter size={18} /> {showFilters ? t('hideFilters') : t('filters')}
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
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>{t('date')}</label>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 700 }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>{t('method')}</label>
                                <select
                                    value={filterMethod}
                                    onChange={(e) => setFilterMethod(e.target.value)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 700 }}
                                >
                                    <option value="">{t('all')}</option>
                                    <option value="Espèces">{t('cashPayment')}</option>
                                    <option value="Crédit">{t('creditPayment')}</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button
                                    onClick={() => { setFilterDate(''); setFilterMethod(''); }}
                                    style={{ padding: '14px 24px', borderRadius: '12px', background: 'rgba(214, 69, 69, 0.1)', color: 'var(--danger)', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    {t('reset')}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="table-responsive">
                    <table className="table-sales" style={{ minWidth: '800px', width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                                <th style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{t('referenceClient')}</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{t('dateMethod')}</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{t('seller')}</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, textAlign: 'right' }}>{t('totalAmount')}</th>
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
                                                <div style={{ fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                                                    #{sale.id?.toString().slice(-6).toUpperCase()}
                                                    <ArrowUpRight size={14} style={{ opacity: 0.4 }} />
                                                </div>
                                                <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>{sale.clientInfo?.nom || t('walkInCustomer')}</div>
                                            </td>
                                            <td style={{ padding: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                                    <Calendar size={16} color="var(--primary)" /> {new Date(sale.createdAt).toLocaleDateString()}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>{sale.methodePaiement === 'Dette' || sale.methodePaiement === 'Crédit' ? (t('debt') || 'Dette') : sale.methodePaiement === 'Espèces' ? (t('cash') || 'Espèces') : sale.methodePaiement}</div>
                                            </td>
                                            <td style={{ padding: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--grad-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, boxShadow: '0 4px 12px var(--primary-glow)' }}>
                                                        {sale.vendeur?.nom?.charAt(0) || 'A'}
                                                    </div>
                                                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{sale.vendeur?.nom || 'Admin'}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '24px', textAlign: 'right' }}>
                                                <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                                                    {fx.originalAmount?.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>{fx.saleCurrency}</span>
                                                </div>
                                                <div style={{ fontSize: '0.95rem', color: 'var(--success)', fontWeight: 800, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                                    <RefreshCcw size={14} /> {fx.convertedAmount.toLocaleString()} {fx.altCurrency}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '6px' }}>
                                                    {sale.articles?.length || 0} {t('articles')} · <span style={{ color: sale.statut === 'Remboursée' ? 'var(--danger)' : 'var(--success)' }}>{sale.statut || t('paid')}</span>
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
                                                                    <Eye size={16} color="var(--primary)" /> {t('details')}
                                                                </button>
                                                                <button
                                                                    onClick={() => { handlePrint(sale); setActionMenuId(null); }}
                                                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 700, borderRadius: '10px' }}
                                                                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-main)'}
                                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                                >
                                                                    <Printer size={16} color="var(--primary)" /> {t('printInvoice')}
                                                                </button>
                                                                <button
                                                                    onClick={() => { handlePrintTicket(sale); setActionMenuId(null); }}
                                                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 700, borderRadius: '10px' }}
                                                                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-main)'}
                                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                                >
                                                                    <Zap size={16} color="var(--warning)" /> {t('receipt')}
                                                                </button>
                                                                {sale.statut !== 'Remboursée' && (
                                                                    <button
                                                                        onClick={() => { handleRefund(sale); setActionMenuId(null); }}
                                                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--secondary)', fontWeight: 700, borderRadius: '10px' }}
                                                                        onMouseOver={e => e.currentTarget.style.background = 'var(--secondary-glow)'}
                                                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                                    >
                                                                        <RotateCcw size={16} /> {t('refund')}
                                                                    </button>
                                                                )}
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
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{t('noTransactions')}</h3>
                            <p style={{ fontWeight: 600 }}>{t('adjustFilters')}</p>
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
                            {t('previous')}
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
                            {t('next')}
                        </button>
                    </div>
                )}

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {t('showingRangeStart')} {filteredSales.length?indexOfFirstItem+1:0} {t('to')} {Math.min(indexOfLastItem, filteredSales.length)} {t('of')} {filteredSales.length} {t('transactionsCount')}
                </div>
            </div>

            {/* Sale Details Modal */}
            <Modal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                title={`${t('sale')} #${selectedSale?.id?.toString().slice(-6).toUpperCase()}`}
                subtitle={t('details')}
                icon={ShoppingBag}
                maxWidth="700px"
            >
                {selectedSale && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', background: 'var(--bg-main)', borderRadius: '20px' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('customer')}</p>
                                <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>{selectedSale.clientInfo?.nom || t('walkInCustomer')}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('method')}</p>
                                <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>{selectedSale.methodePaiement === 'Dette' || selectedSale.methodePaiement === 'Crédit' ? (t('debt') || 'Dette') : selectedSale.methodePaiement === 'Espèces' ? (t('cash') || 'Espèces') : selectedSale.methodePaiement}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('date') || 'Date'}</p>
                                <p style={{ fontWeight: 800 }}>{new Date(selectedSale.createdAt).toLocaleString('fr-FR', { hour12: false })}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('totalAmount')}</p>
                                {(() => {
                                    const fx = getSaleDisplayAmounts(selectedSale);
                                    return (
                                        <div>
                                            <p style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)', margin: 0 }}>
                                                {fx.originalAmount.toLocaleString()} {fx.saleCurrency}
                                            </p>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 800, margin: '4px 0 0 0' }}>
                                                ≙ {fx.convertedAmount.toLocaleString()} {fx.altCurrency}
                                            </p>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        <div>
                            <h4 style={{ marginBottom: '16px' }}>{t('articles')} ({selectedSale.articles?.length || 0})</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {selectedSale.articles?.map((art: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderRadius: '14px', border: '1.5px solid var(--border)' }}>
                                        <div>
                                            <p style={{ fontWeight: 800, color: 'var(--text-main)' }}>{art.nom}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{art.quantite} x {art.prixUnitaire?.toLocaleString()} {currency}</p>
                                        </div>
                                        <p style={{ fontWeight: 700 }}>{(art.quantite * art.prixUnitaire)?.toLocaleString()} {currency}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                            <button
                                onClick={() => handlePrintTicket(selectedSale)}
                                className="btn-premium primary"
                                style={{ flex: 1 }}
                            >
                                <Printer size={18} /> {t('printReceipt')}
                            </button>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="btn-premium secondary"
                            >
                                {t('close')}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Financial Report Modal */}
            <Modal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                title={t('financialReportTitle')}
                subtitle={t('analysisBasedOnFiltered')}
                icon={PieChart}
                maxWidth="600px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--primary-glow)', background: 'var(--primary-glow)' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <TrendingUp size={20} />
                            </div>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total historique filtré</p>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{reportStats.totalRevenue.toLocaleString()} {currency}</h3>
                        </div>
                        <div className="glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid var(--border)' }}>
                                <ShoppingBag size={20} />
                            </div>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('transactionsLabel')}</p>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{reportStats.count}</h3>
                        </div>
                    </div>

                    <div className="premium-card" style={{ padding: '24px' }}>
                        <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><DollarSign size={18} /> {t('paymentMethodSplit')}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {Object.entries(reportStats.methodSplit).map(([method, amount]: [string, any]) => (
                                <div key={method}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 800 }}>
                                        <span>{method === 'Dette' || method === 'Crédit' ? (t('debt') || 'Dette') : method === 'Espèces' ? (t('cash') || 'Espèces') : method}</span>
                                        <span>{amount.toLocaleString()} {currency}</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--bg-main)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${reportStats.totalRevenue>0?Math.max(0,Math.min(100,amount/reportStats.totalRevenue*100)):0}%` }}
                                            style={{ height: '100%', background: 'var(--primary)', borderRadius: '10px' }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {Object.keys(reportStats.methodSplit).length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>{t('noDataAvailable')}</p>
                            )}
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-main)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
                        <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{t('averageBasket')}: <span style={{ color: 'var(--text-main)' }}>{reportStats.averageValue.toLocaleString()} {currency}</span></p>
                    </div>

                    <button className="btn-premium primary" style={{ width: '100%' }} onClick={() => setShowReportModal(false)}>
                        {t('closeReport')}
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
