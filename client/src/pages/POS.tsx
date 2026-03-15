import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    ShoppingCart, 
    Trash2, 
    Plus, 
    Minus, 
    CreditCard, 
    X, 
    ChevronRight,
    Package,
    Loader2,
    CheckCircle2,
    Zap,
    Download
} from 'lucide-react';
import api from '../api/axios';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import { generateInvoice } from '../utils/printHelpers';

const POS = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotal } = useCartStore();
    const { currency, user } = useAuthStore();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products');
            setProducts(data);
        } catch (error) {
            toast.error("Erreur de chargement des produits");
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => 
        p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [showSuccess, setShowSuccess] = useState(false);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        try {
            const { data } = await api.post('/sales', {
                items: cart,
                montantTotal: getTotal(),
                methodePaiement: 'Espèces'
            });
            
            // Generate and print invoice
            (generateInvoice as any)(data, user);
            
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                clearCart();
            }, 3000);
            
            toast.success("Vente terminée avec succès !");
        } catch (error) {
            toast.error("Erreur lors de la finalisation de la vente");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={40} color="var(--primary)" />
        </div>
    );

    return (
        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', height: 'calc(100vh - 160px)' }}>
            {/* Catalog */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflow: 'hidden' }}>
                <div className="glass" style={{ padding: '20px', borderRadius: '24px', position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '32px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                    <input 
                        type="text" 
                        placeholder="Rechercher un produit ou catégorie..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '16px 20px 16px 56px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', overflowY: 'auto', paddingRight: '12px', paddingBottom: '20px' }}>
                    {filteredProducts.map((product) => (
                        <motion.div
                            key={product.id}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => addToCart(product)}
                            className="premium-card"
                            style={{ padding: '16px', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
                        >
                            <div style={{ width: '100%', height: '140px', borderRadius: '16px', backgroundColor: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                                {product.image ? <img src={product.image} alt={product.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} /> : <Package size={48} opacity={0.5} />}
                            </div>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.nom}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>{product.categorie}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.2rem' }}>{product.prixVente.toLocaleString()} {currency}</span>
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
                            <h2 style={{ fontWeight: 900, fontSize: '1.4rem' }}>Panier Client</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{cart.length} articles sélectionnés</p>
                        </div>
                    </div>
                    {cart.length > 0 && (
                        <button onClick={clearCart} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Vider</button>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <AnimatePresence>
                        {cart.length === 0 ? (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '16px' }}>
                                <ShoppingCart size={64} opacity={0.15} />
                                <p style={{ fontWeight: 700 }}>Le panier est vide</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    style={{ display: 'flex', gap: '16px', alignItems: 'center' }}
                                >
                                    <div style={{ width: '64px', height: '64px', borderRadius: '14px', backgroundColor: 'var(--primary-glow)', flexShrink: 0, overflow: 'hidden' }}>
                                        {(item as any).image ? <img src={(item as any).image} alt={item.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Package size={24} /></div>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontWeight: 800, margin: '0 0 4px 0' }}>{item.nom}</h4>
                                        <p style={{ fontWeight: 900, color: 'var(--primary)', margin: 0 }}>{(item as any).prixVente?.toLocaleString()} {currency}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-main)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                                        <button onClick={() => updateQuantity(item.id, Math.max(1, ((item as any).quantity || (item as any).quantite || 1) - 1))} style={{ border: 'none', background: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><Minus size={16} /></button>
                                        <span style={{ fontWeight: 900, minWidth: '24px', textAlign: 'center' }}>{(item as any).quantity || (item as any).quantite}</span>
                                        <button onClick={() => updateQuantity(item.id, ((item as any).quantity || (item as any).quantite || 1) + 1)} style={{ border: 'none', background: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><Plus size={16} /></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} style={{ border: 'none', background: 'none', color: 'var(--danger)', opacity: 0.5, cursor: 'pointer' }}><X size={20} /></button>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                <div style={{ padding: '32px', backgroundColor: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.2rem' }}>Total à payer</span>
                        <span className="text-gradient" style={{ fontWeight: 900, fontSize: '2.2rem' }}>{getTotal().toLocaleString()} {currency}</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="btn-premium primary"
                        style={{ width: '100%', padding: '24px', borderRadius: '20px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: cart.length === 0 ? 0.5 : 1 }}
                    >
                        <CreditCard size={24} /> Finaliser la vente <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Success Overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ 
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
                            zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <motion.div 
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="premium-card"
                            style={{ padding: '60px', borderRadius: '40px', textAlign: 'center', maxWidth: '500px', background: 'var(--bg-card)', border: '2px solid var(--success)' }}
                        >
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
                                style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--success-glow)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', border: '2px solid var(--success)' }}
                            >
                                <CheckCircle2 size={60} />
                            </motion.div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px', letterSpacing: '-0.05em' }}>Vente Réussie !</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '40px', fontWeight: 600 }}>La transaction a été enregistrée et la facture est en cours d'impression.</p>
                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                <button onClick={() => setShowSuccess(false)} className="btn-premium secondary" style={{ padding: '16px 32px', borderRadius: '18px' }}>Fermer</button>
                                <button onClick={() => { setShowSuccess(false); navigate('/sales'); }} className="btn-premium primary" style={{ padding: '16px 32px', borderRadius: '18px' }}>Gérer les ventes</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default POS;
