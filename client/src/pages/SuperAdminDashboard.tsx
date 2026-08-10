import { useTranslation } from '../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/common/ConfirmModal';
import {
    Users, ShieldCheck, UserX, CheckCircle, Clock, Search, Mail,
    Building2, Trash2, ArrowRight, Activity, TrendingUp, Zap,
    AlertTriangle, Filter, MoreVertical, LayoutDashboard,
    Eye, Power, Terminal, Settings as SettingsIcon, Calendar,
    Bell, Send, Landmark, ShoppingBag, Wallet, Boxes, AlertCircle,
    Info, Check, AlertTriangle as Warning, XCircle, Loader2, RefreshCw, BarChart3,
    ShieldAlert, Settings, HardDrive, List, Globe, Database, Save
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'sonner';
import { useAuthStore } from '../store/useAuthStore';
import Logo from '../components/layout/Logo';
import { BUSINESS_TYPES } from '../constants/businessTypes';

const SuperAdminDashboard = () => {
  const { t } = useTranslation();
    const { currency, exchangeRate, language } = useAuthStore();
    const safeExchangeRate = Number(exchangeRate) > 0 ? Number(exchangeRate) : 2800;
    const [users, setUsers] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [platformStats, setPlatformStats] = useState<any>(null);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [landingInbox, setLandingInbox] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOnline, setFilterOnline] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs' | 'notifications' | 'visitors' | 'newsletter' | 'settings'>('overview');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1280);

    // Notification states
    const [notifTitre, setNotifTitre] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const [notifType, setNotifType] = useState('info');
    const [sendingNotif, setSendingNotif] = useState(false);
    
    // Newsletter Personalization
    const [newsTitle, setNewsTitle] = useState('');
    const [newsBody, setNewsBody] = useState('');

    const normalizeActivityType = (type: string | undefined | null) => {
        if (!type) return 'commerce-general';
        if (type in BUSINESS_TYPES) return type;
        const lower = type.toLowerCase();
        if (lower.includes('pharma')) return 'pharmacie';
        if (lower.includes('quinc')) return 'quincaillerie';
        if (lower.includes('mode')) return 'boutique-mode';
        return 'commerce-general';
    };

    const getBusinessTypeLabel = (type: string | undefined | null) => {
        const businessType = BUSINESS_TYPES[normalizeActivityType(type)];
        return language === 'en' ? (businessType.labelEn || businessType.label) : businessType.label;
    };
    const [newsLogo, setNewsLogo] = useState('');
    const [savingSettings, setSavingSettings] = useState(false);

    // Global Settings Toggles
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [isRegistrationEnabled, setIsRegistrationEnabled] = useState(true);

    const fetchData = async () => {
        try {
            const [usersRes, logsRes, statsRes, settingsRes] = await Promise.all([
                api.get(`/superadmin/users?_t=${Date.now()}`),
                api.get(`/superadmin/logs?_t=${Date.now()}`),
                api.get(`/superadmin/stats?_t=${Date.now()}`),
                api.get(`/superadmin/settings?_t=${Date.now()}`)
            ]);

            const uData = usersRes.data;
            setUsers(uData.success && uData.data ? uData.data : (uData.data || uData || []));
            
            const lData = logsRes.data;
            setLogs(lData.success && lData.data ? lData.data : (lData.data || lData || []));
            
            const sData = statsRes.data;
            setPlatformStats(sData.success && sData.data ? sData.data : (sData.data || sData || null));

            const stData = settingsRes.data;
            const settings = stData.success && stData.data ? stData.data : (stData.data || stData || []);
            
            const maint = settings.find((s: any) => s.key === 'maintenance_mode');
            const portal = settings.find((s: any) => s.key === 'registration_enabled');
            if (maint) setIsMaintenanceMode(maint.value === 'true');
            if (portal) setIsRegistrationEnabled(portal.value === 'true');

        } catch (error) {
            toast.error(t('checdelarcupratMsg'));
        } finally {
            setLoading(false);
        }
    };

    const toggleMaintenanceMode = async () => {
        const newValue = !isMaintenanceMode;
        try {
            await api.post('/superadmin/settings', { key: 'maintenance_mode', value: String(newValue) });
            setIsMaintenanceMode(newValue);
            toast.success(newValue ? "Mode maintenance activé" : "Mode maintenance désactivé");
        } catch (error) {
            toast.error(t('ErreurlorsdubasMsg'));
        }
    };

    const toggleRegistration = async () => {
        const newValue = !isRegistrationEnabled;
        try {
            await api.post('/superadmin/settings', { key: 'registration_enabled', value: String(newValue) });
            setIsRegistrationEnabled(newValue);
            toast.success(newValue ? "Inscriptions autorisées" : "Inscriptions fermées");
        } catch (error) {
            toast.error(t('ErreurlorsdubasMsg'));
        }
    };

    const fetchSubscribers = async () => {
        try {
            const [subRes, settingsRes, inboxRes] = await Promise.all([
                api.get(`/superadmin/newsletter?_t=${Date.now()}`),
                api.get(`/superadmin/settings?_t=${Date.now()}`),
                api.get(`/superadmin/landing-inbox?_t=${Date.now()}`)
            ]);
            
            const sData = subRes.data;
            setSubscribers(sData.success && sData.data ? sData.data : (sData.data || sData || []));
            
            const stData = settingsRes.data;
            const settings = stData.success && stData.data ? stData.data : (stData.data || stData || []);
            const iData = inboxRes.data;
            setLandingInbox(iData.success && iData.data ? iData.data : (iData.data || iData || []));
            
            // Populate settings
            const title = settings.find((s: any) => s.key === 'newsletter_title');
            const body = settings.find((s: any) => s.key === 'newsletter_body');
            const logo = settings.find((s: any) => s.key === 'newsletter_logo');
            if (title) setNewsTitle(title.value);
            if (body) setNewsBody(body.value);
            if (logo) setNewsLogo(logo.value);
        } catch (error) {
            toast.error(t('checdelarcupratMsg'));
        }
    };

    const handleSaveNewsletterSettings = async () => {
        setSavingSettings(true);
        try {
            await Promise.all([
                api.post('/superadmin/settings', { key: 'newsletter_title', value: newsTitle }),
                api.post('/superadmin/settings', { key: 'newsletter_body', value: newsBody }),
                api.post('/superadmin/settings', { key: 'newsletter_logo', value: newsLogo })
            ]);
            toast.success(t('PersonnalisatioMsg'));
        } catch (error) {
            toast.error("Échec de l'enregistrement");
        } finally {
            setSavingSettings(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Rafraîchissement toutes les 30s
        fetchSubscribers();
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setSearchTerm('');
    }, [activeTab]);

    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const validateUser = async (id: number) => {
        try {
            await api.put(`/superadmin/users/${id}/validate`);
            toast.success(t('UtilisateurvaliMsg'));
            fetchData();
        } catch (error) {
            toast.error(t('ErreurlorsdelavMsg'));
        }
    };

    const verifyEmail = async (id: number) => {
        try {
            await api.put(`/superadmin/users/${id}/verify`);
            toast.success(t('EmailvrifimanueMsg'));
            fetchData();
        } catch (error) {
            toast.error(t('ErreurlorsdelavMsg'));
        }
    };

    const suspendUser = async (id: number) => {
        try {
            const { data } = await api.put(`/superadmin/users/${id}/suspend`);
            toast.success(data.message);
            fetchData();
        } catch (error) {
            toast.error(t('ErreurlorsdelasMsg'));
        }
    };

    const handleImpersonate = async (id: number) => {
        try {
            const { data } = await api.post(`/superadmin/users/${id}/impersonate`);
            toast.success(data.message);
            
            // SECURITY: backup ONLY the superadmin access token (no PII) to allow easy return
            const currentToken = localStorage.getItem('lumo-token');
            if (currentToken) {
                localStorage.setItem('lumo-token-superadmin', currentToken);
            }

            useAuthStore.getState().setAuth(data.user, data.token);
            
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur d'usurpation");
        }
    };

    const deleteUser = async (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: "Suppression Critique",
            message: "Action critique : Supprimer définitivement cet utilisateur et TOUTES ses données ? Cette action est irréversible.",
            onConfirm: async () => {
                try {
                    await api.delete(`/superadmin/users/${id}`);
                    toast.success(t('UtilisateursuppMsg'));
                    fetchData();
                } catch (error: any) {
                    toast.error(error.response?.data?.message || t('ErreurlorsdelasMsg'));
                }
            }
        });
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notifTitre || !notifMessage) return toast.error(t('ChampsrequismanMsg'));

        setSendingNotif(true);
        try {
            await api.post('/superadmin/notify', {
                titre: notifTitre,
                message: notifMessage,
                type: notifType
            });
            toast.success(t('DiffusionsystmeMsg'));
            setNotifTitre('');
            setNotifMessage('');
        } catch (error) {
            toast.error(t('checdeladiffusiMsg'));
        } finally {
            setSendingNotif(false);
        }
    };

    const filteredUsers = React.useMemo(() => users.filter(u => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = u.nom.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search) ||
            u.entreprise?.nom?.toLowerCase().includes(search);

        if (!filterOnline) return matchesSearch;

        // On considère en ligne si dernière activité < 5 minutes
        if (!u.lastActivity) return false;
        const lastSeen = new Date(u.lastActivity).getTime();
        const now = new Date().getTime();
        const isOnline = (now - lastSeen) < (5 * 60 * 1000);

        return matchesSearch && isOnline;
    }), [users, searchTerm, filterOnline]);

    const formatMoney = (amount: number, devise: 'USD' | 'CDF') => {
        const value = Number.isFinite(amount) ? amount : 0;
        return `${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${devise}`;
    };

    const revenueUsd = Number(platformStats?.revenue?.total || 0);
    const purchasesUsd = Number(platformStats?.purchases?.total || 0);
    const marginUsd = revenueUsd - purchasesUsd;
    const revenueDisplay = currency === 'USD' ? formatMoney(revenueUsd, 'USD') : formatMoney(revenueUsd * safeExchangeRate, 'CDF');
    const purchasesDisplay = currency === 'USD' ? formatMoney(purchasesUsd, 'USD') : formatMoney(purchasesUsd * safeExchangeRate, 'CDF');
    const marginDisplay = currency === 'USD' ? formatMoney(marginUsd, 'USD') : formatMoney(marginUsd * safeExchangeRate, 'CDF');
    const isMobile = viewportWidth < 768;
    const isTablet = viewportWidth >= 768 && viewportWidth < 1200;

    const StatCard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
        <motion.div
            whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
            style={{
                padding: '22px 24px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'all 0.25s ease'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                    <Icon size={22} strokeWidth={2} />
                </div>
                {trend && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: '700', backgroundColor: 'rgba(15,157,106,0.1)', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={13} /> +{trend}%
                    </div>
                )}
            </div>
            <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>{title}</p>
                <h3 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>{value}</h3>
                {subtext && <p style={{ margin: '5px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '500' }}>{subtext}</p>}
            </div>
        </motion.div>
    );

    const TabButton = ({ id, icon: Icon, label, active, onClick }: any) => (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: isMobile ? '10px 12px' : '13px 18px',
                border: 'none', background: 'none',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                fontWeight: active ? '700' : '500',
                fontSize: isMobile ? '0.83rem' : '0.92rem',
                cursor: 'pointer', transition: 'all 0.2s',
                marginBottom: '-1px', whiteSpace: 'nowrap'
            }}
        >
            <Icon size={isMobile ? 15 : 17} strokeWidth={active ? 2.5 : 2} style={{ opacity: active ? 1 : 0.6 }} /> {label}
        </button>
    );

    const ActionBtn = ({ icon: Icon, label, onClick, color = 'var(--text-main)' }: any) => (
        <button
            onClick={onClick}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', border: 'none', background: 'transparent', color: color, fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer', borderRadius: '10px', transition: 'all 0.2s', width: '100%', textAlign: 'left' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--sidebar-active)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            <Icon size={17} /> {label}
        </button>
    )

    if (loading) return (
        <div style={{ height: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px' }}>
            <Loader2 size={44} className="animate-spin" style={{ color: 'var(--primary)', opacity: 0.5 }} />
            <p style={{ fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.82rem' }}>Chargement en cours...</p>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                padding: isMobile ? '16px' : '32px',
                maxWidth: '1560px',
                margin: '0 auto',
                paddingBottom: '80px',
                minHeight: '100vh',
            }}
        >
            {/* TOP HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '16px', marginBottom: isMobile ? '24px' : '36px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: isMobile ? '42px' : '54px', height: isMobile ? '42px' : '54px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px -4px var(--primary-glow)', flexShrink: 0 }}>
                        <ShieldCheck size={isMobile ? 20 : 26} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: isMobile ? '1.25rem' : isTablet ? '1.5rem' : '2rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2, color: 'var(--text-main)' }}>
                            SuperAdmin <span style={{ color: 'var(--primary)' }}>Control Center</span>
                        </h1>
                        <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: '500' }}>Pilote central de la plateforme LUMO</p>
                    </div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '10px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', textAlign: isMobile ? 'left' : 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '1px' }}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</div>
                </div>
            </header>

            {/* NAVIGATION TABS */}
            <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)', marginBottom: isMobile ? '20px' : '32px', overflowX: 'auto' }} className="hide-scrollbar">
                <TabButton id="overview" icon={BarChart3} label="Vue d'ensemble" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                <TabButton id="users" icon={Users} label="Utilisateurs" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                <TabButton id="logs" icon={Activity} label="Audit Log" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                <TabButton id="notifications" icon={Bell} label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
                <TabButton id="visitors" icon={Eye} label="Visiteurs" active={activeTab === 'visitors'} onClick={() => setActiveTab('visitors')} />
                <TabButton id="newsletter" icon={Mail} label="Newsletter" active={activeTab === 'newsletter'} onClick={() => setActiveTab('newsletter')} />
                <TabButton id="settings" icon={Database} label="Système" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </div>

            {/* TAB CONTENT */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}
                    >
                        {/* FINANCE KPIs */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '12px' : '18px' }}>
                            <StatCard title="Chiffre d'affaires" value={revenueDisplay} subtext={currency === 'CDF' ? `≈ ${formatMoney(revenueUsd, 'USD')}` : 'Ventes consolidées'} icon={Landmark} color="var(--primary)" trend={platformStats?.revenueTrend} />
                            <StatCard title="Volume d'achats" value={purchasesDisplay} subtext={currency === 'CDF' ? `≈ ${formatMoney(purchasesUsd, 'USD')}` : 'Approvisionnements'} icon={ShoppingBag} color="var(--accent)" />
                            <StatCard title="Marge brute" value={marginDisplay} subtext={currency === 'CDF' ? `≈ ${formatMoney(marginUsd, 'USD')}` : 'CA − Achats'} icon={Wallet} color={marginUsd < 0 ? 'var(--danger)' : 'var(--success)'} />
                        </div>

                        {/* SYSTEM KPIs */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '18px' }}>
                            <StatCard title="Consommation IA" value={`${(platformStats?.aiUsage || 0).toLocaleString()} msgs`} subtext={`Coût est. : ${platformStats?.apiCosts || 0} USD`} icon={Zap} color="var(--secondary)" />
                            <StatCard title="Uptime serveur" value={platformStats?.uptime || '—'} subtext={`Latence : ${platformStats?.latency || '0ms'}`} icon={Clock} color="#22d3ee" />
                            <StatCard title="Charge RAM" value={`${platformStats?.system?.memPercent || 0}%`} subtext={`CPU: ${platformStats?.system?.cpuLoad || 0} · ${platformStats?.system?.platform || 'Linux'}`} icon={HardDrive} color={parseFloat(platformStats?.system?.memPercent || 0) > 80 ? 'var(--danger)' : 'var(--text-muted)'} />
                            <StatCard title="Version noyau" value={platformStats?.system?.nodeVersion || 'Node.js'} subtext="Moteur backend" icon={Terminal} color="var(--success)" />
                        </div>

                        {/* BOTTOM: Users list + Stats summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: isMobile ? '16px' : '18px' }}>
                            {/* Dernières inscriptions */}
                            <div style={{ padding: '24px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: 'var(--text-main)' }}>
                                            <Users size={18} color="var(--primary)" /> Dernières inscriptions
                                        </h3>
                                        <p style={{ color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.83rem', margin: '3px 0 0 0' }}>Comptes en attente d'activation</p>
                                    </div>
                                    <button onClick={() => setActiveTab('users')} className="btn-premium secondary" style={{ fontSize: '0.83rem', padding: '8px 14px' }}>
                                        Voir tout <ArrowRight size={14} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }} className="premium-scroll">
                                    {users.slice(0, 6).map((u, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                            key={u.id}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onClick={() => { setSelectedUser(u); setShowUserModal(true); }}
                                            whileHover={{ backgroundColor: 'var(--sidebar-active)' }}
                                        >
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{ width: '38px', height: '38px', borderRadius: '11px', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
                                                    <img src={u.avatar && u.avatar !== 'default_avatar.png' ? (u.avatar.startsWith('http') ? u.avatar : `/public/${u.avatar}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nom)}&background=155E58&color=fff&bold=true&size=128`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-main)' }}>{u.nom}</div>
                                                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: '500' }}>{u.entreprise?.nom || 'Indépendant'}</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.67rem', fontWeight: '700', color: u.isAdminValidated ? 'var(--success)' : 'var(--warning)', backgroundColor: u.isAdminValidated ? 'rgba(15,157,106,0.1)' : 'rgba(192,126,18,0.1)', padding: '4px 10px', borderRadius: '7px', whiteSpace: 'nowrap' }}>
                                                {u.isAdminValidated ? 'Actif' : 'En attente'}
                                            </span>
                                        </motion.div>
                                    ))}
                                    {users.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.88rem' }}>Aucun utilisateur enregistré.</div>
                                    )}
                                </div>
                            </div>

                            {/* Statistiques globales */}
                            <div style={{ padding: '24px', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 32px -8px var(--primary-glow)' }}>
                                <div style={{ position: 'absolute', bottom: '-16px', right: '-16px', opacity: 0.08 }}>
                                    <BarChart3 size={120} />
                                </div>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '18px', opacity: 0.9 }}>Statistiques Globales</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { label: 'Total Utilisateurs', value: platformStats?.counts?.users || 0 },
                                        { label: 'E-mails vérifiés', value: users.filter(u => u.isVerified).length },
                                        { label: 'Comptes actifs', value: users.filter(u => u.isAdminValidated).length },
                                        { label: 'En attente', value: users.filter(u => !u.isAdminValidated).length, highlight: true },
                                        { label: 'Visites landing', value: platformStats?.counts?.landingVisits || 0 },
                                        { label: 'Messages visiteurs', value: platformStats?.counts?.landingMessages || 0 },
                                    ].map((item: any, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                                            <span style={{ opacity: 0.82, fontWeight: '500', fontSize: '0.88rem' }}>{item.label}</span>
                                            <span style={{ fontWeight: '800', fontSize: '1.15rem', color: item.highlight ? '#fbbf24' : 'white' }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '9px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
                                    <RefreshCw size={13} className="animate-spin" /> Serveur OPS actif • Latence stable
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'visitors' && (
                    <motion.div
                        key="visitors"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass"
                        style={{ borderRadius: isMobile ? '18px' : '44px', border: '1px solid var(--border)', padding: isMobile ? '16px' : '40px', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                            <div style={{ padding: '24px', borderRadius: '22px', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                    <Eye size={22} color="#6366f1" />
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Visites Landing</h3>
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{(platformStats?.counts?.landingVisits || 0).toLocaleString()}</div>
                                <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontWeight: 600 }}>Trafic consolidé enregistré</p>
                            </div>

                            <div style={{ padding: '24px', borderRadius: '22px', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                    <Mail size={22} color="#10b981" />
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Messages reçus</h3>
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{landingInbox.length.toLocaleString()}</div>
                                <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontWeight: 600 }}>Inbox visiteurs / clients</p>
                            </div>
                        </div>

                        <div style={{ border: '1px solid var(--border)', borderRadius: '20px', background: 'var(--bg-main)', overflow: 'hidden' }}>
                            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)' }}>Boîte de réception - Landing Page</h4>
                                <button onClick={fetchSubscribers} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '12px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                                    <RefreshCw size={16} /> Actualiser
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '55vh', overflowY: 'auto', padding: '14px' }}>
                                {landingInbox.map((m: any) => (
                                    <div key={m.id} style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '12px 14px', background: 'var(--bg-card)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{m.nom || 'Visiteur'}</strong>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleString('fr-FR')}</span>
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{m.email || 'Sans email'}</div>
                                        <div style={{ marginTop: '8px', fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{m.message}</div>
                                    </div>
                                ))}
                                {landingInbox.length === 0 && (
                                    <div style={{ color: 'var(--text-muted)', fontWeight: 600, padding: '10px' }}>Aucun message reçu pour le moment.</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div
                        key="users"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: isMobile ? '16px' : '28px', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}
                    >
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                                <input
                                    type="text"
                                    placeholder="Rechercher un utilisateur, email ou entreprise..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 14px 12px 42px', borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)',
                                        color: 'var(--text-main)', fontSize: '0.92rem', outline: 'none',
                                        fontWeight: '500', transition: 'border-color 0.2s'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                />
                            </div>
                            <button
                                onClick={() => setFilterOnline(!filterOnline)}
                                style={{
                                    padding: '12px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                                    background: filterOnline ? 'rgba(15,157,106,0.1)' : 'var(--bg-main)',
                                    color: filterOnline ? 'var(--success)' : 'var(--text-muted)',
                                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                    fontWeight: '600', fontSize: '0.88rem', transition: 'all 0.2s', whiteSpace: 'nowrap'
                                }}
                            >
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                                En ligne
                            </button>
                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                style={{
                                    padding: '12px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                                    background: showAdvancedFilters ? 'var(--primary-glow)' : 'var(--bg-main)',
                                    color: showAdvancedFilters ? 'var(--primary)' : 'var(--text-muted)',
                                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                    fontWeight: '600', fontSize: '0.88rem', transition: 'all 0.2s', whiteSpace: 'nowrap'
                                }}
                            >
                                <Filter size={16} /> Filtres
                            </button>
                        </div>

                        <AnimatePresence>
                            {showAdvancedFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ overflow: 'hidden', marginBottom: '16px' }}
                                >
                                    <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Rôle</label>
                                            <select style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.88rem' }}>
                                                <option>Tous les rôles</option>
                                                <option>Admin</option>
                                                <option>Vendeur</option>
                                                <option>SuperAdmin</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Date d'inscription</label>
                                            <input type="date" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.88rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Tri</label>
                                            <select style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.88rem' }}>
                                                <option>Plus récents</option>
                                                <option>Plus anciens</option>
                                                <option>A-Z</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{ overflow: 'auto', maxHeight: '65vh' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: '700', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        <th style={{ padding: '0 16px 8px' }}>Utilisateur</th>
                                        <th style={{ padding: '0 16px 8px' }}>Entreprise</th>
                                        <th style={{ padding: '0 16px 8px' }}>Vérification</th>
                                        <th style={{ padding: '0 16px 8px' }}>Statut</th>
                                        <th style={{ padding: '0 16px 8px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {filteredUsers.map((user) => (
                                            <motion.tr
                                                key={user.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                style={{ backgroundColor: 'var(--bg-main)', transition: 'all 0.2s' }}
                                                whileHover={{ backgroundColor: 'var(--sidebar-active)' }}
                                            >
                                                <td style={{ padding: '14px 16px', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', border: '1px solid var(--border)', borderRight: 'none' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '11px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                                                            <img
                                                                src={user.avatar && user.avatar !== 'default_avatar.png' ? (user.avatar.startsWith('http') ? user.avatar : `/public/${user.avatar}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nom)}&background=155E58&color=fff&bold=true&size=128`}
                                                                alt=""
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '700', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                                                                {user.nom}
                                                                {user.role === 'superadmin' && (
                                                                    <span style={{ fontSize: '0.62rem', backgroundColor: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                                                        OWNER
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500', marginTop: '2px' }}>{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 16px', border: '1px solid var(--border)', borderLeft: 'none', borderRight: 'none' }}>
                                                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>{user.entreprise?.nom || '—'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', marginTop: '2px' }}>{getBusinessTypeLabel(user.typeActivite)}</div>
                                                </td>
                                                <td style={{ padding: '14px 16px', border: '1px solid var(--border)', borderLeft: 'none', borderRight: 'none' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '8px', backgroundColor: user.isVerified ? 'rgba(15,157,106,0.1)' : 'rgba(192,126,18,0.1)', color: user.isVerified ? 'var(--success)' : 'var(--warning)', fontSize: '0.78rem', fontWeight: '700' }}>
                                                        {user.isVerified ? <CheckCircle size={13} /> : <AlertCircle size={13} />} {user.isVerified ? 'Vérifié' : 'En attente'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 16px', border: '1px solid var(--border)', borderLeft: 'none', borderRight: 'none' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '8px', backgroundColor: user.isAdminValidated ? 'rgba(15,157,106,0.1)' : 'rgba(239,68,68,0.1)', color: user.isAdminValidated ? 'var(--success)' : 'var(--danger)', fontSize: '0.78rem', fontWeight: '700' }}>
                                                        {user.isAdminValidated ? <CheckCircle size={13} /> : <AlertTriangle size={13} />} {user.isAdminValidated ? 'Actif' : 'Suspendu'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 16px', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', textAlign: 'right', border: '1px solid var(--border)', borderLeft: 'none', position: 'relative' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(actionMenuOpenId === user.id ? null : user.id); }}
                                                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {actionMenuOpenId === user.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                                    style={{ position: 'absolute', right: '12px', top: '52px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 100, boxShadow: 'var(--shadow-lg)', width: '220px' }}
                                                                >
                                                                    <ActionBtn icon={Eye} label="Se connecter en tant que" color="#3b82f6" onClick={() => { handleImpersonate(user.id); setActionMenuOpenId(null); }} />
                                                                    <ActionBtn icon={Eye} label="Inspecter l'instance" color="var(--primary)" onClick={() => { setSelectedUser(user); setShowUserModal(true); setActionMenuOpenId(null); }} />
                                                                    <ActionBtn icon={Mail} label="Contacter" color="var(--text-main)" onClick={() => { window.location.href = `mailto:${user.email}`; setActionMenuOpenId(null); }} />
                                                                    {user.role !== 'superadmin' && (
                                                                        <>
                                                                            <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                                                                            <ActionBtn icon={Power} label={user.isAdminValidated ? 'Suspendre' : 'Réactiver'} color={user.isAdminValidated ? 'var(--warning)' : 'var(--success)'} onClick={() => { suspendUser(user.id); setActionMenuOpenId(null); }} />
                                                                            {!user.isAdminValidated && <ActionBtn icon={Check} label="Approuver" color="var(--success)" onClick={() => { validateUser(user.id); setActionMenuOpenId(null); }} />}
                                                                            {!user.isVerified && <ActionBtn icon={Mail} label="Valider l'Email" color="var(--primary)" onClick={() => { verifyEmail(user.id); setActionMenuOpenId(null); }} />}
                                                                            <ActionBtn icon={ShieldAlert} label="Promouvoir propriétaire" color="#a855f7" onClick={() => { toast('Fonctionnalité bientôt disponible'); setActionMenuOpenId(null); }} />
                                                                            <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                                                                            <ActionBtn icon={Trash2} label="Supprimer définitivement" color="var(--danger)" onClick={() => { deleteUser(user.id); setActionMenuOpenId(null); }} />
                                                                        </>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'logs' && (
                    <motion.div
                        key="logs"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ padding: isMobile ? '16px' : '28px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', letterSpacing: '-0.01em', margin: 0, color: 'var(--text-main)' }}>Journal d'Audit</h3>
                            <div style={{ position: 'relative', width: isMobile ? '100%' : '320px' }}>
                                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Rechercher une action, utilisateur..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '500', fontSize: '0.9rem', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '65vh', overflowY: 'auto' }} className="premium-scroll">
                            {logs.filter(log =>
                                log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                String(log.userId).includes(searchTerm)
                            ).map((log, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    key={log.id}
                                    style={{
                                        padding: '14px 18px',
                                        borderRadius: 'var(--radius-sm)',
                                        backgroundColor: log.action.includes('SUPPRESSION') || log.action.includes('DELETE') ? 'rgba(239,68,68,0.04)' : 'var(--bg-main)',
                                        border: `1px solid ${log.action.includes('SUPPRESSION') || log.action.includes('DELETE') ? 'rgba(239,68,68,0.15)' : 'var(--border)'}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                        <div style={{
                                            padding: '10px',
                                            borderRadius: '10px',
                                            backgroundColor: log.action.includes('AUTH') ? 'rgba(15,157,106,0.1)' : 'rgba(21,94,88,0.08)',
                                            color: log.action.includes('AUTH') ? 'var(--success)' : 'var(--primary)',
                                        }}>
                                            {log.action.includes('AUTH') ? <ShieldCheck size={18} /> : <Terminal size={18} />}
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                                                <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>{log.action}</div>
                                                <div style={{ fontSize: '0.67rem', fontWeight: '700', color: 'var(--primary)', background: 'var(--primary-glow)', padding: '2px 8px', borderRadius: '6px' }}>#{log.userId}</div>
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '500' }}>{log.description}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', minWidth: '100px', flexShrink: 0 }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.82rem', color: 'var(--text-main)' }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '500', marginTop: '1px' }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                                    </div>
                                </motion.div>
                            ))}
                            {logs.length === 0 && (
                                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.9rem' }}>
                                    Aucune activité enregistrée.
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'notifications' && (
                    <motion.div
                        key="notifications"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ padding: isMobile ? '16px' : '32px', borderRadius: 'var(--radius-md)', maxWidth: '800px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                                <Bell size={22} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>Broadcast Système</h2>
                                <p style={{ color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.88rem', margin: '2px 0 0 0' }}>Diffusez des annonces à l'ensemble des utilisateurs.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '14px' }}>
                                <div>
                                    <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>Priorité</label>
                                    <select
                                        value={notifType}
                                        onChange={e => setNotifType(e.target.value)}
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.92rem', outline: 'none' }}
                                    >
                                        <option value="info">Information générale</option>
                                        <option value="success">Mise à jour disponible</option>
                                        <option value="warning">Alerte maintenance</option>
                                        <option value="error">Incident technique</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>Objet</label>
                                    <input type="text" value={notifTitre} onChange={e => setNotifTitre(e.target.value)} placeholder="Titre..." style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.92rem', outline: 'none' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>Message</label>
                                <textarea rows={6} value={notifMessage} onChange={e => setNotifMessage(e.target.value)} placeholder="Contenu du broadcast..." style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '500', fontSize: '0.92rem', resize: 'none', outline: 'none', lineHeight: 1.6 }} />
                            </div>

                            <button type="submit" disabled={sendingNotif} style={{ padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '700', fontSize: '1rem', cursor: sendingNotif ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px -6px var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' }}>
                                {sendingNotif ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Diffuser le broadcast</>}
                            </button>
                        </form>
                    </motion.div>
                )}

                {activeTab === 'newsletter' && (
                    <motion.div
                        key="newsletter"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ padding: isMobile ? '16px' : '28px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Mail size={18} color="var(--primary)" />
                                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>Newsletter</h3>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500' }}>Abonnés via la Landing Page</span>
                            </div>
                            <div style={{ background: 'var(--primary-glow)', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)' }}>{subscribers.length}</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Abonnés</span>
                            </div>
                        </div>

                        <div style={{ overflow: 'auto', maxHeight: '65vh' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: '700', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        <th style={{ padding: '0 14px 8px' }}>E-mail</th>
                                        <th style={{ padding: '0 14px 8px' }}>Date d'inscription</th>
                                        <th style={{ padding: '0 14px 8px', textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscribers.map((sub) => (
                                        <motion.tr key={sub.id} style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)' }}>
                                            <td style={{ padding: '16px 24px', borderRadius: '16px 0 0 16px', border: '1px solid var(--border)', borderRight: 'none', fontWeight: '700', color: 'var(--text-main)' }}>
                                                {sub.email}
                                            </td>
                                            <td style={{ padding: '16px 24px', border: '1px solid var(--border)', borderLeft: 'none', borderRight: 'none', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                {new Date(sub.createdAt).toLocaleDateString()} à {new Date(sub.createdAt).toLocaleTimeString()}
                                            </td>
                                            <td style={{ padding: '16px 24px', borderRadius: '0 16px 16px 0', border: '1px solid var(--border)', borderLeft: 'none', textAlign: 'right' }}>
                                                <button 
                                                    onClick={() => toast("Option de suppression bientôt disponible")}
                                                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7 }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                    {subscribers.length === 0 && (
                                        <tr>
                                            <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                Aucun abonné pour le moment.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: '28px', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)' }}>Messages reçus depuis la Landing Page</h4>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800 }}>{landingInbox.length} messages</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                                {landingInbox.slice(0, 20).map((m: any) => (
                                    <div key={m.id} style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '12px 14px', background: 'var(--bg-card)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                            <strong style={{ fontSize: '0.9rem' }}>{m.nom || 'Visiteur'}</strong>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleString('fr-FR')}</span>
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{m.email}</div>
                                        <div style={{ marginTop: '8px', fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{m.message}</div>
                                    </div>
                                ))}
                                {landingInbox.length === 0 && (
                                    <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Aucun message pour le moment.</div>
                                )}
                            </div>
                        </div>

                        {/* SECTION PERSONNALISATION */}
                        <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '2px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                                <div style={{ padding: '12px', borderRadius: '14px', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                                    <Settings size={28} />
                                </div>
                                <h3 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>Personnaliser l'E-mail</h3>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr', gap: '40px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>URL du Logo</label>
                                        <input 
                                            type="text" 
                                            value={newsLogo}
                                            onChange={e => setNewsLogo(e.target.value)}
                                            placeholder="https://votre-logo.com/logo.png"
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '500', fontSize: '0.9rem', outline: 'none' }}
                                        />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={newsTitle}
                                        onChange={e => setNewsTitle(e.target.value)}
                                        placeholder="Titre de l'Email"
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.92rem', outline: 'none' }}
                                    />
                                    <textarea 
                                        rows={5}
                                        value={newsBody}
                                        onChange={e => setNewsBody(e.target.value)}
                                        placeholder="Corps du Message..."
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '500', fontSize: '0.9rem', resize: 'none', outline: 'none', lineHeight: 1.6 }}
                                    />
                                    <button 
                                        onClick={handleSaveNewsletterSettings}
                                        disabled={savingSettings}
                                        style={{ padding: '12px 20px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '700', fontSize: '0.92rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                                    >
                                        {savingSettings ? <Loader2 size={20} className="animate-spin" /> : <Save size={18} />} Enregistrer
                                    </button>
                                </div>
                                <div style={{ background: 'white', padding: '40px', borderRadius: '32px', border: '1px solid var(--border)', color: 'var(--text-main)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                    {newsLogo ? (
                                        <img src={newsLogo} alt="Logo" style={{ height: '44px', marginBottom: '20px', borderRadius: '8px' }} />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                            <Logo size={40} />
                                            <span style={{ fontWeight: '800', fontSize: '24px', letterSpacing: '-0.05em', color: 'var(--text-main)' }}>Lumo</span>
                                        </div>
                                    )}
                                    <h1 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 16px 0', color: '#000' }}>{newsTitle || 'Titre de l\'email...'}</h1>
                                    <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{newsBody || 'Votre message de bienvenue s\'affichera ici.'}</p>
                                    <div style={{ marginTop: '24px', padding: '14px', background: '#6366f1', color: 'white', textAlign: 'center', borderRadius: '12px', fontWeight: '900', fontSize: '14px' }}>ACCÉDER À MON ESPACE</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                        <div
                            onClick={toggleRegistration}
                            style={{ padding: '24px 28px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: isRegistrationEnabled ? 'rgba(15,157,106,0.1)' : 'var(--bg-main)', color: isRegistrationEnabled ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                    <Globe size={22} />
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>Portail d'Inscription</h3>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: '500' }}>Autoriser la création de nouvelles instances de commerce.</p>
                                </div>
                            </div>
                            <div style={{ width: '52px', height: '28px', borderRadius: '14px', backgroundColor: isRegistrationEnabled ? 'var(--success)' : 'var(--border)', position: 'relative', transition: 'all 0.3s', flexShrink: 0 }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '4px', right: isRegistrationEnabled ? '4px' : 'auto', left: isRegistrationEnabled ? 'auto' : '4px', transition: 'all 0.3s', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
                            </div>
                        </div>

                        <div
                            onClick={toggleMaintenanceMode}
                            style={{ padding: '24px 28px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: isMaintenanceMode ? 'rgba(239,68,68,0.1)' : 'var(--bg-main)', color: isMaintenanceMode ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                    <ShieldAlert size={22} />
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>Verrouillage Maintenance</h3>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: '500' }}>Suspendre tous les accès clients pour opérations techniques.</p>
                                </div>
                            </div>
                            <div style={{ width: '52px', height: '28px', borderRadius: '14px', backgroundColor: isMaintenanceMode ? 'var(--danger)' : 'var(--border)', position: 'relative', transition: 'all 0.3s', flexShrink: 0 }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '4px', right: isMaintenanceMode ? '4px' : 'auto', left: isMaintenanceMode ? 'auto' : '4px', transition: 'all 0.3s', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* INSPECTION MODAL */}
            <AnimatePresence>
                {showUserModal && selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}
                        onClick={() => setShowUserModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            style={{
                                width: '100%',
                                maxWidth: '900px',
                                borderRadius: 'var(--radius-lg)',
                                padding: '32px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                boxShadow: 'var(--shadow-lg)',
                                marginBottom: '20px',
                                position: 'relative',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* HEADER: Avatar + Infos */}
                            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '32px', position: 'relative', flexWrap: 'wrap' }}>
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-main)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: 'var(--shadow-sm)',
                                    border: '1px solid var(--border)',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    flexShrink: 0
                                }}>
                                    <img
                                        src={selectedUser.avatar && selectedUser.avatar !== 'default_avatar.png' ? (selectedUser.avatar.startsWith('http') ? selectedUser.avatar : `/public/${selectedUser.avatar}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.nom)}&background=155E58&color=fff&bold=true&size=512`}
                                        alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {(!selectedUser.avatar || selectedUser.avatar === 'default_avatar.png') && (
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px', background: 'rgba(239, 68, 68, 0.9)', backdropFilter: 'blur(4px)', textAlign: 'center', fontSize: '0.6rem', fontWeight: '700', color: 'white', letterSpacing: '0.05em' }}>
                                            PHOTO REQUISE
                                        </div>
                                    )}
                                </div>

                                <div style={{ flex: 1, minWidth: '220px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', lineHeight: 1.2 }}>{selectedUser.nom}</h2>
                                        {selectedUser.role === 'superadmin' && (
                                            <div style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.2)', fontWeight: '700', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                                SUPERADMIN
                                            </div>
                                        )}
                                    </div>
                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>{selectedUser.email}</p>

                                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
                                        <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-glow)', border: '1px solid var(--border)', textAlign: 'left' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '4px', textTransform: 'uppercase' }}>UUID</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)' }}>#{String(selectedUser.id).padStart(5, '0')}_LUMO</div>
                                        </div>
                                        <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border)', textAlign: 'left' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '4px', textTransform: 'uppercase' }}>Rôle</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: selectedUser.role === 'superadmin' ? 'var(--warning)' : 'var(--primary)' }}>{selectedUser.role.toUpperCase()}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Close button */}
                                <button
                                    onClick={() => setShowUserModal(false)}
                                    style={{ position: 'absolute', top: '-16px', right: '-16px', width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }}
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>

                            {/* INFO CARDS */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                                {/* Détails commerciaux */}
                                <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <h4 style={{ margin: 0, color: 'var(--primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>Détails Commerciaux</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--primary-glow)', flexShrink: 0 }}><Building2 size={16} color="var(--primary)" /></div>
                                            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>{selectedUser.entreprise?.nom || 'Sans Enseigne'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', flexShrink: 0 }}><Activity size={16} color="var(--text-muted)" /></div>
                                            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>{getBusinessTypeLabel(selectedUser.typeActivite)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Statut identité */}
                                <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <h4 style={{ margin: 0, color: 'var(--success)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>Statut Identité</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ padding: '8px', borderRadius: '8px', background: selectedUser.isVerified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', flexShrink: 0 }}><Mail size={16} color={selectedUser.isVerified ? 'var(--success)' : 'var(--warning)'} /></div>
                                            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>Email : <span style={{ color: selectedUser.isVerified ? 'var(--success)' : 'var(--warning)' }}>{selectedUser.isVerified ? 'Vérifié' : 'Non vérifié'}</span></span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ padding: '8px', borderRadius: '8px', background: selectedUser.isAdminValidated ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', flexShrink: 0 }}><CheckCircle size={16} color={selectedUser.isAdminValidated ? 'var(--success)' : 'var(--warning)'} /></div>
                                            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>Accès : <span style={{ color: selectedUser.isAdminValidated ? 'var(--success)' : 'var(--warning)' }}>{selectedUser.isAdminValidated ? 'Approuvé' : 'En attente'}</span></span>
                                        </div>
                                    </div>
                                </div>

                                {/* Métriques système */}
                                <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <h4 style={{ margin: 0, color: 'var(--warning)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>Métriques Système</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', flexShrink: 0 }}><Calendar size={16} color="var(--text-muted)" /></div>
                                            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>Inscrit le {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ padding: '8px', borderRadius: '8px', background: selectedUser.isAdminValidated ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', flexShrink: 0 }}><Power size={16} color={selectedUser.isAdminValidated ? 'var(--success)' : 'var(--danger)'} /></div>
                                            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>État : <span style={{ color: selectedUser.isAdminValidated ? 'var(--success)' : 'var(--danger)' }}>{selectedUser.isAdminValidated ? 'Opérationnel' : 'Suspendu'}</span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ACTION BAR */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {selectedUser.role !== 'superadmin' && (
                                        <>
                                            {!selectedUser.isAdminValidated && (
                                                <button onClick={() => { validateUser(selectedUser.id); setShowUserModal(false); }} style={{ padding: '10px 16px', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                                    <Check size={16} /> Valider
                                                </button>
                                            )}
                                            <button onClick={() => { suspendUser(selectedUser.id); setShowUserModal(false); }} style={{ padding: '10px 16px', background: 'var(--bg-card)', color: selectedUser.isAdminValidated ? 'var(--warning)' : 'var(--success)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                                <Power size={16} /> {selectedUser.isAdminValidated ? 'Suspendre' : 'Réactiver'}
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button onClick={() => window.location.href = `mailto:${selectedUser.email}`} style={{ padding: '10px 16px', background: 'var(--bg-card)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                        <Mail size={16} /> Contacter
                                    </button>
                                    {selectedUser.role !== 'superadmin' && (
                                        <button onClick={() => { deleteUser(selectedUser.id); setShowUserModal(false); }} style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                            <Trash2 size={16} /> Supprimer
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />
        </motion.div >
    );
};

export default SuperAdminDashboard;
