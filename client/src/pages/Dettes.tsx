import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  User,
  MoreVertical,
  Filter,
  DollarSign
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

const Dettes = () => {
    const { currency } = useSettingsStore();
    const [searchTerm, setSearchTerm] = useState('');

    const debts = [
        { id: 1, client: 'Jean Dupont', amount: 125000, date: '2026-03-10', status: 'en_attente', type: 'Dette Client' },
        { id: 2, client: 'Sarl Global', amount: 450000, date: '2026-02-28', status: 'partiel', type: 'Dette Fournisseur' },
        { id: 3, client: 'Alice Mwamba', amount: 15000, date: '2026-03-12', status: 'urgent', type: 'Dette Client' },
    ];

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'urgent': return 'var(--danger)';
            case 'partiel': return 'var(--warning)';
            default: return 'var(--info)';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="title-xl">Suivi des <span className="text-gradient">Dettes</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Crédits, remboursements et échéances.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-premium glass"><Calendar size={18} /> Rapports</button>
                    <button className="btn-premium btn-primary"><Plus size={18} /> Nouvelle Dette</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                {[
                    { label: 'Dettes Totales', value: 590000, icon: AlertCircle, color: 'var(--danger)' },
                    { label: 'Recouvrements', value: 120000, icon: CheckCircle2, color: 'var(--success)' },
                    { label: 'À Échéance', value: 45000, icon: Clock, color: 'var(--warning)' },
                ].map((s, i) => (
                    <div key={i} className="glass" style={{ padding: '24px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>{s.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 950 }}>{s.value.toLocaleString()} {currency}</div>
                        </div>
                        <div style={{ padding: '12px', borderRadius: '14px', backgroundColor: s.color, opacity: 0.1, color: s.color }}>
                            <s.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass" style={{ padding: '32px', borderRadius: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div style={{ position: 'relative', width: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Rechercher une dette ou un client..." className="glass" style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none' }} />
                    </div>
                    <button className="glass" style={{ padding: '12px 20px', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, cursor: 'pointer' }}>
                        <Filter size={18} /> Filtrer
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {debts.map((debt) => (
                        <motion.div
                            key={debt.id}
                            whileHover={{ scale: 1.01 }}
                            className="glass"
                            style={{ padding: '20px 24px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '18px', backgroundColor: 'var(--sidebar-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                    <User size={24} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 850, fontSize: '1.1rem' }}>{debt.client}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{debt.type} • {debt.date}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 950, fontSize: '1.2rem', color: getStatusColor(debt.status) }}>{debt.amount.toLocaleString()} {currency}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Reste à payer</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button className="btn-premium btn-primary" style={{ padding: '10px 16px', fontSize: '0.8rem' }}>Régler</button>
                                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><MoreVertical size={20} /></button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dettes;
