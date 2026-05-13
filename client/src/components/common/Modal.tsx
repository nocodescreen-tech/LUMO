import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    maxWidth?: string;
    icon?: React.ElementType;
}

const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    subtitle, 
    children, 
    maxWidth = '600px',
    icon: Icon = Sparkles
}) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ 
                        position: 'fixed', 
                        inset: 0,
                        backgroundColor: 'rgba(2, 6, 23, 0.85)', 
                        backdropFilter: 'blur(16px)', 
                        zIndex: 99999, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: '40px',
                        overflowY: 'auto'
                    }}
                    onClick={onClose}
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                            width: '100%', 
                            maxWidth: maxWidth, 
                            borderRadius: '32px', 
                            padding: '40px', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            position: 'relative',
                            background: 'var(--bg-card)',
                            boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.8)',
                            margin: 'auto'
                        }}
                    >
                        {/* Decorative Background Glow */}
                        <div style={{ 
                            position: 'absolute', 
                            top: '-50px', 
                            right: '-50px', 
                            width: '200px', 
                            height: '200px', 
                            borderRadius: '50%', 
                            background: 'var(--grad-primary)', 
                            filter: 'blur(80px)', 
                            opacity: 0.1, 
                            pointerEvents: 'none',
                            zIndex: 0
                        }}></div>

                        {/* Close Button */}
                        <button 
                            onClick={onClose}
                            style={{ 
                                position: 'absolute', 
                                top: '24px', 
                                right: '24px', 
                                background: 'rgba(0, 0, 0, 0.05)', 
                                border: '1px solid var(--border)', 
                                borderRadius: '12px', 
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                transition: 'all 0.3s ease',
                                zIndex: 10
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--danger)';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.transform = 'rotate(90deg)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                                e.currentTarget.style.color = 'var(--text-muted)';
                                e.currentTarget.style.transform = 'rotate(0deg)';
                            }}
                        >
                            <X size={20} />
                        </button>

                        {/* Header Section */}
                        <div style={{ marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                                <Icon size={18} strokeWidth={2.5} /> HubCommerce System
                            </div>
                            <h2 style={{ 
                                fontSize: '2.2rem', 
                                fontWeight: '900', 
                                letterSpacing: '-0.04em', 
                                color: 'var(--text-main)',
                                margin: 0,
                                lineHeight: 1.1
                            }}>{title}</h2>
                            {subtitle && (
                                <p style={{ 
                                    color: 'var(--text-muted)', 
                                    marginTop: '10px',
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    lineHeight: '1.5'
                                }}>{subtitle}</p>
                            )}
                        </div>
                        
                        {/* Content Area */}
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (!mounted) return null;
    return createPortal(modalContent, document.body);
};

export default Modal;

