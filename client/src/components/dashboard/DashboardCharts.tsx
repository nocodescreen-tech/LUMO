import React from 'react';
import { motion } from 'framer-motion';

interface ChartProps {
  salesData?: any[];
}

const DashboardCharts = ({ salesData = [] }: ChartProps) => {
  const parseData = () => {
    if (salesData && salesData.length > 0) {
      return salesData.map(d => ({
        day: new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
        sales: parseFloat(d.total) || 0
      }));
    }
    return [
      { day: 'Lun', sales: 0 },
      { day: 'Mar', sales: 0 },
      { day: 'Mer', sales: 0 },
      { day: 'Jeu', sales: 0 },
      { day: 'Ven', sales: 0 },
      { day: 'Sam', sales: 0 },
      { day: 'Dim', sales: 0 },
    ];
  };

  const data = parseData();

  const maxSales = Math.max(...data.map(d => d.sales)) * 1.2 || 1;
  const height = 300;
  const width = 800;
  const stepX = width / (data.length - 1);

  // Generate path points
  const points = data.map((d, i) => ({
    x: i * stepX,
    y: height - (d.sales / maxSales) * height
  }));

  // Create smooth cubic bezier path
  const linePath = points.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = a[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    return `${acc} C ${cp1x},${prev.y} ${cp1x},${p.y} ${p.x},${p.y}`;
  }, '');

  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height + 40}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <line 
              key={p} 
              x1="0" y1={height * (1-p)} 
              x2={width} y2={height * (1-p)} 
              stroke="var(--border)" 
              strokeWidth="1" 
              strokeDasharray="4 4"
            />
          ))}

          {/* Area */}
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            d={areaPath}
            fill="url(#areaGradient)"
          />

          {/* Line */}
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "circOut" }}
            d={linePath}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Points */}
          {points.map((p, i) => (
            <g key={i}>
                <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.5 + i * 0.1 }}
                    cx={p.x} cy={p.y} r="8"
                    fill="var(--bg-card)"
                    stroke="var(--primary)"
                    strokeWidth="4"
                    style={{ cursor: 'pointer' }}
                />
                <text x={p.x} y={height + 30} textAnchor="middle" fill="var(--text-muted)" fontSize="12" fontWeight="800">
                    {data[i].day}
                </text>
            </g>
          ))}
        </svg>
    </div>
  );
};

export default DashboardCharts;
