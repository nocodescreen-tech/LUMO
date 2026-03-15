import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, UserCircle, Sun, Moon, LogOut, Settings, User, Check, Trash2, Sparkles, X, LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Wallet, CreditCard, Truck, Activity } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../api/axios';

const APP_NAVIGATION = [
  { label: 'Tableau de Bord', icon: LayoutDashboard, path: '/dashboard', tags: ['accueil', 'dashboard', 'tableau'] },
  { label: 'Caisse (POS)', icon: ShoppingCart, path: '/pos', tags: ['pos', 'caisse', 'vente'] },
  { label: 'Produits & Stocks', icon: Package, path: '/products', tags: ['produits', 'stock', 'inventaire'] },
  { label: 'Clients', icon: Users, path: '/clients', tags: ['clients', 'contact'] },
  { label: 'Ventes', icon: Wallet, path: '/sales', tags: ['ventes', 'historique', 'transactions'] },
  { label: 'Dettes & Crédits', icon: CreditCard, path: '/dettes', tags: ['dettes', 'crédit', 'remboursement'] },
  { label: 'Fournisseurs', icon: Truck, path: '/fournisseurs', tags: ['fournisseurs', 'achats'] },
  { label: 'Statistiques', icon: BarChart3, path: '/stats', tags: ['stats', 'rapports', 'analyses'] },
  { label: 'Activités', icon: Activity, path: '/activities', tags: ['activités', 'journal', 'logs'] },
  { label: 'Paramètres', icon: Settings, path: '/settings', tags: ['paramètres', 'config', 'profil', 'modules'] },
];

