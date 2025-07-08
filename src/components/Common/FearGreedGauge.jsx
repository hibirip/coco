import React, { useEffect, useState } from 'react';

const FearGreedGauge = ({ value, loading }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!loading && value !== null) {
      setTimeout(() => {
        setAnimatedValue(value);
        setIsInitialized(true);
      }, 100);
    }
  }, [value, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const normalizedValue = Math.max(0, Math.min(100, animatedValue || 0));
  const rotation = (normalizedValue / 100) * 180 - 90;

  const getGradientColors = (val) => {
    if (val <= 24) return { from: '#dc2626', to: '#ef4444', glow: 'rgba(220, 38, 38, 0.4)' };
    if (val <= 49) return { from: '#ea580c', to: '#f97316', glow: 'rgba(234, 88, 12, 0.4)' };
    if (val <= 74) return { from: '#ca8a04', to: '#eab308', glow: 'rgba(202, 138, 4, 0.4)' };
    return { from: '#16a34a', to: '#22c55e', glow: 'rgba(22, 163, 74, 0.4)' };
  };

  const getLabel = (val) => {
    if (val <= 24) return '극심한 공포';
    if (val <= 49) return '공포';
    if (val <= 74) return '탐욕';
    return '극심한 탐욕';
  };

  const colors = getGradientColors(normalizedValue);
  const label = getLabel(normalizedValue);

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Gauge Container - Original size maintained */}
      <div className="relative w-32 h-16">
        {/* Subtle glow effect */}
        <div 
          className="absolute inset-0 blur-xl opacity-20 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle at center, ${colors.glow}, transparent)`,
          }}
        />
        
        {/* SVG Gauge */}
        <svg className="w-full h-full relative z-10" viewBox="0 0 128 64">
          <defs>
            {/* Gradient definitions */}
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.from} />
              <stop offset="100%" stopColor={colors.to} />
            </linearGradient>
            
            {/* Shadow filter */}
            <filter id="shadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
              <feOffset dx="0" dy="1" result="offsetblur"/>
              <feFlood floodColor="#000000" floodOpacity="0.2"/>
              <feComposite in2="offsetblur" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background arc */}
          <path
            d="M 16 56 A 48 48 0 0 1 112 56"
            fill="none"
            stroke="#374151"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
          />
          
          {/* Color segments - subtle background */}
          <path
            d="M 16 56 A 48 48 0 0 1 40 16"
            fill="none"
            stroke="#dc2626"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.15"
          />
          <path
            d="M 40 16 A 48 48 0 0 1 64 8"
            fill="none"
            stroke="#ea580c"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.15"
          />
          <path
            d="M 64 8 A 48 48 0 0 1 88 16"
            fill="none"
            stroke="#ca8a04"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.15"
          />
          <path
            d="M 88 16 A 48 48 0 0 1 112 56"
            fill="none"
            stroke="#16a34a"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.15"
          />
          
          {/* Active value arc */}
          <path
            d="M 16 56 A 48 48 0 0 1 112 56"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(normalizedValue / 100) * 150.8} 150.8`}
            className="transition-all duration-1000 ease-out"
            filter="url(#shadow)"
          />
          
          {/* Needle */}
          <g 
            transform={`rotate(${rotation} 64 56)`}
            className="transition-all duration-1000 ease-out"
          >
            <line
              x1="64"
              y1="56"
              x2="64"
              y2="20"
              stroke={colors.from}
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#shadow)"
            />
            <circle
              cx="64"
              cy="20"
              r="3"
              fill={colors.from}
            />
          </g>
          
          {/* Center circle */}
          <circle
            cx="64"
            cy="56"
            r="6"
            fill={colors.from}
            filter="url(#shadow)"
          />
          <circle
            cx="64"
            cy="56"
            r="3"
            fill="#ffffff"
          />
        </svg>
      </div>
      
      {/* Value and Label */}
      <div className="text-center">
        <div 
          className="text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
          style={{
            backgroundImage: `linear-gradient(to right, ${colors.from}, ${colors.to})`,
          }}
        >
          {Math.round(normalizedValue)}
        </div>
        <div 
          className="text-sm font-medium"
          style={{ color: colors.from }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

export default FearGreedGauge;