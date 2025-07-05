import React, { useState, useEffect } from 'react';
import { getCoinLogoUrl, getFallbackLogoUrl } from '../../utils/coinLogos';

// 로고 캐시 저장소 (한번 성공적으로 로드된 로고는 메모리에 저장)
const logoCache = new Map();
const failedLogoCache = new Set();

/**
 * 코인 로고 컴포넌트
 * 여러 소스에서 로고를 시도하고 실패 시 폴백 처리
 */
const CoinLogo = ({ 
  symbol, 
  size = 40, 
  className = '', 
  showFallback = true,
  onLoad,
  onError 
}) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedUrl, setCachedUrl] = useState(null);
  
  // 심볼에서 USDT 제거
  const cleanSymbol = symbol?.replace(/USDT$/, '') || '';
  
  // 로고 URL 체인 생성 (다단계 대체)
  const logoUrls = [
    getCoinLogoUrl(symbol),      // 1순위: CoinMarketCap
    getFallbackLogoUrl(cleanSymbol), // 2순위: 검증된 대체 로고들
    `https://via.placeholder.com/64x64/3B82F6/FFFFFF?text=${cleanSymbol.slice(0, 2)}` // 3순위: 플레이스홀더
  ].filter(Boolean); // 빈 값 제거
  
  // 심볼 변경 시 캐시 확인 및 상태 초기화
  useEffect(() => {
    // 캐시된 성공 URL이 있으면 사용
    if (logoCache.has(cleanSymbol)) {
      const cached = logoCache.get(cleanSymbol);
      setCachedUrl(cached);
      setHasError(false);
      setIsLoading(false);
      return;
    }
    
    // 실패한 심볼인 경우 바로 폴백 표시
    if (failedLogoCache.has(cleanSymbol)) {
      setHasError(true);
      setIsLoading(false);
      return;
    }
    
    // 새로운 시도
    setCachedUrl(null);
    setCurrentUrlIndex(0);
    setHasError(false);
    setIsLoading(true);
  }, [symbol, cleanSymbol]);
  
  // 이미지 로드 실패 처리
  const handleError = (e) => {
    const currentUrl = logoUrls[currentUrlIndex];
    console.warn(`로고 로드 실패: ${currentUrl}`);
    
    // 다음 URL이 있으면 시도
    if (currentUrlIndex < logoUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
    } else {
      // 모든 URL 실패 - 실패 캐시에 추가
      failedLogoCache.add(cleanSymbol);
      setHasError(true);
      setIsLoading(false);
      if (onError) onError(e);
    }
  };
  
  // 이미지 로드 성공 처리
  const handleLoad = (e) => {
    const currentUrl = logoUrls[currentUrlIndex];
    
    // 성공한 URL을 캐시에 저장
    logoCache.set(cleanSymbol, currentUrl);
    setCachedUrl(currentUrl);
    
    setIsLoading(false);
    if (onLoad) onLoad(e);
    console.log(`✅ 로고 캐시 저장: ${cleanSymbol} -> ${currentUrl}`);
  };
  
  // 폴백 렌더링
  if (hasError && showFallback) {
    return (
      <div 
        className={`
          flex items-center justify-center
          bg-gradient-to-br from-primary/20 to-primary/10
          rounded-full font-bold text-primary
          ${className}
        `}
        style={{ width: size, height: size }}
      >
        <span style={{ fontSize: size * 0.4 }}>
          {cleanSymbol.slice(0, 2)}
        </span>
      </div>
    );
  }
  
  return (
    <div 
      className={`relative ${className}`} 
      style={{ width: size, height: size }}
    >
      {/* 로딩 스켈레톤 */}
      {isLoading && (
        <div className="absolute inset-0 bg-card animate-pulse rounded-full" />
      )}
      
      {/* 실제 이미지 */}
      {!hasError && (
        <img
          src={cachedUrl || logoUrls[currentUrlIndex]}
          alt={`${cleanSymbol} logo`}
          className={`
            w-full h-full object-contain
            ${isLoading ? 'opacity-0' : 'opacity-100'}
            transition-opacity duration-200
          `}
          onError={cachedUrl ? undefined : handleError}
          onLoad={cachedUrl ? undefined : handleLoad}
          loading="lazy"
        />
      )}
    </div>
  );
};

/**
 * 코인 로고 리스트 컴포넌트
 * 여러 코인 로고를 한 번에 표시
 */
export const CoinLogoList = ({ symbols, size = 30, max = 5, className = '' }) => {
  const displaySymbols = symbols.slice(0, max);
  const remaining = symbols.length - max;
  
  return (
    <div className={`flex items-center ${className}`}>
      {displaySymbols.map((symbol, index) => (
        <div
          key={symbol}
          className={`
            ${index > 0 ? '-ml-2' : ''}
            ring-2 ring-background rounded-full
            hover:z-10 transition-all
          `}
          style={{ zIndex: displaySymbols.length - index }}
        >
          <CoinLogo symbol={symbol} size={size} />
        </div>
      ))}
      
      {remaining > 0 && (
        <div
          className="
            -ml-2 flex items-center justify-center
            bg-card ring-2 ring-background rounded-full
            text-xs text-textSecondary font-medium
          "
          style={{ 
            width: size, 
            height: size,
            zIndex: 0
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

/**
 * 코인 로고와 정보를 함께 표시하는 컴포넌트
 */
export const CoinLogoWithInfo = ({ 
  symbol, 
  name, 
  size = 40, 
  showSymbol = true,
  showName = true,
  className = '' 
}) => {
  const cleanSymbol = symbol?.replace(/USDT$/, '') || '';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <CoinLogo symbol={symbol} size={size} />
      
      <div className="flex flex-col">
        {showName && name && (
          <span className="font-medium text-text">
            {name}
          </span>
        )}
        {showSymbol && (
          <span className="text-sm text-textSecondary">
            {cleanSymbol}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * 로고 캐시 관리 함수들
 */
export const clearLogoCache = () => {
  logoCache.clear();
  failedLogoCache.clear();
  console.log('🧹 로고 캐시 초기화 완료');
};

export const getLogoCacheStats = () => {
  return {
    successCount: logoCache.size,
    failedCount: failedLogoCache.size,
    successSymbols: Array.from(logoCache.keys()),
    failedSymbols: Array.from(failedLogoCache)
  };
};

export const preloadLogos = async (symbols) => {
  console.log(`🔄 로고 프리로드 시작: ${symbols.length}개 심볼`);
  
  const promises = symbols.map(symbol => {
    return new Promise((resolve) => {
      const cleanSymbol = symbol.replace(/USDT$/, '');
      
      // 이미 캐시된 경우 스킵
      if (logoCache.has(cleanSymbol) || failedLogoCache.has(cleanSymbol)) {
        resolve();
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        logoCache.set(cleanSymbol, getCoinLogoUrl(symbol));
        resolve();
      };
      img.onerror = () => {
        failedLogoCache.add(cleanSymbol);
        resolve();
      };
      img.src = getCoinLogoUrl(symbol);
    });
  });
  
  await Promise.all(promises);
  console.log(`✅ 로고 프리로드 완료: 성공 ${logoCache.size}개, 실패 ${failedLogoCache.size}개`);
};

export default CoinLogo;