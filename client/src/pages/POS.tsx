import React, { useState, useEffect } from 'react';
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
    Loader2
} from 'lucide-react';
import api from '../api/axios';
import { useCartStore } from '../store/useCartStore';
import { toast } from 'sonner';

const POS = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { cart, addToCart, removeFromCart, updateQuantity, clearCart, total } = useCartStore();

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

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        try {
            await api.post('/sales', {
                items: cart,
                montantTotal: total,
                methodePaiement: 'Espèces'
            });
            toast.success("Vente enregistrée avec succès !");
            clearCart();
        } catch (error) {
            toast.error("Erreur lors de l'encaissement");
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', height: '100vh', backgroundColor: 'var(--bg-main)', color: 'white' }}>
            {/* Left: Product Selection */}
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 950 }}>Terminal <span className="text-gradient">POS</span></h1>
                    <div style={{ position: 'relative', width: '400px' }}>
                        <Search size={22} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Rechercher un produit..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '14px 14px 14px 50px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'white', outline: 'none' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px' }}>
                            <Loader2 className="animate-spin" size={40} />
                        </div>
                    ) : filteredProducts.map(product => (
                        <motion.div
                            key={product.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addToCart(product)}
                            className="glass btn-hover"
                            style={{ padding: '20px', borderRadius: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
                        >
                            <div style={{ height: '120px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={40} color="var(--text-muted)" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{product.nom}</div>
                                <div style={{ color: '#10b981', fontWeight: 950, fontSize: '1.1rem', marginTop: '4px' }}>{parseFloat(product.prix).toLocaleString()} CDF</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stock: {product.stock}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Right: Cart */}
            <div className="glass" style={{ borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShoppingCart size={24} />
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 950 }}>Panier Actuel</h2>
                </div>

                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <AnimatePresence>
                        {cart.map(item => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.02)' }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{item.nom}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{(item.prix || 0).toLocaleString()} x {item.quantite}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-main)', borderRadius: '10px', padding: '4px' }}>
                                        <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantite - 1))} style={{ border: 'none', background: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}><Minus size={14} /></button>
                                        <span style={{ width: '30px', textAlign: 'center', fontWeight: 950 }}>{item.quantite}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantite + 1)} style={{ border: 'none', background: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}><Plus size={14} /></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <div style={{ padding: '32px', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-muted)' }}>Total</span>
                        <span style={{ fontSize: '2rem', fontWeight: 950, color: '#10b981' }}>{total.toLocaleString()} CDF</span>
                    </div>
                    <button 
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="btn-hover"
                        style={{ padding: '24px', borderRadius: '24px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 950, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 20px 40px -10px var(--primary-glow)', width: '100%', cursor: 'pointer' }}
                    >
                        <CreditCard size={24} /> Encaisser la commande
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POS;
