import * as React from 'react';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// Lazy loading for pages would be better, but for restoration we'll do direct imports
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Fournisseurs from './pages/Fournisseurs';
import Expenses from './pages/Expenses';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Dettes from './pages/Dettes';
import Settings from './pages/Settings';
import Activities from './pages/Activities';
import Stats from './pages/Stats';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyResetOTP from './pages/auth/VerifyResetOTP';
import Layout from './components/layout/Layout';

import SuperAdminDashboard from './pages/SuperAdminDashboard';

const App = () => {
  const { token, checkAuth, theme, user } = useAuthStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (token) {
      checkAuth();
    }
  }, [theme, token]); // On réagit aux changements de token et de thème

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
