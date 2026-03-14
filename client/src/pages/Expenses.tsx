import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  ArrowDownCircle, 
  ArrowUpCircle,
  ShoppingBag,
  Zap,
  Coffee,
  Truck,
  MoreHorizontal
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

const Expenses = () => {
    const { currency } = useSettingsStore();

    const expenses = [
        { id: 1, title: 'Loyer Bureau', amount: 350000, category: 'Fixe', icon: Zap, date: '2026-03-01' },
        { id: 2, title: 'Transport Appro', amount: 45000, category: 'Logistique', icon: Truck, date: '2026-03-12' },
        { id: 3, title: 'Fournitures', amount: 12000, category: 'Bureau', icon: Coffee, date: '2026-03-13' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="title-xl">Suivi des <span className="text-gradient">Dépenses</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Contrôlez vos sorties de trésorerie.</p>
                </div>
                <button className="btn-premium btn-primary"><Plus size={18} /> Nouvelle Dépense</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                {[
                    { label: 'Total Ce Mois', value: 407000, icon: ArrowDownCircle, color: 'var(--danger)' },
                    { label: 'Fixes', value: 350000, icon: Zap, color: 'var(--primary)' },
                    { label: 'Variables', value: 57000, icon: Zap, color: 'var(--secondary)' },
                    { label: 'Budget Restant', value: 150000, icon: ArrowUpCircle, color: 'var(--success)' },
                ].map((s, i) => (
                    <div key={i} className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                             <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: s.color, opacity: 0.1, color: s.color }}>
                                <s.icon size={20} />
                             </div>
                             <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</span>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 950 }}>{s.value.toLocaleString()} {currency}</div>
                    </div>
                ))}
            </div>

            <div className="glass" style={{ padding: '32px', borderRadius: '32px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div style={{ position: 'relative', width: '350px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Rechercher une dépense..." className="glass" style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <select className="glass" style={{ padding: '0 16px', borderRadius: '14px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 700 }}>
                            <option>Toutes catégories</option>
                            <option>Logistique</option>
                            <option>Fixe</option>
                        </select>
                        <button className="glass" style={{ padding: '12px 20px', borderRadius: '14px', border: '1px solid var(--border)', cursor: 'pointer' }}><Filter size={18} /></button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>DÉPENSE / CATÉGORIE</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>DATE</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>MONTANT</th>
                                <th style={{ padding: '16px', width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((exp) => (
                                <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--sidebar-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                <exp.icon size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800 }}>{exp.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{exp.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{exp.date}</td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 900, color: 'var(--danger)' }}>-{exp.amount.toLocaleString()} {currency}</td>
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

export default Expenses;
