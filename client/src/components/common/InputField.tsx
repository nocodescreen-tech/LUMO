import React from 'react';

const InputField = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, readOnly = false, required = false }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
    </label>
    <div style={{ position: 'relative' }}>
      {Icon && <Icon size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.8, zIndex: 2 }} />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        style={{
          width: '100%',
          padding: Icon ? '15px 16px 15px 48px' : '15px 16px',
          borderRadius: '16px',
          border: '2px solid var(--border-strong)',
          backgroundColor: readOnly ? 'var(--sidebar-active)' : 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.95rem',
          fontWeight: 600,
          outline: 'none',
          transition: 'all 0.25s',
          boxSizing: 'border-box'
        }}
      />
    </div>
  </div>
);

export default InputField;
