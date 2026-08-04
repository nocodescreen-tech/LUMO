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
    confirmText,
    cancelText,
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
                            fontWeight: 800, 
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'var(--sidebar-active)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
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
                            background: isDanger ? 'var(--danger)' : 'var(--primary)', 
                            color: 'white', 
                            fontWeight: 800, 
                            cursor: 'pointer',
                            boxShadow: isDanger ? '0 10px 30px -8px rgba(214, 69, 69, 0.4)' : '0 10px 30px -8px rgba(21, 94, 88, 0.4)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = isDanger ? '#B23A3A' : 'var(--primary-dark)'; e.currentTarget.style.boxShadow = '0 14px 34px -10px rgba(0,0,0,0.3)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = isDanger ? 'var(--danger)' : 'var(--primary)'; e.currentTarget.style.boxShadow = isDanger ? '0 10px 30px -8px rgba(214, 69, 69, 0.4)' : '0 10px 30px -8px rgba(21, 94, 88, 0.4)'; }}
                    >
                        {finalConfirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
