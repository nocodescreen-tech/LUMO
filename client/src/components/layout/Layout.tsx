import React, { useState, useEffect } from 'react';
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
  CreditCard
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

import { translations } from '../../translations';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { theme, toggleTheme, language, setLanguage, modules, currency } = useSettingsStore();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const t = translations[language];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const navItems = [
    { name: t.dashboard, icon: LayoutDashboard, path: '/' },
    { name: t.pos, icon: ShoppingCart, path: '/pos' },
    { name: t.products, icon: Package, path: '/products' },
    { name: t.clients, icon: Users, path: '/clients' },
    { name: t.sales, icon: Wallet, path: '/sales' },
    { name: t.stats, icon: BarChart3, path: '/stats' },
    ...(modules.fournisseurs ? [{ name: t.suppliers, icon: Truck, path: '/fournisseurs' }] : []),
    ...(modules.dettes ? [{ name: t.debts, icon: CreditCard, path: '/dettes' }] : []),
    { name: t.activities, icon: Activity, path: '/activities' },
    { name: t.settings, icon: t.settings, icon: Settings, path: '/settings' },
  ];


  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="glass"
        style={{ 
          position: 'fixed', 
          left: 0, 
          top: 0, 
          bottom: 0, 
          zIndex: 60,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px', 
            background: 'var(--grad-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white'
          }}>
            <ShoppingCart size={24} strokeWidth={3} />
          </div>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                style={{ fontWeight: 950, fontSize: '1.4rem', letterSpacing: '-0.04em' }}
              >
                Lumo<span className="text-gradient">Commerce</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '24px 12px', borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={logout}
            className="sidebar-link" 
            style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)' }}
          >
            <LogOut size={22} />
            {isSidebarOpen && <span>Déconnexion</span>}
          </button>
          
          <div style={{ marginTop: '12px', padding: '12px', borderRadius: '16px', backgroundColor: 'var(--sidebar-active)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', flexShrink: 0 }}></div>
            {isSidebarOpen && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{user?.nom || 'Admin'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{user?.role || 'Super Admin'}</div>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        marginLeft: isSidebarOpen ? 280 : 80, 
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '0 32px 32px 32px'
      }}>
        {/* Navbar */}
        <header className="glass-nav" style={{ 
          position: 'sticky', 
          top: 0, 
          margin: '0 -32px', 
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ border: 'none', background: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <Menu size={24} />
            </button>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder={t.search} 
                style={{ 
                  padding: '10px 10px 10px 40px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)', 
                  backgroundColor: 'var(--sidebar-active)', 
                  color: 'var(--text-main)',
                  width: '300px',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="glass" style={{ padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: 'var(--primary)' }}>
              <DollarSign size={16} /> {currency}
            </div>
            <button 
              onClick={toggleTheme}
              className="glass"
              style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-main)' }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="glass" style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} />
              <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--danger)', border: '2px solid var(--bg-card)' }}></div>
            </div>
            <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
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
