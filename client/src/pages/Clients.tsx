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
  AlertCircle
} from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Modal from '../components/common/Modal';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [allClients, setAllClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any>(null);

    const [newClient, setNewClient] = useState({
        nom: '',
        email: '',
        telephone: '',
        adresse: ''
    });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/clients');
      setAllClients(data || []);
      setClients(data || []);
    } catch (error) {
      toast.error("Échec du chargement des clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Search logic
  useEffect(() => {
    const filtered = allClients.filter((c: any) => 
        c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setClients(filtered);
  }, [searchTerm, allClients]);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await api.post('/clients', newClient);
        toast.success(`Client ${newClient.nom} ajouté avec succès !`);
        setShowAddModal(false);
        setNewClient({ nom: '', email: '', telephone: '', adresse: '' });
        fetchClients();
    } catch (error) {
        toast.error("Erreur lors de l’ajout du client");
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await api.put(`/clients/${selectedClient.id}`, selectedClient);
        toast.success("Fiche client mise à jour !");
        setShowEditModal(false);
        fetchClients();
    } catch (error) {
        toast.error("Erreur lors de la modification");
    }
  };

  const handleDeleteClient = async (id: number, name: string) => {
    if (!window.confirm(`Supprimer définitivement le client ${name} ?`)) return;
    try {
        await api.delete(`/clients/${id}`);
        toast.success("Client retiré de la base.");
        fetchClients();
    } catch (error) {
        toast.error("Échec de la suppression");
    }
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
            <Users size={14} /> Répertoire CRM Premium
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0 }}>
            Gestion <span className="text-gradient">Clientèle</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Centralisez les informations de vos clients et suivez leur cycle d'achat.</p>
        </div>
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
          <UserPlus size={22} /> Nouveau Client
        </button>
      </div>

      {/* Control Bar */}
      <div className="glass" style={{ padding: '16px', borderRadius: '24px', display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Rechercher par nom, téléphone ou email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '16px 16px 16px 60px', 
              borderRadius: '18px', 
              border: '1px solid var(--border)', 
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontWeight: '700',
              outline: 'none',
              fontSize: '1rem'
            }}
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
            <h2 style={{ fontSize: '1.8rem', fontWeight: '950' }}>Base de données vide</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Commencez par ajouter votre premier client pour le suivi.</p>
          </div>
        ) : clients.map((c: any) => (
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
                    <Calendar size={14} /> Inscrit le {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setSelectedClient(c); setShowEditModal(true); }} className="btn-hover" style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDeleteClient(c.id, c.nom)} className="btn-hover" style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="glass" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', padding: '24px', borderRadius: '24px', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontWeight: '700' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Phone size={16} /></div>
                {c.telephone || 'Non renseigné'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontWeight: '700' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Mail size={16} /></div>
                {c.email || 'Pas d\'email'}
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
                    <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Dette Actuelle</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: '950', color: c.detteTotale > 0 ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {c.detteTotale?.toLocaleString() || 0} <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>CDF</span>
                        {c.detteTotale > 0 && <AlertCircle size={18} />}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="glass btn-hover" style={{ width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                        <History size={20} />
                    </button>
                    <button className="glass btn-hover" style={{ height: '48px', padding: '0 20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: '950', cursor: 'pointer', color: 'var(--primary)', border: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                        Fiche Complète <ChevronRight size={18} />
                    </button>
                </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal Ajout */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Inscription Client"
        subtitle="Enregistrez un nouveau profil dans votre répertoire CRM."
        maxWidth="650px"
        icon={UserPlus}
      >
        <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>Nom & Prénom</label>
            <div style={{ position: 'relative' }}>
              <Users style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={22} />
              <input required type="text" placeholder="ex: Marc Tshilombo" value={newClient.nom} onChange={(e) => setNewClient({...newClient, nom: e.target.value})} style={{ width: '100%', padding: '20px 20px 20px 60px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white', fontWeight: '700', fontSize: '1.1rem', outline: 'none' }} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>Numéro Téléphone</label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="text" placeholder="+243..." value={newClient.telephone} onChange={(e) => setNewClient({...newClient, telephone: e.target.value})} style={{ width: '100%', padding: '18px 18px 18px 52px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white', fontWeight: '700', fontSize: '1rem', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                <input type="email" placeholder="client@hub.com" value={newClient.email} onChange={(e) => setNewClient({...newClient, email: e.target.value})} style={{ width: '100%', padding: '18px 18px 18px 52px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white', fontWeight: '700', fontSize: '1rem', outline: 'none' }} />
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>Localisation / Adresse</label>
            <div style={{ position: 'relative' }}>
              <MapPin style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={22} />
              <input type="text" placeholder="ex: 12 Rue de la Gombe, Kinshasa" value={newClient.adresse} onChange={(e) => setNewClient({...newClient, adresse: e.target.value})} style={{ width: '100%', padding: '20px 20px 20px 60px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white', fontWeight: '700', fontSize: '1.1rem', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginTop: '16px' }}>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-hover" style={{ padding: '18px 32px', border: 'none', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontWeight: '800', cursor: 'pointer', fontSize: '1rem', borderRadius: '16px' }}>Fermer</button>
            <button type="submit" className="btn-hover" style={{ padding: '18px 48px', borderRadius: '20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '950', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 20px 40px -10px var(--primary-glow)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <UserCheck size={24} /> Valider l'inscription
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edition */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        title="Modifier Profil"
        subtitle="Mettez à jour les coordonnées de votre client."
        maxWidth="650px"
        icon={Edit}
      >
        {selectedClient && (
          <form onSubmit={handleUpdateClient} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>Nom complet</label>
              <div style={{ position: 'relative' }}>
                <Users style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={22} />
                <input required type="text" value={selectedClient.nom} onChange={(e) => setSelectedClient({...selectedClient, nom: e.target.value})} style={{ width: '100%', padding: '20px 20px 20px 60px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white', fontWeight: '700', fontSize: '1.1rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>Téléphone</label>
                <div style={{ position: 'relative' }}>
                  <Phone style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                  <input type="text" value={selectedClient.telephone} onChange={(e) => setSelectedClient({...selectedClient, telephone: e.target.value})} style={{ width: '100%', padding: '18px 18px 18px 52px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white', fontWeight: '700', outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={20} />
                  <input type="email" value={selectedClient.email} onChange={(e) => setSelectedClient({...selectedClient, email: e.target.value})} style={{ width: '100%', padding: '18px 18px 18px 52px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white', fontWeight: '700', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', marginLeft: '4px' }}>Adresse</label>
              <div style={{ position: 'relative' }}>
                <MapPin style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} size={22} />
                <input type="text" value={selectedClient.adresse} onChange={(e) => setSelectedClient({...selectedClient, adresse: e.target.value})} style={{ width: '100%', padding: '20px 20px 20px 60px', borderRadius: '20px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white', fontWeight: '700', fontSize: '1.1rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowEditModal(false)} className="btn-hover" style={{ padding: '18px 32px', border: 'none', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontWeight: '800', cursor: 'pointer', fontSize: '1rem', borderRadius: '16px' }}>Annuler</button>
              <button type="submit" className="btn-hover" style={{ padding: '18px 48px', borderRadius: '20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '950', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 20px 40px -10px var(--primary-glow)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <UserCheck size={24} /> Sauvegarder
              </button>
            </div>
          </form>
        )}
      </Modal>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); borderRadius: 10px; }
      `}</style>
    </motion.div>
  );
};

export default Clients;
