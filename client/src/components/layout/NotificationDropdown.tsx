import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, X, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../common/ConfirmModal';

interface Props {
  onClose: () => void;
  onRefresh?: () => void;
}

const NotificationDropdown = ({ onClose, onRefresh }: Props) => {
  const navigate=useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError,setLoadError]=useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      setNotifications(Array.isArray(data) ? data : (data?.notifications || data?.data?.notifications || (Array.isArray(data?.data)?data.data:[])));
      setLoadError(false);
    } catch (error) {
      setLoadError(true);
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      onRefresh?.();
      toast.success('Toutes les notifications marquées comme lues');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteAll = async () => {
    try {
      await api.delete('/notifications/all');
      setNotifications([]);
      onRefresh?.();
      toast.success('Notifications archivées');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const markOneRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
      onRefresh?.();
    } catch {
      // silent
    }
  };

  const unreadCount = (Array.isArray(notifications) ? notifications : []).filter(n => !n.lu).length;

  const getNotifColor = (type: string) => {
    switch (String(type||'').toLowerCase()) {
      case 'success': return 'var(--success)';
      case 'warning': return 'var(--warning)';
      case 'error': return 'var(--danger)';
      default: return 'var(--primary)';
    }
  };

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute',
        top: '60px',
        right: 0,
        width: '380px',
        maxHeight: '520px',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        zIndex: 200,
        padding: '0',
      }}
      className="premium-scroll lumo-notification-panel"
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--bg-card)',
        zIndex: 10,
        borderRadius: '24px 24px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Bell size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-main)' }}>Notifications</div>
            {unreadCount > 0 && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{ background: 'var(--primary-glow)', border: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Check size={13} /> Tout lire
            </button>
          )}
          <button
            onClick={fetchNotifications}
            style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex' }}
            title="Actualiser"
          >
            <RefreshCw size={14} />
          </button>
          {Array.isArray(notifications) && notifications.length > 0 && (
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex' }}
              title="Tout archiver"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            aria-label="Fermer les notifications"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', display: 'flex', borderRadius: '8px' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '72px', borderRadius: '16px', background: 'var(--bg-main)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : loadError ? <div role="alert" style={{padding:16,color:'var(--text-muted)'}}>Impossible de charger les notifications.<button type="button" className="btn-premium secondary" onClick={fetchNotifications}>Réessayer</button></div> : !Array.isArray(notifications) || notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <Bell size={40} style={{ opacity: 0.15, marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>Aucune notification</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {notifications.slice(0, 15).map(n => (
              <div
                key={n.id}
                onClick={() => !n.lu && markOneRead(n.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  backgroundColor: n.lu ? 'transparent' : 'var(--primary-glow)',
                  border: `1px solid ${n.lu ? 'var(--border)' : 'rgba(21,94,88,0.15)'}`,
                  cursor: n.lu ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                  opacity: n.lu ? 0.7 : 1,
                }}
                onMouseEnter={e => !n.lu && (e.currentTarget.style.background = 'rgba(21,94,88,0.12)')}
                onMouseLeave={e => !n.lu && (e.currentTarget.style.background = 'var(--primary-glow)')}
              >
                {!n.lu && (
                  <div style={{ position: 'absolute', top: '16px', right: '16px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', paddingRight: n.lu ? 0 : '20px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.87rem', color: 'var(--text-main)' }}>{n.titre || 'Notification'}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {new Date(n.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, paddingRight: n.lu ? 0 : '20px' }}>{n.contenu || n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{padding:12,borderTop:'1px solid var(--border)'}}><button className="btn-premium secondary" style={{width:'100%'}} onClick={()=>{onClose();navigate('/notifications')}}>Ouvrir le centre de notifications</button></div>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteAll}
        title="Archiver les notifications"
        message="Archiver toutes vos notifications ? Les alertes archivées ne réapparaîtront pas à l’identique."
        confirmText="Tout archiver"
        type="danger"
      />
    </motion.div>
  );
};

export default NotificationDropdown;
