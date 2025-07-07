import React from 'react';

const PlaceholderImage = ({ 
  width = 300, 
  height = 200, 
  text = '', 
  backgroundColor = '#f0f0f0',
  textColor = '#666',
  className = '',
  style = {}
}) => {
  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="14" fill="${textColor}">
        ${text || `${width}×${height}`}
      </text>
    </svg>
  `;

  const dataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;

  return (
    <img 
      src={dataUrl}
      alt={text || 'Placeholder'}
      width={width}
      height={height}
      className={className}
      style={style}
      loading="lazy"
    />
  );
};

export const createPlaceholderDataUrl = (width, height, text, backgroundColor = '#f0f0f0', textColor = '#666') => {
  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="14" fill="${textColor}">
        ${text || `${width}×${height}`}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

export default PlaceholderImage;