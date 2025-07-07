import React from 'react';

const FearGreedGauge = ({ value, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const normalizedValue = Math.max(0, Math.min(100, value || 0));
  const rotation = (normalizedValue / 100) * 180 - 90;

  const getColor = (val) => {
    if (val <= 24) return '#dc2626'; // red-600
    if (val <= 49) return '#ea580c'; // orange-600
    if (val <= 74) return '#ca8a04'; // yellow-600
    return '#16a34a'; // green-600
  };

  const getLabel = (val) => {
    if (val <= 24) return '극심한 공포';
    if (val <= 49) return '공포';
    if (val <= 74) return '탐욕';
    return '극심한 탐욕';
  };

  const getEmoji = (val) => {
    if (val <= 24) return '😱';
    if (val <= 49) return '😰';
    if (val <= 74) return '😈';
    return '🤑';
  };

  const color = getColor(normalizedValue);
  const label = getLabel(normalizedValue);
  const emoji = getEmoji(normalizedValue);

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Gauge Container */}
      <div className="relative w-32 h-16">
        {/* Background Arc */}
        <svg className="w-full h-full transform" viewBox="0 0 128 64">
          {/* Background semicircle */}
          <path
            d="M 16 56 A 48 48 0 0 1 112 56"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Color segments */}
          <path
            d="M 16 56 A 48 48 0 0 1 40 16"
            fill="none"
            stroke="#dc2626"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M 40 16 A 48 48 0 0 1 64 8"
            fill="none"
            stroke="#ea580c"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M 64 8 A 48 48 0 0 1 88 16"
            fill="none"
            stroke="#ca8a04"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M 88 16 A 48 48 0 0 1 112 56"
            fill="none"
            stroke="#16a34a"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
          />
          
          {/* Active arc based on value */}
          <path
            d="M 16 56 A 48 48 0 0 1 112 56"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(normalizedValue / 100) * 150.8} 150.8`}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Needle */}
          <line
            x1="64"
            y1="56"
            x2="64"
            y2="16"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${rotation} 64 56)`}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Center dot */}
          <circle
            cx="64"
            cy="56"
            r="4"
            fill={color}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
      </div>
      
      {/* Value and Label */}
      <div className="text-center">
        <div className="text-2xl font-bold" style={{ color }}>
          {normalizedValue}
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 font-medium">
          <span className="text-lg">{emoji}</span>
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
};

export default FearGreedGauge;