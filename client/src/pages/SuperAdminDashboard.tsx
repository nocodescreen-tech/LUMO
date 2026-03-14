import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, ShieldCheck, UserX, CheckCircle, Clock, Search, Mail,
    Building2, Trash2, ArrowRight, Activity, TrendingUp,
    AlertTriangle, Filter, MoreVertical, LayoutDashboard,
    Eye, Power, Terminal, Settings as SettingsIcon, Calendar,
    Bell, Send, Landmark, ShoppingBag, Wallet, Boxes, AlertCircle,
    Info, Check, AlertTriangle as Warning, XCircle, Loader2, RefreshCw, BarChart3,
    ShieldAlert, Globe, Server, Database
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'sonner';

const SuperAdminDashboard = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [platformStats, setPlatformStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs' | 'notifications' | 'settings'>('overview');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);

    // Notification states
    const [notifTitre, setNotifTitre] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const [notifType, setNotifType] = useState('info');
    const [sendingNotif, setSendingNotif] = useState(false);

    const fetchData = async () => {
        try {
            const [usersRes, logsRes, statsRes] = await Promise.all([
                api.get('/superadmin/users'),
                api.get('/superadmin/logs'),
                api.get('/superadmin/stats')
            ]);

            setUsers(usersRes.data);
            setLogs(logsRes.data);
            setPlatformStats(statsRes.data);

        } catch (error) {
            toast.error("Échec de la récupération des données plateforme");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const validateUser = async (id: number) => {
        try {
            await api.put(`/superadmin/users/${id}/validate`);
            toast.success("Utilisateur validé avec succès");
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de la validation");
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

    const deleteUser = async (id: number) => {
        if (!window.confirm("Action critique : Supprimer définitivement cet utilisateur et TOUTES ses données ? Cette action est irréversible.")) return;
        try {
            await api.delete(`/superadmin/users/${id}`);
            toast.success("Utilisateur supprimé définitivement");
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notifTitre || !notifMessage) return toast.warning("Champs requis manquants");

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

    const filteredUsers = users.filter(u =>
        u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.entreprise?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const StatCard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="glass"
            style={{
                padding: '32px',
                borderRadius: '32px',
                flex: 1,
                minWidth: '280px',
                border: `1px solid var(--border)`,
                borderTop: `4px solid ${color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: 'var(--bg-card)',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ padding: '16px', borderRadius: '20px', backgroundColor: `${color}15`, color: color, border: `1px solid ${color}20` }}>
                    <Icon size={28} />
                </div>
                {trend && (
                    <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '950', backgroundColor: '#10b98115', padding: '8px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #10b98130' }}>
                        <TrendingUp size={16} /> +{trend}%
                    </div>
                )}
            </div>
            <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
                <h3 style={{ margin: '10px 0 0 0', fontSize: '2.4rem', fontWeight: '950', letterSpacing: '-0.04em' }}>{value}</h3>
                {subtext && <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', color: 'white', opacity: 0.6, fontWeight: '600' }}>{subtext}</p>}
            </div>
        </motion.div>
    );

    const TabButton = ({ id, icon: Icon, label, active, onClick }: any) => (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '20px 32px', border: 'none', background: 'none',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: active ? '4px solid var(--primary)' : '4px solid transparent',
                fontWeight: active ? '950' : '700',
                fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.3s',
                marginBottom: '-1px',
                whiteSpace: 'nowrap'
            }}
        >
            <Icon size={22} strokeWidth={active ? 2.5 : 2} /> {label}
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
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            <Icon size={20} /> {label}
        </button>
    )

    if (loading) return (
        <div style={{ height: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
            <Loader2 size={60} className="animate-spin" style={{ color: 'var(--primary)', opacity: 0.5 }} />
            <p style={{ fontWeight: '950', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.9rem' }}>Initialisation du Terminal de Haute Sécurité...</p>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '60px', maxWidth: '1700px', margin: '0 auto', paddingBottom: '100px' }}
        >
            {/* TOP HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '60px' }}>
                <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                    <div style={{ width: '84px', height: '84px', borderRadius: '24px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 25px 50px -15px var(--primary-glow)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <ShieldCheck size={44} color="white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', fontWeight: '950', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.25em' }}>
                            <span className="dot-pulse"></span>
                            Niveau d'Accès : Super Utilisateur (100%)
                        </div>
                        <h1 style={{ fontSize: '3.6rem', fontWeight: '950', letterSpacing: '-0.07em', margin: 0, lineHeight: 1 }}>
                            Lumos <span className="text-gradient">Root Dashboard</span>
                        </h1>
                    </div>
                </div>
                <div style={{ textAlign: 'right', background: 'var(--bg-card)', padding: '16px 28px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: '950', color: 'white' }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ color: 'var(--text-muted)', fontWeight: '800', fontSize: '0.9rem', marginTop: '4px' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                </div>
            </header>

            {/*主 NAVIGATION */}
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)', marginBottom: '48px', overflowX: 'auto', paddingBottom: '2px' }} className="hide-scrollbar">
                <TabButton id="overview" icon={BarChart3} label="Architecture & Flux" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                <TabButton id="users" icon={Users} label="Base Commerçants" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                <TabButton id="logs" icon={Activity} label="Audit Log Central" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                <TabButton id="notifications" icon={Bell} label="Broadcast Système" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
                <TabButton id="settings" icon={Server} label="Noyau Système" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                            <StatCard
                                title="Revenu Global Plateforme"
                                value={`${(platformStats?.revenue?.total || 0).toLocaleString()} CDF`}
                                subtext={`Flux consolidé de toutes les instances`}
                                icon={Landmark}
                                color="#6366f1"
                                trend={12.4}
                            />
                            <StatCard
                                title="Volume d'Achats Brut"
                                value={`${(platformStats?.purchases?.total || 0).toLocaleString()} CDF`}
                                subtext={`Approvisionnements cumulés`}
                                icon={ShoppingBag}
                                color="#ec4899"
                            />
                            <StatCard
                                title="Fonds Roulements"
                                value={`${(platformStats?.expenses?.total || 0).toLocaleString()} CDF`}
                                subtext={`Dépenses consolidées`}
                                icon={Wallet}
                                color="#f59e0b"
                            />
                            <StatCard
                                title="Articles Référencés"
                                value={`${platformStats?.counts?.products || 0}`}
                                subtext="Catalogue total Lumos"
                                icon={Boxes}
                                color="#10b981"
                                trend={5.2}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
                            {/* RECENT ACCOUNTS */}
                            <div className="glass" style={{ padding: '48px', borderRadius: '44px', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <h3 style={{ fontSize: '1.6rem', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '16px', letterSpacing: '-0.02em' }}>
                                        <Activity size={28} color="var(--primary)" /> Monitoring Inscriptions
                                    </h3>
                                    <button onClick={() => setActiveTab('users')} style={{ padding: '8px 20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--primary)', fontWeight: '950', fontSize: '0.85rem', cursor: 'pointer' }}>Voir tout</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {users.slice(0, 5).map((u, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            key={u.id}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}
                                        >
                                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', color: 'white', fontSize: '1.2rem', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>{u.nom[0]}</div>
                                                <div>
                                                    <div style={{ fontWeight: '950', fontSize: '1.1rem', color: 'white' }}>{u.nom}</div>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>{u.entreprise?.nom || 'Client Sans Structure'} • {u.typeActivite}</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '950', color: u.isAdminValidated ? '#10b981' : '#f59e0b', backgroundColor: u.isAdminValidated ? '#10b98115' : '#f59e0b15', padding: '6px 14px', borderRadius: '10px', border: '1px solid currentColor' }}>
                                                    {u.isAdminValidated ? 'ACCÈS ACTIF' : 'SCAN REQUIS'}
                                                </span>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: '700' }}>{new Date(u.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* SERVER STATUS / STATS */}
                            <div className="glass" style={{ padding: '48px', borderRadius: '44px', background: 'var(--grad-primary)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 40px 80px -20px var(--primary-glow)' }}>
                                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.15 }}><Database size={160} /></div>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '950', marginBottom: '32px', letterSpacing: '-0.02em' }}>Santé du Cluster</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {[
                                        { label: 'Instances Actives', value: platformStats?.counts?.users || 0, color: 'rgba(255,255,255,0.2)' },
                                        { label: 'Comptes Vérifiés', value: users.filter(u => u.isVerified).length, color: 'rgba(255,255,255,0.2)' },
                                        { label: 'Noyau Admin Validé', value: users.filter(u => u.isAdminValidated).length, color: 'rgba(255,255,255,0.2)' },
                                        { label: 'Requêtes en Attente', value: users.filter(u => !u.isAdminValidated).length, color: '#f59e0b', special: true },
                                    ].map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                                            <span style={{ opacity: 0.9, fontWeight: '700', fontSize: '1.05rem' }}>{item.label}</span>
                                            <span style={{ fontWeight: '950', fontSize: '1.5rem', color: item.special ? item.color : 'white' }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '40px', padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: '800' }}>
                                        <RefreshCw size={16} className="animate-spin" /> Uptime : 99.98% • Latence 42ms
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
                        style={{ borderRadius: '44px', border: '1px solid var(--border)', padding: '48px', backgroundColor: 'var(--bg-card)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)' }}
                    >
                        <div style={{ display: 'flex', gap: '24px', marginBottom: '48px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} size={24} />
                                <input
                                    type="text"
                                    placeholder="Rechercher une instance, un mail ou une raison sociale..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%', padding: '24px 24px 24px 72px', borderRadius: '24px',
                                        border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)',
                                        color: 'white', fontSize: '1.1rem', outline: 'none',
                                        fontWeight: '700', transition: 'all 0.3s'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                />
                            </div>
                            <button className="glass btn-hover" style={{ padding: '0 32px', borderRadius: '24px', border: '1.5px solid var(--border)', background: 'var(--bg-card)', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: '950', fontSize: '1rem' }}>
                                <Filter size={20} /> Filtres Avancés
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto', paddingBottom: '120px' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 16px' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '900', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                        <th style={{ padding: '0 32px' }}>Administrateur Instance</th>
                                        <th style={{ padding: '0 32px' }}>Détails Structure</th>
                                        <th style={{ padding: '0 32px' }}>Validation KYC</th>
                                        <th style={{ padding: '0 32px' }}>Statut Système</th>
                                        <th style={{ padding: '0 32px', textAlign: 'right' }}>Protocole</th>
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
                                                style={{ backgroundColor: 'rgba(255,255,255,0.01)', transition: 'all 0.3s' }}
                                            >
                                                <td style={{ padding: '24px 32px', borderRadius: '24px 0 0 24px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                        <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', color: 'white', fontSize: '1.4rem', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>{user.nom[0]}</div>
                                                        <div>
                                                            <div style={{ fontWeight: '950', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                                                                {user.nom}
                                                                {user.role === 'superadmin' && <span style={{ fontSize: '0.7rem', backgroundColor: '#f59e0b', color: 'black', padding: '4px 12px', borderRadius: '100px', fontWeight: '950' }}>SUPERUSER</span>}
                                                            </div>
                                                            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                                                    <div style={{ fontWeight: '900', fontSize: '1.1rem', color: 'white' }}>{user.entreprise?.nom || 'Structure Non Définie'}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '950', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.05em' }}>{user.typeActivite}</div>
                                                </td>
                                                <td style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '100px', backgroundColor: user.isVerified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: user.isVerified ? '#10b981' : '#f59e0b', fontSize: '0.85rem', fontWeight: '950', border: '1px solid currentColor' }}>
                                                        {user.isVerified ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {user.isVerified ? 'Mail Vérifié' : 'En Attente'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '100px', backgroundColor: user.isAdminValidated ? 'rgba(99, 102, 241, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: user.isAdminValidated ? '#6366f1' : '#ef4444', fontSize: '0.85rem', fontWeight: '950', border: '1px solid currentColor' }}>
                                                        {user.isAdminValidated ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />} {user.isAdminValidated ? 'Noyau Actif' : 'Noyau Bloqué'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '24px 32px', borderRadius: '0 24px 24px 0', textAlign: 'right', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', position: 'relative' }}>
                                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(actionMenuOpenId === user.id ? null : user.id); }}
                                                            className="glass btn-hover"
                                                            style={{ padding: '14px', borderRadius: '18px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'white', cursor: 'pointer' }}
                                                        >
                                                            <MoreVertical size={24} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {actionMenuOpenId === user.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 15, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.9 }}
                                                                    style={{ position: 'absolute', right: '80px', top: '50px', backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '24px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 100, boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6)', width: '240px', backdropFilter: 'blur(20px)' }}
                                                                >
                                                                    <ActionBtn icon={Eye} label="Prise de Contrôle" color="var(--primary)" onClick={() => { setSelectedUser(user); setShowUserModal(true); setActionMenuOpenId(null); }} />
                                                                    {user.role !== 'superadmin' && (
                                                                        <>
                                                                            <div style={{ height: '1.5px', backgroundColor: 'var(--border)', margin: '8px 0' }} />
                                                                            <ActionBtn icon={Power} label={user.isAdminValidated ? "Désactiver Instance" : "Réactiver Instance"} color={user.isAdminValidated ? "#f59e0b" : "#10b981"} onClick={() => { suspendUser(user.id); setActionMenuOpenId(null); }} />
                                                                            {!user.isAdminValidated && <ActionBtn icon={Check} label="Valider le KYC" color="#10b981" onClick={() => { validateUser(user.id); setActionMenuOpenId(null); }} />}
                                                                            <ActionBtn icon={Trash2} label="Suppression Nucleéaire" color="#ef4444" onClick={() => { deleteUser(user.id); setActionMenuOpenId(null); }} />
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
                        <h3 style={{ fontSize: '1.8rem', fontWeight: '950', marginBottom: '48px', letterSpacing: '-0.02em' }}>Audit Trail Système</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {logs.map((log, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={log.id}
                                    style={{ padding: '28px', borderRadius: '28px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                        <div style={{ padding: '18px', borderRadius: '20px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                            <Terminal size={28} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '950', color: 'white', fontSize: '1.2rem', marginBottom: '6px' }}>{log.action}</div>
                                            <div style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>{log.description}</div>
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '900', backgroundColor: 'var(--primary-glow)', padding: '4px 12px', borderRadius: '8px', border: '1px solid var(--primary-glow)' }}>USER_ID: {log.userId}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '900', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '8px' }}>ENTRY_ID: {log.id}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', minWidth: '180px' }}>
                                        <div style={{ fontWeight: '950', fontSize: '1rem', color: 'white' }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '700', marginTop: '4px' }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'notifications' && (
                    <motion.div
                        key="notifications"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass"
                        style={{ padding: '64px', borderRadius: '44px', maxWidth: '900px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.4)' }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                            <div style={{ width: '96px', height: '96px', borderRadius: '32px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', border: '2px solid var(--primary-glow)', boxShadow: '0 20px 40px -10px var(--primary-glow)' }}>
                                <Bell size={48} />
                            </div>
                            <h2 style={{ fontSize: '2.4rem', fontWeight: '950', letterSpacing: '-0.03em' }}>Diffusion Système</h2>
                            <p style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '1.15rem', marginTop: '12px' }}>Envoyez des avis critiques en Push à toutes les instances actives.</p>
                        </div>

                        <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '16px' }}>Sélecteur de Priorité</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                    {[
                                        { id: 'info', icon: Info, color: '#3b82f6', label: 'INFO' },
                                        { id: 'success', icon: Check, color: '#10b981', label: 'SUCCÈS' },
                                        { id: 'warning', icon: Warning, color: '#f59e0b', label: 'ALERTE' },
                                        { id: 'error', icon: XCircle, color: '#ef4444', label: 'CRITIQUE' }
                                    ].map(t => (
                                        <button
                                            key={t.id} type="button"
                                            onClick={() => setNotifType(t.id)}
                                            style={{ padding: '20px', border: notifType === t.id ? `3px solid ${t.color}` : '2px solid var(--border)', borderRadius: '24px', backgroundColor: notifType === t.id ? `${t.color}15` : 'var(--bg-main)', color: notifType === t.id ? t.color : 'var(--text-muted)', cursor: 'pointer', fontWeight: '950', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'all 0.4s' }}
                                        >
                                            <t.icon size={28} /> {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>Objet de la diffusion</label>
                                <input type="text" value={notifTitre} onChange={e => setNotifTitre(e.target.value)} placeholder="Titre de l'annonce système..." style={{ width: '100%', padding: '22px', borderRadius: '20px', border: '2px solid var(--border)', background: 'var(--bg-main)', color: 'white', fontWeight: '900', fontSize: '1.1rem', outline: 'none', transition: 'all 0.3s' }} onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>Corps du message</label>
                                <textarea rows={6} value={notifMessage} onChange={e => setNotifMessage(e.target.value)} placeholder="Détaillez le contenu technique ou informatif de la diffusion..." style={{ width: '100%', padding: '22px', borderRadius: '20px', border: '2px solid var(--border)', background: 'var(--bg-main)', color: 'white', fontWeight: '700', fontSize: '1.05rem', resize: 'none', outline: 'none', lineHeight: '1.6', transition: 'all 0.3s' }} onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                            </div>
                            <button type="submit" disabled={sendingNotif} style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '950', fontSize: '1.2rem', cursor: sendingNotif ? 'not-allowed' : 'pointer', boxShadow: '0 20px 40px -10px var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', transition: 'all 0.3s' }}>
                                {sendingNotif ? <Loader2 className="animate-spin" size={24} /> : <><Send size={26} /> Déclencher le Broadcast Global</>}
                            </button>
                        </form>
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
                    >
                        <div className="glass" style={{ padding: '56px', borderRadius: '44px', border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)' }}>
                            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                                <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #10b98130' }}>
                                    <Globe size={36} />
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.8rem', fontWeight: '950', letterSpacing: '-0.02em', color: 'white' }}>Portail d'Inscription</h3>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '600' }}>Autoriser la création libre de nouvelles instances de commerce.</p>
                                </div>
                            </div>
                            <div style={{ width: '84px', height: '42px', borderRadius: '30px', backgroundColor: 'var(--primary)', position: 'relative', cursor: 'pointer', boxShadow: '0 0 30px var(--primary-glow)', border: '2px solid transparent' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', right: '3px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }} />
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '56px', borderRadius: '44px', border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)' }}>
                            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                                <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ef444430' }}>
                                    <ShieldAlert size={36} />
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.8rem', fontWeight: '950', letterSpacing: '-0.02em', color: 'white' }}>Verrouillage Maintenance</h3>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '600' }}>Suspendre tous les accès clients pour opérations techniques critiques.</p>
                                </div>
                            </div>
                            <div style={{ width: '84px', height: '42px', borderRadius: '30px', backgroundColor: 'rgba(255,255,255,0.05)', position: 'relative', cursor: 'pointer', border: '2px solid var(--border)' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border)', position: 'absolute', top: '3px', left: '3px' }} />
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
                        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(30px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}
                        onClick={() => setShowUserModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 50, opacity: 0 }}
                            className="glass" style={{ width: '100%', maxWidth: '900px', borderRadius: '56px', padding: '64px', background: 'var(--bg-card)', border: '1.5px solid var(--border)', boxShadow: '0 50px 100px -20px rgba(0,0,0,1)' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', gap: '48px', alignItems: 'center', marginBottom: '56px', borderBottom: '1px solid var(--border)', paddingBottom: '48px' }}>
                                <div style={{ width: '160px', height: '160px', borderRadius: '48px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', color: 'white', fontSize: '4.5rem', boxShadow: '0 30px 60px -15px var(--primary-glow)', border: '2px solid rgba(255,255,255,0.1)' }}>
                                    {selectedUser.nom[0]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <h2 style={{ fontSize: '3.5rem', fontWeight: '950', margin: 0, letterSpacing: '-0.05em', color: 'white' }}>{selectedUser.nom}</h2>
                                        {selectedUser.isAdminValidated && <ShieldCheck size={40} color="var(--primary)" />}
                                    </div>
                                    <p style={{ margin: '12px 0 0 0', color: 'var(--text-muted)', fontSize: '1.5rem', fontWeight: '600' }}>{selectedUser.email}</p>
                                    <div style={{ display: 'flex', gap: '14px', marginTop: '24px' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '950', padding: '8px 20px', borderRadius: '14px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid var(--primary-glow)' }}>ID_HEX: {selectedUser.id.toString(16).toUpperCase()}</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '950', padding: '8px 20px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Rôle: {selectedUser.role.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '32px', marginBottom: '56px' }}>
                                <div style={{ padding: '32px', borderRadius: '32px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1.5px solid var(--border)' }}>
                                    <h4 style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '950' }}>Dossier Commercial</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <p style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.2rem', color: 'white' }}><Building2 size={24} color="var(--primary)" /> {selectedUser.entreprise?.nom || 'Structure Non Enregistrée'}</p>
                                        <p style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.2rem', color: 'white' }}><Activity size={24} color="var(--primary)" /> Secteur: {selectedUser.typeActivite}</p>
                                        <p style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.2rem', color: 'white' }}><Mail size={24} color="var(--primary)" /> {selectedUser.email}</p>
                                    </div>
                                </div>
                                <div style={{ padding: '32px', borderRadius: '32px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1.5px solid var(--border)' }}>
                                    <h4 style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '950' }}>État des Systèmes</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <p style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.2rem', color: 'white' }}><CheckCircle size={24} color={selectedUser.isVerified ? '#10b981' : '#f59e0b'} /> Email: {selectedUser.isVerified ? 'Authentifié' : 'Non Vérifié'}</p>
                                        <p style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.2rem', color: 'white' }}><Power size={24} color={selectedUser.isAdminValidated ? '#10b981' : '#ef4444'} /> Firewall: {selectedUser.isAdminValidated ? 'Actif' : 'Suspendu'}</p>
                                        <p style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.2rem', color: 'white' }}><Calendar size={24} color="var(--primary)" /> Création Instance: {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px' }}>
                                <button onClick={() => setShowUserModal(false)} className="glass btn-hover" style={{ padding: '22px 48px', border: '1.5px solid var(--border)', background: 'transparent', color: 'white', borderRadius: '24px', fontWeight: '950', fontSize: '1.1rem', cursor: 'pointer' }}>Quitter l'Inspection</button>
                                {selectedUser.role !== 'superadmin' && (
                                    <button
                                        onClick={() => { suspendUser(selectedUser.id); setShowUserModal(false); }}
                                        style={{ padding: '22px 48px', background: selectedUser.isAdminValidated ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: selectedUser.isAdminValidated ? '#f59e0b' : '#10b981', borderRadius: '24px', border: 'none', fontWeight: '950', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                                    >
                                        <Power size={28} /> {selectedUser.isAdminValidated ? 'Suspendre Noyau' : 'Réactiver Noyau'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .btn-hover:hover { background-color: var(--bg-hover) !important; transform: translateY(-4px); }
                .table-row-hover:hover { background-color: rgba(255,255,255,0.04) !important; transform: scale(1.005); z-index: 10; }
                .dot-pulse { width: 10px; height: 10px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
                @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
            `}</style>
        </motion.div>
    );
};

export default SuperAdminDashboard;
