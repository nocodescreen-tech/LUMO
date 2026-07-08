import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  History,
  Edit,
  Trash2,
  X,
  Filter,
  UserPlus,
  RefreshCw,
  ChevronRight,
  UserCheck,
  Calendar,
  AlertCircle,
  ShoppingBag,
  Clock,
  ArrowDownCircle,
  Download
} from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import { exportToExcel } from '../utils/exportUtils';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../hooks/useTranslation';

const Clients = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useState<any[]>([]);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 8;
  const { user, currency, exchangeRate } = useAuthStore(state => ({ user: state.user, currency: state.currency, exchangeRate: state.exchangeRate }));
  const displayCurrency = currency || user?.entreprise?.devise || 'CDF';

  // Normalize any amount to the user's display currency
  const toDisplayCurrency = (amount: number, saleCurrency: string): number => {
    const normalized = (saleCurrency === 'FC' ? 'CDF' : saleCurrency) || displayCurrency;
    if (normalized === displayCurrency) return amount;
    // Sale is in CDF, display is USD => divide
    if (normalized === 'CDF' && displayCurrency === 'USD') return amount / (exchangeRate || 2250);
    // Sale is in USD, display is CDF => multiply
    if (normalized === 'USD' && displayCurrency === 'CDF') return amount * (exchangeRate || 2250);
    return amount;
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

      // Structure standard: { success, data: { data: [], pagination: { pages } } }
      if (resData.success && resData.data) {
        if (Array.isArray(resData.data.data)) {
          clientsList = resData.data.data;
          pages = resData.data.pagination?.pages || 1;
        } else if (Array.isArray(resData.data)) {
          clientsList = resData.data;
        }
      }
      // Fallback
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

  // Search logic — filter locally from allClients
  useEffect(() => {
    if (!searchTerm.trim()) {
      // When search cleared, restore full list from allClients
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


  // Pagination Logic
  const currentItems = clients;

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0 }}>
            {t('clientsMgmtPrefix')} <span className="text-gradient">{t('clientsGradient')}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('clientsDesc')}</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => exportToExcel(clients, 'Clients_Report')}
            className="btn-hover"
            style={{
              padding: '16px 24px',
              borderRadius: '20px',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontWeight: '900',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            <Download size={22} /> {t('report')}
          </button>
          {clients.length > 0 && canDo('clients.delete') && (
            <button
              onClick={handleAllDelete}
              className="btn-hover"
              style={{
                padding: '16px 24px',
                borderRadius: '20px',
                backgroundColor: 'var(--bg-main)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontWeight: '900',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              <Trash2 size={22} /> {t('deleteAll')}
            </button>
          )}
          {canDo('clients.add') && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '16px 32px',
                borderRadius: '20px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontWeight: '950',
                cursor: 'pointer',
                boxShadow: '0 20px 40px -10px var(--primary-glow)',
                fontSize: '1rem'
              }}
            >
              <UserPlus size={22} /> {t('newClient')}
            </button>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass" style={{ padding: '16px', borderRadius: '24px', display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('searchClientPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '18px 20px 18px 60px', borderRadius: '20px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontWeight: '600', fontSize: '0.95rem' }}
          />
        </div>
        <button onClick={fetchClients} className="glass btn-hover" style={{ width: '56px', height: '56px', borderRadius: '18px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}>
          <RefreshCw size={20} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '28px' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="premium-card skeleton" style={{ borderRadius: '32px', height: '300px', opacity: 0.1 }}></div>
          ))
        ) : clients.length === 0 ? (
          <div className="premium-card" style={{ gridColumn: '1 / -1', padding: '100px', textAlign: 'center', borderRadius: '40px' }}>
            <Users size={80} opacity={0.1} style={{ marginBottom: '24px' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: '950' }}>{t('emptyCrmTitle')}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('emptyCrmDesc')}</p>
          </div>
        ) : currentItems.map((c: any) => (
          <motion.div
            key={c.id}
            layout
            whileHover={{ y: -8, scale: 1.01 }}
            className="premium-card"
            style={{ padding: '36px', borderRadius: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: '950', fontSize: '1.8rem', border: '1px solid var(--border)' }}>
                  {c.nom.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '950', margin: 0, letterSpacing: '-0.02em' }}>{c.nom}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.85rem', marginTop: '6px' }}>
                    <Calendar size={14} /> {t('registeredOn')} {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {canDo('clients.edit') && (
                  <button onClick={() => { setSelectedClient(c); setShowEditModal(true); }} className="btn-hover" style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Edit size={18} />
                  </button>
                )}
                {canDo('clients.delete') && (
                  <button onClick={() => handleDeleteClient(c.id, c.nom)} className="btn-hover" style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>



            <div className="glass" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', padding: '24px', borderRadius: '24px', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontWeight: '700' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Phone size={16} /></div>
                {c.telephone || t('notSpecified')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontWeight: '700' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Mail size={16} /></div>
                {c.email || t('noEmail')}
              </div>
              {c.adresse && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}><MapPin size={16} /></div>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.adresse}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{t('currentDebt')}</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '950', color: c.detteTotale > 0 ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {c.detteTotale?.toLocaleString() || 0} <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>{currency}</span>
                  {c.detteTotale > 0 && <AlertCircle size={18} />}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="glass btn-hover" style={{ width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                  <History size={20} />
                </button>
                <button onClick={() => {
                  setSelectedClient(c);
                  setShowDetailsModal(true);
                  setHistoryLoading(true);
                  api.get(`/clients/${c.id}/sales?_t=${Date.now()}`).then(res => {
                    const data = res.data;
                    const list = Array.isArray(data) ? data : (data.data?.data || data.data || []);
                    setClientHistory(list);
                  }).catch(err => console.error(err)).finally(() => setHistoryLoading(false));
                }} className="glass btn-hover" style={{ height: '48px', padding: '0 2px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: '950', cursor: 'pointer', color: 'var(--primary)', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                  {t('fullFile')} <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ padding: '12px 24px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontWeight: 700 }}
          >
            {t('previous')}
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              style={{
                width: '48px', height: '48px',
                borderRadius: '14px',
                background: currentPage === i + 1 ? 'var(--primary)' : 'var(--bg-card)',
                color: currentPage === i + 1 ? 'white' : 'var(--text-main)',
                fontWeight: 800,
                cursor: 'pointer',
                border: currentPage === i + 1 ? 'none' : '1px solid var(--border)'
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{ padding: '12px 24px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, fontWeight: 700 }}
          >
            {t('next')}
          </button>
        </div>
      )}

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
        {t('showingClients')
          .replace('{start}', (((currentPage - 1) * itemsPerPage) + 1).toString())
          .replace('{end}', Math.min(currentPage * itemsPerPage, clients.length).toString())
          .replace('{total}', clients.length.toString())}
      </div>

      {/* Modal Ajout */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('clientAddTitle')}
        subtitle={t('clientAddSubtitle')}
        maxWidth="650px"
        icon={UserPlus}
      >
        <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>{t('nameAndLastName')}</label>
            <div style={{ position: 'relative' }}>
              <Users style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={22} />
              <input required type="text" placeholder="ex: Marc Tshilombo" value={newClient.nom} onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })} style={{ width: '100%', padding: '20px 20px 20px 60px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', fontSize: '1.1rem', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>{t('phoneOptional')}</label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="text" placeholder="+243..." value={newClient.telephone} onChange={(e) => setNewClient({ ...newClient, telephone: e.target.value })} style={{ width: '100%', padding: '18px 18px 18px 52px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', fontSize: '1rem', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>{t('email')}</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="email" placeholder="client@lumo.com" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} style={{ width: '100%', padding: '18px 18px 18px 52px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', fontSize: '1rem', outline: 'none' }} />
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>{t('addressOptional')}</label>
            <div style={{ position: 'relative' }}>
              <MapPin style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={22} />
              <input type="text" placeholder="ex: 12 Rue de la Gombe, Kinshasa" value={newClient.adresse} onChange={(e) => setNewClient({ ...newClient, adresse: e.target.value })} style={{ width: '100%', padding: '20px 20px 20px 60px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', fontSize: '1.1rem', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginTop: '16px' }}>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-hover" style={{ padding: '18px 32px', border: 'none', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontWeight: '800', cursor: 'pointer', fontSize: '1rem', borderRadius: '16px' }}>{t('close') || 'Fermer'}</button>
            <button type="submit" className="btn-hover" style={{ padding: '18px 48px', borderRadius: '20px', backgroundColor: 'var(--primary)', color: 'var(--text-main)', border: 'none', fontWeight: '950', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 20px 40px -10px var(--primary-glow)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <UserCheck size={24} /> {t('validateRegistration')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edition */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('editProfileTitle')}
        subtitle={t('editProfileSubtitle')}
        maxWidth="650px"
        icon={Edit}
      >
        {selectedClient && (
          <form onSubmit={handleUpdateClient} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>{t('fullName')}</label>
              <div style={{ position: 'relative' }}>
                <Users style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={22} />
                <input required type="text" value={selectedClient.nom || ''} onChange={(e) => setSelectedClient({ ...selectedClient, nom: e.target.value })} style={{ width: '100%', padding: '20px 20px 20px 60px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', fontSize: '1.1rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>{t('phoneOptional')}</label>
                <div style={{ position: 'relative' }}>
                  <Phone style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                  <input type="text" value={selectedClient.telephone || ''} onChange={(e) => setSelectedClient({ ...selectedClient, telephone: e.target.value })} style={{ width: '100%', padding: '18px 18px 18px 52px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>{t('email')}</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                  <input type="email" value={selectedClient.email || ''} onChange={(e) => setSelectedClient({ ...selectedClient, email: e.target.value })} style={{ width: '100%', padding: '18px 18px 18px 52px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>{t('addressOptional')}</label>
              <div style={{ position: 'relative' }}>
                <MapPin style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={22} />
                <input type="text" value={selectedClient.adresse || ''} onChange={(e) => setSelectedClient({ ...selectedClient, adresse: e.target.value })} style={{ width: '100%', padding: '20px 20px 20px 60px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', fontSize: '1.1rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowEditModal(false)} className="btn-hover" style={{ padding: '18px 32px', border: 'none', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontWeight: '800', cursor: 'pointer', fontSize: '1rem', borderRadius: '16px' }}>{t('cancel')}</button>
              <button type="submit" className="btn-hover" style={{ padding: '18px 48px', borderRadius: '20px', backgroundColor: 'var(--primary)', color: 'var(--text-main)', border: 'none', fontWeight: '950', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 20px 40px -10px var(--primary-glow)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <UserCheck size={24} /> {t('save')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Fiche Complète */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setClientHistory([]); }}
        title={t('clientDetailsTitle').replace('{name}', selectedClient?.nom || '')}
      >
        {selectedClient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800 }}>{t('totalPurchases')}</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 950, color: 'var(--primary)', marginTop: '4px' }}>
                  {(Array.isArray(clientHistory) ? clientHistory : [])
                    .reduce((acc, curr) => acc + toDisplayCurrency(parseFloat(curr.montantTotal) || 0, curr.devise || displayCurrency), 0)
                    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {' '}<span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{displayCurrency}</span>
                </div>
              </div>
              <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800 }}>{t('remainingDebt')}</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 950, color: selectedClient.detteTotale > 0 ? '#ef4444' : '#10b981', marginTop: '4px' }}>
                  {toDisplayCurrency(selectedClient.detteTotale || 0, displayCurrency)
                    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {' '}<span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{displayCurrency}</span>
                </div>
              </div>
              <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800 }}>{t('numberOfVisits')}</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 950, color: 'var(--text-main)', marginTop: '4px' }}>
                  {t('visitsCount')
                    .replace('{count}', clientHistory.length.toString())
                    .replace('{s}', clientHistory.length > 1 ? 's' : '')}
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="var(--primary)" /> {t('purchaseHistory')}
              </h4>
              {historyLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('loadingHistory')}</div>
              ) : clientHistory.length === 0 ? (
                <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: '24px', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
                  {t('noPurchasesFound')}
                </div>
              ) : (
                <div className="custom-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '10px' }}>
                  {clientHistory.map(sale => (
                    <div key={sale.id} className="glass" style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-main)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          <Clock size={16} color="var(--primary)" /> {new Date(sale.createdAt).toLocaleString()}
                        </div>
                        <span style={{ background: sale.methodePaiement === 'Dette' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: sale.methodePaiement === 'Dette' ? '#ef4444' : '#10b981', padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 900 }}>
                          {sale.methodePaiement === 'Dette' ? (t('debt') || 'Dette') : sale.methodePaiement === 'Espèces' ? (t('cash') || 'Espèces') : sale.methodePaiement}
                        </span>
                      </div>

                      {/* Liste des articles */}
                      {sale.articles && sale.articles.length > 0 && (
                        <div style={{ background: 'var(--bg-body)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          {sale.articles.map((art: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: i !== sale.articles.length - 1 ? '8px' : '0', color: 'var(--text-main)', borderBottom: i !== sale.articles.length - 1 ? '1px dashed var(--border)' : 'none', paddingBottom: i !== sale.articles.length - 1 ? '8px' : '0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ArrowDownCircle size={14} opacity={0.5} /> <span style={{ fontWeight: 700 }}>{art.nom}</span> <span style={{ color: 'var(--text-muted)' }}>x{art.quantite}</span>
                              </div>
                              <span style={{ fontWeight: 800 }}>
                                {toDisplayCurrency(art.prixUnitaire * art.quantite, sale.devise || displayCurrency)
                                  .toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                {' '}{displayCurrency}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', fontWeight: 900, fontSize: '1.1rem', color: 'var(--primary)', borderTop: '1px solid var(--border)' }}>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-hover"
            style={{ padding: '12px 20px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontWeight: 700 }}
          >
            {t('previous')}
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                style={{
                  width: '44px', height: '44px', borderRadius: '14px',
                  background: currentPage === i + 1 ? 'var(--primary)' : 'var(--bg-card)',
                  color: currentPage === i + 1 ? 'white' : 'var(--text-main)',
                  fontWeight: 800, cursor: 'pointer', border: currentPage === i + 1 ? 'none' : '1px solid var(--border)'
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-hover"
            style={{ padding: '12px 20px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, fontWeight: 700 }}
          >
            {t('next')}
          </button>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); borderRadius: 10px; }
      `}</style>
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
