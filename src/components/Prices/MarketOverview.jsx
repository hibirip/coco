/**
 * MarketOverview - 시장 전체 동향 차트 컴포넌트
 * 시가총액, 거래량, BTC 도미넌스, 공포&탐욕 지수 표시
 */

import { useMemo, useCallback } from 'react';
import { usePrices } from '../../contexts';
import { formatKRW, formatUSD, formatPercent, getChangeColorClass } from '../../utils';

// 더미 데이터 (향후 실제 API로 대체)
const MARKET_DATA = {
  totalMarketCap: 2420000000000, // $2.42T
  totalMarketCapChange: 2.34, // +2.34%
  total24hVolume: 89500000000, // $89.5B
  volume24hChange: -5.67, // -5.67%
  btcDominance: 52.3, // 52.3%
  btcDominanceChange: 0.8, // +0.8%
  fearGreedIndex: 72, // 72 (탐욕)
  fearGreedLabel: '탐욕'
};

// 공포&탐욕 지수 설정
const FEAR_GREED_CONFIG = {
  ranges: [
    { min: 0, max: 24, label: '극단적 공포', color: 'bg-red-600', textColor: 'text-red-400' },
    { min: 25, max: 49, label: '공포', color: 'bg-orange-600', textColor: 'text-orange-400' },
    { min: 50, max: 74, label: '탐욕', color: 'bg-yellow-600', textColor: 'text-yellow-400' },
    { min: 75, max: 100, label: '극단적 탐욕', color: 'bg-green-600', textColor: 'text-green-400' }
  ]
};

/**
 * MarketOverview 컴포넌트
 * @param {Object} props
 * @param {string} props.className - 추가 CSS 클래스
 */
export default function MarketOverview({ className = '' }) {
  // PriceContext에서 실시간 데이터 가져오기
  const {
    prices,
    upbitPrices,
    exchangeRate,
    stats,
    isConnected,
    upbitIsConnected
  } = usePrices();

  // 공포&탐욕 지수 설정 계산
  const fearGreedConfig = useMemo(() => {
    const config = FEAR_GREED_CONFIG.ranges.find(
      range => MARKET_DATA.fearGreedIndex >= range.min && MARKET_DATA.fearGreedIndex <= range.max
    );
    return config || FEAR_GREED_CONFIG.ranges[1]; // 기본값: 공포
  }, []);

  // 시가총액 포맷팅
  const formatMarketCap = useCallback((value) => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  }, []);

  // 거래량 포맷팅
  const formatVolume = useCallback((value) => {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  }, []);

  return (
    <div className={`${className}`}>
      {/* 섹션 제목 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-primary mb-2">시장 동향</h2>
        <p className="text-sm text-textSecondary">
          전체 암호화폐 시장의 주요 지표와 동향을 확인하세요
        </p>
      </div>

      {/* 4개 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. 시가총액 카드 */}
        <div className="bg-section p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-primary text-lg">💰</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-textSecondary">시가총액</h3>
                <p className="text-xs text-textSecondary">Total Market Cap</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-2xl font-bold text-text">
              {formatMarketCap(MARKET_DATA.totalMarketCap)}
            </p>
            <div className="flex items-center">
              <span className={`text-sm font-medium ${getChangeColorClass(MARKET_DATA.totalMarketCapChange)}`}>
                {MARKET_DATA.totalMarketCapChange > 0 ? '+' : ''}
                {formatPercent(MARKET_DATA.totalMarketCapChange)}
              </span>
              <span className="text-xs text-textSecondary ml-2">24h</span>
            </div>
          </div>
        </div>

        {/* 2. 24시간 거래량 카드 */}
        <div className="bg-section p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 text-lg">📊</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-textSecondary">거래량</h3>
                <p className="text-xs text-textSecondary">24h Volume</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-2xl font-bold text-text">
              {formatVolume(MARKET_DATA.total24hVolume)}
            </p>
            <div className="flex items-center">
              <span className={`text-sm font-medium ${getChangeColorClass(MARKET_DATA.volume24hChange)}`}>
                {MARKET_DATA.volume24hChange > 0 ? '+' : ''}
                {formatPercent(MARKET_DATA.volume24hChange)}
              </span>
              <span className="text-xs text-textSecondary ml-2">24h</span>
            </div>
          </div>
        </div>

        {/* 3. BTC 도미넌스 카드 */}
        <div className="bg-section p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <span className="text-orange-400 text-lg">₿</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-textSecondary">BTC 도미넌스</h3>
                <p className="text-xs text-textSecondary">Market Share</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-2xl font-bold text-text">
              {formatPercent(MARKET_DATA.btcDominance)}
            </p>
            
            {/* 프로그레스 바 */}
            <div className="space-y-2">
              <div className="w-full bg-card rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${MARKET_DATA.btcDominance}%` }}
                ></div>
              </div>
              <div className="flex items-center">
                <span className={`text-sm font-medium ${getChangeColorClass(MARKET_DATA.btcDominanceChange)}`}>
                  {MARKET_DATA.btcDominanceChange > 0 ? '+' : ''}
                  {formatPercent(MARKET_DATA.btcDominanceChange)}
                </span>
                <span className="text-xs text-textSecondary ml-2">24h</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. 공포&탐욕 지수 카드 */}
        <div className="bg-section p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-10 h-10 ${fearGreedConfig.color}/20 rounded-lg flex items-center justify-center`}>
                <span className={`${fearGreedConfig.textColor} text-lg`}>
                  {MARKET_DATA.fearGreedIndex >= 75 ? '🤑' : 
                   MARKET_DATA.fearGreedIndex >= 50 ? '😈' : 
                   MARKET_DATA.fearGreedIndex >= 25 ? '😰' : '😱'}
                </span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-textSecondary">공포&탐욕</h3>
                <p className="text-xs text-textSecondary">Fear & Greed</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-baseline">
              <p className="text-2xl font-bold text-text">
                {MARKET_DATA.fearGreedIndex}
              </p>
              <span className="text-sm text-textSecondary ml-1">/100</span>
            </div>
            
            {/* 지수 표시 바 */}
            <div className="space-y-2">
              <div className="w-full bg-card rounded-full h-2">
                <div 
                  className={`${fearGreedConfig.color} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${MARKET_DATA.fearGreedIndex}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${fearGreedConfig.textColor}`}>
                  {fearGreedConfig.label}
                </span>
                <span className="text-xs text-textSecondary">
                  업데이트: 1시간 전
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 추가 정보 */}
      <div className="mt-6 p-4 bg-card rounded-lg border border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`}></div>
              <span className="text-textSecondary">
                실시간 연결: {stats.connectedCoins}/{stats.totalCoins}개
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${stats.kimchiPremiumCount > 0 ? 'bg-primary' : 'bg-textSecondary'}`}></div>
              <span className="text-textSecondary">
                김치프리미엄: {stats.kimchiPremiumCount}개 계산 중
              </span>
            </div>
          </div>
          
          <div className="text-xs text-textSecondary">
            마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-textSecondary">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 rounded"></div>
          <span>극단적 공포 (0-24)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-600 rounded"></div>
          <span>공포 (25-49)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-600 rounded"></div>
          <span>탐욕 (50-74)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-600 rounded"></div>
          <span>극단적 탐욕 (75-100)</span>
        </div>
      </div>
    </div>
  );
}