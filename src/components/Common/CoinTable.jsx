/**
 * CoinTable - 재사용 가능한 코인 테이블 컴포넌트
 * 실시간 가격 데이터 표시, 김치프리미엄 옵션, 즐겨찾기 기능
 */

import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrices } from '../../contexts';
import { useMultiplePriceFlash } from '../../hooks';
import { 
  formatKRW, 
  formatUSD, 
  formatPercent, 
  getChangeColorClass,
  getCoinLogoUrl 
} from '../../utils';
import { CoinLogoWithInfo } from './CoinLogo';
import { SparklineWithTrend, MockSparkline } from './Sparkline';
import LoadingSpinner from './LoadingSpinner';
import SkeletonLoader, { MobileSkeletonLoader } from './SkeletonLoader';
import CoinTableLoader from './CoinTableLoader';

/**
 * CoinTable 컴포넌트
 * @param {Object} props
 * @param {number} props.limit - 표시할 코인 개수 (기본값: 모든 코인)
 * @param {boolean} props.showKimchi - 김치프리미엄 컬럼 표시 여부 (기본값: true)
 * @param {boolean} props.showFavorites - 즐겨찾기 기능 표시 여부 (기본값: true)
 * @param {string} props.className - 추가 CSS 클래스
 * @param {Function} props.onCoinClick - 코인 클릭 시 커스텀 핸들러
 * @param {Array} props.customData - 사전 필터링된 코인 데이터 (옵션)
 * @param {boolean} props.showHeader - 테이블 헤더 표시 여부 (기본값: true)
 */
