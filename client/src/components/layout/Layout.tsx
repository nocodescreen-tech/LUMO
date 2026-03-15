import * as React from 'react';
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  DollarSign, 
  ShoppingCart, 
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
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import NotificationDropdown from './NotificationDropdown';
import api from '../../api/axios';


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
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const t = (translations as any)[language] || translations.fr;

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications');
      const count = data.filter((n: any) => !n.lu).length;
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && isSidebarOpen) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    ...(user?.role === 'superadmin' 
      ? [
          { name: 'Admin Platform', icon: ShieldCheck, path: '/superadmin', group: 'PLATFORM' },
          { name: 'Paramètres Globaux', icon: Settings, path: '/settings', group: 'PLATFORM' },
          { name: 'Audit Logs', icon: Activity, path: '/activities', group: 'PLATFORM' },
        ] 
      : []),
    { name: t.dashboard, icon: LayoutDashboard, path: '/', group: 'STORE' },
    { name: t.pos, icon: ShoppingCart, path: '/pos', group: 'STORE' },
    { name: t.products, icon: Package, path: '/products', group: 'STORE' },
    { name: t.clients, icon: Users, path: '/clients', group: 'STORE' },
    { name: t.sales, icon: Wallet, path: '/sales', group: 'STORE' },
    { name: t.stats, icon: BarChart3, path: '/stats', group: 'STORE' },
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)', position: 'relative' }}>
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        animate={{ width: isSidebarOpen ? 300 : 120 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: isMobile ? 'fixed' : 'fixed',
          left: isMobile ? (isSidebarOpen ? 0 : -120) : 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          flexShrink: 0,
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Logo area */}
        <div style={{ 
          padding: isSidebarOpen ? '28px 24px' : '28px 16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isSidebarOpen ? 'space-between' : 'center',
          borderBottom: '1px solid var(--border)',
          gap: '12px'
        }}>
          {isSidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontWeight: 900, fontSize: '1rem' }}>L</span>
              </div>
              <div>
                <div style={{ fontWeight: 950, fontSize: '1.15rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lumo</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Commerce Suite</div>
              </div>
            </div>
          )}
          {!isSidebarOpen && (
            <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--primary), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: '1rem' }}>L</span>
            </div>
          )}
          {isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '6px', borderRadius: '8px' }}
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }} className="premium-scroll">
          {groups.map(group => {
            const items = navItems.filter(i => i.group === group);
            return (
              <React.Fragment key={group}>
                {isSidebarOpen && (
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '16px 12px 8px', textTransform: 'uppercase' }}>
                    {group}
                  </div>
                )}
                {items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: isSidebarOpen ? '12px 20px' : '14px' }}
                  >
                    <item.icon size={22} style={{ flexShrink: 0 }} />
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

        <div style={{ padding: isSidebarOpen ? '24px 16px' : '24px 12px', borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={logout}
            className="nav-link" 
            style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', marginBottom: '16px' }}
          >
            <LogOut size={22} />
            {isSidebarOpen && <span>Déconnexion</span>}
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
        className="premium-scroll"
        style={{ 
          flex: 1, 
          marginLeft: isMobile ? 0 : (isSidebarOpen ? 300 : 120), 
          transition: 'margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: isMobile ? '0 16px 24px 16px' : '0 40px 40px 40px',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        {/* Navbar */}
        <header style={{ 
          position: 'sticky', 
          top: 0, 
          margin: isMobile ? '0 -16px' : '0 -40px', 
          padding: isMobile ? '16px' : '24px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 50,
          background: 'var(--bg-main)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex-center"
              style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
            >
              <Menu size={20} />
            </button>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder={t.search} 
                className=""
                style={{ 
                  padding: '12px 12px 12px 48px', 
                  borderRadius: '14px', 
                  border: '1px solid var(--border)', 
                  backgroundColor: 'var(--bg-card)', 
                  color: 'var(--text-main)',
                  width: isMobile ? '120px' : '320px',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => useAuthStore.getState().setCurrency(currency === 'CDF' ? 'USD' : 'CDF')}
              style={{ padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-glow)', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <DollarSign size={18} /> {currency}
            </button>
            
            <button 
              onClick={toggleTheme}
              className="flex-center"
              style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-main)', boxShadow: 'var(--shadow-sm)' }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div style={{ position: 'relative' }}>
              <button
                className="flex-center btn-hover"
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

            <div style={{ height: '32px', width: '1px', backgroundColor: 'var(--border)', margin: '0 8px' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="hidden-mobile" style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>{user?.nom?.split(' ')[0] || 'Admin'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
              </div>
              <div className="flex-center" style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1px solid var(--border)', padding: '2px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                <img src={getAvatarUrl()} alt="" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
              </div>
            </div>
          </div>
        </header>

        <div style={{ marginTop: '32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
