import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Wallet, CreditCard, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

interface DashboardAlertsProps {
  lowStockCount?: number;
  lowStockProducts?: any[];
  debtsTotal?: number;
  expiringProductsCount?: number;
  expiringProducts?: any[];
}

const DashboardAlerts = ({ lowStockCount = 0, lowStockProducts = [], debtsTotal = 0, expiringProductsCount = 0, expiringProducts = [] }: DashboardAlertsProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (lowStockCount === 0 && debtsTotal === 0 && expiringProductsCount === 0) return null;

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
          <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: 'rgba(192, 126, 18, 0.15)', color: 'var(--warning)' }}>
            <AlertTriangle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--warning)', fontSize: '1.1rem' }}>
              {t('criticalStockTitle').replace('{count}', lowStockCount.toString())}
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: 'var(--text-main)', opacity: 0.8, fontWeight: 600 }}>
              {lowStockProducts.length > 0 
                ? t('criticalStockArticles').replace('{list}', lowStockProducts.map(p => p.nom).join(', '))
                : t('criticalStockDesc')}
            </p>
          </div>
          <ChevronRight size={20} style={{ opacity: 0.4, color: 'var(--text-main)' }} />
        </motion.div>
      )}

      {expiringProductsCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => navigate('/products')}
          className="glass"
          style={{ 
            padding: '20px 24px', 
            borderRadius: '24px', 
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            cursor: 'pointer'
          }}
        >
          <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
            <AlertTriangle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--danger)', fontSize: '1.1rem' }}>
              {t('expiredProductsTitle').replace('{count}', expiringProductsCount.toString())}
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: 'var(--text-main)', opacity: 0.8, fontWeight: 600 }}>
              {expiringProducts.length > 0 
                ? t('expiredProductsCheck').replace('{list}', expiringProducts.slice(0, 3).map(p => p.nom).join(', '))
                : t('expiredProductsDesc')}
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
            background: 'linear-gradient(135deg, rgba(21, 94, 88, 0.1) 0%, rgba(21, 94, 88, 0.05) 100%)',
            border: '1px solid rgba(21, 94, 88, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            cursor: 'pointer'
          }}
        >
          <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: 'rgba(21, 94, 88, 0.2)', color: '#155E58' }}>
            <CreditCard size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontWeight: '700', color: '#155E58', fontSize: '1.1rem' }}>
              {t('debtsToCollectTitle')}
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: 'var(--text-main)', opacity: 0.8, fontWeight: 600 }}>
              {t('debtsToCollectDesc').replace('{amount}', debtsTotal.toLocaleString())}
            </p>
          </div>
          <ChevronRight size={20} style={{ opacity: 0.4, color: 'var(--text-main)' }} />
        </motion.div>
      )}
    </div>
  );
};

export default DashboardAlerts;
