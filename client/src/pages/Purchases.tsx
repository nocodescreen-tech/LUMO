import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Search, 
  Plus, 
  Truck, 
  Calendar, 
  ArrowRight,
  Filter,
  MoreHorizontal,
  Download
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

const Purchases = () => {
    const { currency } = useSettingsStore();

    const purchases = [
        { id: 'ORD-9921', supplier: 'Distributeur Alpha', items: 150, total: 2450000, date: '12 Mars 2026', status: 'reçu' },
        { id: 'ORD-9922', supplier: 'Zenu Logistique', items: 45, total: 89000, date: '13 Mars 2026', status: 'expédié' },
        { id: 'ORD-9923', supplier: 'Global Import', items: 12, total: 1200, date: '14 Mars 2026', status: 'en_attente' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="title-xl">Gestion des <span className="text-gradient">Achats</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Commandes fournisseurs et stocks entrants.</p>
                </div>
                <button className="btn-premium btn-primary"><Plus size={18} /> Nouvelle Commande</button>
            </div>

            <div className="glass" style={{ padding: '32px', borderRadius: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div style={{ position: 'relative', width: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Rechercher une commande..." className="glass" style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none' }} />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ORDRE / FOURNISSEUR</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>QUANTITÉ</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>DATE</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>STATUT</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>MONTANT</th>
                                <th style={{ padding: '16px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map((purchase) => (
                                <tr key={purchase.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: 800 }}>#{purchase.id}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{purchase.supplier}</div>
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: 700 }}>{purchase.items} pcs</td>
                                    <td style={{ padding: '16px', fontSize: '0.9rem' }}>{purchase.date}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ 
                                            padding: '4px 10px', 
                                            borderRadius: '8px', 
                                            fontSize: '0.7rem', 
                                            fontWeight: 800, 
                                            textTransform: 'uppercase',
                                            backgroundColor: purchase.status === 'reçu' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                            color: purchase.status === 'reçu' ? 'var(--success)' : 'var(--text-muted)'
                                        }}>
                                            {purchase.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 900 }}>{purchase.total.toLocaleString()} {currency}</td>
                                    <td style={{ padding: '16px' }}>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><MoreHorizontal size={20} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Purchases;
