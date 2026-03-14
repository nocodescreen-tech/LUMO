import React from 'react';
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
    return (
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
                        zIndex: 2000, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: '24px' 
                    }}
                    onClick={onClose}
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 40 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass"
                        style={{ 
                            width: '100%', 
                            maxWidth: maxWidth, 
                            borderRadius: '40px', 
                            padding: '48px', 
                            border: '1.5px solid var(--border)',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            position: 'relative',
                            background: 'var(--bg-card)',
                            boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        {/* Decorative Background Glow */}
                        <div style={{ 
                            position: 'absolute', 
                            top: '-100px', 
                            right: '-100px', 
                            width: '300px', 
                            height: '300px', 
                            borderRadius: '50%', 
                            background: 'var(--grad-primary)', 
                            filter: 'blur(100px)', 
                            opacity: 0.08, 
                            pointerEvents: 'none',
                            zIndex: 0
                        }}></div>

                        {/* Close Button */}
                        <button 
                            onClick={onClose}
                            style={{ 
                                position: 'absolute', 
                                top: '32px', 
                                right: '32px', 
                                background: 'rgba(255, 255, 255, 0.03)', 
                                border: '1px solid var(--border)', 
                                borderRadius: '16px', 
                                padding: '12px', 
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                zIndex: 10
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.transform = 'rotate(90deg)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                                e.currentTarget.style.color = 'var(--text-muted)';
                                e.currentTarget.style.transform = 'rotate(0deg)';
                            }}
                        >
                            <X size={24} />
                        </button>

                        {/* Header Section */}
                        <div style={{ marginBottom: '40px', position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary)', fontWeight: '900', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em' }}>
                                <Icon size={16} strokeWidth={2.5} /> Lumos Operations
                            </div>
                            <h2 style={{ 
                                fontSize: '2.5rem', 
                                fontWeight: '950', 
                                letterSpacing: '-0.05em', 
                                color: 'white',
                                margin: 0,
                                lineHeight: 1.1
                            }}>{title}</h2>
                            {subtitle && (
                                <p style={{ 
                                    color: 'var(--text-muted)', 
                                    marginTop: '12px',
                                    fontSize: '1.1rem',
                                    fontWeight: '500',
                                    lineHeight: '1.6'
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
};

export default Modal;
