import * as React from 'react';
import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { PageSkeleton } from './design-system/PageSkeleton';
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
const SubusersPage = lazy(() => import('./pages/SubusersPage'));
const Cash = lazy(() => import('./pages/Cash'));

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyResetOTP = lazy(() => import('./pages/auth/VerifyResetOTP'));
const Layout = lazy(() => import('./components/layout/Layout'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const SupportCenter = lazy(() => import('./pages/SupportCenter'));
const InventoryEnterprise = lazy(() => import('./pages/InventoryEnterprise'));
const RepairCenter = lazy(() => import('./pages/RepairCenter'));
const CommercialDocuments = lazy(() => import('./pages/CommercialDocuments'));
const Receivables = lazy(() => import('./pages/Receivables'));
const Accounting = lazy(() => import('./pages/Accounting'));
const Treasury = lazy(() => import('./pages/Treasury'));
const StaffAssignments = lazy(() => import('./pages/StaffAssignments'));
const HumanResources = lazy(() => import('./pages/HumanResources'));
const Payroll = lazy(() => import('./pages/Payroll'));
const AccessGovernance = lazy(() => import('./pages/AccessGovernance'));
const ExpenseApprovals = lazy(() => import('./pages/ExpenseApprovals'));
const LeaveManagement = lazy(() => import('./pages/LeaveManagement'));
const Budgets = lazy(() => import('./pages/Budgets'));
const NotificationCenter = lazy(() => import('./pages/NotificationCenter'));
const CRM = lazy(() => import('./pages/CRM'));
const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'));
const SubscriptionCenter = lazy(() => import('./pages/SubscriptionCenter'));

const Landing = lazy(() => import('./pages/Landing'));

const LoadingFallback = () => <PageSkeleton />;
class WorkspaceBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<div role="alert" style={{padding:24}}><h2>Interface indisponible</h2><p>Revenez à l’accueil ou rechargez la page. Ne répétez pas une opération financière sans vérifier son historique.</p><button onClick={()=>window.location.reload()}>Recharger</button> <a href="/">Accueil</a></div>:this.props.children}
}
const ScreenBoundary=({children}:{children:React.ReactNode})=>{const loc=useLocation(),id=useAuthStore(s=>s.user?.id);return <WorkspaceBoundary key={String(id)+'/'+loc.pathname}>{children}</WorkspaceBoundary>};




const App = () => {
  const { token, checkAuth, theme, user, hydrating, hydrateFromRefresh } = useAuthStore();
  const can=(...permissions:string[])=>user?.role==='admin'||(!!user&&user.role!=='superadmin'&&permissions.every(p=>user.permissions?.includes(p)));
  // useRuntimeTranslator(); // Disabled due to severe collision bugs (e.g., "Stock" -> "Mouvements de")

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Initialisation du CSRF au démarrage
    api.get('/csrf-token').catch(() => {});
  }, []);

  // Tentative unique de récupération de session au montage : si aucun token
  // n'est présent en mémoire (ex: après un rafraîchissement de page), on essaie
  // de récupérer une session valide via le refresh token (cookie httpOnly).
  useEffect(() => {
    if (token) {
      useAuthStore.setState({ hydrating: false });
    } else {
      hydrateFromRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token) {
      void checkAuth().catch(()=>{});
      
      // Synchronisation périodique (toutes les 15 minutes)
      const interval = setInterval(() => {
        void checkAuth(false).catch(()=>{}); // Ne pas rediriger si l'appel échoue (laisse l'intercepteur gérer)
      }, 15 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [token]);

  if (hydrating) {
    return <LoadingFallback />;
  }

  return (
    <MotionConfig reducedMotion="user">
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-right" richColors theme={theme as any} />
      <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', transition: 'background-color 0.5s ease' }}>
        <Suspense fallback={<LoadingFallback />}>
          {!token ? (
            <ScreenBoundary><Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-reset-otp" element={<VerifyResetOTP />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes></ScreenBoundary>
        ) : (
          <Layout key={user?.id}>
            <ScreenBoundary><Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              {user?.role==='admin'&&<Route path="/executive" element={<ExecutiveDashboard key={user.id}/>} />}
              {user?.role==='admin'&&<Route path="/subscription" element={<SubscriptionCenter key={user.id}/>} />}
              {can('cash')&&<Route path="/cash" element={<Cash />} />}
              {can('pos','sales.add','products')&&<Route path="/pos" element={<POS />} />}
              {can('products')&&<Route path="/products" element={<Products />} />}
              {can('clients')&&<Route path="/clients" element={<Clients />} />}
              {user?.role==='admin'&&<Route path="/users" element={<UsersPage />} />}
              {can('suppliers')&&<Route path="/fournisseurs" element={<Fournisseurs />} />}
              {can('sales')&&<Route path="/sales" element={<Sales />} />}
              {can('purchases')&&<Route path="/purchases" element={<Purchases />} />}
              {can('products')&&<Route path="/stock-history" element={<StockHistory />} />}
              {can('debts','clients')&&<Route path="/dettes" element={<Dettes />} />}
              <Route path="/settings" element={<Settings />} />
              {user&&<Route path="/notifications" element={<NotificationCenter key={user.id}/>} />}
              {can('activities')||user?.role==='superadmin'&&<Route path="/activities" element={<Activities />} />}
              {user?.role==='admin'&&<Route path="/stats" element={<Stats />} />}
              {user?.role === 'admin' && <Route path="/subusers" element={<SubusersPage />} />}
              {user?.role === 'admin' && <Route path="/access-governance" element={<AccessGovernance />} />}
              {(user?.role === 'admin'||user?.permissions?.includes('expenses.request')||user?.permissions?.includes('expenses.review')) && <Route path="/expense-approvals" element={<ExpenseApprovals />} />}
              {user?.role === 'admin' && <Route path="/support" element={<SupportCenter />} />}
              {user?.role === 'admin' && <Route path="/inventory" element={<InventoryEnterprise />} />}
              {user?.role === 'admin' && <Route path="/repairs" element={<RepairCenter />} />}
              {user?.role === 'admin' && <Route path="/documents" element={<CommercialDocuments />} />}
              {user?.role === 'admin' && <Route path="/receivables" element={<Receivables />} />}
              {user?.role === 'admin' && <Route path="/accounting" element={<Accounting />} />}
              {user?.role === 'admin' && <Route path="/budgets" element={<Budgets key={user.id}/>} />}
              {(user?.role==='admin'||user?.permissions?.includes('crm.manage'))&&<Route path="/crm" element={<CRM key={user?.id}/>} />}
              {user?.role === 'admin' && <Route path="/treasury" element={<Treasury />} />}
              {user?.role === 'admin' && <Route path="/staff-assignments" element={<StaffAssignments />} />}
              {user?.role === 'admin' && <Route path="/hr" element={<HumanResources />} />}
              {user&&user.role!=='superadmin'&&<Route path="/leave" element={<LeaveManagement key={user.id}/>} />}
              {user?.role === 'admin' && <Route path="/payroll" element={<Payroll />} />}
              {user?.role === 'superadmin' && (
                <Route path="/superadmin" element={<SuperAdminDashboard />} />
              )}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes></ScreenBoundary>
          </Layout>
        )}
        </Suspense>
      </div>
    </BrowserRouter>
    </MotionConfig>
  );
};

export default App;
