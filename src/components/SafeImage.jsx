import React from 'react';
import useImageLoader from '../hooks/useImageLoader';
import { createPlaceholderDataUrl } from './PlaceholderImage';

const SafeImage = ({ 
  src, 
  alt, 
  fallbackText = '',
  width = 'auto',
  height = 'auto',
  className = '',
  style = {},
  placeholderColor = '#f0f0f0',
  textColor = '#666',
  onLoad,
  onError,
  ...props 
}) => {
  const numericWidth = typeof width === 'string' ? 300 : width;
  const numericHeight = typeof height === 'string' ? 200 : height;
  
  const fallbackSrc = createPlaceholderDataUrl(
    numericWidth, 
    numericHeight, 
    fallbackText || alt || 'Image', 
    placeholderColor, 
    textColor
  );

  const { imageSrc, isLoading, hasError } = useImageLoader(src, fallbackSrc);

  const handleLoad = (e) => {
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    if (onError) onError(e);
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={`${className} ${isLoading ? 'animate-pulse' : ''}`}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};

export default SafeImage;