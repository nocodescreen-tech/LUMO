import React from 'react';

const Logo = ({ size = 42, showText = true }: { size?: number, showText?: boolean }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div 
        style={{ 
          width: size, 
          height: size, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 6px 14px rgba(99, 102, 241, 0.35))'
        }}
        title="Lumo - Intelligence Commerce"
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', transform: 'scale(1.15)' }}>
          <defs>
            <linearGradient id="lumoTop" x1="10" y1="45" x2="90" y2="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#a855f7" />
              <stop offset="1" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="lumoLeft" x1="10" y1="45" x2="50" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ec4899" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="lumoRight" x1="90" y1="45" x2="50" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" />
              <stop offset="1" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          {/* Back faceted glow */}
          <path d="M50 12 L86 45 L50 88 L14 45 Z" fill="url(#lumoTop)" opacity="0.3" filter="blur(4px)" />
          
          {/* Main 3D crystal structure */}
          <path d="M14 45 L50 88 L50 55 Z" fill="url(#lumoLeft)" />
          <path d="M86 45 L50 88 L50 55 Z" fill="url(#lumoRight)" />
          <path d="M14 45 L50 12 L86 45 L50 55 Z" fill="url(#lumoTop)" />
          
          {/* Highlights */}
          <path d="M50 12 L14 45 L50 55 Z" fill="#ffffff" opacity="0.25" />
          <path d="M50 55 L86 45 L50 48 Z" fill="#ffffff" opacity="0.15" />
        </svg>
      </div>
      {showText && (
        <span style={{ 
          fontSize: size * 0.72, 
          fontWeight: 900, 
          letterSpacing: '-0.05em',
          background: 'linear-gradient(135deg, var(--text-main) 0%, var(--primary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block',
          fontFamily: "'Inter', 'Outfit', sans-serif"
        }}>
          Lumo
        </span>
      )}
    </div>
  );
};

export default Logo;

