import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Lock, 
  Unlock, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  History, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  DollarSign,
  Trash2
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import { generateCashSessionReport } from '../utils/printHelpers';
import { getDisplayAmount, normalizeAmount } from '../utils/currencyHelpers';
import { Printer } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const Cash = () => {
    const { t } = useTranslation();
    const { currency, user } = useAuthStore();
    const exchangeRate = user?.preferences?.exchangeRate || 2800;
    const shopCurrency = (user?.entreprise?.devise === 'FC' ? 'CDF' : user?.entreprise?.devise) || 'CDF';

    const formatAmt = (amount: number) => {
        const { main, sub } = getDisplayAmount(amount, shopCurrency, currency, exchangeRate);
        return <>{main} <span style={{ fontSize: '0.65em', opacity: 0.7 }}>({sub})</span></>;
    };
    
    const formatAmtStr = (amount: number) => {
        return getDisplayAmount(amount, shopCurrency, currency, exchangeRate).main;
    };
    const [currentSession, setCurrentSession] = useState<any>(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    
    const [formData, setFormData] = useState({
        openingBalanceUSD: '',
        openingBalanceCDF: '',
        closingBalanceUSD: '',
        closingBalanceCDF: '',
        note: ''
    });

    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sessionRes, historyRes] = await Promise.all([
                api.get(`/cash/current?_t=${Date.now()}`),
                api.get(`/cash/history?_t=${Date.now()}`)
            ]);
            
            const sData = sessionRes.data;
            setCurrentSession(sData?.success && sData?.data !== undefined ? sData.data : sData);
            
            const hData = historyRes.data;
            let sessionList = [];
            if (hData.success && hData.data) {
                sessionList = Array.isArray(hData.data.sessions) ? hData.data.sessions : (Array.isArray(hData.data) ? hData.data : []);
            } else {
                if (Array.isArray(hData)) sessionList = hData;
                else if (hData && Array.isArray(hData.data)) sessionList = hData.data;
                else if (hData && Array.isArray(hData.sessions)) sessionList = hData.sessions;
            }
            
            setSessions(sessionList);
        } catch (error) {
            toast.error(t('cashLoadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSession = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const totalUSD = Number(formData.openingBalanceUSD) || 0;
            const totalCDF = Number(formData.openingBalanceCDF) || 0;
            
            // Convert both to shop currency correctly
            const usdInShopCurrency = shopCurrency === 'CDF' 
                ? normalizeAmount(totalUSD, 'USD', 'CDF', exchangeRate) 
                : totalUSD;
            const cdfInShopCurrency = shopCurrency === 'CDF' 
                ? totalCDF 
                : normalizeAmount(totalCDF, 'CDF', 'USD', exchangeRate);
            const combinedShopCurrency = usdInShopCurrency + cdfInShopCurrency;

            const { data } = await api.post('/cash/open', {
                openingBalance: combinedShopCurrency,
                note: formData.note
            });
            setCurrentSession(data);
            setShowOpenModal(false);
            setFormData({ ...formData, openingBalanceUSD: '', openingBalanceCDF: '', note: '' });
            toast.success(t('cashOpenedSuccess'));
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('cashOpenError'));
        }
    };

    const handleCloseSession = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const totalUSD = Number(formData.closingBalanceUSD) || 0;
            const totalCDF = Number(formData.closingBalanceCDF) || 0;
            
            // Convert both to shop currency correctly
            const usdInShopCurrency = shopCurrency === 'CDF' 
                ? normalizeAmount(totalUSD, 'USD', 'CDF', exchangeRate) 
                : totalUSD;
            const cdfInShopCurrency = shopCurrency === 'CDF' 
                ? totalCDF 
                : normalizeAmount(totalCDF, 'CDF', 'USD', exchangeRate);
            const combinedShopCurrency = usdInShopCurrency + cdfInShopCurrency;

            await api.post('/cash/close', {
                closingBalance: combinedShopCurrency,
                note: formData.note
            });
            setCurrentSession(null);
            setShowCloseModal(false);
            setFormData({ ...formData, closingBalanceUSD: '', closingBalanceCDF: '', note: '' });
            toast.success(t('cashClosedSuccess'));
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('cashCloseError'));
        }
    };
    const handleDeleteSession = async () => {
        if (!confirmDelete.id) return;
        try {
            await api.delete(`/cash/${confirmDelete.id}`);
            toast.success(t('sessionDeleted'));
            setConfirmDelete({ isOpen: false, id: null });
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('deleteError'));
        }
    };


    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('loading')}</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="title-xl">{t('cashMgmtPrefix')} <span className="text-gradient">{t('cashRegister')}</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('cashSubtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {currentSession ? (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => generateCashSessionReport(currentSession, { ...useAuthStore.getState().user, preferences: { currency } })} className="btn-premium secondary" style={{ background: 'var(--bg-card)' }}>
                                <Printer size={18} /> {t('printReport')}
                            </button>
                            <button onClick={() => setShowCloseModal(true)} className="btn-premium secondary" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                                <Lock size={18} /> {t('closeCash')}
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowOpenModal(true)} className="btn-premium primary">
                            <Unlock size={18} /> {t('openCash')}
                        </button>
                    )}
                </div>
            </div>

            {/* Status Card */}
            <div className="premium-card" style={{ padding: '40px', borderRadius: '40px', background: currentSession ? 'var(--primary-glow)' : 'var(--bg-card)', border: currentSession ? '1px solid var(--primary)' : '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <div style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '30px', 
                        background: currentSession ? 'var(--primary)' : 'var(--text-muted)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: currentSession ? '0 20px 40px -10px var(--primary-glow)' : 'none'
                    }}>
                        {currentSession ? <Unlock size={48} color="white" /> : <Lock size={48} color="white" />}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <span style={{ 
                                padding: '6px 16px', 
                                borderRadius: '100px', 
                                fontSize: '0.8rem', 
                                fontWeight: 900, 
                                background: currentSession ? '#10b981' : '#ef4444', 
                                color: 'white',
                                textTransform: 'uppercase'
                            }}>
                                {currentSession ? 'Caisse Ouverte' : 'Caisse Fermée'}
                            </span>
                            {currentSession && (
                                <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>
                                    Depuis le {new Date(currentSession.openingTime).toLocaleString()}
                                </span>
                            )}
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 950, margin: 0 }}>
                            {currentSession ? (
                                <>{formatAmt(Number(currentSession.openingBalance))} <span style={{ fontSize: '1.2rem', opacity: 0.6 }}><br/>(Fond initial)</span></>
                            ) : (
                                "Prêt pour une nouvelle session ?"
                            )}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <AnimatePresence>
                {currentSession && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}
                    >
                        <div className="premium-card" style={{ padding: '24px', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#10b981', marginBottom: '16px' }}>
                                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)' }}>
                                    <TrendingUp size={20} />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>VENTES DU JOUR</span>
                            </div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 950 }}>{formatAmt(Number(currentSession.totalSales || 0))}</h3>
                        </div>

                        <div className="premium-card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-main)', border: '2px dashed var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary)', marginBottom: '16px' }}>
                                <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--primary-glow)' }}>
                                    <Calculator size={20} />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>SOLDE THÉORIQUE</span>
                            </div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 950 }}>
                                {formatAmt(Number(currentSession.openingBalance) + Number(currentSession.totalSales || 0))}
                            </h3>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* History Table */}
            <div className="premium-card" style={{ padding: '32px', borderRadius: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                    <History size={24} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 950, margin: 0 }}>Historique des Sessions</h3>
                </div>
                
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                <th style={{ padding: '0 24px' }}>Ouverture / Fermeture</th>
                                <th style={{ padding: '0 24px' }}>Fond Initial</th>
                                <th style={{ padding: '0 24px' }}>Ventes</th>
                                <th style={{ padding: '0 24px' }}>Solde Final</th>
                                <th style={{ padding: '0 24px' }}>Écart</th>
                                <th style={{ padding: '0 24px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((s: any, i: number) => {
                                const diff = Number(s.closingBalance) - Number(s.expectedBalance);
                                return (
                                    <motion.tr 
                                        key={s.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        style={{ background: 'var(--bg-main)', borderRadius: '16px' }}
                                    >
                                        <td style={{ padding: '20px 24px', borderRadius: '16px 0 0 16px' }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{new Date(s.openingTime).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {new Date(s.openingTime).toLocaleTimeString()} - {s.closingTime ? new Date(s.closingTime).toLocaleTimeString() : 'En cours'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', fontWeight: 700 }}>{formatAmt(Number(s.openingBalance))}</td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ color: '#10b981', fontWeight: 700 }}>+{formatAmtStr(Number(s.totalSales))}</div>
                                        </td>
                                        <td style={{ padding: '20px 24px', fontWeight: 900 }}>{formatAmt(Number(s.closingBalance || 0))}</td>
                                        <td style={{ padding: '20px 24px' }}>
                                            {s.status === 'CLOSED' ? (
                                                <span style={{ 
                                                    fontWeight: 900, 
                                                    color: diff === 0 ? '#10b981' : '#ef4444',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    {diff === 0 ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                                    {diff > 0 ? `+${formatAmtStr(diff)}` : formatAmtStr(diff)}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>SESSION ACTIVE</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right', borderRadius: '0 16px 16px 0', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => generateCashSessionReport(s, { ...useAuthStore.getState().user, preferences: { currency } })}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '8px' }}
                                                title={t('printReport')}
                                            >
                                                <Printer size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setConfirmDelete({ isOpen: true, id: s.id })}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                                                title="Supprimer la session"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Opening Modal */}
            <Modal
                isOpen={showOpenModal}
                onClose={() => setShowOpenModal(false)}
                title={t('openCash')}
                subtitle="Définissez le montant initial présent dans le tiroir-caisse."
                icon={Unlock}
            >
                <form onSubmit={handleOpenSession} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '8px' }}>MONTANT EN USD</label>
                            <div style={{ position: 'relative' }}>
                                <DollarSign size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="number" 
                                    value={formData.openingBalanceUSD}
                                    onChange={(e) => setFormData({ ...formData, openingBalanceUSD: e.target.value })}
                                    placeholder="0.00"
                                    style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 800 }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '8px' }}>MONTANT EN CDF</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 800 }}>FC</span>
                                <input 
                                    type="number" 
                                    value={formData.openingBalanceCDF}
                                    onChange={(e) => setFormData({ ...formData, openingBalanceCDF: e.target.value })}
                                    placeholder="0.00"
                                    style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 800 }}
                                />
                            </div>
                        </div>
                    </div>
{(formData.openingBalanceUSD || formData.openingBalanceCDF) && (
                         <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                             <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>TOTAL CALCULÉ</div>
                             <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>
                                 {formatAmt((shopCurrency === 'CDF' ? normalizeAmount(Number(formData.openingBalanceUSD) || 0, 'USD', 'CDF', exchangeRate) : Number(formData.openingBalanceUSD) || 0) + 
                                           (shopCurrency === 'CDF' ? Number(formData.openingBalanceCDF) || 0 : normalizeAmount(Number(formData.openingBalanceCDF) || 0, 'CDF', 'USD', exchangeRate)))}
                             </div>
                         </div>
                     )}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '8px' }}>NOTE PARTICULIÈRE (OPTIONNEL)</label>
                        <textarea 
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            placeholder="Ex: Changement de shift, billets de 100 uniquement..."
                            style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100px', resize: 'none', fontWeight: 600 }}
                        />
                    </div>
                    <button type="submit" className="btn-premium primary" style={{ width: '100%', padding: '20px' }}>
                        Confirmer l'Ouverture
                    </button>
                </form>
            </Modal>

            {/* Closing Modal */}
            <Modal
                isOpen={showCloseModal}
                onClose={() => setShowCloseModal(false)}
                title={t('closeCash')}
                subtitle="Vérifiez le solde et fermez la session de travail."
                icon={Lock}
            >
                <form onSubmit={handleCloseSession} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ padding: '20px', borderRadius: '20px', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Solde Théorique attendu :</span>
                            <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.2rem' }}>
                                {formatAmt(Number(currentSession?.openingBalance) + Number(currentSession?.totalSales || 0))}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '8px' }}>MONTANT EN USD</label>
                            <div style={{ position: 'relative' }}>
                                <DollarSign size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="number" 
                                    value={formData.closingBalanceUSD}
                                    onChange={(e) => setFormData({ ...formData, closingBalanceUSD: e.target.value })}
                                    placeholder="0.00"
                                    style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 800 }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '8px' }}>MONTANT EN CDF</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 800 }}>FC</span>
                                <input 
                                    type="number" 
                                    value={formData.closingBalanceCDF}
                                    onChange={(e) => setFormData({ ...formData, closingBalanceCDF: e.target.value })}
                                    placeholder="0.00"
                                    style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 800 }}
                                />
                            </div>
                        </div>
                    </div>
{(formData.closingBalanceUSD || formData.closingBalanceCDF) && (
                         <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                             <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>TOTAL CALCULÉ</div>
                             <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>
                                 {formatAmt((shopCurrency === 'CDF' ? normalizeAmount(Number(formData.closingBalanceUSD) || 0, 'USD', 'CDF', exchangeRate) : Number(formData.closingBalanceUSD) || 0) + 
                                           (shopCurrency === 'CDF' ? Number(formData.closingBalanceCDF) || 0 : normalizeAmount(Number(formData.closingBalanceCDF) || 0, 'CDF', 'USD', exchangeRate)))}
                             </div>
                         </div>
                     )}
                    <button type="submit" className="btn-premium primary" style={{ width: '100%', padding: '20px', background: '#ef4444', boxShadow: '0 20px 40px -10px rgba(239, 68, 68, 0.3)' }}>
                        Confirmer la Clôture
                    </button>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: null })}
                onConfirm={handleDeleteSession}
                title="Supprimer la Session"
                message="Êtes-vous sûr de vouloir supprimer définitivement cette session de caisse ? Cette action est irréversible."
            />
        </div>
    );
};

export default Cash;
