import React, { useEffect } from 'react';
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

import Login from './pages/auth/Login';
import Layout from './components/layout/Layout';

const App = () => {
  const { token, checkAuth } = useAuthStore();

  useEffect(() => {
    if (token) {
      checkAuth();
    }
  }, []);

  if (!token) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
