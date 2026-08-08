import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  History,
  Edit,
  Trash2,
  UserPlus,
  RefreshCw,
  ChevronRight,
  UserCheck,
  Calendar,
  AlertCircle,
  Clock,
  ArrowDownCircle,
  Download,
  CreditCard,
  X,
  Filter,
  ShoppingBag,
  Loader2
} from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import { exportToExcel } from '../utils/exportUtils';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../hooks/useTranslation';
import { normalizeAmount, getEffectiveRate } from '../utils/currencyHelpers';

const Clients = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useState<any[]>([]);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 8;
  const { user, currency } = useAuthStore(state => ({ user: state.user, currency: state.currency }));
  const exchangeRate = getEffectiveRate();
  const displayCurrency = currency || user?.entreprise?.devise || 'CDF';

  // Normalize any amount to the user's display currency
  const toDisplayCurrency = (amount: number, saleCurrency: string): number => {
    const normalized = (saleCurrency === 'FC' ? 'CDF' : saleCurrency) || displayCurrency;
    if (normalized === displayCurrency) return amount;
    return normalizeAmount(amount, normalized, displayCurrency, exchangeRate);
  };

  const canDo = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    return (user.permissions || []).includes(permission);
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const [newClient, setNewClient] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: ''
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clients?page=${currentPage}&limit=${itemsPerPage}&_t=${Date.now()}`);
      const resData = response.data;

      let clientsList = [];
      let pages = 1;

      if (resData.success && resData.data) {
        if (Array.isArray(resData.data.data)) {
          clientsList = resData.data.data;
          pages = resData.data.pagination?.pages || 1;
        } else if (Array.isArray(resData.data)) {
          clientsList = resData.data;
        }
      }
      else {
        if (Array.isArray(resData)) clientsList = resData;
        else if (resData && Array.isArray(resData.data)) clientsList = resData.data;
        else if (resData && Array.isArray(resData.clients)) clientsList = resData.clients;
      }

      setClients(clientsList);
      setAllClients(clientsList);
      setTotalPages(pages);
    } catch (error) {
      toast.error(t('clientsLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [currentPage]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setClients(allClients);
      setCurrentPage(1);
      return;
    }
    const filtered = allClients.filter((c: any) =>
      c.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setClients(filtered);
    setCurrentPage(1);
  }, [searchTerm, allClients]);

  const currentItems = clients;

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clients', newClient);
      toast.success(t('clientAddedNamed').replace('{name}', newClient.nom));
      setShowAddModal(false);
      setNewClient({ nom: '', email: '', telephone: '', adresse: '' });
      fetchClients();
    } catch (error) {
      toast.error(t('clientAddError'));
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/clients/${selectedClient.id}`, selectedClient);
      toast.success(t('clientUpdated'));
      setShowEditModal(false);
      fetchClients();
    } catch (error) {
      toast.error(t('clientUpdateError'));
    }
  };

  const handleDeleteClient = async (id: number, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: t('deleteClientTitle'),
      message: t('deleteClientConfirmMsg').replace('{name}', name),
      onConfirm: async () => {
        try {
          await api.delete(`/clients/${id}`);
          toast.success(t('clientDeleted'));
          fetchClients();
        } catch (error) {
          toast.error(t('clientDeleteFailed'));
        }
      }
    });
  };

  const handleAllDelete = async () => {
    setConfirmModal({
      isOpen: true,
      title: t('bulkDeleteTitle'),
      message: t('bulkDeleteConfirmMsg'),
      onConfirm: async () => {
        try {
          await api.delete('/clients/all');
          toast.success(t('clientBulkDeleted'));
          fetchClients();
        } catch (error) {
          toast.error(t('clientBulkDeleteError'));
        }
      }
    });
  };

  const totalClients = allClients.length;
  const clientsWithDebt = allClients.filter(c => (c.detteTotale || 0) > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '900', fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase' }}>
            <Users size={14} /> {t('crmDirectory')}
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', margin: 0 }}>
            {t('clientsMgmtPrefix')} <span className="text-gradient">{t('clientsGradient')}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('clientsDesc')}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', minWidth: '180px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Users size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Total Clients</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{totalClients}</div>
            </div>
          </div>
          
          <div className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', minWidth: '180px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(214, 69, 69, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Avec Dettes</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--danger)' }}>{clientsWithDebt}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('searchClientPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '16px 16px 16px 60px', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--border)', 
              backgroundColor: 'var(--bg-main)', 
              color: 'var(--text-main)', 
              fontWeight: '600', 
              outline: 'none',
              fontSize: '1rem' 
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => exportToExcel(clients, 'Clients_Report')} className="glass btn-hover" style={{ padding: '0 24px', height: '48px', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: '600' }}>
            <Download size={18} /> {t('report')}
          </button>
          
          {clients.length > 0 && canDo('clients.delete') && (
            <button onClick={handleAllDelete} className="glass btn-hover" style={{ padding: '0 24px', height: '48px', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid rgba(214, 69, 69, 0.2)', fontWeight: '600' }}>
              <Trash2 size={18} /> {t('deleteAll')}
            </button>
          )}
          
          <button onClick={fetchClients} className="glass btn-hover" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}>
            <RefreshCw size={18} />
          </button>
          
          {canDo('clients.add') && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '0 32px', height: '48px', borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary)', color: 'white',
                border: 'none', fontWeight: '600', cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                fontSize: '0.95rem'
              }}
            >
              <UserPlus size={20} /> {t('newClient')}
            </button>
          )}
        </div>
      </div>

      <div className="glass" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                <th style={{ padding: '16px 24px' }}>Client</th>
                <th style={{ padding: '16px 24px' }}>Contact</th>
                <th style={{ padding: '16px 24px' }}>Dette Actuelle</th>
                <th style={{ padding: '16px 24px' }}>Date d'inscription</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center' }}>
                  <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto', opacity: 0.5 }} />
                </td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center' }}>
                  <Users size={60} style={{ opacity: 0.1, marginBottom: '24px', margin: '0 auto', color: 'var(--text-muted)' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-muted)' }}>{t('emptyCrmTitle')}</h3>
                  <p style={{ color: 'var(--text-muted)', fontWeight: '500', marginTop: '8px' }}>{t('emptyCrmDesc')}</p>
                </td></tr>
              ) : currentItems.map((c: any) => (
                <motion.tr
                  key={c.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.3s' }}
                  className="hover-row"
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--primary)', fontSize: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
                        {c.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1rem' }}>{c.nom}</div>
                        {c.adresse && (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <MapPin size={12} /> <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.adresse}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {c.telephone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.85rem' }}>
                          <Phone size={14} color="var(--primary)" /> {c.telephone}
                        </div>
                      )}
                      {c.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.85rem' }}>
                          <Mail size={14} /> {c.email}
                        </div>
                      )}
                      {!c.telephone && !c.email && (
                         <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('notSpecified')}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: c.detteTotale > 0 ? 'var(--danger)' : 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {toDisplayCurrency(c.detteTotale || 0, displayCurrency).toLocaleString()} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{displayCurrency}</span>
                      {c.detteTotale > 0 && <AlertCircle size={14} />}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                      <Calendar size={14} /> {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setSelectedClient(c);
                          setShowDetailsModal(true);
                          setHistoryLoading(true);
                          api.get(`/clients/${c.id}/sales?_t=${Date.now()}`).then(res => {
                            const data = res.data;
                            const list = Array.isArray(data) ? data : (data.data?.data || data.data || []);
                            setClientHistory(list);
                          }).catch(err => console.error(err)).finally(() => setHistoryLoading(false));
                        }}
                        className="glass btn-hover"
                        style={{ padding: '0 12px', height: '40px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.85rem' }}
                        title={t('fullFile')}
                      >
                         <History size={16} /> Fiche
                      </button>
                      {canDo('clients.edit') && (
                        <button
                          onClick={() => { setSelectedClient(c); setShowEditModal(true); }}
                          className="glass btn-hover"
                          style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {canDo('clients.delete') && (
                        <button
                          onClick={() => handleDeleteClient(c.id, c.nom)}
                          className="glass btn-hover"
                          style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
            {t('showingClients')
              .replace('{start}', (clients.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1).toString())
              .replace('{end}', Math.min(currentPage * itemsPerPage, clients.length).toString())
              .replace('{total}', clients.length.toString())}
          </div>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-hover"
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontWeight: 600, fontSize: '0.85rem' }}
              >
                {t('previous')}
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (totalPages > 5 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} style={{ color: 'var(--text-muted)', padding: '0 4px', display: 'flex', alignItems: 'center' }}>...</span>;
                  return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                      background: currentPage === pageNum ? 'var(--primary)' : 'var(--bg-card)',
                      color: currentPage === pageNum ? 'white' : 'var(--text-main)',
                      fontWeight: 700, cursor: 'pointer', border: currentPage === pageNum ? 'none' : '1px solid var(--border)',
                      fontSize: '0.9rem'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-hover"
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, fontWeight: 600, fontSize: '0.85rem' }}
              >
                {t('next')}
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('clientAddTitle')}
        subtitle={t('clientAddSubtitle')}
        maxWidth="650px"
        icon={UserPlus}
      >
        <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('nameAndLastName')}</label>
            <div style={{ position: 'relative' }}>
              <Users style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
              <input required type="text" placeholder="ex: Marc Tshilombo" value={newClient.nom} onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('phoneOptional')}</label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="text" placeholder="+243..." value={newClient.telephone} onChange={(e) => setNewClient({ ...newClient, telephone: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('email')}</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="email" placeholder="client@lumo.com" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('addressOptional')}</label>
            <div style={{ position: 'relative' }}>
              <MapPin style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
              <input type="text" placeholder="ex: 12 Rue de la Gombe, Kinshasa" value={newClient.adresse} onChange={(e) => setNewClient({ ...newClient, adresse: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-hover" style={{ padding: '12px 24px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem', borderRadius: 'var(--radius-sm)' }}>{t('close') || 'Fermer'}</button>
            <button type="submit" className="btn-hover" style={{ padding: '12px 32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} /> {t('validateRegistration')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('editProfileTitle')}
        subtitle={t('editProfileSubtitle')}
        maxWidth="650px"
        icon={Edit}
      >
        {selectedClient && (
          <form onSubmit={handleUpdateClient} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('fullName')}</label>
              <div style={{ position: 'relative' }}>
                <Users style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input required type="text" value={selectedClient.nom || ''} onChange={(e) => setSelectedClient({ ...selectedClient, nom: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('phoneOptional')}</label>
                <div style={{ position: 'relative' }}>
                  <Phone style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                  <input type="text" value={selectedClient.telephone || ''} onChange={(e) => setSelectedClient({ ...selectedClient, telephone: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('email')}</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                  <input type="email" value={selectedClient.email || ''} onChange={(e) => setSelectedClient({ ...selectedClient, email: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('addressOptional')}</label>
              <div style={{ position: 'relative' }}>
                <MapPin style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="text" value={selectedClient.adresse || ''} onChange={(e) => setSelectedClient({ ...selectedClient, adresse: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowEditModal(false)} className="btn-hover" style={{ padding: '12px 24px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem', borderRadius: 'var(--radius-sm)' }}>{t('cancel')}</button>
              <button type="submit" className="btn-hover" style={{ padding: '12px 32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={18} /> {t('save')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setClientHistory([]); }}
        title={t('clientDetailsTitle').replace('{name}', selectedClient?.nom || '')}
        icon={History}
        maxWidth="700px"
      >
        {selectedClient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{t('totalPurchases')}</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                  {(Array.isArray(clientHistory) ? clientHistory : [])
                    .reduce((acc, curr) => acc + toDisplayCurrency(parseFloat(curr.montantTotal) || 0, curr.devise || displayCurrency), 0)
                    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {' '}<span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{displayCurrency}</span>
                </div>
              </div>
              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{t('remainingDebt')}</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: selectedClient.detteTotale > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '4px' }}>
                  {toDisplayCurrency(selectedClient.detteTotale || 0, displayCurrency)
                    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {' '}<span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{displayCurrency}</span>
                </div>
              </div>
              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{t('numberOfVisits')}</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                  {t('visitsCount')
                    .replace('{count}', clientHistory.length.toString())
                    .replace('{s}', clientHistory.length > 1 ? 's' : '')}
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} color="var(--primary)" /> {t('purchaseHistory')}
              </h4>
              {historyLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}><Loader2 size={32} className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} /></div>
              ) : clientHistory.length === 0 ? (
                <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
                  {t('noPurchasesFound')}
                </div>
              ) : (
                <div className="custom-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '10px' }}>
                  {clientHistory.map(sale => (
                    <div key={sale.id} className="glass" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-card)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          <Clock size={16} color="var(--primary)" /> {new Date(sale.createdAt).toLocaleString()}
                        </div>
                        <span style={{ background: sale.methodePaiement === 'Dette' ? 'rgba(214, 69, 69, 0.1)' : 'rgba(15, 157, 106, 0.1)', color: sale.methodePaiement === 'Dette' ? 'var(--danger)' : 'var(--success)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                          {sale.methodePaiement === 'Dette' ? (t('debt') || 'Dette') : sale.methodePaiement === 'Espèces' ? (t('cash') || 'Espèces') : sale.methodePaiement}
                        </span>
                      </div>

                      {sale.articles && sale.articles.length > 0 && (
                        <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          {sale.articles.map((art: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: i !== sale.articles.length - 1 ? '8px' : '0', color: 'var(--text-main)', borderBottom: i !== sale.articles.length - 1 ? '1px dashed var(--border)' : 'none', paddingBottom: i !== sale.articles.length - 1 ? '8px' : '0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ArrowDownCircle size={14} opacity={0.5} /> <span style={{ fontWeight: 600 }}>{art.nom}</span> <span style={{ color: 'var(--text-muted)' }}>x{art.quantite}</span>
                              </div>
                              <span style={{ fontWeight: 700 }}>
                                {toDisplayCurrency(art.prixUnitaire * art.quantite, sale.devise || displayCurrency)
                                  .toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                {' '}{displayCurrency}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', borderTop: '1px solid var(--border)' }}>
                        Total : {toDisplayCurrency(parseFloat(sale.montantTotal) || 0, sale.devise || displayCurrency)
                          .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {displayCurrency}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </motion.div>
  );
};

export default Clients;
