import React, { useState, useEffect } from 'react';
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
  Filter
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'sonner';

const Fournisseurs = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
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
      const { data } = await api.get('/fournisseurs');
      setSuppliers(data);
    } catch (error) {
      toast.error("Impossible de charger les fournisseurs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/fournisseurs', formData);
      setSuppliers([data, ...suppliers]);
      setShowAddModal(false);
      setFormData({ nom: '', email: '', telephone: '', adresse: '', categorie: '' });
      toast.success("Fournisseur ajouté avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
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
          <h1 className="title-xl">Gestion <span className="text-gradient">Fournisseurs</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Gérez vos partenaires et approvisionnements.</p>
        </div>
        <button className="btn-premium btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Nouveau Fournisseur
        </button>
      </div>

      {/* Stats Mini Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
         <div className="glass" style={{ padding: '24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '12px', borderRadius: '16px' }}><Truck size={24} /></div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Partenaires</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{suppliers.length}</div>
            </div>
         </div>
         {/* More stats can go here */}
      </div>

      {/* List Component */}
      <div className="glass" style={{ padding: '32px', borderRadius: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', gap: '20px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Rechercher un fournisseur..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass"
              style={{ padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', outline: 'none', backgroundColor: 'transparent' }}
            />
          </div>
          <button className="btn-premium glass" style={{ border: '1px solid var(--border)' }}><Filter size={18} /> Filtres</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          <AnimatePresence>
            {filteredSuppliers.map((supplier, i) => (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass"
                style={{ padding: '24px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'var(--primary)', opacity: 0.1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <Truck size={24} />
                    </div>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><MoreHorizontal size={20} /></button>
                 </div>
                 
                 <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 850 }}>{supplier.nom}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800 }}>{supplier.categorie || 'IMPORTATEUR'}</span>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                       <Phone size={14} /> {supplier.telephone || 'Non renseigné'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                       <Mail size={14} /> {supplier.email || 'N/A'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                       <MapPin size={14} /> {supplier.adresse || 'N/A'}
                    </div>
                 </div>

                 <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
                    <button className="glass" style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Approvisionner</button>
                    <button className="glass" style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass" style={{ width: '100%', maxWidth: '500px', padding: '40px', borderRadius: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                 <h2 style={{ fontSize: '1.5rem', fontWeight: 950 }}>Nouveau <span className="text-gradient">Fournisseur</span></h2>
                 <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <input type="text" placeholder="Nom du fournisseur" required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none' }} />
                 <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none' }} />
                 <input type="text" placeholder="Téléphone" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none' }} />
                 <input type="text" placeholder="Adresse" value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none' }} />
                 <button type="submit" className="btn-premium btn-primary" style={{ justifyContent: 'center', height: '56px' }}>Enregistrer</button>
              </form>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default Fournisseurs;
