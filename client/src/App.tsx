import * as React from 'react';
import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Loader2 } from 'lucide-react';

// Chargement paresseux (Lazy Loading) pour optimiser les performances
const Dashboard = lazy(() => import('./pages/Dashboard'));
const POS = lazy(() => import('./pages/POS'));
const Products = lazy(() => import('./pages/Products'));
const Clients = lazy(() => import('./pages/Clients'));
const Fournisseurs = lazy(() => import('./pages/Fournisseurs'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Sales = lazy(() => import('./pages/Sales'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Dettes = lazy(() => import('./pages/Dettes'));
const Settings = lazy(() => import('./pages/Settings'));
const Activities = lazy(() => import('./pages/Activities'));
const Stats = lazy(() => import('./pages/Stats'));

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyResetOTP = lazy(() => import('./pages/auth/VerifyResetOTP'));
const Layout = lazy(() => import('./components/layout/Layout'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));

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

import { motion } from 'framer-motion';

const App = () => {
  const { token, checkAuth, theme, user } = useAuthStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]); // Met à jour l'attribut CSS uniquement quand le thème change

  useEffect(() => {
    if (token) {
      checkAuth();
    }
    // On ne vérifie l'auth qu'au montage ou si le token change (connexion/déconnexion)
  }, [token]);

  return (
    <BrowserRouter>
      <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', transition: 'background-color 0.5s ease' }}>
        {!token ? (
          <Routes>
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
              <Route path="/pos" element={<POS />} />
              <Route path="/products" element={<Products />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/fournisseurs" element={<Fournisseurs />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/purchases" element={<Purchases />} />
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
      </div>
    </BrowserRouter>
  );
};

export default App;
