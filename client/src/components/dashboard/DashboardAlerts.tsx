import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Wallet, CreditCard, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardAlertsProps {
  lowStockCount?: number;
  lowStockProducts?: any[];
  debtsTotal?: number;
}

const DashboardAlerts = ({ lowStockCount = 0, lowStockProducts = [], debtsTotal = 0 }: DashboardAlertsProps) => {
  const navigate = useNavigate();

  if (lowStockCount === 0 && debtsTotal === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      {lowStockCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => navigate('/products')}
          className="glass"
          style={{ 
            padding: '20px 24px', 
            borderRadius: '24px', 
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            cursor: 'pointer'
          }}
        >
          <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontWeight: '900', color: '#f59e0b', fontSize: '1.1rem' }}>Stock Critique ({lowStockCount})</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: 'var(--text-main)', opacity: 0.8, fontWeight: 600 }}>
              {lowStockProducts.length > 0 
                ? `Articles : ${lowStockProducts.map(p => p.nom).join(', ')}...`
                : 'Certains articles sont presque épuisés.'}
            </p>
          </div>
          <ChevronRight size={20} style={{ opacity: 0.4, color: 'var(--text-main)' }} />
        </motion.div>
      )}

      {debtsTotal > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate('/dettes')}
          className="glass"
          style={{ 
            padding: '20px 24px', 
            borderRadius: '24px', 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            cursor: 'pointer'
          }}
        >
          <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#6366f1' }}>
            <CreditCard size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontWeight: '900', color: '#6366f1', fontSize: '1.1rem' }}>Dettes à Recouvrer</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: 'var(--text-main)', opacity: 0.8, fontWeight: 600 }}>Total: {debtsTotal.toLocaleString()} CDF à encaisser.</p>
          </div>
          <ChevronRight size={20} style={{ opacity: 0.4, color: 'var(--text-main)' }} />
        </motion.div>
      )}
    </div>
  );
};

export default DashboardAlerts;
