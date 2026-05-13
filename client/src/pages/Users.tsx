import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  Search,
  Plus,
  Phone,
  Mail,
  Shield,
  Edit,
  Trash2,
  X,
  RefreshCw,
  UserPlus,
  Calendar,
  Lock,
  UserCheck,
  ShieldCheck,
  UserX,
  Activity
} from 'lucide-react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [newUser, setNewUser] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    telephone: '',
    role: 'caissier',
    allowCash: false
  });

  const [meta, setMeta] = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/subusers?_t=${Date.now()}`);
      const resData = response.data;
      
      let usersList = [];
      if (resData.success && resData.data) {
          if (Array.isArray(resData.data)) {
              usersList = resData.data;
          } else if (resData.data.data && Array.isArray(resData.data.data)) {
              usersList = resData.data.data;
          } else if (resData.data.items && Array.isArray(resData.data.items)) {
              usersList = resData.data.items;
          }
          if (resData.meta) setMeta(resData.meta);
      } else {
          usersList = Array.isArray(resData) ? resData : (resData.data || []);
      }
      
      setUsers(usersList);
    } catch (error) {
      toast.error("Échec du chargement des membres d'équipe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const basePermissions = newUser.role === 'manager' 
        ? ['products', 'sales', 'clients', 'expenses', 'stats', 'pos'] 
        : ['pos', 'sales.add', 'products', 'clients'];
      
      if (newUser.allowCash) basePermissions.push('cash');

      await api.post('/subusers', { ...newUser, permissions: basePermissions });
      toast.success(`${newUser.role === 'caissier' ? 'Caissier' : 'Manager'} ${newUser.nom} ajouté avec succès !`);
      setShowAddModal(false);
      setNewUser({ nom: '', email: '', motDePasse: '', telephone: '', role: 'caissier', allowCash: false });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l’ajout du membre");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const basePermissions = selectedUser.role === 'manager' 
        ? ['products', 'sales', 'clients', 'expenses', 'stats', 'pos'] 
        : ['pos', 'sales.add', 'products', 'clients'];
      
      if (selectedUser.allowCash) basePermissions.push('cash');

      await api.put(`/subusers/${selectedUser.id}`, { ...selectedUser, permissions: basePermissions });
      toast.success("Informations du membre mises à jour !");
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    setConfirmModal({
        isOpen: true,
        title: "Supprimer Membre",
        message: `Supprimer définitivement l'accès pour ${name} ? Cette action est irréversible.`,
        onConfirm: async () => {
            try {
                await api.delete(`/subusers/${id}`);
                toast.success("Membre retiré de l'équipe.");
                fetchUsers();
            } catch (error) {
                toast.error("Échec de la suppression");
            }
        }
    });
  };

  const toggleSuspension = async (user: any) => {
      try {
          await api.put(`/subusers/${user.id}`, { isSuspended: !user.isSuspended });
          toast.success(user.isSuspended ? "Compte réactivé !" : "Compte suspendu !");
          fetchUsers();
      } catch (error) {
          toast.error("Erreur lors du changement de statut");
      }
  };

  const filteredUsers = users.filter((u: any) =>
    u.nom.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '900', fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase' }}>
            <ShieldCheck size={14} /> Gestion d'Équipe & Rôles
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0 }}>
            Membres de <span className="text-gradient">l'Équipe</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Créez et gérez les accès pour vos caissiers et managers.</p>
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
          <UserPlus size={22} /> Nouveau Membre
        </button>
      </div>

      <div className="glass" style={{ padding: '16px', borderRadius: '24px', display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
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
        <button onClick={fetchUsers} className="glass btn-hover" style={{ width: '56px', height: '56px', borderRadius: '18px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}>
          <RefreshCw size={20} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '28px' }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="premium-card skeleton" style={{ borderRadius: '32px', height: '250px', opacity: 0.1 }}></div>
          ))
        ) : filteredUsers.length === 0 ? (
          <div className="premium-card" style={{ gridColumn: '1 / -1', padding: '100px', textAlign: 'center', borderRadius: '40px' }}>
            <UsersIcon size={80} opacity={0.1} style={{ marginBottom: '24px' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: '950' }}>Aucun membre trouvé</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Ajoutez des caissiers pour déléguer les ventes.</p>
          </div>
        ) : filteredUsers.map((u: any) => (
          <motion.div
            key={u.id}
            layout
            whileHover={{ y: -8 }}
            className="premium-card"
            style={{ padding: '32px', borderRadius: '40px', border: u.isSuspended ? '2px solid #ef4444' : '1px solid var(--border)', opacity: u.isSuspended ? 0.7 : 1 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '950', fontSize: '1.5rem' }}>
                  {u.nom.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '950', margin: 0 }}>{u.nom}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: '900', fontSize: '0.75rem', textTransform: 'uppercase', marginTop: '4px' }}>
                    <Shield size={12} /> {u.role}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setSelectedUser({ ...u, allowCash: u.permissions?.includes('cash') }); setShowEditModal(true); }} className="btn-hover" style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <Edit size={16} />
                </button>
                <button onClick={() => toggleSuspension(u)} className="btn-hover" style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: u.isSuspended ? '#10b981' : '#ef4444', cursor: 'pointer' }}>
                  {u.isSuspended ? <UserCheck size={16} /> : <UserX size={16} />}
                </button>
                <button onClick={() => handleDeleteUser(u.id, u.nom)} className="btn-hover" style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: '#ef4444', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', borderRadius: '20px', background: 'var(--bg-main)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
                <Mail size={16} color="var(--text-muted)" /> {u.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
                <Phone size={16} color="var(--text-muted)" /> {u.telephone || 'Non défini'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Actif depuis le {new Date(u.createdAt).toLocaleDateString()}
                </div>
                {u.isSuspended && (
                    <span style={{ padding: '4px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>Suspendu</span>
                )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal Ajout */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un Collaborateur"
        subtitle="Déléguez la gestion tout en gardant le contrôle."
        maxWidth="600px"
        icon={UserPlus}
      >
        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Nom complet</label>
            <input required type="text" placeholder="ex: Patrick Mulumba" value={newUser.nom} onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700' }} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Email Professionnel</label>
              <input required type="email" placeholder="caissier@hub.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Mot de Passe Provisoire</label>
              <input required type="password" placeholder="••••••••" value={newUser.motDePasse} onChange={(e) => setNewUser({ ...newUser, motDePasse: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Téléphone</label>
              <input type="text" placeholder="+243..." value={newUser.telephone} onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Rôle / Niveau d'accès</label>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', outline: 'none' }}>
                <option value="caissier">Caissier (Ventes seulement)</option>
                <option value="manager">Manager (Ventes + Stock)</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="checkbox" 
              id="allowCash" 
              checked={newUser.allowCash}
              onChange={(e) => setNewUser({ ...newUser, allowCash: e.target.checked })}
              style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
            />
            <label htmlFor="allowCash" style={{ fontWeight: '800', cursor: 'pointer' }}>
              Autoriser l'accès au module Trésorerie (Ouverture/Clôture de Caisse)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '10px' }}>
            <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '14px 24px', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '800', cursor: 'pointer' }}>Annuler</button>
            <button type="submit" style={{ padding: '14px 32px', borderRadius: '16px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: '950', cursor: 'pointer', boxShadow: '0 10px 20px -5px var(--primary-glow)' }}>Créer le compte</button>
          </div>
        </form>
      </Modal>

      {/* Modal Edition */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier Collaborateur"
        maxWidth="600px"
      >
        {selectedUser && (
           <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <div>
             <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Nom complet</label>
             <input required type="text" value={selectedUser.nom} onChange={(e) => setSelectedUser({ ...selectedUser, nom: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700' }} />
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
             <div>
               <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Email</label>
               <input required type="email" value={selectedUser.email} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700' }} />
             </div>
             <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Téléphone</label>
                <input type="text" value={selectedUser.telephone} onChange={(e) => setSelectedUser({ ...selectedUser, telephone: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700' }} />
              </div>
           </div>
 
           <div>
             <label style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Rôle / Niveau d'accès</label>
             <select value={selectedUser.role} onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', outline: 'none' }}>
               <option value="caissier">Caissier</option>
               <option value="manager">Manager</option>
             </select>
           </div>
 
           <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="checkbox" 
              id="editAllowCash" 
              checked={selectedUser.allowCash}
              onChange={(e) => setSelectedUser({ ...selectedUser, allowCash: e.target.checked })}
              style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
            />
            <label htmlFor="editAllowCash" style={{ fontWeight: '800', cursor: 'pointer' }}>
              Autoriser l'accès au module Trésorerie (Ouverture/Clôture de Caisse)
            </label>
          </div>

           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '10px' }}>
             <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '14px 24px', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '800', cursor: 'pointer' }}>Annuler</button>
             <button type="submit" style={{ padding: '14px 32px', borderRadius: '16px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: '950', cursor: 'pointer' }}>Enregistrer</button>
           </div>
         </form>
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

export default Users;
