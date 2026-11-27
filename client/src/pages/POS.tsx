import '../design-system/warehouse.css';
import './checkout-commercial.css';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageSkeleton } from '../design-system/PageSkeleton';
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
import { postFinancial } from '../api/financialOperation';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import {useWarehouseOptions} from '../hooks/useWarehouseOptions';
import { toast } from 'sonner';
import { normalizeAmount, getEffectiveRate } from '../utils/currencyHelpers';
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
    const [deposit,setDeposit]=useState('');
    const [dueOn,setDueOn]=useState('');
    const isCreditPayment=/crédit|credit|dette/i.test(paymentMethod);
    const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotal,setSerialInput } = useCartStore();
    const { currency, user, exchangeRate: storeRate, enabledModules, checkAuth } = useAuthStore();
    const [warehouseId,setWarehouseId]=useState('');
    const staffMode=!!user&&!['admin','superadmin'].includes(user.role);
    const [staffLocation,setStaffLocation]=useState<{actor:number;id:number|null;name:string|null}|null>(null);
    const staffLocationRef=React.useRef<{actor:number;id:number|null;name:string|null}|null>(null);
    const warehouseOptions=useWarehouseOptions(user?.role==='admin',user?.id);
    const catalogRequest=React.useRef(0);
    const [catalogError,setCatalogError]=useState(false);
    // Taux vivant : sync avec le store + fallback + rechargement au focus
    const [liveRate, setLiveRate] = useState(Number(storeRate) || 2250);

    // Resync le taux depuis le store à chaque changement
    useEffect(() => {
        if (Number(storeRate) > 0) setLiveRate(Number(storeRate));
    }, [storeRate]);

    // Recharger le taux depuis le serveur au montage et au focus (si subuser)
    useEffect(() => {
        const refreshRate = async () => {
            try {
                const { data } = await api.get(`/auth/profile?t=${Date.now()}`);
                const prefs = data.user?.preferences || data.preferences || {};
                if (prefs.exchangeRate && Number(prefs.exchangeRate) > 0) {
                    setLiveRate(Number(prefs.exchangeRate));
                }
            } catch (_) { /* silencieux */ }
        };
        refreshRate();
        const onFocus = () => refreshRate();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const canPrint = (): boolean => {
        if (!user) return false;
        if (user.role === 'admin' || user.role === 'superadmin') return true;
        const perms = user.permissions || [];
        return perms.includes('pos.print') || perms.includes('pos');
    };
    
    const [cashSession, setCashSession] = useState<any>(null);
    const [cashBranch,setCashBranch]=useState<number|null>(null);
    const cashBranchRef=React.useRef<number|null>(null);
    const cashRequest=React.useRef(0);
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
            // Catalogue load resolves the authoritative cash branch.
        };
        init();
    }, []);

    useEffect(()=>{clearCart();setWarehouseId('');setStaffLocation(null);staffLocationRef.current=null;cashBranchRef.current=null;setCashBranch(null);setCashSession(null);},[user?.id]);
    useEffect(()=>{void fetchProducts(warehouseId);return()=>{catalogRequest.current++}},[warehouseId,user?.id]);
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
            toast.success(`${t('posProductAdded').replace('{name}', found.nom)}`, {
                icon: 'check',
                style: { borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--primary)' }
            });
        } else {
            toast.error(t('posBarcodeUnknown').replace('{code}', normalized), {
                description: "Le produit n'existe pas ou le code est mal renseigné.",
                icon: HelpCircle
            });
        }
    };

    const checkCashSession = async (branch=cashBranchRef.current) => {
        const run=++cashRequest.current;
        if(branch===null){setCashSession(null);setCheckingSession(true);return;}
        setCheckingSession(true);
        try{const {data}=await api.get('/cash/current',{params:{branchKey:branch,_t:Date.now()}});if(run===cashRequest.current&&branch===cashBranchRef.current)setCashSession(data||null);}
        catch(e){if(run===cashRequest.current)setCashSession(null);}
        finally{if(run===cashRequest.current&&branch===cashBranchRef.current)setCheckingSession(false);}
    };

    const fetchProducts = async (location=warehouseId) => {
        const run=++catalogRequest.current;
        setLoading(true);setCatalogError(false);cashBranchRef.current=null;setCashBranch(null);setCashSession(null);setCheckingSession(true);setShowCashModal(false);
        try {
            const list:any[]=[];let page=1,pages=1;let branch:number|null=null;let assigned:{actor:number;id:number|null;name:string|null}|null=null;
            do{
                const {data}=await api.get('/products',{params:{page,limit:100,...(location?{warehouseId:Number(location)}:{}),_t:Date.now()}});
                if(run!==catalogRequest.current)return;
                const rows=data?.data?.data;
                if(!Array.isArray(rows))throw new Error('Catalogue invalide');
                const nextBranch=data.data.branchKey;if(!Number.isSafeInteger(nextBranch)||nextBranch<0||branch!==null&&branch!==nextBranch)throw new Error('Succursale modifiée');branch=nextBranch;
                if(staffMode&&user){const id=data.data.warehouseId;if(id!==null&&(!Number.isSafeInteger(id)||id<=0))throw new Error('Emplacement invalide');if(assigned&&assigned.id!==id)throw new Error('Affectation modifiée pendant le chargement');assigned={actor:user.id,id,name:data.data.warehouseName||null};}
                list.push(...rows);pages=Number(data.data.pagination?.pages||1);page++;
                if(pages>200)throw new Error('Catalogue trop volumineux pour ce POS');
            }while(page<=pages);
            if(run===catalogRequest.current){if(assigned){if(staffLocationRef.current&&staffLocationRef.current.id!==assigned.id){clearCart();toast.error('Affectation modifiée : panier réinitialisé.');}staffLocationRef.current=assigned;setStaffLocation(assigned);}setProducts(list.map(p=>({...p,stock:Number(p.availableStock??p.unallocatedStock??p.stock)})));cashBranchRef.current=branch;setCashBranch(branch);void checkCashSession(branch);}
        }catch(e){if(run===catalogRequest.current){setProducts([]);setCatalogError(true);toast.error(t('errorLoadingProducts'));}}
        finally{if(run===catalogRequest.current)setLoading(false)}
    };

    const filteredProducts = products.filter(p =>
        p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleProductClick = (product: any) => {
            if(Number(product.stock)<=cart.filter(i=>i.id===product.id).reduce((sum,i)=>sum+i.quantite,0)){toast.error(language==='fr'?'Stock disponible insuffisant':'Insufficient available stock');return;}
            if (product.variantes && product.variantes.length > 0) {
                // Modèle configurations : chaque ligne = UNE configuration complète (Y7, Y9...), on garde la liste telle quelle
                setSelectedProductForVariants({ ...product, variantes: product.variantes });
                setTempSelectedVariants([{ nom: product.variantes[0].nom, valeur: product.variantes[0].valeur }]);
            } else {
                addToCart(product, currency, liveRate);
            }
        };

        // Modèle configurations : chaque ligne = UNE configuration complète (ex: "MODEL 1", "Y7"...), on garde la liste telle quelle
        // (plus besoin de formatVariantSummary : le nomAffiche utilise le nom de la config et les specs vont dans metadata)

        // Regroupe les variantes par nom et fusionne les valeurs uniques (évite les doublons type RAM x2, SSD x2)
        const normalizeVariantes = (variantes: any[] = []): { nom: string; valeur: string }[] => {
            const map: Record<string, string[]> = {};
            (Array.isArray(variantes) ? variantes : []).forEach((v: any) => {
                if (!v || !v.nom) return;
                const nom = String(v.nom).trim();
                if (!nom) return;
                const valeurs = String(v.valeur || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                if (!map[nom]) map[nom] = [];
                valeurs.forEach((val: string) => { if (!map[nom].includes(val)) map[nom].push(val); });
            });
            return Object.entries(map).map(([nom, valeurs]) => ({ nom, valeur: valeurs.join(', ') }));
        };

        // Dédoublonne les variantes sélectionnées (par nom) pour l'affichage panier / payload
        const dedupeSelectedVariantes = (variants: { nom: string; valeur: string }[] = []): { nom: string; valeur: string }[] => {
            const seen = new Set<string>();
            const out: { nom: string; valeur: string }[] = [];
            (Array.isArray(variants) ? variants : []).forEach((v) => {
                if (!v || !v.nom) return;
                const key = String(v.nom).trim().toLowerCase();
                if (!seen.has(key)) { seen.add(key); out.push({ nom: v.nom, valeur: v.valeur }); }
            });
            return out;
        };

        const confirmVariantSelection = () => {
            if (selectedProductForVariants) {
                addToCart(selectedProductForVariants, currency, liveRate, tempSelectedVariants);
                setSelectedProductForVariants(null);
                setTempSelectedVariants([]);
            }
        };

    const displayPrice = (product: any) => {
        const rawPrice = product.prixVente || product.prix || 0;
        const productDevise = product.devise || currency;
        const rate = liveRate;
        if (productDevise === currency) {
            return `${Number(rawPrice).toLocaleString()} ${currency}`;
        }
        let converted: number;
        if (productDevise !== currency) converted = normalizeAmount(rawPrice, productDevise, currency, rate);
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
        if (openingCash||cashBranchRef.current===null||checkingSession) return;
        const branch=cashBranchRef.current;
        setOpeningCash(true);
        try {
            const { data } = await api.post('/cash/open', { openingBalance: Number(openingBalance),branchKey:branch });
            if(cashBranchRef.current===branch)setCashSession(data?.data??data);
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

    const handleCloseSession = () => {
        if(cashBranchRef.current!==null)navigate('/cash?branchKey='+cashBranchRef.current);
    };

    const getCartItemPriceInSaleCurrency = (item: any) => {
        const rawPrice = item.prixOriginal || item.prix || 0;
        const deviseOrigin = item.deviseOriginal || currency;
        const rate = liveRate;
        if (deviseOrigin === saleCurrency) return rawPrice;
        if (deviseOrigin !== saleCurrency) return normalizeAmount(rawPrice, deviseOrigin, saleCurrency, rate);
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
        if(catalogError||cashBranchRef.current===null||checkingSession||(staffMode&&staffLocation?.actor!==user?.id)){toast.error('Actualisez le catalogue et l’emplacement avant de vendre.');return;}
        if(!navigator.onLine){toast.error(language==='fr'?'Connexion requise : aucune vente ne sera validée hors ligne.':'Connection required to complete a sale.');return;}
        const identifiers=cart.filter(item=>item.serialTracked).flatMap(item=>(item.serialInput||'').split(/[,\n]+/).map(s=>s.trim().toUpperCase()).filter(Boolean));
        if(cart.some(item=>item.serialTracked&&(item.serialInput||'').split(/[,\n]+/).map(s=>s.trim()).filter(Boolean).length!==item.quantite)||new Set(identifiers).size!==identifiers.length){toast.error('Indiquez un numéro de série distinct par appareil.');return;}
        if(isCreditPayment&&(!Number.isFinite(Number(deposit||0))||Number(deposit||0)<0||Number(deposit||0)>=getSaleTotal())){toast.error('Acompte inférieur au montant total requis.');return;}
        setLoading(true);
        setClientName(finalClientName);
        setClientPhone(finalClientPhone);
        setClientEmail(finalClientEmail);
        
        const saleTotal = getSaleTotal();
                const salePayload = {
                    warehouseId:staffMode?staffLocation?.id??null:warehouseId?Number(warehouseId):null,
                    items: cart.map(item => {
                        const itemSalePrice = getCartItemPriceInSaleCurrency(item);
                        const cleanVariantes = dedupeSelectedVariantes(item.selectedVariantes || []);
                        // nomAffiche court pour la facture : "hp probook - Y7" (specs complètes dans metadata)
                        const configLabel = cleanVariantes.length > 0 ? cleanVariantes[0].nom : '';
                        const normalizedName = configLabel ? `${item.nom} - ${configLabel}` : item.nom;
                        return {
                            id: item.id,
                            nom: item.nom,
                            nomAffiche: normalizedName,
                            prix: itemSalePrice,
                            prixUnitaire: itemSalePrice,
                        prixAchat: item.prixAchat || 0,
                        deviseProduit: item.deviseOriginal || saleCurrency || currency || 'USD',
                        quantite: item.quantite,
                        serialNumbers:item.serialTracked?(item.serialInput||'').split(/[,\n]+/).map(s=>s.trim()).filter(Boolean):[],
                        selectedVariantes: cleanVariantes,
                        metadata: cleanVariantes.reduce((acc: Record<string, string>, v: { nom: string; valeur: string }) => {
                            acc[v.nom] = v.valeur;
                            return acc;
                        }, {})
                    };
                }),
        montantTotal: saleTotal,
            devise: saleCurrency || currency || 'USD',
            tauxChange: liveRate,
            methodePaiement: paymentMethod || 'Espèces',
            ...(isCreditPayment?{acompte:Number(deposit||0),dueOn:dueOn||null}:{}),
            montantRecu: paymentMethod === 'Espèces' ? (amountReceived===''?saleTotal:Number(amountReceived)) : 0,
            clientId: allClients.find(c=>c.nom.toLowerCase()===finalClientName.trim().toLowerCase() && (!finalClientPhone || c.telephone===finalClientPhone))?.id || null,
            clientInfo: {
                nom: finalClientName.trim()===t('walkInClient')?'Client de passage':(finalClientName.trim()||'Client de passage'),
                telephone: finalClientPhone.trim() || '',
                email: finalClientEmail.trim() || ''
            }
        };

        try {
            const response=await postFinancial('/sales',salePayload,'sale.create');
            const createdSale = response.data?.success ? response.data.data : response.data;
            setLastSale(createdSale);

            toast.success(t('saleCompleted'));
            setShowSuccess(true);
            setShowClientModal(false);
            clearCart();
            await Promise.all([checkCashSession(),fetchProducts(warehouseId)]);
        } catch (error: any) {
            if(!error.response && (error.code==='ERR_NETWORK'||!navigator.onLine)){
                toast.error(language==='fr'?'Résultat incertain. Conservez le panier et réessayez la même vente après reconnexion.':'Result uncertain. Keep the cart and retry the same sale after reconnecting.');
            } else toast.error(error.response?.data?.message || error.message || t('saleError'));
        } finally {
            setLoading(false);
            setClientEmail('');
        }
    };

    // Legacy queue has no reliable tenant identity. Never replay it automatically.
    useEffect(()=>{
        if(localStorage.getItem('pending-sales')) toast.warning(language==='fr'?'Anciennes ventes hors ligne détectées. Vérification manuelle nécessaire; aucune synchronisation automatique.':'Legacy offline sales detected. Manual reconciliation required.');
    },[language]);

    if (loading) return <PageSkeleton />;

    return (
        <div className="responsive-grid lumo-pos lumo-pos-commercial" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(320px, 1fr)', gap: '16px', height: 'calc(100dvh - 120px)' }}>
            {/* Catalog */}
            <div className="pc-catalog-pane" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
                <header className="pc-heading"><div><small>LUMO / POS</small><h1>{language==='fr'?'Point de vente':'Point of sale'}</h1></div><span className={cashSession?'pc-status open':'pc-status'} role="status">{checkingSession?(language==='fr'?'Vérification…':'Checking…'):cashSession?(language==='fr'?'Caisse ouverte':'Register open'):(language==='fr'?'Caisse fermée':'Register closed')}</span></header>
                {user?.role==='admin'&&<div className="lumo-pos-location"><label>{language==='fr'?'Emplacement de vente':'Sales location'} <select aria-label="Emplacement de vente" value={warehouseId} disabled={cart.length>0||warehouseOptions.loading} onChange={e=>{if(cart.length===0){setProducts([]);cashBranchRef.current=null;setCashBranch(null);setCashSession(null);setShowCashModal(false);setWarehouseId(e.target.value)}}}><option value="">{language==='fr'?'Stock non affecté':'Unallocated stock'}</option>{warehouseOptions.options.map(w=><option key={w.id} value={w.id}>{w.name} · {w.code}</option>)}</select></label>{warehouseOptions.failed&&<button onClick={warehouseOptions.retry}>Réessayer les entrepôts</button>}{cart.length>0&&<small>Videz le panier pour changer d’emplacement.</small>}</div>}
                {staffMode&&<div className="lumo-pos-location"><strong>Emplacement de vente : {staffLocation?.actor===user?.id?(staffLocation?.name||'Stock non affecté'):'Vérification requise'}</strong><small>Défini par le responsable. Rechargez le catalogue si votre affectation change.</small><button onClick={()=>fetchProducts('')}>Actualiser l’affectation</button></div>}
                {catalogError&&<button className="btn-premium" onClick={()=>fetchProducts(warehouseId)}>Recharger le catalogue</button>}
                <div className="glass lumo-pos-toolbar" style={{ padding: '12px', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                        <input 
                            type="text" 
                            aria-label={t('searchProduct')}
                            placeholder={t('searchProduct')} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: enabledModules.includes('barcode') ? '12px 116px 12px 44px' : '12px 12px 12px 44px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
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
                        disabled={checkingSession||cashBranch===null}
                        className={`btn-hover ${cashSession ? 'danger' : 'primary'}`}
                        style={{ padding: '14px 24px', borderRadius: '16px', fontWeight: 800, border: 'none', background: cashSession ? 'rgba(214, 69, 69, 0.1)' : 'var(--primary)', color: cashSession ? 'var(--danger)' : 'white', cursor: checkingSession ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: checkingSession ? 0.6 : 1 }}
                    >
                        {checkingSession ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <Zap size={18} fill={cashSession ? 'var(--danger)' : 'white'} />
                        )}
                        {checkingSession ? t('checking') : (cashSession ? t('closeRegister') : t('openRegister'))}
                    </button>
                </div>

                <div className="lumo-pos-catalog pc-products" style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(150px, 100%), 1fr))', gap: '12px', alignContent: 'start', overflowY: 'auto', paddingRight: '4px', paddingBottom: '12px' }}>
                    {filteredProducts.length === 0 && <div className="lumo-pos-empty"><Package size={32}/><p>{language==='fr'?'Aucun produit trouvé':'No products found'}</p></div>}
                    {filteredProducts.map((product) => (
                        <motion.button
                            type="button"
                            key={product.id}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleProductClick(product)}
                            className="premium-card lumo-pos-product"
                            style={{ padding: '10px', textAlign: 'left', color: 'var(--text-main)', position: 'relative', cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '190px' }}
                        >
                            <div style={{ width: '100%', height: '92px', flexShrink: 0, borderRadius: '8px', backgroundColor: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                                {product.image ? <img src={product.image} alt={product.nom} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} /> : <Package size={48} opacity={0.5} />}
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
                                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>{displayPrice(product)}</span>
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
                                <div style={{ position: 'absolute', top: '24px', right: '24px', backgroundColor: 'var(--danger)', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }}>{language==='fr'?'Stock faible':'Low stock'}</div>
                            )}
                        </motion.button>
                    ))}
                </div>
                <button type="button" className="lumo-pos-cart-jump btn-premium primary" onClick={()=>document.getElementById('lumo-pos-cart')?.scrollIntoView({block:'start',behavior:'smooth'})}><ShoppingCart size={18}/>{language==='fr'?'Voir le panier':'View cart'} · {cart.length} · {getSaleTotal().toLocaleString()} {saleCurrency}</button>
            </div>

            {/* Cart */}
            <div id="lumo-pos-cart" className="glass lumo-pos-cart pc-cart" style={{ borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShoppingCart size={28} />
                        </div>
                        <div>
                            <h2 style={{ fontWeight: 800, fontSize: '1.4rem' }}>{t('customerCart')}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{cart.length} {language === 'fr' ? 'articles sélectionnés' : 'selected items'}</p>
                        </div>
                    </div>
                    {cart.length > 0 && (
                        <button onClick={clearCart} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>{t('clearCart')}</button>
                    )}
                </div>

                <div style={{ flex: 1, minHeight: 100, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                                        {item.serialTracked&&<label style={{display:'grid',gap:4,fontSize:12,margin:'8px 0'}}>Numéros de série ({item.quantite})<textarea aria-label={'Numéros de série '+item.nom} rows={Math.min(4,item.quantite)} value={item.serialInput||''} onChange={e=>setSerialInput(item.cartId,e.target.value)} placeholder="Un numéro par ligne" maxLength={101000} style={{width:'100%',minWidth:0,padding:8,border:'1px solid var(--border)',borderRadius:8,background:'var(--bg-card)',color:'var(--text-main)'}}/></label>}
                                        {item.selectedVariantes && item.selectedVariantes.length > 0 && (
                                            dedupeSelectedVariantes(item.selectedVariantes).map((v, idx) => (
                                                <div key={idx} style={{ marginBottom: '4px' }}>
                                                    <span style={{ display: 'inline-block', fontSize: '0.68rem', padding: '2px 8px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '6px', fontWeight: 800 }}>{v.nom}</span>
                                                    {String(v.valeur || '').split(',').map(s => s.trim()).filter(Boolean).length > 0 && (
                                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                                                            {String(v.valeur).split(',').map(s => s.trim()).filter(Boolean).join(' • ')}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                        <div>
                                            <p style={{ fontWeight: 800, color: 'var(--primary)', margin: 0, fontSize: '0.9rem' }}>
                                                {displayCartItemPrice(item)}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-main)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                                        <button onClick={() => updateQuantity(item.cartId, Math.max(1, item.quantite - 1))} style={{ border: 'none', background: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><Minus size={16} /></button>
                                        <span style={{ fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>{item.quantite}</span>
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
                                <button aria-pressed={saleCurrency==='USD'} onClick={() => {setSaleCurrency('USD');setDeposit('');setAmountReceived('');}} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: saleCurrency === 'USD' ? 'var(--primary)' : 'transparent', color: saleCurrency === 'USD' ? 'white' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}>$ USD</button>
                                <button aria-pressed={saleCurrency==='CDF'} onClick={() => {setSaleCurrency('CDF');setDeposit('');setAmountReceived('');}} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: saleCurrency === 'CDF' ? 'var(--primary)' : 'transparent', color: saleCurrency === 'CDF' ? 'white' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}>FC CDF</button>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', marginBottom: '4px' }}>{t('totalToPay')}</div>
                            <div className="text-gradient" style={{ fontWeight: 800, fontSize: '2rem', lineHeight: '1', letterSpacing: '-0.02em' }}>{getSaleTotal().toLocaleString()} <span style={{ fontSize: '1rem' }}>{saleCurrency}</span></div>
                        </div>
                    </div>

                    {/* Méthode de paiement (Compact) */}
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{t('paymentMethod')}</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {[
                                { value: 'Espèces', label: `${t('cashPayment')}` },
                                { value: 'Crédit', label: `${t('creditPayment')}`, module: 'debts' },
                            ].filter(m => !m.module || enabledModules?.includes(m.module)).map(m => (
                                <button
                                    key={m.value}
                                    aria-pressed={paymentMethod===m.value}
                                    onClick={() => {setPaymentMethod(m.value);setDeposit('');setDueOn('');}}
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
                    {isCreditPayment&&<div className="lumo-pos-location"><label>Acompte encaissé ({saleCurrency})<input type="number" min={0} step={saleCurrency==='CDF'?1:0.01} value={deposit} onChange={e=>setDeposit(e.target.value)} placeholder="0"/></label><label>Échéance facultative<input type="date" value={dueOn} onChange={e=>setDueOn(e.target.value)}/></label><small>Solde : {Math.max(0,getSaleTotal()-Number(deposit||0)).toLocaleString('fr-FR')} {saleCurrency}. La créance est enregistrée dans la devise comptable.</small></div>}
                    {paymentMethod === 'Espèces' && (
                        <div style={{ background: 'linear-gradient(135deg, rgba(21,94,88,0.1), rgba(168,85,247,0.05))', borderRadius: '16px', border: '1px solid rgba(21,94,88,0.2)', padding: '16px' }}>
                            <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{t('changeToReturn')}</div>
                            <div style={{ position: 'relative', marginBottom: '8px' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>{saleCurrency === 'USD' ? '$' : 'CDF'}</span>
                                <input
                                    type="number"
                                    placeholder={t('amountReceived')}
                                    value={amountReceived}
                                    onChange={(e) => setAmountReceived(e.target.value)}
                                    style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '12px', border: '2px solid var(--primary)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 800, outline: 'none' }}
                                />
                            </div>
                            {amountReceived && !isNaN(parseFloat(amountReceived)) && (
                                <div style={{ 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: parseFloat(amountReceived) >= getSaleTotal() ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                    borderRadius: '12px', padding: '10px 14px',
                                    border: `1px solid ${parseFloat(amountReceived) >= getSaleTotal() ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                                }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: parseFloat(amountReceived) >= getSaleTotal() ? 'var(--success)' : 'var(--danger)' }}>
                                        {parseFloat(amountReceived) >= getSaleTotal() ? t('changeToGive') : t('insufficientAmount')}
                                    </span>
                                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: parseFloat(amountReceived) >= getSaleTotal() ? 'var(--success)' : 'var(--danger)' }}>
                                        {Math.abs(parseFloat(amountReceived) - getSaleTotal()).toLocaleString()} {saleCurrency}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleCheckout}
                        disabled={checkingSession||cashBranch===null||catalogError||(enabledModules?.includes('cash') && !cashSession) || cart.length === 0}
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
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="premium-card" style={{ width: '100%', maxWidth: '450px', padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{t('chooseVariant')}</h2>
                                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>{selectedProductForVariants.nom}</p>
                                </div>
                                <button onClick={() => setSelectedProductForVariants(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                                {(selectedProductForVariants.variantes || []).map((v: any, idx: number) => {
                                    const isActive = tempSelectedVariants.some(sv => sv.nom === v.nom && sv.valeur === v.valeur);
                                    const specList = String(v.valeur || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setTempSelectedVariants([{ nom: v.nom, valeur: v.valeur }])}
                                            style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px',
                                                padding: '14px 16px', borderRadius: '14px', cursor: 'pointer', textAlign: 'left', width: '100%',
                                                border: `2px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                                                background: isActive ? 'var(--primary-glow)' : 'var(--bg-main)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <span style={{ fontSize: '1rem', fontWeight: 800, color: isActive ? 'var(--primary)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {isActive && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />}
                                                {v.nom || `${selectedProductForVariants.nom} ${idx + 1}`}
                                            </span>
                                            {specList.length > 0 && (
                                                <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.5 }}>
                                                    {specList.join(' • ')}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
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
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>{t('cashRegisterOpening')}</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>{t('initialBalanceHint').replace('{currency}', user?.entreprise?.devise==='USD'?'USD':'CDF')}</p>
                            <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} autoFocus style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '2px solid var(--primary)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', outline: 'none', marginBottom: '32px' }} />
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
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px' }}>{t('saleSuccessful')}</h2>
                            {canPrint() && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
                                <button onClick={() => (generateTicket as any)(lastSale, user)} className="btn-hover" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Download size={24} color="var(--primary)" />
                                    <span style={{ fontWeight: 800 }}>{t('ticket')}</span>
                                </button>
                                <button onClick={() => (generateInvoice as any)(lastSale, user)} className="btn-hover" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Download size={24} color="#155E58" />
                                    <span style={{ fontWeight: 800 }}>{t('invoiceA4')}</span>
                                </button>
                            </div>
                            )}
                            <button onClick={() => { setShowSuccess(false); setAmountReceived('');setDeposit('');setDueOn(''); setClientName(''); setClientPhone(''); setClientEmail(''); }} className="btn-premium primary" style={{ width: '100%', padding: '16px', borderRadius: '18px' }}>{t('newSale')}</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Sélection Client */}
            <AnimatePresence>
                {showClientModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="premium-card" style={{ width: '100%', maxWidth: '450px', padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{t('checkoutCustomer')}</h2>
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
