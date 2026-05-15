import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Wallet,
  Activity,
  Building2,
  ArrowUpDown,
  FileText,
  Truck,
  ShieldCheck,
  ChevronRight,
  ChevronUp,
  User,
  ChevronsUpDown,
  TrendingDown
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import Logo from './Logo';
import { useTranslation } from '../../hooks/useTranslation';
import ConfirmModal from '../common/ConfirmModal';

const Sidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, enabledModules } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' },
    { id: 'cash', icon: Wallet, label: t('cashSession'), path: '/cash' },
    { id: 'pos', icon: ShoppingCart, label: t('pos'), path: '/pos' },
    { id: 'products', icon: Package, label: t('products'), path: '/products' },
    { id: 'sales', icon: FileText, label: t('sales'), path: '/sales' },
    { id: 'purchases', icon: Truck, label: t('purchases'), path: '/purchases' },
    { id: 'clients', icon: Users, label: t('clients'), path: '/clients' },
    { id: 'staff', icon: ShieldCheck, label: t('team'), path: '/users' },
    { id: 'suppliers', icon: Building2, label: t('suppliers'), path: '/fournisseurs' },
    { id: 'debts', icon: ArrowUpDown, label: t('debts'), path: '/dettes' },
    { id: 'stats', icon: BarChart3, label: t('stats'), path: '/stats' },
    { id: 'activities', icon: Activity, label: t('activities'), path: '/activities', superOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    // SuperAdmin restricted items
    if (item.superOnly && user?.role !== 'superadmin') return false;

    // 1. Sub-user: check their specific granted permissions
    if (user?.role !== 'admin' && user?.role !== 'superadmin' && user?.permissions) {
      if (item.id === 'dashboard') return true;
      return user.permissions.includes(item.id);
    }

    // 2. Main admin: check enabledModules + hardcoded always-visible items
    if (user?.role === 'admin') {
      // Always visible for admin regardless of modules
      if (['dashboard', 'cash', 'staff'].includes(item.id)) return true;
      // Suppliers visible if purchases OR suppliers module is enabled
      if (item.id === 'suppliers') return enabledModules.includes('purchases') || enabledModules.includes('suppliers');
      // All other items depend on enabledModules
      return Array.isArray(enabledModules) && enabledModules.includes(item.id);
    }

    // 3. SuperAdmin: sees everything
    return true;
  });

  const avatarSrc = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `/public/${user.avatar}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nom || 'U')}&background=6366f1&color=fff&bold=true&size=128`;

  const roleLabel = user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Caissier';
  const roleColor = user?.role === 'superadmin' ? '#a855f7' : user?.role === 'admin' ? '#6366f1' : user?.role === 'manager' ? '#f59e0b' : '#10b981';

  return (
    <div className="glass" style={{
      width: '280px',
      height: 'calc(100vh - 32px)',
      position: 'fixed',
      left: '16px',
      top: '16px',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 24px',
      zIndex: 1000,
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ marginBottom: '48px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
        <Logo size={42} />
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', paddingRight: '4px' }}>
        <style>{`nav::-webkit-scrollbar { width: 3px; } nav::-webkit-scrollbar-track { background: transparent; } nav::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }`}</style>
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '600',
                border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-glow)';
                  e.currentTarget.style.color = 'var(--primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              <item.icon size={20} />
              <span style={{ fontSize: '0.95rem' }}>{item.label}</span>
              {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </div>
          );
        })}
      </nav>

      {/* USER DROPDOWN FOOTER */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        {user?.role === 'superadmin' && (
          <div
            onClick={() => navigate('/superadmin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '16px',
              cursor: 'pointer',
              color: 'var(--secondary)',
              backgroundColor: 'var(--secondary-glow)',
              fontWeight: '800',
              fontSize: '0.9rem',
              marginBottom: '8px'
            }}
          >
            <ShieldCheck size={20} />
            <span>SuperAdmin</span>
          </div>
        )}

        {/* User card that opens the dropdown */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '18px',
              cursor: 'pointer',
              border: `1px solid ${userMenuOpen ? 'var(--primary)' : 'var(--border)'}`,
              background: userMenuOpen ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => {
              if (!userMenuOpen) {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.background = 'var(--primary-glow)';
              }
            }}
            onMouseLeave={e => {
              if (!userMenuOpen) {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              }
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              overflow: 'hidden', border: '2px solid var(--border)', flexShrink: 0
            }}>
              <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {/* Name + Role */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.nom || 'Utilisateur'}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: roleColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {roleLabel}
              </div>
            </div>
            <ChevronsUpDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
          </div>

          {/* DROPDOWN MENU */}
          {userMenuOpen && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: 0,
              right: 0,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '8px',
              boxShadow: '0 -20px 60px -10px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 100,
              animation: 'slideUpFade 0.2s ease',
            }}>
              <style>{`@keyframes slideUpFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

              {/* Compte info at top of menu */}
              <div style={{ padding: '12px 14px 16px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
                <div style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--text-main)' }}>{user?.nom}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>

              {/* Actions */}
              {[
                {
                  icon: User,
                  label: t('myProfile'),
                  color: 'var(--text-main)',
                  onClick: () => { navigate('/settings'); setUserMenuOpen(false); }
                },
                {
                  icon: Settings,
                  label: t('settings'),
                  color: 'var(--text-main)',
                  onClick: () => { navigate('/settings'); setUserMenuOpen(false); }
                },
              ].map((item, i) => (
                <div
                  key={i}
                  onClick={item.onClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '11px 14px', borderRadius: '13px', cursor: 'pointer',
                    color: item.color, fontWeight: '700', fontSize: '0.9rem',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <item.icon size={17} />
                  <span>{item.label}</span>
                </div>
              ))}

              <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />

              <div
                onClick={() => setShowLogoutModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 14px', borderRadius: '13px', cursor: 'pointer',
                  color: '#ef4444', fontWeight: '700', fontSize: '0.9rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={17} />
                <span>{t('logout')}</span>
              </div>
            </div>
          )}
        </div>

        <ConfirmModal 
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={() => {
                logout();
                navigate('/login');
                setShowLogoutModal(false);
            }}
            title={t('logoutConfirmTitle')}
            message={t('logoutConfirmMessage')}
            confirmText={t('logout')}
            cancelText={t('stay')}
            type="danger"
        />
      </div>
    </div>
  );
};

export default Sidebar;
