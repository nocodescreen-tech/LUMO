import React from 'react';
import { motion } from 'framer-motion';

interface ChartProps {
  salesData?: any[];
  period?: string;
}

const DashboardCharts = ({ salesData = [], period = '7d' }: ChartProps) => {
  const parseData = () => {
    const daysArr = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    if (period === '7d') {
      const weekData = daysArr.map(name => ({ day: name, sales: 0 }));
      
      salesData.forEach(d => {
        const dateObj = new Date(d.date);
        // getDay(): 0=Dim, 1=Lun -> 0=Lun ... 6=Dim
        const dayIdx = (dateObj.getDay() + 6) % 7;
        if (dayIdx >= 0 && dayIdx < 7) {
          weekData[dayIdx].sales += parseFloat(d.total) || 0;
        }
      });
      return weekData;
    }

    if (salesData && salesData.length > 0) {
      return salesData.map(d => {
        const dateObj = new Date(d.date);
        let dayFormat = '';
        
        if (period === 'today') {
           dayFormat = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else if (period === '30d') {
           dayFormat = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        } else {
           dayFormat = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' });
           dayFormat = dayFormat.charAt(0).toUpperCase() + dayFormat.slice(1);
        }
        
        return {
          day: dayFormat,
          sales: parseFloat(d.total) || 0
        };
      });
    }
    
    // Default fallback if no data
    if (period === 'today') {
       return [
         { day: '00h', sales: 0 }, { day: '04h', sales: 0 }, { day: '08h', sales: 0 },
         { day: '12h', sales: 0 }, { day: '16h', sales: 0 }, { day: '20h', sales: 0 }
       ];
    }
    return daysArr.map(name => ({ day: name, sales: 0 }));
  };

  const data = parseData();

  const maxSales = Math.max(...data.map(d => d.sales)) * 1.2 || 1;
  const height = 300;
  const width = 800;

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

          {/* Barres (Candlestick style) */}
          {data.map((d, i) => {
            const barWidth = Math.min(30, (width / data.length) * 0.5);
            const xPos = (width / data.length) * i + (width / data.length) / 2 - barWidth / 2;
            const barHeight = Math.max((d.sales / maxSales) * height, 4); // minimum height
            
            // Only show labels for some data points if there's too many
            const showLabel = data.length > 10 ? i % Math.ceil(data.length / 7) === 0 || i === data.length - 1 : true;
            
            return (
              <g key={i}>
                  {/* Background shadow for hover effect */}
                  <rect 
                    x={xPos - 10} y={0} width={barWidth + 20} height={height} 
                    fill="transparent" 
                    className="chart-hover-bg"
                  />
                  
                  {/* The bar */}
                  <motion.rect
                      initial={{ height: 0, y: height }}
                      animate={{ height: barHeight, y: height - barHeight }}
                      transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
                      x={xPos}
                      width={barWidth}
                      rx={6}
                      fill="url(#areaGradient)"
                      style={{ cursor: 'pointer' }}
                  />
                  
                  {/* Accent dot on top of the bar */}
                  <motion.circle
                      initial={{ opacity: 0, cy: height }}
                      animate={{ opacity: 1, cy: height - barHeight }}
                      transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
                      cx={xPos + barWidth / 2}
                      r="4"
                      fill="var(--bg-main)"
                      stroke="var(--primary)"
                      strokeWidth="2"
                  />

                  {showLabel && (
                    <text x={xPos + barWidth / 2} y={height + 30} textAnchor="middle" fill="var(--text-muted)" fontSize="12" fontWeight="800">
                        {d.day}
                    </text>
                  )}
              </g>
            );
          })}
        </svg>
    </div>
  );
};

export default DashboardCharts;
