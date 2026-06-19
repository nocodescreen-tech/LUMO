import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    ShoppingCart, 
    Plus, 
    Minus, 
    CreditCard, 
    X, 
    ChevronRight,
    Package,
    Loader2,
    CheckCircle2,
    Zap,
    Download,
    Layers,
    ScanLine
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import BarcodeScanner from '../components/common/BarcodeScanner';
import api from '../api/axios';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import { generateInvoice, generateTicket } from '../utils/printHelpers';

const POS = () => {
    const { t } = useTranslation();
    const language = useAuthStore(state => state.language);
    const navigate = useNavigate();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [amountReceived, setAmountReceived] = useState('');
    const [receivedCurrency, setReceivedCurrency] = useState('LOCAL'); // 'LOCAL' or 'ALT'
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Espèces');
    const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotal } = useCartStore();
    const { currency, user, exchangeRate, enabledModules } = useAuthStore();

    const canPrint = (): boolean => {
        if (!user) return false;
        if (user.role === 'admin' || user.role === 'superadmin') return true;
        const perms = user.permissions || [];
        return perms.includes('pos.print') || perms.includes('pos');
    };
    
    const [cashSession, setCashSession] = useState<any>(null);
    const [showCashModal, setShowCashModal] = useState(false);
    const [openingBalance, setOpeningBalance] = useState('0');
    // Variant state
    const [selectedProductForVariants, setSelectedProductForVariants] = useState<any>(null);
    const [tempSelectedVariants, setTempSelectedVariants] = useState<any[]>([]);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [openingCash, setOpeningCash] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    const altCurrency = currency === 'CDF' ? 'USD' : 'CDF';

    const productsRef = React.useRef(products);
    useEffect(() => { productsRef.current = products; }, [products]);

    useEffect(() => {
        const init = async () => {
            setCheckingSession(true);
            // M5 Fix: Force fresh auth state to avoid stale localStorage issues
            try { await useAuthStore.getState().checkAuth(false); } catch(e) {}
            await Promise.all([fetchProducts(), checkCashSession()]);
            setCheckingSession(false);
        };
        init();
    }, []);

    const [showClientModal, setShowClientModal] = useState(false);
    const [allClients, setAllClients] = useState<any[]>([]);
    const [filteredClients, setFilteredClients] = useState<any[]>([]);
    const [clientSearch, setClientSearch] = useState('');

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const { data } = await api.get(`/clients?_t=${Date.now()}`);
                // Support both direct array and {success, data}
                const list = Array.isArray(data) ? data : (data.data?.data || data.data || []);
                setAllClients(list);
            } catch (err) {}
        };
        fetchClients();
    }, []);

    useEffect(() => {
        if (!clientSearch.trim()) {
            setFilteredClients([]);
            return;
        }
        const filtered = allClients.filter(c => 
            c.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.telephone?.includes(clientSearch) ||
            c.email?.toLowerCase().includes(clientSearch.toLowerCase())
        );
        setFilteredClients(filtered);
    }, [clientSearch, allClients]);

    useEffect(() => {
        // ── Hardware USB/HID Barcode Scanner Listener ────────────────────────────
        // USB HID scanners send keystrokes very fast (<30ms/char), terminated by Enter.
        // This distinguishes them from human typing (>100ms between keystrokes).
        if (!enabledModules.includes('barcode')) return;

        let barcodeBuffer = '';
        let lastKeyTime = Date.now();
        let bufferTimer: ReturnType<typeof setTimeout> | null = null;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            // Allow capture only when NOT focused on a user input (unless it's POS search)
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

            const now = Date.now();
            const gap = now - lastKeyTime;

            // Gap > 100ms means human typing — discard buffer and start fresh
            if (gap > 100 && barcodeBuffer.length > 0) {
                barcodeBuffer = '';
            }
            lastKeyTime = now;

            // Clear auto-flush timer
            if (bufferTimer) clearTimeout(bufferTimer);

            if (e.key === 'Enter') {
                if (barcodeBuffer.length >= 3) {
                    processBarcode(barcodeBuffer);
                }
                barcodeBuffer = '';
            } else if (e.key === 'Tab') {
                // Some scanners use Tab as terminator instead of Enter
                if (barcodeBuffer.length >= 3) {
                    e.preventDefault();
                    processBarcode(barcodeBuffer);
                    barcodeBuffer = '';
                }
            } else if (e.key.length === 1) {
                barcodeBuffer += e.key;
                // Auto-flush after 300ms if no Enter (some scanners omit it)
                bufferTimer = setTimeout(() => {
                    if (barcodeBuffer.length >= 3) {
                        processBarcode(barcodeBuffer);
                    }
                    barcodeBuffer = '';
                }, 300);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (bufferTimer) clearTimeout(bufferTimer);
        };
    }, [enabledModules]);

    const processBarcode = (code: string) => {
        // Nettoyage agressif du code
        const normalized = code.trim().replace(/[\n\r\t]/g, '');
        if (!normalized) return;

        console.log('Barcode Scanned:', normalized);

        // 1. Recherche exacte
        let found = productsRef.current.find(p => 
            (p.codeBarre && p.codeBarre === normalized) || 
            (p.sku && p.sku === normalized) ||
            (p.reference && p.reference === normalized)
        );

        // 2. Recherche avec suppression des zéros non significatifs (fallback)
        if (!found) {
            const trimmedNormalized = normalized.replace(/^0+/, '');
            found = productsRef.current.find(p => 
                (p.codeBarre && p.codeBarre.replace(/^0+/, '') === trimmedNormalized) ||
                (p.sku && p.sku.replace(/^0+/, '') === trimmedNormalized)
            );
        }

        if (found) {
            handleProductClick(found);
            toast.success(`🛒 ${t('posProductAdded').replace('{name}', found.nom)}`, {
                icon: '✅',
                style: { borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--primary)' }
            });
        } else {
            toast.error(t('posBarcodeUnknown').replace('{code}', normalized), {
                description: "Le produit n'existe pas ou le code est mal renseigné.",
                icon: '❓'
            });
        }
    };

    const checkCashSession = async () => {
        try {
            const { data } = await api.get(`/cash/current?_t=${Date.now()}`);
            setCashSession(data || null);
            console.log("Cash session status:", data ? "OPEN" : "CLOSED");
        } catch (error) {
            console.error("Failed to check cash session:", error);
            setCashSession(null);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get(`/products?_t=${Date.now()}`);
            const resData = response.data;
            
            let productsList = [];
            
            // Structure standard: { success, data: { data: [] } }
            if (resData.success && resData.data) {
                if (Array.isArray(resData.data.data)) {
                    productsList = resData.data.data;
                } else if (Array.isArray(resData.data)) {
                    productsList = resData.data;
                } else if (typeof resData.data === 'object') {
                    productsList = resData.data.products || resData.data.items || resData.data.data || [];
                }
            }
            // Fallback
            else {
                const data = resData;
                if (Array.isArray(data)) productsList = data;
                else if (data && Array.isArray(data.data)) productsList = data.data;
                else if (data && Array.isArray(data.products)) productsList = data.products;
            }
            
            setProducts(productsList);
        } catch (error) {
            toast.error(t('errorLoadingProducts'));
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleProductClick = (product: any) => {
        if (product.variantes && product.variantes.length > 0) {
            setSelectedProductForVariants(product);
            // Initialize with first values if possible or empty
            setTempSelectedVariants(product.variantes.map((v: any) => ({ nom: v.nom, valeur: v.valeur.split(',')[0].trim() })));
        } else {
            addToCart(product, currency, exchangeRate);
        }
    };

    const confirmVariantSelection = () => {
        if (selectedProductForVariants) {
            addToCart(selectedProductForVariants, currency, exchangeRate, tempSelectedVariants);
            setSelectedProductForVariants(null);
            setTempSelectedVariants([]);
        }
    };

    const displayPrice = (product: any) => {
        const rawPrice = product.prixVente || product.prix || 0;
        const productDevise = product.devise || currency;
        if (productDevise === currency) {
            return `${Number(rawPrice).toLocaleString()} ${currency}`;
        }
        let converted: number;
        if (productDevise === 'USD' && currency === 'CDF' && exchangeRate) converted = Math.round(rawPrice * exchangeRate);
        else if (productDevise === 'CDF' && currency === 'USD' && exchangeRate) converted = Math.round((rawPrice / exchangeRate) * 100) / 100;
        else converted = rawPrice;
        return `${Number(converted).toLocaleString()} ${currency}`;
    };

    const displayOriginalPrice = (product: any) => {
        const rawPrice = product.prixVente || product.prix || 0;
        const productDevise = product.devise || currency;
        if (productDevise === currency) return null;
        return `${Number(rawPrice).toLocaleString()} ${productDevise}`;
    };

    const [showSuccess, setShowSuccess] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);
    const [saleCurrency, setSaleCurrency] = useState(currency || 'USD');

    useEffect(() => {
        if (currency) setSaleCurrency(currency);
    }, [currency]);

    const handleOpenSession = async () => {
        if (openingCash) return;
        setOpeningCash(true);
        try {
            const { data } = await api.post('/cash/open', { openingBalance: Number(openingBalance) });
            setCashSession(data);
            setShowCashModal(false);
            toast.success(t('cashOpened'));
        } catch (error: any) {
            // Idempotent: si déjà ouvert, le serveur renvoie 200 maintenant
            // mais on garde une sécurité si le serveur renvoyait encore 400
            if (error.response?.status === 400 && error.response?.data?.message?.includes("déjà ouverte")) {
                setShowCashModal(false);
                checkCashSession();
            } else {
                toast.error(error.response?.data?.message || t('cashOpenError'));
            }
        } finally {
            setOpeningCash(false);
        }
    };

    const handleCloseSession = async () => {
        try {
            await api.post('/cash/close');
            setCashSession(null);
            toast.success(t('cashClosed'));
        } catch (error) {
            toast.error(t('cashCloseError'));
        }
    };

    const getCartItemPriceInSaleCurrency = (item: any) => {
        const rawPrice = item.prixOriginal || item.prix || 0;
        const deviseOrigin = item.deviseOriginal || currency;
        if (deviseOrigin === saleCurrency) return rawPrice;
        if (deviseOrigin === 'USD' && saleCurrency === 'CDF' && exchangeRate) return Math.round(rawPrice * exchangeRate);
        if (deviseOrigin === 'CDF' && saleCurrency === 'USD' && exchangeRate) return Math.round((rawPrice / exchangeRate) * 100) / 100;
        return rawPrice;
    };

    const getSaleTotal = () => {
        return cart.reduce((acc, item) => acc + (getCartItemPriceInSaleCurrency(item) * item.quantite), 0);
    };

    const displayCartItemPrice = (item: any) => {
        return `${Number(getCartItemPriceInSaleCurrency(item)).toLocaleString()} ${saleCurrency}`;
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setClientSearch(clientName === t('walkInClient') ? '' : clientName);
        setShowClientModal(true);
    };

    const executeSale = async (finalClientName: string, finalClientPhone: string, finalClientEmail: string = '') => {
        setLoading(true);
        setClientName(finalClientName);
        setClientPhone(finalClientPhone);
        setClientEmail(finalClientEmail);
        
        const saleTotal = getSaleTotal();
        const salePayload = {
            items: cart.map(item => {
                const itemSalePrice = getCartItemPriceInSaleCurrency(item);
                return {
                    id: item.id,
                    nom: item.nom,
                    prix: itemSalePrice,
                    prixUnitaire: itemSalePrice,
                prixAchat: item.prixAchat || 0,
                deviseProduit: item.deviseOriginal || saleCurrency || currency || 'USD',
                quantite: item.quantite,
                metadata: (item.selectedVariantes || []).reduce((acc: Record<string, string>, v: { nom: string; valeur: string }) => {
                    acc[v.nom] = v.valeur;
                    return acc;
                }, {})
            };
        }),
        montantTotal: saleTotal,
            devise: saleCurrency || currency || 'USD',
            tauxChange: Number(exchangeRate) || 2800,
            methodePaiement: paymentMethod || 'Espèces',
            montantRecu: paymentMethod === 'Espèces' ? Number(amountReceived) || saleTotal : saleTotal,
            clientInfo: {
                nom: finalClientName.trim() || t('walkInClient'),
                telephone: finalClientPhone.trim() || '',
                email: finalClientEmail.trim() || ''
            }
        };

        try {
            if (finalClientName.trim() && finalClientName !== t('walkInClient')) {
                const exists = allClients.find(c => c.nom.toLowerCase() === finalClientName.toLowerCase());
                if (!exists) {
                    try {
                        await api.post('/clients', {
                            nom: finalClientName.trim(),
                            telephone: finalClientPhone.trim(),
                            email: finalClientEmail.trim()
                        });
                    } catch (clientError) {
                        console.warn('Client non créé silencieusement:', clientError);
                    }
                }
            }

            const response = await api.post('/sales', salePayload);
            const createdSale = response.data?.success ? response.data.data : response.data;
            setLastSale(createdSale);

            toast.success(t('saleCompleted'));
            setShowSuccess(true);
            setShowClientModal(false);
            clearCart();
            await checkCashSession();
        } catch (error: any) {
            if (!navigator.onLine || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
                const pending = JSON.parse(localStorage.getItem('pending-sales') || '[]');
                const offlineSale = {
                    ...salePayload,
                    articles: salePayload.items,
                    id: 'OFFLINE_' + Date.now(),
                    createdAt: new Date().toISOString(),
                    status: 'OFFLINE'
                };
                pending.push(offlineSale);
                localStorage.setItem('pending-sales', JSON.stringify(pending));
                setLastSale(offlineSale);
                toast.info(t('saleSavedOffline'));
                setShowSuccess(true);
                setShowClientModal(false);
                clearCart();
            } else {
                toast.error(error.response?.data?.message || t('saleError'));
            }
        } finally {
            setLoading(false);
            setClientEmail('');
        }
    };

    // Auto-sync offline sales
    useEffect(() => {
        const syncOffline = async () => {
            if (!navigator.onLine) return;
            const pending = JSON.parse(localStorage.getItem('pending-sales') || '[]');
            if (pending.length === 0) return;

            const syncMsg = language === 'fr'
  ? `⏳ Synchronisation de ${pending.length} vente(s) hors-ligne...`
  : `⏳ Syncing ${pending.length} offline sale(s)...`;
toast.info(syncMsg);
            const remaining = [];
            for (const sale of pending) {
                try {
                    await api.post('/sales', sale);
                } catch (err) {
                    remaining.push(sale);
                }
            }
            localStorage.setItem('pending-sales', JSON.stringify(remaining));
            if (remaining.length === 0) {
                toast.success("✅ " + t('allOfflineSynced'));
            }
        };

        window.addEventListener('online', syncOffline);
        syncOffline(); // Initial check
        return () => window.removeEventListener('online', syncOffline);
    }, []);

    if (loading) return (
        <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={40} color="var(--primary)" />
        </div>
    );

    return (
        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', height: 'calc(100vh - 140px)' }}>
            {/* Catalog */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
                <div className="glass" style={{ padding: '20px', borderRadius: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                        <input 
                            type="text" 
                            placeholder={t('searchProduct')} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '16px 20px 16px 48px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
                        />
                        {enabledModules.includes('barcode') && (
                            <button 
                                onClick={() => setShowCameraModal(true)}
                                title={t('scanBarcode')}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800 }}
                            >
                                <ScanLine size={18} />
                                {t('scanBarcode')}
                            </button>
                        )}
                    </div>
                    <button 
                        onClick={() => {
                            if (checkingSession) return;
                            cashSession ? handleCloseSession() : setShowCashModal(true);
                        }}
                        disabled={checkingSession}
                        className={`btn-hover ${cashSession ? 'danger' : 'primary'}`}
                        style={{ padding: '14px 24px', borderRadius: '16px', fontWeight: 800, border: 'none', background: cashSession ? 'rgba(239, 68, 68, 0.1)' : 'var(--primary)', color: cashSession ? '#ef4444' : 'white', cursor: checkingSession ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: checkingSession ? 0.6 : 1 }}
                    >
                        {checkingSession ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <Zap size={18} fill={cashSession ? '#ef4444' : 'white'} />
                        )}
                        {checkingSession ? t('checking') : (cashSession ? t('closeRegister') : t('openRegister'))}
                    </button>
                </div>

                <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', overflowY: 'auto', paddingRight: '12px', paddingBottom: '20px' }}>
                    {filteredProducts.map((product) => (
                        <motion.div
                            key={product.id}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleProductClick(product)}
                            className="premium-card"
                            style={{ padding: '16px', position: 'relative', cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '300px' }}
                        >
                            <div style={{ width: '100%', height: '140px', flexShrink: 0, borderRadius: '16px', backgroundColor: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                                {product.image ? <img src={product.image} alt={product.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} /> : <Package size={48} opacity={0.5} />}
                            </div>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.nom}</h3>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '12px', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{product.categorie}</p>
                                    {product.variantes?.length > 0 && <Layers size={12} color="var(--primary)" />}
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: product.stock <= 5 ? 'var(--danger)' : 'var(--success)' }}>
                                    Stock: {product.stock}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                <div>
                                    <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem' }}>{displayPrice(product)}</span>
                                    {displayOriginalPrice(product) && (
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '2px' }}>
                                            ≙ {displayOriginalPrice(product)}
                                        </div>
                                    )}
                                </div>
                                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Plus size={20} />
                                </div>
                            </div>
                            {product.stock <= 5 && (
                                <div style={{ position: 'absolute', top: '24px', right: '24px', backgroundColor: 'var(--danger)', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }}>Rupture proche</div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Cart */}
            <div className="glass" style={{ borderRadius: '32px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ padding: '32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShoppingCart size={28} />
                        </div>
                        <div>
                            <h2 style={{ fontWeight: 900, fontSize: '1.4rem' }}>{t('customerCart')}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{cart.length} {language === 'fr' ? 'articles sélectionnés' : 'selected items'}</p>
                        </div>
                    </div>
                    {cart.length > 0 && (
                        <button onClick={clearCart} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>{t('clearCart')}</button>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <AnimatePresence>
                        {cart.length === 0 ? (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '16px' }}>
                                <ShoppingCart size={64} opacity={0.15} />
                                <p style={{ fontWeight: 700 }}>{t('cartEmpty')}</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <motion.div
                                    key={item.cartId}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    style={{ display: 'flex', gap: '16px', alignItems: 'center' }}
                                >
                                    <div style={{ width: '64px', height: '64px', borderRadius: '14px', backgroundColor: 'var(--primary-glow)', flexShrink: 0, overflow: 'hidden' }}>
                                        {item.image ? <img src={item.image} alt={item.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Package size={24} /></div>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontWeight: 800, margin: '0 0 2px 0' }}>{item.nom}</h4>
                                        {item.selectedVariantes && item.selectedVariantes.length > 0 && (
                                            <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                                {item.selectedVariantes.map((v, idx) => (
                                                    <span key={idx} style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '4px', fontWeight: 800 }}>{v.valeur}</span>
                                                ))}
                                            </div>
                                        )}
                                        <div>
                                            <p style={{ fontWeight: 900, color: 'var(--primary)', margin: 0, fontSize: '0.9rem' }}>
                                                {displayCartItemPrice(item)}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-main)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                                        <button onClick={() => updateQuantity(item.cartId, Math.max(1, item.quantite - 1))} style={{ border: 'none', background: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><Minus size={16} /></button>
                                        <span style={{ fontWeight: 900, minWidth: '24px', textAlign: 'center' }}>{item.quantite}</span>
                                        <button onClick={() => updateQuantity(item.cartId, item.quantite + 1)} style={{ border: 'none', background: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><Plus size={16} /></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.cartId)} style={{ border: 'none', background: 'none', color: 'var(--danger)', opacity: 0.5, cursor: 'pointer' }}><X size={20} /></button>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    
                    {/* Client Info removed from here, moved to Checkout Modal */}

                    {/* Devise & Total */}
                    <div style={{ background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', marginBottom: '6px' }}>{t('saleCurrency')}</div>
                            <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border)', gap: '4px' }}>
                                <button onClick={() => setSaleCurrency('USD')} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: saleCurrency === 'USD' ? 'var(--primary)' : 'transparent', color: saleCurrency === 'USD' ? 'white' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}>$ USD</button>
                                <button onClick={() => setSaleCurrency('CDF')} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: saleCurrency === 'CDF' ? 'var(--primary)' : 'transparent', color: saleCurrency === 'CDF' ? 'white' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}>FC CDF</button>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px' }}>{t('totalToPay')}</div>
                            <div className="text-gradient" style={{ fontWeight: 900, fontSize: '2rem', lineHeight: '1', letterSpacing: '-0.02em' }}>{getSaleTotal().toLocaleString()} <span style={{ fontSize: '1rem' }}>{saleCurrency}</span></div>
                        </div>
                    </div>

                    {/* Méthode de paiement (Compact) */}
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{t('paymentMethod')}</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {[
                                { value: 'Espèces', label: `💵 ${t('cashPayment')}` },
                                { value: 'Crédit', label: `📋 ${t('creditPayment')}`, module: 'debts' },
                            ].filter(m => !m.module || enabledModules?.includes(m.module)).map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => setPaymentMethod(m.value)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '10px', cursor: 'pointer', flex: 1,
                                        border: `1.5px solid ${paymentMethod === m.value ? 'var(--primary)' : 'var(--border)'}`,
                                        background: paymentMethod === m.value ? 'var(--primary-glow)' : 'var(--bg-main)',
                                        color: paymentMethod === m.value ? 'var(--primary)' : 'var(--text-muted)',
                                        fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calculateur de monnaie à rendre (uniquement Espèces) */}
                    {paymentMethod === 'Espèces' && (
                        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.05))', borderRadius: '16px', border: '1px solid rgba(99,102,241,0.2)', padding: '16px' }}>
                            <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{t('changeToReturn')}</div>
                            <div style={{ position: 'relative', marginBottom: '8px' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: 'var(--primary)', fontSize: '1rem' }}>{saleCurrency === 'USD' ? '$' : 'CDF'}</span>
                                <input
                                    type="number"
                                    placeholder={t('amountReceived')}
                                    value={amountReceived}
                                    onChange={(e) => setAmountReceived(e.target.value)}
                                    style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '12px', border: '2px solid var(--primary)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 900, outline: 'none' }}
                                />
                            </div>
                            {amountReceived && !isNaN(parseFloat(amountReceived)) && (
                                <div style={{ 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: parseFloat(amountReceived) >= getSaleTotal() ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                    borderRadius: '12px', padding: '10px 14px',
                                    border: `1px solid ${parseFloat(amountReceived) >= getSaleTotal() ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                                }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: parseFloat(amountReceived) >= getSaleTotal() ? '#10b981' : '#ef4444' }}>
                                        {parseFloat(amountReceived) >= getSaleTotal() ? t('changeToGive') : t('insufficientAmount')}
                                    </span>
                                    <span style={{ fontWeight: 900, fontSize: '1.1rem', color: parseFloat(amountReceived) >= getSaleTotal() ? '#10b981' : '#ef4444' }}>
                                        {Math.abs(parseFloat(amountReceived) - getSaleTotal()).toLocaleString()} {saleCurrency}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleCheckout}
                        disabled={(enabledModules?.includes('cash') && !cashSession) || cart.length === 0}
                        className="btn-premium primary"
                        style={{ width: '100%', padding: '18px', borderRadius: '16px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: ((enabledModules?.includes('cash') && !cashSession) || cart.length === 0) ? 0.5 : 1 }}
                    >
                        <CreditCard size={20} /> {(enabledModules?.includes('cash') && !cashSession) ? t('openCashFirst') : t('finalizeSale')} <ChevronRight size={16} />
                    </button>
                </div>

            </div>

            {/* Modal Variantes */}
            <AnimatePresence>
                {selectedProductForVariants && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="premium-card" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>{t('chooseVariant')}</h2>
                                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>{selectedProductForVariants.nom}</p>
                                </div>
                                <button onClick={() => setSelectedProductForVariants(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                                {selectedProductForVariants.variantes.map((v: any, idx: number) => (
                                    <div key={idx}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>{v.nom}</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {(v.valeur || '').split(',').map((opt: string) => {
                                                const val = opt.trim();
                                                const isActive = tempSelectedVariants.find(sv => sv.nom === v.nom)?.valeur === val;
                                                return (
                                                    <button 
                                                        key={val}
                                                        onClick={() => {
                                                            const newV = [...tempSelectedVariants];
                                                            const existingIdx = newV.findIndex(sv => sv.nom === v.nom);
                                                            if (existingIdx >= 0) newV[existingIdx].valeur = val;
                                                            else newV.push({ nom: v.nom, valeur: val });
                                                            setTempSelectedVariants(newV);
                                                        }}
                                                        style={{ 
                                                            padding: '10px 16px', borderRadius: '12px', border: '1.5px solid', 
                                                            borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                                                            backgroundColor: isActive ? 'var(--primary-glow)' : 'var(--bg-main)',
                                                            color: isActive ? 'var(--primary)' : 'var(--text-main)',
                                                            fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {val}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={confirmVariantSelection} className="btn-premium primary" style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '1rem' }}>
                                Ajouter au panier
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Ouverture Caisse */}
            <AnimatePresence>
                {showCashModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="premium-card" style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                <Zap size={40} fill="var(--primary)" />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>{t('cashRegisterOpening')}</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>{t('initialBalanceHint').replace('{currency}', currency)}</p>
                            <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} autoFocus style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '2px solid var(--primary)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 900, textAlign: 'center', outline: 'none', marginBottom: '32px' }} />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setShowCashModal(false)} className="btn-premium secondary" style={{ flex: 1, padding: '16px' }}>{t('cancelBtn')}</button>
                                <button onClick={handleOpenSession} disabled={openingCash} className="btn-premium primary" style={{ flex: 2, padding: '16px', opacity: openingCash ? 0.6 : 1 }}>
                                    {openingCash ? t('opening') : t('openSession')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Success Overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="premium-card" style={{ padding: '60px', borderRadius: '40px', textAlign: 'center', maxWidth: '500px', background: 'var(--bg-card)', border: '2px solid var(--success)' }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--success-glow)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', border: '2px solid var(--success)' }}>
                                <CheckCircle2 size={60} />
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px' }}>{t('saleSuccessful')}</h2>
                            {canPrint() && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
                                <button onClick={() => (generateTicket as any)(lastSale, user)} className="btn-hover" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Download size={24} color="var(--primary)" />
                                    <span style={{ fontWeight: 800 }}>{t('ticket')}</span>
                                </button>
                                <button onClick={() => (generateInvoice as any)(lastSale, user)} className="btn-hover" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Download size={24} color="#6366f1" />
                                    <span style={{ fontWeight: 800 }}>{t('invoiceA4')}</span>
                                </button>
                            </div>
                            )}
                            <button onClick={() => { setShowSuccess(false); setAmountReceived(''); setClientName(''); setClientPhone(''); setClientEmail(''); }} className="btn-premium primary" style={{ width: '100%', padding: '16px', borderRadius: '18px' }}>{t('newSale')}</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Sélection Client */}
            <AnimatePresence>
                {showClientModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="premium-card" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>{t('checkoutCustomer')}</h2>
                                <button onClick={() => setShowClientModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>{t('customerName')}</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={clientSearch} 
                                        onChange={e => setClientSearch(e.target.value)} 
                                        placeholder={t('typeNameOrWalkIn')} 
                                        style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid var(--primary)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700, outline: 'none' }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !filteredClients.length) {
                                                executeSale(clientSearch || t('walkInClient'), clientPhone, clientEmail);
                                            }
                                        }}
                                    />
                                    <AnimatePresence>
                                        {filteredClients.length > 0 && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', marginTop: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                                                {filteredClients.map(c => (
                                                    <div 
                                                        key={c.id} 
                                                        onClick={() => {
                                                            setClientSearch(c.nom);
                                                            setClientPhone(c.telephone || '');
                                                            setClientEmail(c.email || '');
                                                            executeSale(c.nom, c.telephone || '', c.email || '');
                                                        }}
                                                        className="hover-row" 
                                                        style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}
                                                    >
                                                        <span style={{ fontWeight: 800 }}>{c.nom}</span>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.telephone || ''}</span>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>{t('phoneOptional')}</label>
                                <input 
                                    type="text" 
                                    value={clientPhone} 
                                    onChange={e => setClientPhone(e.target.value)} 
                                    placeholder="Ex: +243..." 
                                    style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700, outline: 'none', marginBottom: '16px' }}
                                />

                                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>{t('emailOptional')}</label>
                                <input 
                                    type="email" 
                                    value={clientEmail} 
                                    onChange={e => setClientEmail(e.target.value)} 
                                    placeholder="client@email.com" 
                                    style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700, outline: 'none' }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            executeSale(clientSearch || t('walkInClient'), clientPhone, clientEmail);
                                        }
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => executeSale(t('walkInClient'), '', '')} className="btn-premium secondary" style={{ flex: 1, padding: '16px' }}>{t('walkInCustomerBtn')}</button>
                                <button onClick={() => executeSale(clientSearch || t('walkInClient'), clientPhone, clientEmail)} className="btn-premium primary" style={{ flex: 1, padding: '16px' }}>{t('confirm')}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* ── Real Barcode Scanner Modal (ZXing + USB HID) ── */}
            <AnimatePresence>
                {showCameraModal && (
                    <BarcodeScanner
                        onDetected={(code) => {
                            processBarcode(code);
                            setShowCameraModal(false);
                        }}
                        onClose={() => setShowCameraModal(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default POS;
