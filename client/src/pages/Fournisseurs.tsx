import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  TrendingUp,
  FileText,
  Edit2,
  Trash2,
  X,
  Filter,
  Download
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'sonner';
import { exportToExcel } from '../utils/exportUtils';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../hooks/useTranslation';

const Fournisseurs = () => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const user = useAuthStore(state => state.user);
  const canDo = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    return (user.permissions || []).includes(permission);
  };

  // Form State
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    categorie: ''
  });

  // Edit Form State (separate to avoid conflicts)
  const [editData, setEditData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    categorie: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get(`/fournisseurs?_t=${Date.now()}`);
      const resData = response.data;
      
      let suppliersList = [];
      
      // Structure standard: { success, data: { data: [] } }
      if (resData.success && resData.data) {
        if (Array.isArray(resData.data.data)) {
          suppliersList = resData.data.data;
        } else if (Array.isArray(resData.data)) {
          suppliersList = resData.data;
        }
      }
      // Fallback
      else {
        const data = resData;
        if (Array.isArray(data)) suppliersList = data;
        else if (data && Array.isArray(data.data)) suppliersList = data.data;
        else if (data && Array.isArray(data.fournisseurs)) suppliersList = data.fournisseurs;
      }
      
      setSuppliers(suppliersList);
    } catch (error) {
      toast.error(t('suppliersLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/fournisseurs', formData);
      // Backend wraps in { success, data: fournisseur }
      const newSupplier = data?.data || data;
      setSuppliers(prev => [newSupplier, ...prev]);
      setShowAddModal(false);
      setFormData({ nom: '', email: '', telephone: '', adresse: '', categorie: '' });
      toast.success(t('supplierAdded'));
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('supplierUpdateError'));
    }
  };

  const handleDeleteSupplier = async (id: number, nom: string) => {
    if (!confirm(`Supprimer le fournisseur "${nom}" ?`)) return;
    try {
      await api.delete(`/fournisseurs/${id}`);
      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast.success(t('supplierDeleted'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('supplierDeleteError'));
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="title-xl">{t('suppliersMgmtPrefix')} <span className="text-gradient">{t('suppliers')}</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>GÃ©rez vos partenaires et approvisionnements.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => exportToExcel(suppliers, 'Fournisseurs_Report')}
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
            <Download size={22} /> Rapport
          </button>
          {canDo('suppliers.add') && (
            <button className="btn-premium primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Nouveau Fournisseur
            </button>
          )}
        </div>
      </div>

      {/* Stats Mini Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="premium-card" style={{ padding: '24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '12px', borderRadius: '16px' }}><Truck size={24} /></div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Partenaires</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{suppliers.length}</div>
            </div>
         </motion.div>
      </div>

      {/* List Component */}
      <div className="premium-card" style={{ padding: '32px', borderRadius: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', gap: '20px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Rechercher un fournisseur..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', outline: 'none', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem' }}
            />
          </div>
          <button className="btn-premium secondary" style={{ border: '1px solid var(--border)' }}><Filter size={18} /> Filtres</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          <AnimatePresence>
            {filteredSuppliers.map((supplier, i) => (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="premium-card"
                style={{ padding: '24px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <Truck size={24} />
                    </div>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><MoreHorizontal size={20} /></button>
                 </div>
                 
                 <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>{supplier.nom}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>{supplier.categorie || 'IMPORTATEUR'}</span>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                       <Phone size={15} color="var(--primary)" /> {supplier.telephone || 'Non renseignÃ©'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                       <Mail size={15} color="var(--primary)" /> {supplier.email || 'N/A'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                       <MapPin size={15} color="var(--primary)" /> {supplier.adresse || 'N/A'}
                    </div>
                 </div>

                 <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
                    {canDo('suppliers.edit') && (
                      <button
                        className="btn-premium secondary"
                        style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        onClick={() => openEditModal(supplier)}
                      >
                        <Edit2 size={15} /> Modifier
                      </button>
                    )}
                    {canDo('suppliers.delete') && (
                      <button
                        className="btn-premium secondary"
                        style={{ flex: 1, padding: '10px', borderRadius: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        onClick={() => handleDeleteSupplier(supplier.id, supplier.nom)}
                      >
                        <Trash2 size={15} /> Supprimer
                      </button>
                    )}
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
           <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="premium-card" style={{ width: '100%', maxWidth: '500px', padding: '48px', borderRadius: '36px', background: 'var(--bg-card)', border: '1px solid var(--border-strong)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                 <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Nouveau <span className="text-gradient">Fournisseur</span></h2>
                 <button onClick={() => setShowAddModal(false)} style={{ background: 'var(--sidebar-active)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '4px' }}>Nom de l'Entreprise</label>
                    <input type="text" placeholder="Ex: Global Supply Sarl" required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} style={{ padding: '16px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} />
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '4px' }}>Email Partenaire</label>
                    <input type="email" placeholder="contact@fournisseur.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '16px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} />
                 </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '4px' }}>Téléphone</label>
                     <input type="text" placeholder="+243 ..." value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} style={{ padding: '16px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} />
                  </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '4px' }}>Localisation</label>
                    <input type="text" placeholder="Kinshasa, Gombe" value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} style={{ padding: '16px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} />
                 </div>
                 <button type="submit" className="btn-premium primary" style={{ height: '60px', fontSize: '1.1rem', marginTop: '12px' }}>Enregistrer le Partenaire</button>
              </form>
           </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingSupplier && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
           <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="premium-card" style={{ width: '100%', maxWidth: '500px', padding: '48px', borderRadius: '36px', background: 'var(--bg-card)', border: '1px solid var(--border-strong)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                 <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Modifier <span className="text-gradient">Fournisseur</span></h2>
                 <button onClick={() => { setShowEditModal(false); setEditingSupplier(null); }} style={{ background: 'var(--sidebar-active)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleEditSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '4px' }}>Nom de l'Entreprise</label>
                    <input type="text" placeholder="Ex: Global Supply Sarl" required value={editData.nom} onChange={e => setEditData({ ...editData, nom: e.target.value })} style={{ padding: '16px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} />
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '4px' }}>Email Partenaire</label>
                    <input type="email" placeholder="contact@fournisseur.com" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} style={{ padding: '16px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} />
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '4px' }}>Tâ”œâŒlâ”œâŒphone</label>
                    <input type="text" placeholder="+243 ..." value={editData.telephone} onChange={e => setEditData({ ...editData, telephone: e.target.value })} style={{ padding: '16px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} />
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '4px' }}>Localisation</label>
                    <input type="text" placeholder="Kinshasa, Gombe" value={editData.adresse} onChange={e => setEditData({ ...editData, adresse: e.target.value })} style={{ padding: '16px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} />
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '4px' }}>CatÃ©gorie</label>
                    <input type="text" placeholder="Ex: IMPORTATEUR" value={editData.categorie} onChange={e => setEditData({ ...editData, categorie: e.target.value })} style={{ padding: '16px', borderRadius: '16px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} />
                 </div>
                 <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button type="button" onClick={() => { setShowEditModal(false); setEditingSupplier(null); }} style={{ flex: 1, height: '56px', fontSize: '1rem', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer' }}>Annuler</button>
                    <button type="submit" className="btn-premium primary" style={{ flex: 2, height: '56px', fontSize: '1rem' }}>Enregistrer les modifications</button>
                 </div>
              </form>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default Fournisseurs;

