/**
 * CoinTable - 재사용 가능한 코인 테이블 컴포넌트
 * 실시간 가격 데이터 표시, 김치프리미엄 옵션, 즐겨찾기 기능
 */

import { useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrices } from '../../contexts';
import { 
  formatKRW, 
  formatUSD, 
  formatPercent, 
  getChangeColorClass,
  getCoinLogoUrl 
} from '../../utils';
import { CoinLogoWithInfo } from './CoinLogo';

/**
 * CoinTable 컴포넌트
 * @param {Object} props
 * @param {number} props.limit - 표시할 코인 개수 (기본값: 모든 코인)
 * @param {boolean} props.showKimchi - 김치프리미엄 컬럼 표시 여부 (기본값: true)
 * @param {boolean} props.showFavorites - 즐겨찾기 기능 표시 여부 (기본값: true)
 * @param {string} props.className - 추가 CSS 클래스
 * @param {Function} props.onCoinClick - 코인 클릭 시 커스텀 핸들러
 * @param {Array} props.customData - 사전 필터링된 코인 데이터 (옵션)
 */
export default function CoinTable({
  limit,
  showKimchi = true,
  showFavorites = true,
  className = '',
  onCoinClick,
  customData
}) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState(new Set());

  // PriceContext에서 데이터 가져오기
  const {
    prices,
    upbitPrices,
    exchangeRate,
    MAJOR_COINS,
    MAJOR_SYMBOLS,
    calculateKimchiPremium,
    isConnected,
    upbitIsConnected
  } = usePrices();

  // 테이블 데이터 준비
  const tableData = useMemo(() => {
    // customData가 제공된 경우 해당 데이터 사용
    if (customData && Array.isArray(customData)) {
      return limit ? customData.slice(0, limit) : customData;
    }
    
    // 기본 데이터 로직
    const coins = MAJOR_SYMBOLS.map(symbol => {
      const coin = Object.values(MAJOR_COINS).find(c => c.symbol === symbol);
      const bitgetPrice = prices[symbol];
      const upbitPrice = upbitPrices[coin?.upbitMarket];
      const kimchiPremium = showKimchi ? calculateKimchiPremium(symbol) : null;
      
      // 디버깅: 첫 번째 코인(BTC)만 로그 출력
      if (symbol === 'BTCUSDT' && showKimchi) {
        console.log('🔍 CoinTable 김치프리미엄 디버깅:', {
          symbol,
          bitgetPrice: bitgetPrice?.price,
          upbitPrice: upbitPrice?.trade_price,
          exchangeRate,
          kimchiPremium,
          hasExchangeRate: !!exchangeRate,
          hasKimchiFunction: typeof calculateKimchiPremium === 'function'
        });
      }
      
      return {
        symbol,
        coin,
        bitgetPrice,
        upbitPrice,
        kimchiPremium,
        // 정렬을 위한 우선순위
        priority: coin?.priority || 999,
        // 데이터 유효성
        hasData: bitgetPrice?.price || upbitPrice?.trade_price
      };
    })
    .filter(item => item.coin && item.hasData) // 유효한 데이터만 표시
    .sort((a, b) => a.priority - b.priority); // 우선순위로 정렬

    return limit ? coins.slice(0, limit) : coins;
  }, [
    customData,
    prices, 
    upbitPrices, 
    MAJOR_SYMBOLS, 
    MAJOR_COINS, 
    calculateKimchiPremium, 
    showKimchi, 
    limit
  ]);

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

  return (
    <div className={`bg-section rounded-lg overflow-hidden ${className}`}>
      {/* 테이블 헤더 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">
            실시간 코인 시세 ({tableData.length}개)
          </h3>
          <div className="flex items-center gap-2 text-sm">
            {/* 연결 상태 표시 */}
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${connectionStatus.hasConnection ? 'bg-success' : 'bg-danger'}`}></div>
              <span className="text-textSecondary">
                {connectionStatus.hasFullConnection ? '실시간' : connectionStatus.hasConnection ? '부분연결' : '연결안됨'}
              </span>
            </div>
            
            {/* 김치프리미엄 표시 여부 */}
            {showKimchi && (
              <span className="text-textSecondary">
                김프 {connectionStatus.hasFullConnection ? '활성' : '대기'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 테이블 내용 */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-card">
            <tr className="text-left text-sm text-textSecondary">
              {showFavorites && (
                <th className="px-4 py-3 w-12">★</th>
              )}
              <th className="px-4 py-3 min-w-[200px]">코인</th>
              {showKimchi && (
                <th className="px-4 py-3 text-center min-w-[80px]">김프</th>
              )}
              <th className="px-4 py-3 text-center min-w-[100px]">전일대비</th>
              <th className="px-4 py-3 text-center min-w-[120px]">변동추이(24시간)</th>
              <th className="px-4 py-3 text-right min-w-[120px]">거래액 (원)</th>
              <th className="px-4 py-3 text-center min-w-[80px]">상세</th>
            </tr>
          </thead>
          <tbody>
            {tableData.length > 0 ? (
              tableData.map(({ symbol, coin, bitgetPrice, upbitPrice, kimchiPremium }) => (
                <tr 
                  key={symbol}
                  className="border-b border-border hover:bg-card/50 transition-colors"
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

                  {/* 김치프리미엄 */}
                  {showKimchi && (
                    <td className="px-4 py-3 text-center">
                      {kimchiPremium ? (
                        <div>
                          <div className={`font-bold text-lg ${getChangeColorClass(kimchiPremium.premium)}`}>
                            {kimchiPremium.premium > 0 ? '+' : ''}
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
                        <span className="text-textSecondary">-</span>
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
                            {primaryChange > 0 ? '+' : ''}
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

                  {/* 변동추이(24시간) */}
                  <td className="px-4 py-3 text-center">
                    {bitgetPrice?.price && upbitPrice?.trade_price ? (
                      <div className="text-sm">
                        <div className="text-textSecondary">
                          비트겟제공 이미
                        </div>
                        <div className="text-textSecondary">
                          지 그래프
                        </div>
                      </div>
                    ) : (
                      <span className="text-textSecondary">데이터 로딩 중</span>
                    )}
                  </td>

                  {/* 거래액 (원) */}
                  <td className="px-4 py-3 text-right">
                    {(() => {
                      const upbitVol = upbitPrice?.acc_trade_volume_24h || 0;
                      const bitgetVolKRW = bitgetPrice?.volume24h ? 
                        (bitgetPrice.volume24h * bitgetPrice.price * (exchangeRate || 1380)) : 0;
                      const primaryVol = upbitVol || bitgetVolKRW;
                      
                      if (primaryVol > 0) {
                        return (
                          <span className="text-text font-medium">
                            {(primaryVol / 100000000).toFixed(1)}억 원
                          </span>
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
                  colSpan={showFavorites && showKimchi ? 7 : showFavorites || showKimchi ? 6 : 5}
                  className="px-4 py-8 text-center text-textSecondary"
                >
                  <div className="space-y-2">
                    <p>표시할 코인 데이터가 없습니다</p>
                    <p className="text-sm">
                      {!connectionStatus.hasConnection ? 'WebSocket 연결을 확인해주세요' : '데이터 로딩 중...'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
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