export default function CoinTable({
  limit,
  showKimchi = true,
  showFavorites = true,
  className = '',
  onCoinClick,
  customData,
  showHeader = true,
  searchQuery = '',
  onSearchChange
}) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState(new Set());
  const [sortBy, setSortBy] = useState('priority');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' 또는 'desc'
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // PriceContext에서 데이터 가져오기
  const {
    prices,
    upbitPrices,
    exchangeRate,
    klineData,
    MAJOR_COINS,
    MAJOR_SYMBOLS,
    calculateKimchiPremium,
    isConnected,
    upbitIsConnected
  } = usePrices();

  // 정렬된 테이블 데이터 준비
  const tableData = useMemo(() => {
    let data = [];
    
    // customData가 제공된 경우 해당 데이터 사용
    if (customData && Array.isArray(customData)) {
      data = customData;
    } else {
      // 기본 데이터 로직
      data = MAJOR_SYMBOLS.map(symbol => {
        const coin = Object.values(MAJOR_COINS).find(c => c.symbol === symbol);
        const bitgetPrice = prices[symbol];
        const upbitPrice = upbitPrices[coin?.upbitMarket];
        const kimchiPremium = showKimchi ? calculateKimchiPremium(symbol) : null;
        
        return {
          symbol,
          coin,
          bitgetPrice,
          upbitPrice,
          kimchiPremium,
          sparklineData: klineData[symbol] || null,
          // 정렬을 위한 우선순위
          priority: coin?.priority || 999,
          // 데이터 유효성
          hasData: bitgetPrice?.price || upbitPrice?.trade_price
        };
      })
      .filter(item => item.coin && item.hasData); // 유효한 데이터만 표시
    }

    // 정렬 적용
    const sortedData = [...data].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.bitgetPrice?.price || a.upbitPrice?.trade_price || 0;
          bValue = b.bitgetPrice?.price || b.upbitPrice?.trade_price || 0;
          break;
        case 'kimchi':
          aValue = a.kimchiPremium?.premium || 0;
          bValue = b.kimchiPremium?.premium || 0;
          break;
        case 'change':
          aValue = a.upbitPrice?.change_percent || a.bitgetPrice?.changePercent24h || 0;
          bValue = b.upbitPrice?.change_percent || b.bitgetPrice?.changePercent24h || 0;
          break;
        case 'volume':
          aValue = (a.bitgetPrice?.volume24h && a.bitgetPrice?.price) ? 
            a.bitgetPrice.volume24h * a.bitgetPrice.price : 0;
          bValue = (b.bitgetPrice?.volume24h && b.bitgetPrice?.price) ? 
            b.bitgetPrice.volume24h * b.bitgetPrice.price : 0;
          break;
        case 'priority':
        default:
          aValue = a.priority || 999;
          bValue = b.priority || 999;
          break;
      }
      
      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    return limit ? sortedData.slice(0, limit) : sortedData;
  }, [
    customData,
    prices, 
    upbitPrices, 
    klineData,
    MAJOR_SYMBOLS, 
    MAJOR_COINS, 
    calculateKimchiPremium, 
    showKimchi, 
    limit,
    sortBy,
    sortOrder
  ]);

  // 정렬 핸들러
  const handleSort = useCallback((column) => {
    if (sortBy === column) {
      // 같은 컬럼 클릭 시 오름차순/내림차순 토글
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 컬럼 클릭 시 해당 컬럼으로 정렬하고 내림차순으로 시작
      setSortBy(column);
      setSortOrder('desc');
    }
  }, [sortBy]);

  // 즐겨찾기 토글 - useCallback으로 최적화
  const toggleFavorite = useCallback((symbol) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });
  }, []);

  // 코인 클릭 핸들러 - useCallback으로 최적화
  const handleCoinClick = useCallback((symbol) => {
    if (onCoinClick) {
      onCoinClick(symbol);
    } else {
      navigate(`/coin/${symbol.toLowerCase()}`);
    }
  }, [onCoinClick, navigate]);

  // 연결 상태 확인 - useMemo로 최적화
  const connectionStatus = useMemo(() => ({
    hasConnection: isConnected || upbitIsConnected,
    hasFullConnection: isConnected && upbitIsConnected && exchangeRate
  }), [isConnected, upbitIsConnected, exchangeRate]);

  // 가격 깜빡임 애니메이션을 위한 가격 맵 생성
  const pricesMap = useMemo(() => {
    const map = {};
    tableData.forEach(({ symbol, bitgetPrice, upbitPrice }) => {
      // Bitget 가격 우선, 없으면 업비트 가격 사용
      const price = bitgetPrice?.price || upbitPrice?.trade_price;
      if (price) {
        map[symbol] = price;
      }
    });
    return map;
  }, [tableData]);

  // 가격 변화 깜빡임 훅 사용
  const flashStates = useMultiplePriceFlash(pricesMap, 800);

  // 비트겟 완전 연결 상태 확인 (단순화)
  const isBitgetFullyConnected = useMemo(() => {
    const priceDataCount = Object.keys(prices).length;
    
    // 디버깅 정보 출력 (개발 모드에서만)
    if (import.meta.env.DEV) {
      console.log('🔍 Bitget 연결 상태 체크:', {
        priceDataCount,
        exchangeRate,
        tableDataLength: tableData.length
      });
    }
    
    // 매우 관대한 조건: 가격 데이터가 1개라도 있으면 OK
    return priceDataCount > 0;
  }, [prices, exchangeRate, tableData.length]);

  // 초기 로딩 상태 관리
  useEffect(() => {
    // Bitget이 완전히 연결되고 데이터가 있으면 로딩 완료
    if (isBitgetFullyConnected && (tableData.length > 0 || (customData && customData.length > 0))) {
      setIsInitialLoading(false);
    }
    
    // 2초 후에는 무조건 로딩 상태 해제 (더 빠른 타임아웃)
    const timeout = setTimeout(() => {
      console.log('⏰ 타임아웃으로 로딩 상태 해제');
      setIsInitialLoading(false);
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [isBitgetFullyConnected, tableData.length, customData]);

  // Bitget이 완전히 연결되지 않았고 초기 로딩 중이면 전체 로딩 화면 표시
  if (!isBitgetFullyConnected && isInitialLoading) {
    return (
      <CoinTableLoader 
        className={className}
        showKimchi={showKimchi}
        showFavorites={showFavorites}
      />
    );
  }

  return (
    <div className={`bg-section rounded-lg overflow-hidden ${className} animate-fade-in-up`}>
      {/* 검색 컨트롤 */}
      {onSearchChange && (
        <div className="p-4 border-b border-border">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="코인명 또는 심볼 검색 (예: Bitcoin, BTC)"
            className="w-full px-4 py-2 bg-card border border-border rounded-lg text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      )}

      {/* 테이블 내용 */}
      <div className="overflow-hidden">
        {/* 데스크톱 테이블 */}
        <table className="w-full hidden md:table">
          <thead className="bg-card">
            <tr className="text-left text-sm text-textSecondary">
              {showFavorites && (
                <th className="px-4 py-3 w-12">★</th>
              )}
              <th className="px-4 py-3 min-w-[200px]">코인</th>
              <th 
                className="px-4 py-3 text-right min-w-[120px] cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center justify-end gap-1">
                  현재가
                  {sortBy === 'price' && (
                    <span className="text-primary">
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
              </th>
              {showKimchi && (
                <th 
                  className="px-4 py-3 text-center min-w-[80px] cursor-pointer hover:bg-card/80 transition-colors"
                  onClick={() => handleSort('kimchi')}
                >
                  <div className="flex items-center justify-center gap-1">
                    김프
                    {sortBy === 'kimchi' && (
                      <span className="text-primary">
                        {sortOrder === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </div>
                </th>
              )}
              <th 
                className="px-4 py-3 text-center min-w-[100px] cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => handleSort('change')}
              >
                <div className="flex items-center justify-center gap-1">
                  전일대비
                  {sortBy === 'change' && (
                    <span className="text-primary">
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-center min-w-[120px]">변화량(24h)</th>
              <th 
                className="px-4 py-3 text-right min-w-[120px] cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => handleSort('volume')}
              >
                <div className="flex items-center justify-end gap-1">
                  거래액(24h)
                  {sortBy === 'volume' && (
                    <span className="text-primary">
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-center min-w-[80px]">상세</th>
            </tr>
          </thead>
          <tbody>
            {isInitialLoading ? (
              // 스켈레톤 UI 표시 (즉시 레이아웃 보여줌)
              <>
                {Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="border-b border-border animate-pulse">
                    {showFavorites && (
                      <td className="px-4 py-3">
                        <div className="w-4 h-4 bg-border rounded"></div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-border rounded-full"></div>
                        <div className="space-y-1">
                          <div className="h-4 w-16 bg-border rounded"></div>
                          <div className="h-3 w-12 bg-border rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-border rounded ml-auto"></div>
                        <div className="h-3 w-16 bg-border rounded ml-auto"></div>
                      </div>
                    </td>
                    {showKimchi && (
                      <td className="px-4 py-3 text-center">
                        <div className="space-y-1">
                          <div className="h-4 w-12 bg-border rounded mx-auto"></div>
                          <div className="h-3 w-10 bg-border rounded mx-auto"></div>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <div className="space-y-1">
                        <div className="h-4 w-14 bg-border rounded mx-auto"></div>
                        <div className="h-3 w-12 bg-border rounded mx-auto"></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="h-8 w-20 bg-border rounded mx-auto"></div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="space-y-1">
                        <div className="h-4 w-12 bg-border rounded ml-auto"></div>
                        <div className="h-3 w-10 bg-border rounded ml-auto"></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="h-6 w-16 bg-border rounded mx-auto"></div>
                    </td>
                  </tr>
                ))}
              </>
            ) : tableData.length > 0 ? (
              tableData.map(({ symbol, coin, bitgetPrice, upbitPrice, kimchiPremium, sparklineData }) => (
                <tr 
                  key={symbol}
                  className="border-b border-border hover:bg-card/50 transition-colors cursor-pointer"
                  onClick={() => handleCoinClick(symbol)}
                >
                  {/* 즐겨찾기 */}
                  {showFavorites && (
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(symbol);
                        }}
                        className={`text-lg hover:scale-110 transition-transform ${
                          favorites.has(symbol) ? 'text-warning' : 'text-textSecondary hover:text-warning'
                        }`}
                      >
                        {favorites.has(symbol) ? '★' : '☆'}
                      </button>
                    </td>
                  )}

                  {/* 코인 (로고 + 이름) */}
                  <td className="px-4 py-3">
                    <CoinLogoWithInfo 
                      symbol={symbol}
                      name={coin.name}
                      size={32}
                      showSymbol={true}
                      showName={true}
                    />
                  </td>

                  {/* 현재가 */}
                  <td className="px-4 py-3 text-right">
                    {(() => {
                      const upbitCurrentPrice = upbitPrice?.trade_price;
                      const bitgetPriceKRW = bitgetPrice?.price && exchangeRate ? 
                        (bitgetPrice.price * exchangeRate) : null;
                      
                      // 깜빡임 애니메이션 클래스 가져오기
                      const flashClass = flashStates[symbol]?.flashClass || '';
                      
                      if (bitgetPriceKRW) {
                        return (
                          <div className={`transition-all duration-200 rounded px-2 py-1 ${flashClass}`}>
                            {/* 비트겟 가격 (메인) */}
                            <div className="font-bold text-text">
                              {formatKRW(bitgetPriceKRW)}
                            </div>
                            {/* 업비트 가격 (서브) */}
                            {upbitCurrentPrice && (
                              <div className="text-xs font-light text-textSecondary">
                                업비트: {formatKRW(upbitCurrentPrice)}
                              </div>
                            )}
                          </div>
                        );
                      } else if (upbitCurrentPrice) {
                        return (
                          <div className={`transition-all duration-200 rounded px-2 py-1 ${flashClass}`}>
                            <div className="font-bold text-text">
                              {formatKRW(upbitCurrentPrice)}
                            </div>
                            <div className="text-xs font-light text-textSecondary">
                              비트겟: 로딩 중
                            </div>
                          </div>
                        );
                      }
                      return <span className="text-textSecondary">가격 로딩 중</span>;
                    })()}
                  </td>

                  {/* 김치프리미엄 */}
                  {showKimchi && (
                    <td className="px-4 py-3 text-center">
                      {kimchiPremium ? (
                        <div>
                          <div className={`font-medium ${getChangeColorClass(kimchiPremium.premium)}`}>
                            {formatPercent(kimchiPremium.premium)}
                          </div>
                          <div className="text-sm text-textSecondary">
                            {(() => {
                              if (bitgetPrice?.price && exchangeRate) {
                                const premiumWon = (bitgetPrice.price * exchangeRate) * (kimchiPremium.premium / 100);
                                return formatKRW(Math.abs(premiumWon));
                              }
                              return '-';
                            })()}
                          </div>
                        </div>
                      ) : coin.upbitMarket ? (
                        // 업비트 상장 코인이지만 김프 계산 불가
                        <div className="text-xs text-textSecondary">
                          {(() => {
                            if (!bitgetPrice?.price) return '비트겟\n로딩 중';
                            if (!upbitPrice?.trade_price) return '업비트\n로딩 중';
                            if (!exchangeRate) return '환율\n로딩 중';
                            return '계산\n준비 중';
                          })()}
                        </div>
                      ) : (
                        <div className="text-xs text-textSecondary">
                          업비트<br/>미상장
                        </div>
                      )}
                    </td>
                  )}

                  {/* 전일대비 */}
                  <td className="px-4 py-3 text-center">
                    {(() => {
                      const upbitChange = upbitPrice?.change_percent || 0;
                      const bitgetChange = bitgetPrice?.changePercent24h || 0;
                      const primaryChange = upbitChange || bitgetChange;
                      
                      return (
                        <div>
                          <div className={`font-medium ${getChangeColorClass(primaryChange)}`}>
                            {formatPercent(primaryChange)}
                          </div>
                          <div className="text-sm text-textSecondary">
                            {(() => {
                              if (upbitPrice?.trade_price && primaryChange) {
                                const changeWon = upbitPrice.trade_price * (primaryChange / 100);
                                return formatKRW(Math.abs(changeWon));
                              } else if (bitgetPrice?.price && exchangeRate && primaryChange) {
                                const changeWon = (bitgetPrice.price * exchangeRate) * (primaryChange / 100);
                                return formatKRW(Math.abs(changeWon));
                              }
                              return '-';
                            })()}
                          </div>
                        </div>
                      );
                    })()}
                  </td>

                  {/* 변동추이(24시간) - 스파크라인 차트 */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center">
                      {sparklineData && sparklineData.length > 0 ? (
                        <SparklineWithTrend
                          data={sparklineData}
                          changePercent={(() => {
                            const upbitChange = upbitPrice?.change_percent || 0;
                            const bitgetChange = bitgetPrice?.changePercent24h || 0;
                            return upbitChange || bitgetChange;
                          })()}
                          symbol={symbol}
                          width={80}
                          height={30}
                          strokeWidth={1.5}
                          showGradient={true}
                        />
                      ) : (
                        <MockSparkline
                          changePercent={(() => {
                            const upbitChange = upbitPrice?.change_percent || 0;
                            const bitgetChange = bitgetPrice?.changePercent24h || 0;
                            return upbitChange || bitgetChange;
                          })()}
                          width={80}
                          height={30}
                          strokeWidth={1.5}
                          showGradient={true}
                        />
                      )}
                    </div>
                  </td>

                  {/* 거래액(24h) - 비트겟 기준 */}
                  <td className="px-4 py-3 text-right">
                    {(() => {
                      const bitgetVolKRW = bitgetPrice?.volume24h && bitgetPrice?.price && exchangeRate ? 
                        (bitgetPrice.volume24h * bitgetPrice.price * exchangeRate) : 0;
                      
                      if (bitgetVolKRW > 0) {
                        return (
                          <div>
                            <div className="text-text font-medium">
                              {(bitgetVolKRW / 100000000).toFixed(1)}억 원
                            </div>
                            <div className="text-xs text-textSecondary">
                              ${(bitgetPrice.volume24h * bitgetPrice.price / 1000000).toFixed(1)}M
                            </div>
                          </div>
                        );
                      }
                      return <span className="text-textSecondary">데이터 없음</span>;
                    })()}
                  </td>

                  {/* 상세 */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleCoinClick(symbol)}
                      className="px-3 py-1 bg-primary text-background rounded text-sm hover:bg-primary/80 transition-colors"
                    >
                      거래하기
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              // 데이터 없음 상태
              <tr>
                <td 
                  colSpan={showFavorites && showKimchi ? 8 : showFavorites || showKimchi ? 7 : 6}
                  className="px-4 py-8 text-center text-textSecondary"
                >
                  <div className="space-y-3">
                    <p className="text-lg">표시할 코인 데이터가 없습니다</p>
                    <div className="text-sm space-y-1">
                      <p>데이터 상태:</p>
                      <p>• Bitget API: {Object.keys(prices).length > 0 ? '✅ 정상' : '❌ 로딩중'}</p>
                      <p>• 업비트 API: {Object.keys(upbitPrices).length > 0 ? '✅ 정상' : '❌ 로딩중'}</p>
                      <p>• 환율 정보: {exchangeRate ? `✅ ${formatKRW(exchangeRate)}` : '❌ 없음'}</p>
                      <p>• 수신된 가격 데이터: {Object.keys(prices).length}개 (Bitget), {Object.keys(upbitPrices).length}개 (업비트)</p>
                      {Object.keys(prices).length > 0 && (
                        <p>• Bitget 코인: {Object.keys(prices).slice(0, 3).join(', ')}...</p>
                      )}
                      {Object.keys(upbitPrices).length > 0 && (
                        <p>• 업비트 코인: {Object.keys(upbitPrices).slice(0, 3).join(', ')}...</p>
                      )}
                    </div>
                    <p className="text-sm text-warning">
                      배포환경에서는 REST API를 통해 5초마다 가격 데이터를 업데이트합니다.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 모바일 카드 리스트 */}
        <div className="md:hidden space-y-2">
          {isInitialLoading ? (
            // 모바일 스켈레톤 UI
            <MobileSkeletonLoader rows={8} />
          ) : tableData.length > 0 ? (
            tableData.map(({ symbol, coin, bitgetPrice, upbitPrice, kimchiPremium, sparklineData }) => (
              <div 
                key={symbol}
                className="bg-card p-3 rounded-lg border border-border cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => handleCoinClick(symbol)}
              >
                <div className="grid grid-cols-4 gap-2 items-center">
                  {/* 코인 정보 */}
                  <div className="col-span-1">
                    <CoinLogoWithInfo 
                      symbol={symbol}
                      name={coin.name}
                      size={24}
                      showSymbol={false}
                      showName={false}
                    />
                    <div className="mt-1">
                      <div className="text-xs font-medium text-text truncate">
                        {coin.name}
                      </div>
                      <div className="text-xs text-textSecondary">
                        {symbol.replace('USDT', '')}
                      </div>
                    </div>
                  </div>

                  {/* 현재가 */}
                  <div className="col-span-1 text-right">
                    {(() => {
                      const upbitCurrentPrice = upbitPrice?.trade_price;
                      const bitgetPriceKRW = bitgetPrice?.price && exchangeRate ? 
                        (bitgetPrice.price * exchangeRate) : null;
                      
                      const currentPrice = upbitCurrentPrice || bitgetPriceKRW;
                      
                      // 깜빡임 애니메이션 클래스 가져오기
                      const flashClass = flashStates[symbol]?.flashClass || '';
                      
                      if (currentPrice) {
                        return (
                          <div className={`transition-all duration-200 rounded px-1 py-1 ${flashClass}`}>
                            <div className="text-sm font-bold text-text">
                              {currentPrice > 1000 ? 
                                `₩${Math.round(currentPrice / 1000)}K` : 
                                formatKRW(currentPrice, false)
                              }
                            </div>
                          </div>
                        );
                      }
                      return <span className="text-xs text-textSecondary">로딩중</span>;
                    })()}
                  </div>

                  {/* 전일대비 */}
                  <div className="col-span-1 text-center">
                    {(() => {
                      const upbitChange = upbitPrice?.change_percent || 0;
                      const bitgetChange = bitgetPrice?.changePercent24h || 0;
                      const primaryChange = upbitChange || bitgetChange;
                      
                      return (
                        <div className="text-center">
                          <div className={`text-sm font-medium ${getChangeColorClass(primaryChange)}`}>
                            {formatPercent(primaryChange)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 변동추이 차트 */}
                  <div className="col-span-1 flex justify-end">
                    <div className="w-16 h-8">
                      {sparklineData && sparklineData.length > 0 ? (
                        <SparklineWithTrend
                          data={sparklineData}
                          changePercent={(() => {
                            const upbitChange = upbitPrice?.change_percent || 0;
                            const bitgetChange = bitgetPrice?.changePercent24h || 0;
                            return upbitChange || bitgetChange;
                          })()}
                          symbol={symbol}
                          width={64}
                          height={32}
                          strokeWidth={1.5}
                          showGradient={false}
                        />
                      ) : (
                        <MockSparkline
                          changePercent={(() => {
                            const upbitChange = upbitPrice?.change_percent || 0;
                            const bitgetChange = bitgetPrice?.changePercent24h || 0;
                            return upbitChange || bitgetChange;
                          })()}
                          width={64}
                          height={32}
                          strokeWidth={1.5}
                          showGradient={false}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-textSecondary">
              <p>표시할 코인 데이터가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 테이블 푸터 */}
      <div className="p-4 bg-card/50 text-sm text-textSecondary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>총 {tableData.length}개 코인</span>
            {limit && tableData.length >= limit && (
              <span>({limit}개만 표시)</span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {showKimchi && connectionStatus.hasFullConnection && (
              <span>김치프리미엄 실시간</span>
            )}
            <span>
              환율: {exchangeRate ? formatKRW(exchangeRate) : '로딩 중...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}