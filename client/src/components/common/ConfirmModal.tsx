import { useTranslation } from '../../hooks/useTranslation';
import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Check } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    type = 'danger'
}) => {
    const { t } = useTranslation();
    const finalConfirmText = confirmText || t('confirmBtn');
    const finalCancelText = cancelText || t('cancelBtn');
    const isDanger = type === 'danger';
    
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={title} 
            icon={isDanger ? AlertTriangle : Check}
            maxWidth="500px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.6 }}>
                    {message}
                </p>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button 
                        onClick={onClose}
                        style={{ 
                            flex: 1, 
                            padding: '16px', 
                            borderRadius: '18px', 
                            border: '1px solid var(--border)', 
                            background: 'var(--bg-main)', 
                            color: 'var(--text-main)', 
                            fontWeight: 950, 
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--border)'}
                        onMouseOut={e => e.currentTarget.style.background = 'var(--bg-main)'}
                    >
                        {finalCancelText}
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        style={{ 
                            flex: 1, 
                            padding: '16px', 
                            borderRadius: '18px', 
                            border: 'none', 
                            background: isDanger ? '#ef4444' : 'var(--primary)', 
                            color: 'white', 
                            fontWeight: 950, 
                            cursor: 'pointer',
                            boxShadow: isDanger ? '0 10px 30px -8px rgba(239, 68, 68, 0.4)' : '0 10px 30px -8px rgba(99, 102, 241, 0.4)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {finalConfirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
