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
import { useAuthStore, encodeData, decodeData } from '../store/useAuthStore';
import Logo from '../components/layout/Logo';

const SuperAdminDashboard = () => {
    const { currency, exchangeRate } = useAuthStore();
    const [users, setUsers] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [platformStats, setPlatformStats] = useState<any>(null);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOnline, setFilterOnline] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs' | 'notifications' | 'newsletter' | 'settings'>('overview');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    // Notification states
    const [notifTitre, setNotifTitre] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const [notifType, setNotifType] = useState('info');
    const [sendingNotif, setSendingNotif] = useState(false);
    
    // Newsletter Personalization
    const [newsTitle, setNewsTitle] = useState('');
    const [newsBody, setNewsBody] = useState('');
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
            toast.error("Échec de la récupération des données plateforme");
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
            toast.error("Erreur lors du basculement");
        }
    };

    const toggleRegistration = async () => {
        const newValue = !isRegistrationEnabled;
        try {
            await api.post('/superadmin/settings', { key: 'registration_enabled', value: String(newValue) });
            setIsRegistrationEnabled(newValue);
            toast.success(newValue ? "Inscriptions autorisées" : "Inscriptions fermées");
        } catch (error) {
            toast.error("Erreur lors du basculement");
        }
    };

    const fetchSubscribers = async () => {
        try {
            const [subRes, settingsRes] = await Promise.all([
                api.get(`/superadmin/newsletter?_t=${Date.now()}`),
                api.get(`/superadmin/settings?_t=${Date.now()}`)
            ]);
            
            const sData = subRes.data;
            setSubscribers(sData.success && sData.data ? sData.data : (sData.data || sData || []));
            
            const stData = settingsRes.data;
            const settings = stData.success && stData.data ? stData.data : (stData.data || stData || []);
            
            // Populate settings
            const title = settings.find((s: any) => s.key === 'newsletter_title');
            const body = settings.find((s: any) => s.key === 'newsletter_body');
            const logo = settings.find((s: any) => s.key === 'newsletter_logo');
            if (title) setNewsTitle(title.value);
            if (body) setNewsBody(body.value);
            if (logo) setNewsLogo(logo.value);
        } catch (error) {
            toast.error("Échec de la récupération des données newsletter");
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
            toast.success("Personnalisation enregistrée !");
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

    const validateUser = async (id: number) => {
        try {
            await api.put(`/superadmin/users/${id}/validate`);
            toast.success("Utilisateur validé avec succès");
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de la validation");
        }
    };

    const verifyEmail = async (id: number) => {
        try {
            await api.put(`/superadmin/users/${id}/verify`);
            toast.success("Email vérifié manuellement");
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de la vérification");
        }
    };

    const suspendUser = async (id: number) => {
        try {
            const { data } = await api.put(`/superadmin/users/${id}/suspend`);
            toast.success(data.message);
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de la suspension");
        }
    };

    const handleImpersonate = async (id: number) => {
        try {
            const { data } = await api.post(`/superadmin/users/${id}/impersonate`);
            toast.success(data.message);
            
            // Backup the superadmin token to allow easy return
            const currentAuth = localStorage.getItem('lumo-auth');
            if (currentAuth) {
                localStorage.setItem('lumo-auth-superadmin', currentAuth);
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
                    toast.success("Utilisateur supprimé définitivement");
                    fetchData();
                } catch (error) {
                    toast.error("Erreur lors de la suppression");
                }
            }
        });
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notifTitre || !notifMessage) return toast.error("Champs requis manquants");

        setSendingNotif(true);
        try {
            await api.post('/superadmin/notify', {
                titre: notifTitre,
                message: notifMessage,
                type: notifType
            });
            toast.success("Diffusion système effectuée avec succès");
            setNotifTitre('');
            setNotifMessage('');
        } catch (error) {
            toast.error("Échec de la diffusion");
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

    const StatCard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
        <motion.div
            whileHover={{ y: -10, boxShadow: '0 40px 60px -15px rgba(0,0,0,0.08)' }}
            style={{
                padding: '35px',
                borderRadius: '44px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '28px',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '20px',
                    background: `${color}08`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color
                }}>
                    <Icon size={28} />
                </div>
                {trend && (
                    <div style={{
                        fontSize: '0.85rem',
                        color: '#10b981',
                        fontWeight: '900',
                        backgroundColor: '#10b98108',
                        padding: '8px 18px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: '1px solid #10b98115'
                    }}>
                        <TrendingUp size={16} /> +{trend}%
                    </div>
                )}
            </div>

            <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>{title}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '3.4rem', fontWeight: '950', letterSpacing: '-0.06em', color: 'var(--text-main)' }}>{value}</h3>
                </div>
                {subtext && <p style={{ margin: '14px 0 0 0', fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '-0.01em' }}>{subtext}</p>}
            </div>
        </motion.div>
    );

    const TabButton = ({ id, icon: Icon, label, active, onClick }: any) => (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '24px 36px', border: 'none', background: 'none',
                color: active ? '#4f46e5' : '#64748b',
                borderBottom: active ? '3px solid #4f46e5' : '3px solid transparent',
                fontWeight: active ? '950' : '700',
                fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s',
                marginBottom: '-1px',
                whiteSpace: 'nowrap'
            }}
        >
            <Icon size={24} strokeWidth={active ? 2.5 : 2} style={{ opacity: active ? 1 : 0.7 }} /> {label}
        </button>
    );

    const ActionBtn = ({ icon: Icon, label, onClick, color = 'var(--text-main)' }: any) => (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 20px', border: 'none', background: 'transparent',
                color: color, fontWeight: '800', fontSize: '0.95rem',
                cursor: 'pointer', borderRadius: '14px', transition: 'all 0.3s',
                width: '100%', textAlign: 'left'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--sidebar-active)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            <Icon size={20} /> {label}
        </button>
    )

    if (loading) return (
        <div style={{ height: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
            <Loader2 size={60} className="animate-spin" style={{ color: 'var(--primary)', opacity: 0.5 }} />
            <p style={{ fontWeight: '950', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.9rem' }}>Chargement du Dashboard...</p>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                padding: 'min(5vw, 60px)',
                maxWidth: '1700px',
                margin: '0 auto',
                paddingBottom: '100px',
                minHeight: '100vh',
                overflow: 'visible'
            }}
        >
            {/* TOP HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
                <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '24px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.4)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <ShieldCheck size={40} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '3.2rem', fontWeight: '950', letterSpacing: '-0.06em', margin: 0, lineHeight: 1, color: 'var(--text-main)' }}>
                            SuperAdmin <span style={{ color: '#6366f1' }}>Control Center</span>
                        </h1>
                        <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '700' }}>Pilote central de la plateforme LUMO v2.0</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right', background: 'var(--bg-card)', padding: '16px 28px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '950', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ color: '#6366f1', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</div>
                </div>
            </header>

            {/* NAVIGATION */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '48px', overflowX: 'auto', paddingBottom: '12px' }} className="premium-scroll">
                <TabButton id="overview" icon={BarChart3} label="Architecture & Flux" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                <TabButton id="users" icon={Users} label="Utilisateurs" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                <TabButton id="logs" icon={Activity} label="Audit Log Central" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                <TabButton id="notifications" icon={Bell} label="Broadcast Système" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
                <TabButton id="newsletter" icon={Mail} label="Newsletter" active={activeTab === 'newsletter'} onClick={() => setActiveTab('newsletter')} />
                <TabButton id="settings" icon={Database} label="Noyau Système" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </div>

            {/* TAB CONTENT */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}
                    >
                        {/* KPI GRID */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                            <StatCard
                                title="REVENU GLOBAL PLATEFORME"
                                value={currency === 'USD' 
                                    ? `${(platformStats?.revenue?.total || 0).toLocaleString()} USD` 
                                    : `${((platformStats?.revenue?.total || 0) * exchangeRate).toLocaleString()} CDF`
                                }
                                subtext={currency === 'CDF' ? `≈ ${(platformStats?.revenue?.total || 0).toLocaleString()} USD` : "Flux consolidé de toutes les instances"}
                                icon={Landmark}
                                color="#6366f1"
                                trend={platformStats?.revenueTrend}
                            />
                            <StatCard
                                title="VOLUME D'ACHATS BRUT"
                                value={currency === 'USD' 
                                    ? `${(platformStats?.purchases?.total || 0).toLocaleString()} USD` 
                                    : `${((platformStats?.purchases?.total || 0) * exchangeRate).toLocaleString()} CDF`
                                }
                                subtext={currency === 'CDF' ? `≈ ${(platformStats?.purchases?.total || 0).toLocaleString()} USD` : "Approvisionnements cumulés"}
                                icon={ShoppingBag}
                                color="#ec4899"
                            />

                            <StatCard
                                title="ARTICLES RÉFÉRENCÉS"
                                value={`${(platformStats?.counts?.products || 0).toLocaleString()} UNITÉS`}
                                subtext="Catalogue total Lumos"
                                icon={Boxes}
                                color="#10b981"
                                trend={platformStats?.productsTrend}
                            />
                        </div>

                        {/* SYSTEM & AI HEALTH */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                            <StatCard
                                title="CONSOMMATION IA"
                                value={`${(platformStats?.aiUsage || 0).toLocaleString()} MSGS`}
                                subtext={`Coût API est. : ${platformStats?.apiCosts || 0} USD`}
                                icon={Zap}
                                color="#a855f7"
                            />
                            <StatCard
                                title="UPTIME SERVEUR"
                                value={platformStats?.uptime || "—"}
                                subtext={`Latence API : ${platformStats?.latency || "0ms"}`}
                                icon={Clock}
                                color="#22d3ee"
                            />
                            <StatCard
                                title="CHARGE SYSTÈME"
                                value={`${platformStats?.system?.memPercent || 0}% RAM`}
                                subtext={`CPU Load: ${platformStats?.system?.cpuLoad || 0} | ${platformStats?.system?.platform || "Linux"}`}
                                icon={HardDrive}
                                color={parseFloat(platformStats?.system?.memPercent || 0) > 80 ? "#ef4444" : "#64748b"}
                            />
                            <StatCard
                                title="VERSION NOYAU"
                                value={platformStats?.system?.nodeVersion || "Node.js"}
                                subtext="Moteur d'exécution backend"
                                icon={Terminal}
                                color="#10b981"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
                            {/* RECENT ACCOUNTS */}
                            <div className="glass premium-shadow" style={{ padding: '48px', borderRadius: '44px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.8rem', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '16px', letterSpacing: '-0.03em', margin: 0 }}>
                                            <Users size={32} color="var(--primary)" /> Flux d'Inscriptions
                                        </h3>
                                        <p style={{ color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>Dernières activations requises</p>
                                    </div>
                                    <button onClick={() => setActiveTab('users')} className="btn-premium secondary">
                                        Exploration Totale <ArrowRight size={18} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }} className="premium-scroll">
                                    {users.slice(0, 5).map((u, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            key={u.id}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderRadius: '24px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)', cursor: 'pointer' }}
                                            onClick={() => { setSelectedUser(u); setShowUserModal(true); }}
                                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)', x: 10 }}
                                        >
                                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                <div style={{ width: '52px', height: '52px', borderRadius: '16px', border: '2px solid var(--border)', overflow: 'hidden' }}>
                                                    <img src={u.avatar && u.avatar !== 'default_avatar.png' ? (u.avatar.startsWith('http') ? u.avatar : `/public/${u.avatar}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nom)}&background=6366f1&color=fff&bold=true&size=128`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--text-main)' }}>{u.nom}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700' }}>{u.entreprise?.nom || 'Indépendant'}</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: '950', color: u.isAdminValidated ? '#10b981' : '#f59e0b', backgroundColor: u.isAdminValidated ? '#10b98110' : '#f59e0b10', padding: '6px 14px', borderRadius: '10px', border: '1px solid currentColor' }}>
                                                    {u.isAdminValidated ? 'ACTIVÉ' : 'EN ATTENTE'}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {users.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                            Aucun utilisateur enregistré pour le moment.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* GLOBAL STATS CARD */}
                            <div className="glass" style={{ padding: '48px', borderRadius: '44px', background: 'var(--grad-primary)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 40px 80px -20px var(--primary-glow)' }}>
                                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.15 }}>
                                    <HardDrive size={160} />
                                </div>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '950', marginBottom: '32px', letterSpacing: '-0.02em' }}>
                                    Statistiques Globales
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {[
                                        { label: 'Total Utilisateurs', value: platformStats?.counts?.users || 0, color: 'rgba(255,255,255,0.2)' },
                                        { label: 'E-mails Vérifiés', value: users.filter(u => u.isVerified).length, color: 'rgba(255,255,255,0.2)' },
                                        { label: 'Comptes Actifs', value: users.filter(u => u.isAdminValidated).length, color: 'rgba(255,255,255,0.2)' },
                                        { label: 'En attente de validation', value: users.filter(u => !u.isAdminValidated).length, color: '#f59e0b', special: true },
                                    ].map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                                            <span style={{ opacity: 0.9, fontWeight: '700', fontSize: '1.05rem' }}>{item.label}</span>
                                            <span style={{ fontWeight: '950', fontSize: '1.5rem', color: item.special ? item.color : 'white' }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '40px', padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: '800' }}>
                                        <RefreshCw size={16} className="animate-spin" /> Serveur OPS • Latence stable (42ms)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div
                        key="users"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass"
                        style={{ borderRadius: '44px', border: '1px solid var(--border)', padding: '48px', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}
                    >
                        <div style={{ display: 'flex', gap: '24px', marginBottom: '48px', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} size={24} />
                                <input
                                    type="text"
                                    placeholder="Rechercher un utilisateur, email ou entreprise..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%', padding: '24px 24px 24px 72px', borderRadius: '24px',
                                        border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)',
                                        color: 'var(--text-main)', fontSize: '1.1rem', outline: 'none',
                                        fontWeight: '700', transition: 'all 0.3s'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                />
                            </div>
                            <button
                                onClick={() => setFilterOnline(!filterOnline)}
                                className="glass btn-hover-scale"
                                style={{
                                    padding: '24px 32px', borderRadius: '24px', border: '1.5px solid var(--border)',
                                    background: filterOnline ? '#10b98120' : 'var(--bg-card)',
                                    color: filterOnline ? '#10b981' : 'var(--text-main)',
                                    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                                    fontWeight: '950', fontSize: '1rem', transition: 'all 0.3s',
                                    boxShadow: filterOnline ? '0 0 20px rgba(16, 185, 129, 0.2)' : 'var(--shadow-sm)'
                                }}
                            >
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'pulse 2s infinite' }}></div>
                                EN LIGNE
                            </button>
                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className="glass btn-hover"
                                style={{
                                    padding: '24px 32px', borderRadius: '24px', border: '1.5px solid var(--border)',
                                    background: showAdvancedFilters ? 'var(--primary-glow)' : 'var(--bg-card)',
                                    color: showAdvancedFilters ? 'var(--primary)' : 'var(--text-main)',
                                    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                                    fontWeight: '950', fontSize: '1rem', transition: 'all 0.3s'
                                }}
                            >
                                <Filter size={20} /> FILTRES AVANCÉS
                            </button>
                        </div>

                        <AnimatePresence>
                            {showAdvancedFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ overflow: 'hidden', marginBottom: '32px' }}
                                >
                                    <div style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Rôle Système</label>
                                            <select style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: '700' }}>
                                                <option>Tous les rôles</option>
                                                <option>Admin</option>
                                                <option>Vendeur</option>
                                                <option>SuperAdmin</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Date d'inscription</label>
                                            <input type="date" style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: '700' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Tri par Activité</label>
                                            <select style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: '700' }}>
                                                <option>Plus récents</option>
                                                <option>Plus anciens</option>
                                                <option>A-Z</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{ overflow: 'auto', maxHeight: '70vh', paddingBottom: '120px' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 16px' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '900', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                        <th style={{ padding: '0 32px' }}>Utilisateur</th>
                                        <th style={{ padding: '0 32px' }}>Entreprise</th>
                                        <th style={{ padding: '0 32px' }}>Vérification</th>
                                        <th style={{ padding: '0 32px' }}>Statut</th>
                                        <th style={{ padding: '0 32px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {filteredUsers.map((user) => (
                                            <motion.tr
                                                key={user.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="table-row-hover"
                                                style={{ backgroundColor: 'rgba(0,0,0,0.01)', transition: 'all 0.3s' }}
                                            >
                                                <td style={{ padding: '24px 32px', borderRadius: '24px 0 0 24px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                        <div style={{
                                                            width: '60px',
                                                            height: '60px',
                                                            borderRadius: '20px',
                                                            background: 'var(--bg-main)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            overflow: 'hidden',
                                                            border: '2px solid var(--border)',
                                                            boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
                                                        }}>
                                                            <img
                                                                src={user.avatar && user.avatar !== 'default_avatar.png' ? (user.avatar.startsWith('http') ? user.avatar : `/public/${user.avatar}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nom)}&background=6366f1&color=fff&bold=true&size=128`}
                                                                alt=""
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '950', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
                                                                {user.nom}
                                                                {user.role === 'superadmin' && (
                                                                    <span style={{ fontSize: '0.65rem', backgroundColor: '#6366f1', color: 'white', padding: '4px 10px', borderRadius: '8px', fontWeight: '950', letterSpacing: '0.05em' }}>
                                                                        SYSTEM OWNER
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                                                    <div style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--text-main)' }}>{user.entreprise?.nom || 'Structure Non Définie'}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: '950', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.05em' }}>{user.typeActivite}</div>
                                                </td>
                                                <td style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '100px', backgroundColor: user.isVerified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: user.isVerified ? '#10b981' : '#f59e0b', fontSize: '0.85rem', fontWeight: '950', border: '1px solid currentColor' }}>
                                                        {user.isVerified ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {user.isVerified ? 'Mail Vérifié' : 'En Attente'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '100px', backgroundColor: user.isAdminValidated ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: user.isAdminValidated ? '#10b981' : '#ef4444', fontSize: '0.85rem', fontWeight: '950', border: '1px solid currentColor' }}>
                                                        {user.isAdminValidated ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {user.isAdminValidated ? 'Actif' : 'Suspendu'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '24px 32px', borderRadius: '0 24px 24px 0', textAlign: 'right', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', position: 'relative' }}>
                                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(actionMenuOpenId === user.id ? null : user.id); }}
                                                            className="glass btn-hover-scale"
                                                            style={{ padding: '14px', borderRadius: '18px', border: '1.5px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
                                                        >
                                                            <MoreVertical size={24} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {actionMenuOpenId === user.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 15, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.9 }}
                                                                    style={{ position: 'absolute', right: '80px', top: '50px', backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '24px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 100, boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6)', width: '240px', backdropFilter: 'blur(20px)' }}
                                                                >
                                                                    <ActionBtn icon={Eye} label="Se connecter en tant que" color="#3b82f6" onClick={() => { handleImpersonate(user.id); setActionMenuOpenId(null); }} />
                                                                    <ActionBtn icon={Eye} label="Inspecter l'instance" color="var(--primary)" onClick={() => { setSelectedUser(user); setShowUserModal(true); setActionMenuOpenId(null); }} />
                                                                    <ActionBtn icon={Mail} label="Contacter l'administrateur" color="var(--text-main)" onClick={() => { window.location.href = `mailto:${user.email}`; setActionMenuOpenId(null); }} />
                                                                    {user.role !== 'superadmin' && (
                                                                        <>
                                                                            <div style={{ height: '1.5px', backgroundColor: 'var(--border)', margin: '8px 0' }} />
                                                                            <ActionBtn icon={Power} label={user.isAdminValidated ? "Suspendre l'accès" : "Réactiver l'instance"} color={user.isAdminValidated ? "#f59e0b" : "#10b981"} onClick={() => { suspendUser(user.id); setActionMenuOpenId(null); }} />
                                                                            {!user.isAdminValidated && <ActionBtn icon={Check} label="Approuver l'accès" color="#10b981" onClick={() => { validateUser(user.id); setActionMenuOpenId(null); }} />}
                                                                            {!user.isVerified && <ActionBtn icon={Mail} label="Valider l'Email" color="#6366f1" onClick={() => { verifyEmail(user.id); setActionMenuOpenId(null); }} />}
                                                                            <ActionBtn icon={ShieldAlert} label="Promouvoir Propriétaire" color="#a855f7" onClick={() => { toast("Fonctionnalité de promotion bientôt disponible"); setActionMenuOpenId(null); }} />
                                                                            <div style={{ height: '1.5px', backgroundColor: 'var(--border)', margin: '8px 0' }} />
                                                                            <ActionBtn icon={Trash2} label="Suppression Définitive" color="#ef4444" onClick={() => { deleteUser(user.id); setActionMenuOpenId(null); }} />
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
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass"
                        style={{ padding: '48px', borderRadius: '44px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: '950', letterSpacing: '-0.02em', margin: 0 }}>Journal d'Audit de Sécurité</h3>
                            <div style={{ position: 'relative', width: '400px' }}>
                                <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher une action, un utilisateur ou une description..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '18px 20px 18px 56px', borderRadius: '20px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {logs.filter(log => 
                                log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                String(log.userId).includes(searchTerm)
                            ).map((log, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    key={log.id}
                                    style={{ 
                                        padding: '24px 32px', 
                                        borderRadius: '24px', 
                                        backgroundColor: log.action.includes('SUPPRESSION') || log.action.includes('DELETE') ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.01)', 
                                        border: `1.5px solid ${log.action.includes('SUPPRESSION') || log.action.includes('DELETE') ? 'rgba(239, 68, 68, 0.2)' : 'var(--border)'}`, 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center' 
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                        <div style={{ 
                                            padding: '16px', 
                                            borderRadius: '16px', 
                                            backgroundColor: log.action.includes('AUTH') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)', 
                                            color: log.action.includes('AUTH') ? '#10b981' : '#6366f1',
                                            border: '1px solid currentColor'
                                        }}>
                                            {log.action.includes('AUTH') ? <ShieldCheck size={24} /> : <Terminal size={24} />}
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                                <div style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: '1.1rem' }}>{log.action}</div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>ID #{log.userId}</div>
                                            </div>
                                            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: '600' }}>{log.description}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', minWidth: '150px' }}>
                                        <div style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--text-main)' }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', marginTop: '2px' }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                                    </div>
                                </motion.div>
                            ))}
                            {logs.length === 0 && (
                                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '700' }}>
                                    Aucune activité enregistrée dans le journal.
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'notifications' && (
                    <motion.div
                        key="notifications"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass premium-shadow"
                        style={{ padding: '64px', borderRadius: '44px', maxWidth: '1000px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    >
                        <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                                    <div style={{ padding: '16px', borderRadius: '18px', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                                        <Bell size={32} />
                                    </div>
                                    <h2 style={{ fontSize: '2.8rem', fontWeight: '950', letterSpacing: '-0.04em', margin: 0 }}>Broadcast <span className="text-gradient">Centre</span></h2>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '1.15rem', lineHeight: 1.6, marginBottom: '48px' }}>
                                    Diffusez des annonces critiques, des mises à jour système ou des alertes de maintenance à l'ensemble des utilisateurs connectés.
                                </p>

                                <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>Priorité de Diffusion</label>
                                            <select
                                                value={notifType}
                                                onChange={e => setNotifType(e.target.value)}
                                                style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1.5px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '800', fontSize: '1rem', outline: 'none', appearance: 'none', boxShadow: 'var(--shadow-sm)' }}
                                            >
                                                <option value="info">💡 INFORMATION GÉNÉRALE</option>
                                                <option value="success">✅ MISE À JOUR DISPONIBLE</option>
                                                <option value="warning">⚠️ ALERTE MAINTENANCE</option>
                                                <option value="error">🚨 INCIDENT TECHNIQUE</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>Objet de l'Annonce</label>
                                            <input type="text" value={notifTitre} onChange={e => setNotifTitre(e.target.value)} placeholder="Titre succinct..." style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1.5px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '800', fontSize: '1rem', outline: 'none', boxShadow: 'var(--shadow-sm)' }} />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>Message Détaille</label>
                                        <textarea rows={8} value={notifMessage} onChange={e => setNotifMessage(e.target.value)} placeholder="Contenu explicite du broadcast..." style={{ width: '100%', padding: '24px', borderRadius: '24px', border: '1.5px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '600', fontSize: '1.05rem', resize: 'none', outline: 'none', lineHeight: 1.6, boxShadow: 'var(--shadow-sm)' }} />
                                    </div>

                                    <button type="submit" disabled={sendingNotif} style={{ padding: '24px', borderRadius: '24px', backgroundColor: '#6366f1', color: 'white', border: 'none', fontWeight: '950', fontSize: '1.2rem', cursor: sendingNotif ? 'not-allowed' : 'pointer', boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', transition: 'all 0.3s' }}>
                                        {sendingNotif ? <Loader2 className="animate-spin" size={24} /> : <><Send size={26} /> Déclencher le Broadcast</>}
                                    </button>
                                </form>
                            </div>

                            <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ padding: '32px', borderRadius: '32px', background: 'rgba(255,255,255,0.02)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: '950', color: 'var(--text-main)', letterSpacing: '0.05em' }}>APERCU TEMPS RÉEL</h4>
                                    <div style={{ padding: '20px', borderRadius: '20px', background: 'var(--bg-main)', border: '1px solid var(--border)', opacity: (notifTitre || notifMessage) ? 1 : 0.5 }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: notifType === 'error' ? '#ef4444' : notifType === 'warning' ? '#f59e0b' : '#3b82f6' }}></div>
                                            <span style={{ fontWeight: '900', fontSize: '0.8rem', color: 'var(--text-main)' }}>{notifTitre || 'Titre de l\'annonce'}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', lineHeight: 1.4 }}>
                                            {notifMessage || 'Le contenu s\'affichera ici en temps réel pour validation visuelle avant envoi.'}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ padding: '32px', borderRadius: '32px', background: 'linear-gradient(135deg, #6366f1 0%, #4447e5 100%)', color: 'white', boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.4)' }}>
                                    <Info size={32} style={{ marginBottom: '16px', opacity: 0.8 }} />
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '950' }}>Règle de sécurité</h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', opacity: 0.9, lineHeight: 1.5 }}>
                                        Toutes les notifications sont stockées de manière permanente dans la base de données pour audit ultérieur.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'newsletter' && (
                    <motion.div
                        key="newsletter"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass"
                        style={{ padding: '48px', borderRadius: '44px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '16px', letterSpacing: '-0.03em', margin: 0 }}>
                                    <Mail size={32} color="var(--primary)" /> Gestion de la Newsletter
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>Liste des personnes abonnées via la Landing Page</p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ textAlign: 'right', background: 'rgba(99, 102, 241, 0.05)', padding: '12px 24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '950', color: 'var(--primary)' }}>{subscribers.length}</div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Abonnés Totaux</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ overflow: 'auto', maxHeight: '60vh' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '900', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        <th style={{ padding: '0 24px' }}>E-mail de l'abonné</th>
                                        <th style={{ padding: '0 24px' }}>Date d'inscription</th>
                                        <th style={{ padding: '0 24px', textAlign: 'right' }}>Action</th>
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
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
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

                        {/* SECTION PERSONNALISATION */}
                        <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '2px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                                <div style={{ padding: '12px', borderRadius: '14px', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                                    <Settings size={28} />
                                </div>
                                <h3 style={{ fontSize: '1.6rem', fontWeight: '950', margin: 0 }}>Personnaliser l'E-mail</h3>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>URL du Logo</label>
                                        <input 
                                            type="text" 
                                            value={newsLogo}
                                            onChange={e => setNewsLogo(e.target.value)}
                                            placeholder="https://votre-logo.com/logo.png"
                                            style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700' }}
                                        />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={newsTitle}
                                        onChange={e => setNewsTitle(e.target.value)}
                                        placeholder="Titre de l'Email"
                                        style={{ width: '100%', padding: '20px', borderRadius: '18px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '800' }}
                                    />
                                    <textarea 
                                        rows={6}
                                        value={newsBody}
                                        onChange={e => setNewsBody(e.target.value)}
                                        placeholder="Corps du Message..."
                                        style={{ width: '100%', padding: '24px', borderRadius: '24px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', resize: 'none' }}
                                    />
                                    <button 
                                        onClick={handleSaveNewsletterSettings}
                                        disabled={savingSettings}
                                        style={{ padding: '20px', borderRadius: '20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '950', cursor: 'pointer' }}
                                    >
                                        {savingSettings ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />} Enregistrer
                                    </button>
                                </div>
                                <div style={{ background: 'white', padding: '40px', borderRadius: '32px', border: '1px solid #e2e8f0', color: '#1e293b', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                    {newsLogo ? (
                                        <img src={newsLogo} alt="Logo" style={{ height: '44px', marginBottom: '20px', borderRadius: '8px' }} />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                            <Logo size={40} />
                                            <span style={{ fontWeight: '950', fontSize: '24px', letterSpacing: '-0.05em', color: '#0f172a' }}>Lumo</span>
                                        </div>
                                    )}
                                    <h1 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 16px 0', color: '#000' }}>{newsTitle || 'Titre de l\'email...'}</h1>
                                    <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6, margin: 0 }}>{newsBody || 'Votre message de bienvenue s\'affichera ici.'}</p>
                                    <div style={{ marginTop: '24px', padding: '14px', background: '#6366f1', color: 'white', textAlign: 'center', borderRadius: '12px', fontWeight: '900', fontSize: '14px' }}>ACCÉDER À MON ESPACE</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
                    >
                        <div 
                            className="glass" 
                            onClick={toggleRegistration}
                            style={{ padding: '48px', borderRadius: '44px', border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-lg)', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                                <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: isRegistrationEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)', color: isRegistrationEnabled ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isRegistrationEnabled ? '#10b98130' : 'var(--border)'}` }}>
                                    <Globe size={36} />
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.8rem', fontWeight: '950', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Portail d'Inscription</h3>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '600' }}>Autoriser la création libre de nouvelles instances de commerce.</p>
                                </div>
                            </div>
                            <div style={{ width: '84px', height: '42px', borderRadius: '30px', backgroundColor: isRegistrationEnabled ? '#6366f1' : 'var(--border)', position: 'relative', transition: 'all 0.3s' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', right: isRegistrationEnabled ? '3px' : 'auto', left: isRegistrationEnabled ? 'auto' : '3px', transition: 'all 0.3s', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }} />
                            </div>
                        </div>

                        <div 
                            className="glass" 
                            onClick={toggleMaintenanceMode}
                            style={{ padding: '48px', borderRadius: '44px', border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-lg)', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                                <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: isMaintenanceMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.1)', color: isMaintenanceMode ? '#ef4444' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isMaintenanceMode ? '#ef444430' : 'var(--border)'}` }}>
                                    <ShieldAlert size={36} />
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.8rem', fontWeight: '950', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Verrouillage Maintenance</h3>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '600' }}>Suspendre tous les accès clients pour opérations techniques critiques.</p>
                                </div>
                            </div>
                            <div style={{ width: '84px', height: '42px', borderRadius: '30px', backgroundColor: isMaintenanceMode ? '#ef4444' : 'var(--border)', position: 'relative', transition: 'all 0.3s' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', right: isMaintenanceMode ? '3px' : 'auto', left: isMaintenanceMode ? 'auto' : '3px', transition: 'all 0.3s', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }} />
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
                            initial={{ scale: 0.9, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 50, opacity: 0 }}
                            style={{
                                width: '100%',
                                maxWidth: '1000px',
                                borderRadius: '40px',
                                padding: 'min(6vw, 64px)',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                boxShadow: '0 50px 100px -20px rgba(0,0,0,0.25)',
                                marginBottom: '40px',
                                position: 'relative',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* HEADER: Avatar + Infos */}
                            <div style={{ display: 'flex', gap: '48px', alignItems: 'center', marginBottom: '48px', position: 'relative', flexWrap: 'wrap' }}>
                                <div style={{
                                    width: '160px',
                                    height: '160px',
                                    borderRadius: '36px',
                                    background: 'var(--bg-main)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: 'var(--shadow-lg)',
                                    border: '2px solid var(--border)',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    flexShrink: 0
                                }}>
                                    <img
                                        src={selectedUser.avatar && selectedUser.avatar !== 'default_avatar.png' ? (selectedUser.avatar.startsWith('http') ? selectedUser.avatar : `/public/${selectedUser.avatar}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.nom)}&background=6366f1&color=fff&bold=true&size=512`}
                                        alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {(!selectedUser.avatar || selectedUser.avatar === 'default_avatar.png') && (
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px', background: 'rgba(239, 68, 68, 0.85)', backdropFilter: 'blur(5px)', textAlign: 'center', fontSize: '0.65rem', fontWeight: '900', color: 'white', letterSpacing: '0.05em' }}>
                                            PHOTO REQUISE
                                        </div>
                                    )}
                                </div>

                                <div style={{ flex: 1, minWidth: '220px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                        <h2 style={{ fontSize: 'min(3rem, 8vw)', fontWeight: '950', margin: 0, letterSpacing: '-0.05em', color: 'var(--text-main)', lineHeight: 1 }}>{selectedUser.nom}</h2>
                                        {selectedUser.role === 'superadmin' && (
                                            <div style={{ padding: '8px 18px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: '950', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                                                SUPERADMIN
                                            </div>
                                        )}
                                    </div>
                                    <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '1.15rem', fontWeight: '600' }}>{selectedUser.email}</p>

                                    <div style={{ display: 'flex', gap: '16px', marginTop: '28px', flexWrap: 'wrap' }}>
                                        <div style={{ padding: '14px 24px', borderRadius: '18px', background: 'var(--primary-glow)', border: '1px solid var(--border)', textAlign: 'left' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '950', letterSpacing: '0.15em', marginBottom: '4px', textTransform: 'uppercase' }}>UUID</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '950', color: 'var(--primary)' }}>#{String(selectedUser.id).padStart(5, '0')}_LUMO</div>
                                        </div>
                                        <div style={{ padding: '14px 24px', borderRadius: '18px', background: 'var(--bg-main)', border: '1px solid var(--border)', textAlign: 'left' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '950', letterSpacing: '0.15em', marginBottom: '4px', textTransform: 'uppercase' }}>Rôle</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '950', color: selectedUser.role === 'superadmin' ? '#f59e0b' : 'var(--primary)' }}>{selectedUser.role.toUpperCase()}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Close button */}
                                <button
                                    onClick={() => setShowUserModal(false)}
                                    style={{ position: 'absolute', top: '-8px', right: '-8px', width: '52px', height: '52px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }}
                                >
                                    <XCircle size={28} />
                                </button>
                            </div>

                            {/* INFO CARDS */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                                {/* Détails commerciaux */}
                                <div style={{ padding: '32px', borderRadius: '28px', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <h4 style={{ margin: 0, color: 'var(--primary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '950' }}>Détails Commerciaux</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', flexShrink: 0 }}><Building2 size={20} color="#6366f1" /></div>
                                            <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>{selectedUser.entreprise?.nom || 'Sans Enseigne'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(148, 163, 184, 0.1)', flexShrink: 0 }}><Activity size={20} color="var(--text-muted)" /></div>
                                            <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>{selectedUser.typeActivite || '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Statut identité */}
                                <div style={{ padding: '32px', borderRadius: '28px', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <h4 style={{ margin: 0, color: '#10b981', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '950' }}>Statut Identité</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ padding: '10px', borderRadius: '12px', background: selectedUser.isVerified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', flexShrink: 0 }}><Mail size={20} color={selectedUser.isVerified ? '#10b981' : '#f59e0b'} /></div>
                                            <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>Email : <span style={{ color: selectedUser.isVerified ? '#10b981' : '#f59e0b' }}>{selectedUser.isVerified ? 'Vérifié' : 'Non vérifié'}</span></span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ padding: '10px', borderRadius: '12px', background: selectedUser.isAdminValidated ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', flexShrink: 0 }}><CheckCircle size={20} color={selectedUser.isAdminValidated ? '#10b981' : '#f59e0b'} /></div>
                                            <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>Accès : <span style={{ color: selectedUser.isAdminValidated ? '#10b981' : '#f59e0b' }}>{selectedUser.isAdminValidated ? 'Approuvé' : 'En attente'}</span></span>
                                        </div>
                                    </div>
                                </div>

                                {/* Métriques système */}
                                <div style={{ padding: '32px', borderRadius: '28px', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <h4 style={{ margin: 0, color: '#f59e0b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '950' }}>Métriques Système</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(148, 163, 184, 0.1)', flexShrink: 0 }}><Calendar size={20} color="var(--text-muted)" /></div>
                                            <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>Inscrit le {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ padding: '10px', borderRadius: '12px', background: selectedUser.isAdminValidated ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', flexShrink: 0 }}><Power size={20} color={selectedUser.isAdminValidated ? '#10b981' : '#ef4444'} /></div>
                                            <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>État : <span style={{ color: selectedUser.isAdminValidated ? '#10b981' : '#ef4444' }}>{selectedUser.isAdminValidated ? 'Opérationnel' : 'Suspendu'}</span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ACTION BAR */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', padding: '24px', borderRadius: '24px', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {selectedUser.role !== 'superadmin' && (
                                        <>
                                            {!selectedUser.isAdminValidated && (
                                                <button onClick={() => { validateUser(selectedUser.id); setShowUserModal(false); }} style={{ padding: '14px 28px', background: '#6366f1', color: 'white', borderRadius: '16px', border: 'none', fontWeight: '950', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 30px -8px rgba(99, 102, 241, 0.5)' }}>
                                                    <Check size={18} /> Valider le Compte
                                                </button>
                                            )}
                                            <button onClick={() => { suspendUser(selectedUser.id); setShowUserModal(false); }} style={{ padding: '14px 28px', background: 'var(--bg-card)', color: selectedUser.isAdminValidated ? '#f59e0b' : '#10b981', borderRadius: '16px', border: '1px solid var(--border)', fontWeight: '950', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Power size={18} /> {selectedUser.isAdminValidated ? 'Suspendre' : 'Réactiver'}
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <button onClick={() => window.location.href = `mailto:${selectedUser.email}`} style={{ padding: '14px 28px', background: 'var(--bg-card)', color: 'var(--text-main)', borderRadius: '16px', border: '1px solid var(--border)', fontWeight: '950', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Mail size={18} /> Contacter
                                    </button>
                                    {selectedUser.role !== 'superadmin' && (
                                        <button onClick={() => { deleteUser(selectedUser.id); setShowUserModal(false); }} style={{ padding: '14px 28px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: '950', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Trash2 size={18} /> Supprimer
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
