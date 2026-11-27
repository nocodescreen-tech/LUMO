import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Package,
    Users,
    Truck,
    DollarSign,
    ShoppingCart,
    ShoppingBag,
    BarChart3,
    Settings,
    Bell,
    Search,
    Moon,
    Sun,
    LogOut,
    ChevronLeft,
    Menu,
    Wallet,
    Activity,
    CreditCard,
    ShieldCheck,
    History,
    UserPlus
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import NotificationDropdown from './NotificationDropdown';
import Logo from './Logo';
import api from '../../api/axios';
import { socketService } from '../../utils/socket';
import { toast } from 'sonner';
import SessionTimeoutModal from './SessionTimeoutModal';
import Modal from '../common/Modal';


import { translations } from '../../translations';

const Layout = ({ children }: { children: React.ReactNode }) => {
    const {
        theme,
        setTheme,
        language,
        setLanguage,
        enabledModules,
        currency,
        user,
        logout
    } = useAuthStore();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [apiSearchResults, setApiSearchResults] = useState<any>(null);
    const searchTimeoutRef = useRef<any>(null);

    // Recherche API avec debounce
    useEffect(() => {
        if (searchQuery.length >= 2) {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const { data } = await api.get('/search?q=' + encodeURIComponent(searchQuery));
                    setApiSearchResults(data);
                } catch { setApiSearchResults(null); }
            }, 300);
        } else {
            setApiSearchResults(null);
        }
        return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
    }, [searchQuery]);
    const navigate = useNavigate();
    const location = useLocation();
    const t = (translations as any)[language] || translations.fr;
    const playNotificationCling = React.useCallback(() => {
        try {
            const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1320, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch (_) {
            // Silent fallback if audio is blocked by browser policy
        }
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const { data } = await api.get('/notifications');
            const notifications = Array.isArray(data) ? data : [];
            const count = notifications.filter((n: any) => !n.lu).length;
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000); // 1m poll backup
        
        // Socket.io integration
        if (user?.id) {
            const socket = socketService.connect(user.id);
            
            socket.on('notification', (notif: any) => {
                setUnreadCount(prev => prev + 1);
                const soundEnabled = user?.preferences?.notificationSoundEnabled !== false;
                if (soundEnabled) {
                    playNotificationCling();
                }
                toast.info(notif.titre || 'Nouvelle notification', {
                    description: notif.contenu || notif.message,
                    duration: 5000,
                    action: {
                        label: 'Voir',
                        onClick: () => setShowNotifications(true)
                    }
                });
            });

            return () => {
                socket.off('notification');
                socketService.disconnect();
                clearInterval(interval);
            };
        }
        
        return () => clearInterval(interval);
    }, [user?.id, playNotificationCling]);

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            const mobile = w <= 768;
            const tablet = w > 768 && w <= 1024;
            setIsMobile(mobile);
            setIsTablet(tablet);
            if (mobile) setIsSidebarOpen(false);
            else if (tablet) setIsSidebarOpen(false);
        };
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        // Appel initial pour détecter l'état mobile au premier rendu
        handleResize();

        window.addEventListener('resize', handleResize);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const navItems = [
        ...(user?.role === 'superadmin'
            ? [
                { name: t.adminPlatform || 'Admin Platform', icon: ShieldCheck, path: '/superadmin', group: 'PLATFORM' },
                { name: t.globalSettings || 'Global Settings', icon: Settings, path: '/settings', group: 'PLATFORM' },
                { name: t.auditLogs || 'Audit Logs', icon: Activity, path: '/activities', group: 'PLATFORM' },
            ]
            : []),
        { name: t.dashboard, icon: LayoutDashboard, path: '/', group: 'STORE' },
        { name: t.pos, icon: ShoppingCart, path: '/pos', group: 'STORE' },
        { name: t.products, icon: Package, path: '/products', group: 'STORE' },
        { name: t.clients, icon: Users, path: '/clients', group: 'STORE' },
        ...(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'gerant'
          ? [{ name: t.team || 'Équipe', icon: UserPlus, path: '/subusers', group: 'STORE' }]
          : []),
        { name: t.sales, icon: Wallet, path: '/sales', group: 'STORE' },
        { name: t.purchases, icon: ShoppingBag, path: '/purchases', group: 'STORE' },
        { name: t.stockHistoryNav || 'Stock History', icon: History, path: '/stock-history', group: 'STORE' },
        ...(enabledModules.includes('analytics') ? [{ name: t.stats, icon: BarChart3, path: '/stats', group: 'STORE' }] : []),
        ...(enabledModules.includes('cash') ? [{ name: t.cashNav || 'Treasury', icon: Wallet, path: '/cash', group: 'STORE' }] : []),
        ...(enabledModules.includes('suppliers') ? [{ name: t.suppliers, icon: Truck, path: '/fournisseurs', group: 'STORE' }] : []),
        ...(enabledModules.includes('debts') ? [{ name: t.debts, icon: CreditCard, path: '/dettes', group: 'STORE' }] : []),
        ...(user?.role !== 'superadmin' ? [{ name: t.activities, icon: Activity, path: '/activities', group: 'STORE' }] : []),
        ...(user?.role !== 'superadmin' ? [{ name: t.settings, icon: Settings, path: '/settings', group: 'STORE' }] : []),
    ];

    const groups = [...new Set(navItems.map(i => i.group))];

    const getAvatarUrl = () => {
        if (!user?.avatar || user.avatar === 'default_avatar.png') {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nom || 'U')}&background=6366f1&color=fff&bold=true&size=80`;
        }
        return user.avatar;
    };

    return (
        <div className="lumo-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)', position: 'relative' }}>
            {/* Session Timeout Warning Modal */}
            <SessionTimeoutModal />

            {/* Logout Confirmation Modal */}
            <Modal
                isOpen={showLogoutConfirm}
                onClose={() => !logoutLoading && setShowLogoutConfirm(false)}
                title={t.logout || 'Déconnexion'}
                subtitle={t.logoutConfirmMessage || 'Voulez-vous vraiment vous déconnecter ?'}
                icon={LogOut}
                maxWidth="420px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                    <button
                        disabled={logoutLoading}
                        onClick={async () => {
                            setLogoutLoading(true);
                            await logout();
                            setLogoutLoading(false);
                            setShowLogoutConfirm(false);
                        }}
                        style={{
                            width: '100%', padding: '16px', borderRadius: '16px',
                            border: 'none', background: 'var(--danger)', color: 'white',
                            fontWeight: '800', fontSize: '1rem',
                            cursor: logoutLoading ? 'not-allowed' : 'pointer',
                            opacity: logoutLoading ? 0.7 : 1,
                            boxShadow: '0 8px 20px -6px rgba(239, 68, 68, 0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                    >
                        <LogOut size={18} />
                        {logoutLoading ? 'Déconnexion...' : (t.logoutConfirmYes || 'Oui, me déconnecter')}
                    </button>
                    <button
                        disabled={logoutLoading}
                        onClick={() => setShowLogoutConfirm(false)}
                        style={{
                            width: '100%', padding: '16px', borderRadius: '16px',
                            border: '1.5px solid var(--border)', background: 'transparent',
                            color: 'var(--text-main)', fontWeight: '700', fontSize: '1rem',
                            cursor: logoutLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {t.cancel || 'Annuler'}
                    </button>
                </div>
            </Modal>

            {/* Mobile overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}


            {/* Sidebar */}
            <motion.aside
                className="lumo-sidebar"
                animate={{ 
                    width: isSidebarOpen ? (isMobile ? 280 : 248) : (isMobile ? 0 : 72),
                    x: isMobile && !isSidebarOpen ? -280 : 0
                }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 1000,
                    flexShrink: 0,
                    backgroundColor: isMobile ? 'var(--bg-card)' : 'var(--bg-sidebar)',
                    backdropFilter: isMobile ? 'none' : 'none',
                    borderRight: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: isMobile && isSidebarOpen ? 'var(--shadow-premium)' : 'none'
                }}
            >
                {/* Logo area */}
                <div style={{
                    padding: isSidebarOpen ? '16px 18px' : '16px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isSidebarOpen ? 'space-between' : 'center',
                    borderBottom: '1px solid var(--border)',
                    gap: '12px',
                    height: '68px'
                }}>
                    {(isSidebarOpen || !isMobile) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
                            <Logo size={36} showText={isSidebarOpen} />
                        </div>
                    )}
                    {isSidebarOpen && isMobile && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            style={{ 
                                background: 'var(--sidebar-active)', 
                                cursor: 'pointer', 
                                color: 'var(--text-main)', 
                                display: 'flex', 
                                padding: '10px', 
                                borderRadius: '12px',
                                border: '1px solid var(--border)'
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                </div>

                {isSidebarOpen && <div className="lumo-workspace">
 <div className="lumo-workspace-icon"><ShoppingBag size={18}/></div>
 <div className="lumo-workspace-text"><span>{language === 'fr' ? 'Espace de travail' : 'Workspace'}</span><strong>{user?.entreprise?.nom || user?.nom || 'LUMO'}</strong></div>
 </div>}
 {/* Nav */}
                <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }} className="premium-scroll">
                    {groups.map(group => {
                        const items = navItems.filter(i => i.group === group);
                        return (
                            <React.Fragment key={group}>
                                {isSidebarOpen && (
                                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '16px 12px 8px', textTransform: 'uppercase' }}>
                                        {group === 'PLATFORM' ? (language === 'fr' ? 'Plateforme' : 'Platform') : (language === 'fr' ? 'Gestion commerciale' : 'Business')}
                                    </div>
                                )}
                                {items.map(item => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.path === '/'}
                                        title={item.name}
                                        aria-label={item.name}
                                        onClick={() => isMobile && setIsSidebarOpen(false)}
                                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                        style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: isSidebarOpen ? '10px 12px' : '10px' }}
                                    >
                                        <item.icon size={19} style={{ flexShrink: 0 }} />
                                        <AnimatePresence>
                                            {isSidebarOpen && (
                                                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                    {item.name}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </NavLink>
                                ))}
                            </React.Fragment>
                        );
                    })}
                </nav>

                <div style={{ padding: isSidebarOpen ? '12px' : '8px', borderTop: '1px solid var(--border)' }}>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="nav-link"
                        style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', marginBottom: '16px' }}
                    >
                        <LogOut size={22} />
                        {isSidebarOpen && <span>{t.logout || 'Logout'}</span>}
                    </button>

                    <div style={{ padding: isSidebarOpen ? '12px' : '8px', borderRadius: '16px', backgroundColor: 'var(--sidebar-active)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border)', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            flexShrink: 0,
                            overflow: 'hidden'
                        }}>
                            <img src={getAvatarUrl()} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        {isSidebarOpen && (
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap', color: 'var(--text-main)' }}>{user?.nom || 'Admin'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{user?.role || 'Super Admin'}</div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main
                className="premium-scroll lumo-main"
                id="lumo-main"
                style={{
                    flex: 1,
                    marginLeft: isMobile ? 0 : (isSidebarOpen ? 248 : 72),
                    transition: 'margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    padding: isMobile ? '0 12px 90px' : '0 28px 32px',
                    minWidth: 0,
                    height: '100vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    width: '100%'
                }}
            >
                {/* Navbar */}
                <header className="lumo-topbar" style={{
                    position: 'sticky',
                    top: 0,
                    margin: isMobile ? '0 -12px' : '0 -28px',
                    padding: isMobile ? '10px 12px' : '12px 28px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 50,
                    background: 'var(--bg-main)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid var(--border)',
                    boxShadow: !isOnline ? '0 4px 12px rgba(239, 68, 68, 0.2)' : 'none'
                }}>
                    {!isOnline && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--danger)' }} />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            type="button"
                            aria-label={language === 'fr' ? 'Menu de navigation' : 'Navigation menu'}
                            aria-expanded={isSidebarOpen}
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="flex-center"
                            style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}
                        >
                            <Menu size={20} />
                        </button>
                        <div className="mobile-search-wrap lumo-global-search" style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                            <input
                                type="text"
                                aria-label={t.search || 'Search'}
                                placeholder={t.search || 'Navigate to...'}
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(e.target.value.length > 0); }}
                                onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
                                onBlur={() => setTimeout(() => setShowSearchResults(false), 150)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const matches = navItems.filter(item =>
                                            item.name.toLowerCase().includes(searchQuery.toLowerCase())
                                        );
                                        if (matches.length > 0) {
                                            navigate(matches[0].path);
                                            setSearchQuery('');
                                            setShowSearchResults(false);
                                        }
                                    }
                                    if (e.key === 'Escape') {
                                        setSearchQuery('');
                                        setShowSearchResults(false);
                                    }
                                }}
                                style={{
                                    padding: '12px 12px 12px 48px',
                                    borderRadius: '14px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--bg-card)',
                                    color: 'var(--text-main)',
                                    width: 'clamp(120px, 20vw, 280px)',
                                    minWidth: isMobile ? '120px' : '200px',
                                    outline: 'none',
                                    fontSize: '0.95rem',
                                    fontWeight: '500',
                                    fontFamily: 'inherit'
                                }}
                            />
                            {showSearchResults && (() => {
                                // ── Catalogue complet de tous les éléments navigables ──
                                const searchItems = [
                                    // Modules principaux
                                    ...navItems.map(item => ({ ...item, category: t.searchCategoryModule || 'Module' })),
                                    // Sous-sections des Paramètres
                                    { name: t.searchProfilEntreprise || 'Profil & Entreprise', icon: Settings, path: '/settings#profil', category: t.searchCategoryParametres || 'Paramètres' },
                                    { name: t.searchEquipeUtilisateurs || 'Équipe & Utilisateurs', icon: Users, path: '/settings#equipe', category: t.searchCategoryParametres || 'Paramètres' },
                                    { name: t.searchNotifications || 'Notifications', icon: Bell, path: '/settings#notifications', category: t.searchCategoryParametres || 'Paramètres' },
                                    { name: t.searchSecurite || 'Sécurité & Mot de passe', icon: ShieldCheck, path: '/settings#securite', category: t.searchCategoryParametres || 'Paramètres' },
                                    { name: t.searchThemeApparence || 'Thème & Apparence', icon: Moon, path: '/settings#theme', category: t.searchCategoryParametres || 'Paramètres' },
                                    { name: t.searchDeviseTaux || 'Devise & Taux de change', icon: DollarSign, path: '/settings#devise', category: t.searchCategoryParametres || 'Paramètres' },
                                    { name: t.searchModulesIntegrations || 'Modules & Intégrations', icon: Package, path: '/settings#modules', category: t.searchCategoryParametres || 'Paramètres' },
                                    { name: t.searchSauvegarde || 'Sauvegarde des données', icon: Settings, path: '/settings#backup', category: t.searchCategoryParametres || 'Paramètres' },
                                    { name: t.searchPermissionsRoles || 'Permissions & Rôles', icon: ShieldCheck, path: '/settings#permissions', category: t.searchCategoryParametres || 'Paramètres' },
                                    { name: t.searchDangerZone || 'Réinitialisation / Danger Zone', icon: Settings, path: '/settings#danger', category: t.searchCategoryParametres || 'Paramètres' },
                                    // Raccourcis actions
                                    { name: t.searchNouvelleVente || 'Nouvelle Vente (POS)', icon: ShoppingCart, path: '/pos', category: t.searchCategoryActionRapide || 'Action rapide' },
                                    { name: t.searchAjouterProduit || 'Ajouter un Produit', icon: Package, path: '/products', category: t.searchCategoryActionRapide || 'Action rapide' },
                                    { name: t.searchAjouterClient || 'Ajouter un Client', icon: Users, path: '/clients', category: t.searchCategoryActionRapide || 'Action rapide' },
                                    { name: t.searchRapportAnalytique || 'Rapport Analytique', icon: BarChart3, path: '/stats', category: t.searchCategoryActionRapide || 'Action rapide' },
                                    { name: t.searchHistoriqueStocks || 'Historique des Stocks', icon: History, path: '/stock-history', category: t.searchCategoryActionRapide || 'Action rapide' },
                                    { name: t.searchTresorerieCaisse || 'Trésorerie / Caisse', icon: Wallet, path: '/cash', category: t.searchCategoryActionRapide || 'Action rapide' },
                                ];

                                const q = searchQuery.toLowerCase();
                                const matches = searchItems.filter(item =>
                                    item.name.toLowerCase().includes(q) ||
                                    item.category.toLowerCase().includes(q)
                                );
                                // Déduplique par path (modules principaux peuvent apparaître deux fois)
                                const seen = new Set<string>();
                                const unique = matches.filter(m => {
                                    if (seen.has(m.name + m.path)) return false;
                                    seen.add(m.name + m.path);
                                    return true;
                                });

                                return unique.length > 0 ? (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 8px)',
                                        left: 0,
                                        minWidth: '320px',
                                        backgroundColor: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '16px',
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.25)',
                                        zIndex: 9999,
                                        overflow: 'hidden',
                                        padding: '6px',
                                        maxHeight: '380px',
                                        overflowY: 'auto'
                                    }}>
                                        {unique.slice(0, 10).map((item, i) => (
                                            <div
                                                key={i}
                                                onMouseDown={() => {
                                                    // Gestion des ancres (#)
                                                    const [basePath, hash] = item.path.split('#');
                                                    navigate(basePath);
                                                    if (hash) setTimeout(() => {
                                                        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
                                                    }, 300);
                                                    setSearchQuery('');
                                                    setShowSearchResults(false);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '10px 14px',
                                                    borderRadius: '10px',
                                                    cursor: 'pointer',
                                                    color: 'var(--text-main)',
                                                    fontWeight: 700,
                                                    fontSize: '0.9rem',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-glow)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <item.icon size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.category}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 8px)',
                                        left: 0,
                                        minWidth: '280px',
                                        backgroundColor: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '16px',
                                        padding: '14px',
                                        textAlign: 'center',
                                        color: 'var(--text-muted)',
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        zIndex: 9999
                                    }}>
                                        {t.noData || 'No results'} « {searchQuery} »
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => useAuthStore.getState().setCurrency(currency === 'CDF' ? 'USD' : 'CDF')}
                            style={{ padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-glow)', border: '1px solid rgba(21,94,88,0.2)', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                            <DollarSign size={18} /> {currency}
                        </button>

                        <button
                            onClick={toggleTheme}
                            aria-label={language === 'fr' ? 'Changer le thème' : 'Change theme'}
                            className="flex-center"
                            style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-main)', boxShadow: 'var(--shadow-sm)' }}
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        {!isOnline && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 900, background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 1s infinite' }} />
                                {t.offlineLabel || 'OFFLINE'}
                            </div>
                        )}

                        <div style={{ position: 'relative' }}>
                            <button
                                className="flex-center btn-hover"
                                aria-label="Notifications"
                                aria-expanded={showNotifications}
                                onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }}
                                style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-card)', position: 'relative', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', color: 'var(--text-main)', padding: 0 }}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        right: '-4px',
                                        minWidth: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--danger)',
                                        border: '2px solid var(--bg-main)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        fontWeight: '900',
                                        color: 'white',
                                        padding: '0 4px'
                                    }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </div>
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <NotificationDropdown
                                        onClose={() => setShowNotifications(false)}
                                        onRefresh={fetchUnreadCount}
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="hidden-mobile" style={{ height: '32px', width: '1px', backgroundColor: 'var(--border)', margin: '0 4px' }}></div>

                        <div className="lumo-topbar-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="hidden-mobile" style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>{user?.nom?.split(' ')[0] || 'Admin'}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>{new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' })}</div>
                            </div>
                            <div className="flex-center" style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1px solid var(--border)', padding: '2px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                                <img src={getAvatarUrl()} alt="" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="lumo-page" style={{ marginTop: '24px' }}>
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
 {isMobile && !isSidebarOpen && <nav className="lumo-mobile-nav" aria-label={language === 'fr' ? 'Accès rapides' : 'Quick navigation'}>
 {navItems.filter(item=>['/','/products','/pos','/sales'].includes(item.path)).map(item=><NavLink key={item.path} to={item.path} end={item.path==='/'} className={({isActive})=>isActive?'is-active':''}><item.icon size={21}/><span>{item.name}</span></NavLink>)}
 <button type="button" onClick={()=>setIsSidebarOpen(true)}><Menu size={21}/><span>{language==='fr'?'Plus':'More'}</span></button>
 </nav>}
 </div>
    );
};

export default Layout;
