import React, { useId } from 'react';

const Logo = ({ size = 42, showText = true, textColor }: { size?: number, showText?: boolean, textColor?: string }) => {
  const uniqueId = useId().replace(/:/g, '-');
  const gradientIds = {
    top: `lumoTop-${uniqueId}`,
    left: `lumoLeft-${uniqueId}`,
    right: `lumoRight-${uniqueId}`
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div 
        style={{ 
          width: size, 
          height: size, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 6px 14px rgba(194, 65, 12, 0.35))'
        }}
        title="LUMO - Intelligence Commerce"
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', transform: 'scale(1.15)' }}>
          <defs>
            <linearGradient id={gradientIds.top} x1="10" y1="45" x2="90" y2="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C2410C" />
              <stop offset="1" stopColor="#FDBA74" />
            </linearGradient>
            <linearGradient id={gradientIds.left} x1="10" y1="45" x2="50" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9A3412" />
              <stop offset="1" stopColor="#C2410C" />
            </linearGradient>
            <linearGradient id={gradientIds.right} x1="90" y1="45" x2="50" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDBA74" />
              <stop offset="1" stopColor="#C2410C" />
            </linearGradient>
          </defs>
          {/* Back faceted glow */}
          <path d="M50 12 L86 45 L50 88 L14 45 Z" fill={`url(#${gradientIds.top})`} opacity="0.3" filter="blur(4px)" />
          
          {/* Main 3D crystal structure */}
          <path d="M14 45 L50 88 L50 55 Z" fill={`url(#${gradientIds.left})`} />
          <path d="M86 45 L50 88 L50 55 Z" fill={`url(#${gradientIds.right})`} />
          <path d="M14 45 L50 12 L86 45 L50 55 Z" fill={`url(#${gradientIds.top})`} />
          
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
          color: textColor || 'var(--text-main, #18181B)',
          display: 'inline-block',
          fontFamily: "'Inter', 'Outfit', sans-serif",
          whiteSpace: 'nowrap'
        }}>
          LUMO
        </span>
      )}
    </div>
  );
};

export default Logo;

