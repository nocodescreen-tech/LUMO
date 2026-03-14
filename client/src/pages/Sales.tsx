import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  Eye, 
  User, 
  Clock,
  ArrowUpRight,
  MoreVertical
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

const Sales = () => {
    const { currency } = useSettingsStore();

    const sales = [
        { id: 'INV-1025', client: 'Marc Lelo', items: 3, total: 12500, date: '14 Mars, 10:24', status: 'payé' },
        { id: 'INV-1026', client: 'Anon', items: 1, total: 3500, date: '14 Mars, 11:15', status: 'payé' },
        { id: 'INV-1027', client: 'Julie Kam', items: 8, total: 89000, date: '14 Mars, 12:40', status: 'en_attente' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="title-xl">Historique des <span className="text-gradient">Ventes</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Suivez toutes les transactions client.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-premium glass"><Calendar size={18} /> Rapports</button>
                    <button className="btn-premium btn-primary"><Download size={18} /> Exporter CSV</button>
                </div>
            </div>

            <div className="glass" style={{ padding: '32px', borderRadius: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div style={{ position: 'relative', width: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Rechercher une vente par ID ou client..." className="glass" style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none' }} />
                    </div>
                    <button className="glass" style={{ padding: '12px 20px', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, cursor: 'pointer' }}>
                        <Filter size={18} /> Filtre Avancé
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left' }}>
                                <th style={{ padding: '0 20px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Référence / Client</th>
                                <th style={{ padding: '0 20px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Heure</th>
                                <th style={{ padding: '0 20px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</th>
                                <th style={{ padding: '0 20px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Montant</th>
                                <th style={{ padding: '0 20px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => (
                                <motion.tr 
                                    key={sale.id}
                                    whileHover={{ scale: 1.005 }}
                                    style={{ backgroundColor: 'var(--sidebar-active)', border: '1px solid var(--border)' }}
                                >
                                    <td style={{ padding: '20px', borderRadius: '20px 0 0 20px' }}>
                                        <div style={{ fontWeight: 900, color: 'var(--primary)' }}>#{sale.id}</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '2px' }}>{sale.client}</div>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                                            <Clock size={14} color="var(--text-muted)" /> {sale.date}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <span style={{ 
                                            padding: '6px 14px', 
                                            borderRadius: '10px', 
                                            fontSize: '0.7rem', 
                                            fontWeight: 900, 
                                            textTransform: 'uppercase',
                                            backgroundColor: sale.status === 'payé' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: sale.status === 'payé' ? 'var(--success)' : 'var(--warning)'
                                        }}>
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px', textAlign: 'right' }}>
                                        <div style={{ fontWeight: 950, fontSize: '1.2rem' }}>{sale.total.toLocaleString()} {currency}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{sale.items} articles</div>
                                    </td>
                                    <td style={{ padding: '20px', borderRadius: '0 20px 20px 0' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button className="glass" style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}>
                                                <Eye size={18} />
                                            </button>
                                            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                <MoreVertical size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Sales;
