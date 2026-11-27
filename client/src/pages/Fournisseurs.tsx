import { PageSkeleton } from '../design-system/PageSkeleton';
import { LoadFailure } from '../design-system/LoadFailure';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Plus, Search, Phone, Mail, MapPin, Package, TrendingUp, FileText, Edit2, Trash2, X, Filter, Download, RefreshCw, Loader2, Edit, Building2
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'sonner';
import { exportToPDF } from '../utils/reportPDF';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../hooks/useTranslation';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';

const Fournisseurs = () => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const user = useAuthStore(state => state.user);
  const canDo = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    return (user.permissions || []).includes(permission);
  };

  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    categorie: ''
  });

  const [editData, setEditData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    categorie: ''
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/fournisseurs?_t=${Date.now()}`);
      const resData = response.data;

      let suppliersList = [];

      if (resData.success && resData.data) {
        if (Array.isArray(resData.data.data)) {
          suppliersList = resData.data.data;
        } else if (Array.isArray(resData.data)) {
          suppliersList = resData.data;
        }
      } else {
        const data = resData;
        if (Array.isArray(data)) suppliersList = data;
        else if (data && Array.isArray(data.data)) suppliersList = data.data;
        else if (data && Array.isArray(data.fournisseurs)) suppliersList = data.fournisseurs;
      }

      setSuppliers(suppliersList);
            setLoadError(false);
    } catch (error) {
      setLoadError(true); toast.error(t('suppliersLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/fournisseurs', formData);
      const newSupplier = data?.data || data;
      setSuppliers(prev => [newSupplier, ...prev]);
      setShowAddModal(false);
      setFormData({ nom: '', email: '', telephone: '', adresse: '', categorie: '' });
      toast.success(t('supplierAdded'));
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('supplierAddError'));
    }
  };

  const openEditModal = (supplier: any) => {
    setEditingSupplier(supplier);
    setEditData({
      nom: supplier.nom || '',
      email: supplier.email || '',
      telephone: supplier.telephone || '',
      adresse: supplier.adresse || '',
      categorie: supplier.categorie || ''
    });
    setShowEditModal(true);
  };

  const handleEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    try {
      const { data } = await api.put(`/fournisseurs/${editingSupplier.id}`, editData);
      const updated = data?.data || data;
      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? { ...s, ...updated } : s));
      setShowEditModal(false);
      setEditingSupplier(null);
      toast.success(t('supplierUpdated'));
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('supplierUpdateError'));
    }
  };

  const handleDeleteSupplier = async (id: number, nom: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer le fournisseur',
      message: `Voulez-vous vraiment supprimer le fournisseur "${nom}" ? Cette action est irréversible.`,
      onConfirm: async () => {
        try {
          await api.delete(`/fournisseurs/${id}`);
          setSuppliers(prev => prev.filter(s => s.id !== id));
          toast.success(t('supplierDeleted'));
          fetchSuppliers();
        } catch (error: any) {
          toast.error(error.response?.data?.message || t('supplierDeleteError'));
        }
      }
    });
  };


  const filteredSuppliers = suppliers.filter(s =>
    s.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.telephone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage) || 1;
  const currentItems = filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!loading && loadError) return <LoadFailure onRetry={fetchSuppliers} />;
    return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}
    >
      <div className="lumo-record-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '900', fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase' }}>
            <Truck size={14} /> {t('suppliersMgmtPrefix')}
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, letterSpacing: '-0.04em', margin: 0 }}>
            <span className="text-gradient">{t('suppliers')}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t('suppliersSubtitle')}</p>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', minWidth: '180px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Building2 size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>{t('totalPartners')}</span>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>{suppliers.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass lumo-record-toolbar" style={{ padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('searchSupplier')}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
          <button onClick={() => exportToPDF(suppliers, user?.preferences?.language === 'en' ? 'Suppliers Report' : 'Rapport des Fournisseurs', user)} className="glass btn-hover" style={{ padding: '0 24px', height: '48px', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: '600' }}>
            <Download size={18} /> {t('report')}
          </button>

          <button onClick={fetchSuppliers} className="glass btn-hover" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}>
            <RefreshCw size={18} />
          </button>

          {canDo('suppliers.add') && (
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
              <Plus size={20} /> {t('newSupplier')}
            </button>
          )}
        </div>
      </div>

      <div className="glass" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                <th style={{ padding: '16px 24px' }}>Fournisseur</th>
                <th style={{ padding: '16px 24px' }}>Contact</th>
                <th style={{ padding: '16px 24px' }}>Catégorie</th>
                <th style={{ padding: '16px 24px' }}>Date d'ajout</th>
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
                  <Truck size={60} style={{ opacity: 0.1, marginBottom: '24px', margin: '0 auto', color: 'var(--text-muted)' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-muted)' }}>Aucun fournisseur</h3>
                  <p style={{ color: 'var(--text-muted)', fontWeight: '500', marginTop: '8px' }}>Ajoutez vos premiers partenaires.</p>
                </td></tr>
              ) : currentItems.map((s: any) => (
                <motion.tr
                  key={s.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.3s' }}
                  className="hover-row"
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--primary)', fontSize: '1.2rem', boxShadow: 'var(--shadow-sm)' }}>
                        <Truck size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1rem' }}>{s.nom}</div>
                        {s.adresse && (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <MapPin size={12} /> <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.adresse}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {s.telephone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.85rem' }}>
                          <Phone size={14} color="var(--primary)" /> {s.telephone}
                        </div>
                      )}
                      {s.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.85rem' }}>
                          <Mail size={14} /> {s.email}
                        </div>
                      )}
                      {!s.telephone && !s.email && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('notSpecified')}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {s.categorie ? (
                      <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--primary)', fontWeight: '800', border: '1px solid var(--border)' }}>
                        {s.categorie.toUpperCase()}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                      {new Date(s.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {canDo('suppliers.edit') && (
                        <button
                          onClick={() => openEditModal(s)}
                          className="glass btn-hover"
                          style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {canDo('suppliers.delete') && (
                        <button
                          onClick={() => handleDeleteSupplier(s.id, s.nom)}
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
              .replace('{start}', (filteredSuppliers.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1).toString())
              .replace('{end}', Math.min(currentPage * itemsPerPage, filteredSuppliers.length).toString())
              .replace('{total}', filteredSuppliers.length.toString())}
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
        title={t('newSupplier')}
        subtitle={t('newSupplierSubtitle') || 'Ajoutez un nouveau fournisseur à votre carnet.'}
        maxWidth="650px"
        icon={Building2}
      >
        <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('companyName')}</label>
            <div style={{ position: 'relative' }}>
              <Building2 style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
              <input required type="text" placeholder="Ex: Global Supply Sarl" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('phone')}</label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="text" placeholder="+243..." value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('partnerEmail')}</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="email" placeholder="contact@fournisseur.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('location')}</label>
              <div style={{ position: 'relative' }}>
                <MapPin style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="text" placeholder="Kinshasa, Gombe" value={formData.adresse} onChange={(e) => setFormData({ ...formData, adresse: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('category')}</label>
              <div style={{ position: 'relative' }}>
                <Package style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="text" placeholder="Ex: IMPORTATEUR" value={formData.categorie} onChange={(e) => setFormData({ ...formData, categorie: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-hover" style={{ padding: '12px 24px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem', borderRadius: 'var(--radius-sm)' }}>{t('cancel')}</button>
            <button type="submit" className="btn-hover" style={{ padding: '12px 32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> {t('savePartner')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingSupplier(null); }}
        title={t('editSupplier')}
        subtitle={t('editSupplierSubtitle') || 'Mettez à jour les informations de ce fournisseur.'}
        maxWidth="650px"
        icon={Edit}
      >
        <form onSubmit={handleEditSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('companyName')}</label>
            <div style={{ position: 'relative' }}>
              <Building2 style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
              <input required type="text" placeholder="Ex: Global Supply Sarl" value={editData.nom} onChange={(e) => setEditData({ ...editData, nom: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('phone')}</label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="text" placeholder="+243..." value={editData.telephone} onChange={(e) => setEditData({ ...editData, telephone: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('partnerEmail')}</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="email" placeholder="contact@fournisseur.com" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('location')}</label>
              <div style={{ position: 'relative' }}>
                <MapPin style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="text" placeholder="Kinshasa, Gombe" value={editData.adresse} onChange={(e) => setEditData({ ...editData, adresse: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>{t('category')}</label>
              <div style={{ position: 'relative' }}>
                <Package style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="text" placeholder="Ex: IMPORTATEUR" value={editData.categorie} onChange={(e) => setEditData({ ...editData, categorie: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', outline: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
            <button type="button" onClick={() => { setShowEditModal(false); setEditingSupplier(null); }} className="btn-hover" style={{ padding: '12px 24px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem', borderRadius: 'var(--radius-sm)' }}>{t('cancel')}</button>
            <button type="submit" className="btn-hover" style={{ padding: '12px 32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit size={18} /> {t('save')}
            </button>
          </div>
        </form>
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

export default Fournisseurs;
