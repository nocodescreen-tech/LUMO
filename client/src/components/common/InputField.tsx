import React, { useId, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const InputField = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, readOnly = false, required = false }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = useId();
  const isPassword = type === 'password';
  const effectiveType = useMemo(() => {
    if (!isPassword) return type;
    return showPassword ? 'text' : 'password';
  }, [isPassword, showPassword, type]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label htmlFor={inputId} style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.8, zIndex: 2 }} />}
        <input
          id={inputId}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          required={required}
          style={{
            width: '100%',
            padding: Icon ? (isPassword ? '15px 52px 15px 48px' : '15px 16px 15px 48px') : (isPassword ? '15px 52px 15px 16px' : '15px 16px'),
            borderRadius: '8px',
            border: '2px solid var(--border-strong)',
            backgroundColor: readOnly ? 'var(--sidebar-active)' : 'var(--bg-card)',
            color: 'var(--text-main)',
            fontSize: '0.95rem',
            fontWeight: 600,
            outline: 'none',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
            boxSizing: 'border-box'
          }}
        />
        {isPassword && !readOnly && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default InputField;
