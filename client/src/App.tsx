import * as React from 'react';
import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/useAuthStore';
import api from './api/axios';
import { Loader2 } from 'lucide-react';
import { useRuntimeTranslator } from './i18n/runtimeTranslator';

// Chargement paresseux (Lazy Loading) pour optimiser les performances
const Dashboard = lazy(() => import('./pages/Dashboard'));
const POS = lazy(() => import('./pages/POS'));
const Products = lazy(() => import('./pages/Products'));
const Clients = lazy(() => import('./pages/Clients'));
const UsersPage = lazy(() => import('./pages/Users'));
const Fournisseurs = lazy(() => import('./pages/Fournisseurs'));
const Sales = lazy(() => import('./pages/Sales'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Dettes = lazy(() => import('./pages/Dettes'));
const Settings = lazy(() => import('./pages/Settings'));
const StockHistory = lazy(() => import('./pages/StockHistory'));
const Activities = lazy(() => import('./pages/Activities'));
const Stats = lazy(() => import('./pages/Stats'));
const Cash = lazy(() => import('./pages/Cash'));

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyResetOTP = lazy(() => import('./pages/auth/VerifyResetOTP'));
const Layout = lazy(() => import('./components/layout/Layout'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));

const Landing = lazy(() => import('./pages/Landing'));

const LoadingFallback = () => (
  <div style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <Loader2 size={40} color="var(--primary)" />
    </motion.div>
  </div>
);



const App = () => {
  const { token, checkAuth, theme, user } = useAuthStore();
  // useRuntimeTranslator(); // Disabled due to severe collision bugs (e.g., "Stock" -> "Mouvements de")

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Initialisation du CSRF au démarrage
    api.get('/csrf-token').catch(() => {});
  }, []);

  useEffect(() => {
    if (token) {
      checkAuth();
      
      // Synchronisation périodique (toutes les 15 minutes)
      const interval = setInterval(() => {
        checkAuth(false); // Ne pas rediriger si l'appel échoue (laisse l'intercepteur gérer)
      }, 15 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [token]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-right" richColors theme={theme as any} />
      <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', transition: 'background-color 0.5s ease' }}>
        <Suspense fallback={<LoadingFallback />}>
          {!token ? (
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-reset-otp" element={<VerifyResetOTP />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        ) : (
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cash" element={<Cash />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/products" element={<Products />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/fournisseurs" element={<Fournisseurs />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/stock-history" element={<StockHistory />} />
              <Route path="/dettes" element={<Dettes />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/stats" element={<Stats />} />
              {user?.role === 'superadmin' && (
                <Route path="/superadmin" element={<SuperAdminDashboard />} />
              )}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        )}
        </Suspense>
      </div>
    </BrowserRouter>
  );
};

export default App;