const Topbar = () => {
    const { t } = useTranslation();
    const { user, theme, setTheme, logout, currency, setCurrency } = useAuthStore();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState<any[]>([]);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Refresh notifications every minute
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            // Close search dropdown if clicking outside the search area
            if (searchInputRef.current && !searchInputRef.current.parentElement?.contains(event.target as Node)) {
                setShowSearchDrop(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const [showSearchDrop, setShowSearchDrop] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const appRouteMatches = searchQuery.trim().length > 0
        ? APP_NAVIGATION.filter(r => {
            const q = searchQuery.toLowerCase();
            return r.label.toLowerCase().includes(q) || r.tags.some(t => t.includes(q));
          }).slice(0, 5)
        : [];

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            // If there's a route match, navigate there first
            if (appRouteMatches.length > 0) {
                navigate(appRouteMatches[0].path);
                setSearchQuery('');
                setShowSearchDrop(false);
            } else {
                navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
            }
        }
        if (e.key === 'Escape') {
            setShowSearchDrop(false);
            setSearchQuery('');
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/mark-all-read');
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.lu).length;

    return (
        <div className="glass" style={{
            height: '74px',
            position: 'fixed',
            top: '16px',
            right: '16px',
            left: '312px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            borderRadius: 'var(--radius-lg)',
            zIndex: 999,
            border: '1px solid var(--border)',
        }}>
            {/* SEARCH BAR */}
            <div style={{ position: 'relative', width: '380px' }}>
                <Search 
                    size={18} 
                    style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} 
                />
                <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Rechercher une page, fonctionnalité..." 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDrop(true); }}
                    onFocus={() => setShowSearchDrop(true)}
                    onKeyDown={handleSearch}
                    style={{
                        width: '100%',
                        padding: '12px 20px 12px 48px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                        fontFamily: 'inherit'
                    }}
                />
                {searchQuery && (
                    <X 
                        size={14} 
                        onClick={() => { setSearchQuery(''); setShowSearchDrop(false); }}
                        style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }} 
                    />
                )}

                {/* App navigation dropdown */}
                <AnimatePresence>
                    {showSearchDrop && appRouteMatches.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                            className="glass"
                            style={{
                                position: 'absolute', top: '52px', left: 0, right: 0,
                                borderRadius: '18px', padding: '8px',
                                border: '1px solid var(--border)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                                zIndex: 1200
                            }}
                        >
                            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', padding: '4px 12px 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Navigation rapide
                            </div>
                            {appRouteMatches.map((r, i) => (
                                <div
                                    key={i}
                                    onClick={() => { navigate(r.path); setSearchQuery(''); setShowSearchDrop(false); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 12px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-glow)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <r.icon size={16} />
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{r.label}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* THEME TOGGLE */}
                <div 
                    onClick={toggleTheme}
                    style={{ 
                        cursor: 'pointer', 
                        color: 'var(--text-muted)', 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)'
                    }}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </div>

                {/* CURRENCY TOGGLE */}
                <div 
                    onClick={() => setCurrency(currency === 'USD' ? 'CDF' : 'USD')}
                    style={{ 
                        cursor: 'pointer', 
                        color: 'var(--primary)', 
                        padding: '0 12px',
                        height: '40px', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: 'var(--primary-glow)',
                        border: '1px solid var(--primary-glow)',
                        fontWeight: '900',
                        fontSize: '0.8rem'
                    }}
                >
                    {currency}
                </div>
                
                {/* NOTIFICATIONS */}
                <div style={{ position: 'relative' }} ref={notificationsRef}>
                    <div 
                        onClick={() => setShowNotifications(!showNotifications)}
                        style={{ 
                            cursor: 'pointer', 
                            color: 'var(--text-muted)',
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '12px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border)',
                            position: 'relative'
                        }}
                    >
                        <Bell size={20} strokeWidth={2.5} />
                        {unreadCount > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '10px',
                                height: '10px',
                                backgroundColor: '#ef4444',
                                borderRadius: '50%',
                                border: '2px solid var(--bg-card)'
                            }}></div>
                        )}
                    </div>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="glass"
                                style={{
                                    position: 'absolute',
                                    top: '55px',
                                    right: '0',
                                    width: '320px',
                                    borderRadius: '20px',
                                    padding: '16px',
                                    border: '1px solid var(--border)',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                                    zIndex: 1001,
                                    maxHeight: '400px',
                                    overflowY: 'auto'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                                    <h4 style={{ margin: 0, fontWeight: '800' }}>{t('notifications')}</h4>
                                    {unreadCount > 0 && (
                                        <span 
                                            onClick={markAllRead}
                                            style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            Tout marquer lu
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {notifications.length > 0 ? (
                                        notifications.slice(0, 10).map(n => (
                                            <div 
                                                key={n.id} 
                                                style={{ 
                                                    padding: '12px', 
                                                    borderRadius: '12px', 
                                                    backgroundColor: n.lu ? 'rgba(255,255,255,0.01)' : 'rgba(99, 102, 241, 0.05)', 
                                                    border: '1px solid var(--border)',
                                                    opacity: n.lu ? 0.7 : 1
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{n.titre}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{n.message}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            Aucune notification
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div style={{ height: '32px', width: '1px', backgroundColor: 'var(--border)' }}></div>

                {/* PROFILE MENU */}
                <div style={{ position: 'relative' }} ref={profileMenuRef}>
                    <div 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '4px', borderRadius: '50px', transition: 'background-color 0.2s' }}
                    >
                        <div style={{ 
                            width: '44px', 
                            height: '44px', 
                            borderRadius: '50%', 
                            backgroundColor: 'var(--primary-glow)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)',
                            overflow: 'hidden',
                            border: '2px solid var(--border)',
                            transition: 'border-color 0.3s',
                            position: 'relative'
                        }}>
                            {user?.avatar ? (
                                <img 
                                    src={user.avatar} 
                                    key={user.avatar}
                                    alt="Profile" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                            ) : (
                                <UserCircle size={28} />
                            )}
                            {unreadCount > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: '#ef4444',
                                    borderRadius: '50%',
                                    border: '2px solid var(--bg-card)',
                                    zIndex: 10
                                }}></div>
                            )}
                        </div>
                    </div>

                    <AnimatePresence>
                        {showProfileMenu && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="glass"
                                style={{
                                    position: 'absolute',
                                    top: '60px',
                                    right: '0',
                                    width: '240px',
                                    borderRadius: '24px',
                                    padding: '12px',
                                    border: '1px solid var(--border)',
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                    zIndex: 1001
                                }}
                            >
                                <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
                                    <p style={{ margin: 0, fontWeight: '800', fontSize: '0.95rem' }}>{user?.nom}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</p>
                                </div>
                                <div 
                                    onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-glow)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Settings size={18} />
                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{t('settings')}</span>
                                </div>
                                <div 
                                    onClick={() => { logout(); navigate('/login'); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', cursor: 'pointer', color: '#ef4444' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <LogOut size={18} />
                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{t('logout')}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Topbar;
