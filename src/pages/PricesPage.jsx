/**
 * PricesPage - 메인 시세판
 * 전체 코인 리스트, 검색, 정렬, 필터 기능 제공
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { CoinTable } from '../components/Common';
import { MarketOverview } from '../components/Prices';
import { usePrices } from '../contexts';
import { formatKRW, formatPercent } from '../utils';

// 정렬 옵션 정의
const SORT_OPTIONS = [
  { value: 'priority', label: '기본순', desc: '코인 우선순위' },
  { value: 'price_desc', label: '가격 높은순', desc: 'Bitget USD 기준' },
  { value: 'price_asc', label: '가격 낮은순', desc: 'Bitget USD 기준' },
  { value: 'change_desc', label: '상승률순', desc: '24시간 변동률' },
  { value: 'change_asc', label: '하락률순', desc: '24시간 변동률' },
  { value: 'volume_desc', label: '거래량순', desc: '24시간 거래량' },
  { value: 'kimchi_desc', label: '김프 높은순', desc: '김치프리미엄' },
  { value: 'kimchi_asc', label: '김프 낮은순', desc: '김치프리미엄' }
];

// 필터 옵션 정의
const FILTER_OPTIONS = [
  { value: 'all', label: '전체', desc: '모든 코인' },
  { value: 'favorites', label: '즐겨찾기', desc: '즐겨찾기한 코인만' },
  { value: 'rising', label: '상승', desc: '24시간 상승 코인' },
  { value: 'falling', label: '하락', desc: '24시간 하락 코인' },
  { value: 'kimchi_positive', label: '김프 양수', desc: '김치프리미엄 > 0%' },
  { value: 'kimchi_negative', label: '김프 음수', desc: '김치프리미엄 < 0%' }
];

export default function PricesPage() {
  // 상태 관리
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const [filterBy, setFilterBy] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // PriceContext에서 데이터 가져오기
  const {
    prices,
    upbitPrices,
    exchangeRate,
    ALL_COINS,
    ALL_SYMBOLS,
    calculateKimchiPremium,
    isConnected,
    upbitIsConnected,
    stats
  } = usePrices();

  // 디바운싱된 검색어 (300ms 지연)
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // 디바운싱 적용
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);
  
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
  }, []);

  // 필터링 및 정렬된 코인 데이터
  const filteredAndSortedCoins = useMemo(() => {
    let coins = ALL_SYMBOLS.map(symbol => {
      const coin = Object.values(ALL_COINS).find(c => c.symbol === symbol);
      const bitgetPrice = prices[symbol];
      const upbitPrice = upbitPrices[coin?.upbitMarket];
      const kimchiPremium = calculateKimchiPremium(symbol);
      
      return {
        symbol,
        coin,
        bitgetPrice,
        upbitPrice,
        kimchiPremium,
        priority: coin?.priority || 999,
        hasData: bitgetPrice?.price || upbitPrice?.trade_price
      };
    }).filter(item => item.coin && item.hasData);

    // 검색 필터 적용
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      coins = coins.filter(item => 
        item.coin.name.toLowerCase().includes(query) ||
        item.symbol.toLowerCase().includes(query) ||
        item.symbol.replace('USDT', '').toLowerCase().includes(query)
      );
    }

    // 추가 필터 적용
    switch (filterBy) {
      case 'rising':
        coins = coins.filter(item => {
          const change = Math.max(
            item.bitgetPrice?.changePercent24h || 0,
            item.upbitPrice?.change_percent || 0
          );
          return change > 0;
        });
        break;
      case 'falling':
        coins = coins.filter(item => {
          const change = Math.max(
            item.bitgetPrice?.changePercent24h || 0,
            item.upbitPrice?.change_percent || 0
          );
          return change < 0;
        });
        break;
      case 'kimchi_positive':
        coins = coins.filter(item => item.kimchiPremium?.premium > 0);
        break;
      case 'kimchi_negative':
        coins = coins.filter(item => item.kimchiPremium?.premium < 0);
        break;
      // favorites는 향후 구현
      default:
        break;
    }

    // 정렬 적용
    switch (sortBy) {
      case 'price_desc':
        coins.sort((a, b) => (b.bitgetPrice?.price || 0) - (a.bitgetPrice?.price || 0));
        break;
      case 'price_asc':
        coins.sort((a, b) => (a.bitgetPrice?.price || 0) - (b.bitgetPrice?.price || 0));
        break;
      case 'change_desc':
        coins.sort((a, b) => {
          const aChange = Math.max(a.bitgetPrice?.changePercent24h || 0, a.upbitPrice?.change_percent || 0);
          const bChange = Math.max(b.bitgetPrice?.changePercent24h || 0, b.upbitPrice?.change_percent || 0);
          return bChange - aChange;
        });
        break;
      case 'change_asc':
        coins.sort((a, b) => {
          const aChange = Math.max(a.bitgetPrice?.changePercent24h || 0, a.upbitPrice?.change_percent || 0);
          const bChange = Math.max(b.bitgetPrice?.changePercent24h || 0, b.upbitPrice?.change_percent || 0);
          return aChange - bChange;
        });
        break;
      case 'volume_desc':
        coins.sort((a, b) => {
          const aVolume = Math.max(a.bitgetPrice?.volume24h || 0, a.upbitPrice?.acc_trade_volume_24h || 0);
          const bVolume = Math.max(b.bitgetPrice?.volume24h || 0, b.upbitPrice?.acc_trade_volume_24h || 0);
          return bVolume - aVolume;
        });
        break;
      case 'kimchi_desc':
        coins.sort((a, b) => (b.kimchiPremium?.premium || 0) - (a.kimchiPremium?.premium || 0));
        break;
      case 'kimchi_asc':
        coins.sort((a, b) => (a.kimchiPremium?.premium || 0) - (b.kimchiPremium?.premium || 0));
        break;
      default: // priority
        coins.sort((a, b) => a.priority - b.priority);
        break;
    }

    return coins;
  }, [
    ALL_SYMBOLS, 
    ALL_COINS, 
    prices, 
    upbitPrices, 
    calculateKimchiPremium, 
    debouncedSearch, 
    sortBy, 
    filterBy
  ]);

  // 통계 계산
  const pageStats = useMemo(() => {
    const rising = filteredAndSortedCoins.filter(item => {
      const change = Math.max(
        item.bitgetPrice?.changePercent24h || 0,
        item.upbitPrice?.change_percent || 0
      );
      return change > 0;
    }).length;

    const falling = filteredAndSortedCoins.filter(item => {
      const change = Math.max(
        item.bitgetPrice?.changePercent24h || 0,
        item.upbitPrice?.change_percent || 0
      );
      return change < 0;
    }).length;

    const kimchiPositive = filteredAndSortedCoins.filter(item => 
      item.kimchiPremium?.premium > 0
    ).length;

    return { rising, falling, kimchiPositive, total: filteredAndSortedCoins.length };
  }, [filteredAndSortedCoins]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">

      {/* 시장 동향 차트 */}
      <MarketOverview className="mb-6" />
      
      {/* 코인별 동향 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-section p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-success">{pageStats.rising}</p>
          <p className="text-sm text-textSecondary">상승</p>
        </div>
        <div className="bg-section p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-danger">{pageStats.falling}</p>
          <p className="text-sm text-textSecondary">하락</p>
        </div>
        <div className="bg-section p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-primary">{pageStats.kimchiPositive}</p>
          <p className="text-sm text-textSecondary">김프 양수</p>
        </div>
        <div className="bg-section p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-text">{pageStats.total}</p>
          <p className="text-sm text-textSecondary">전체</p>
        </div>
      </div>

      {/* 검색 및 필터 컨트롤 */}
      <div className="bg-section p-6 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-text mb-2">
              코인 검색
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="코인명 또는 심볼 검색 (예: Bitcoin, BTC)"
              className="w-full px-4 py-2 bg-card border border-border rounded-lg text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* 정렬 */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-text mb-2">
              정렬
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 bg-card border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 필터 토글 */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-text mb-2">
              필터
            </label>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/80 transition-colors flex items-center justify-between"
            >
              <span>필터 옵션</span>
              <span className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
          </div>
        </div>

        {/* 확장된 필터 */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {FILTER_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilterBy(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    filterBy === option.value
                      ? 'bg-primary text-background'
                      : 'bg-card text-text hover:bg-card/80'
                  }`}
                  title={option.desc}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 검색 결과 정보 */}
        <div className="mt-4 flex items-center justify-between text-sm text-textSecondary">
          <div>
            {debouncedSearch && (
              <span>'{debouncedSearch}' 검색 결과: {pageStats.total}개</span>
            )}
            {filterBy !== 'all' && (
              <span className="ml-2">
                ({FILTER_OPTIONS.find(opt => opt.value === filterBy)?.label} 필터 적용)
              </span>
            )}
          </div>
          <div>
            {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label} 정렬
          </div>
        </div>
      </div>

      {/* 메인 코인 테이블 */}
      <div className="bg-section rounded-lg overflow-hidden">
        <CoinTable 
          showKimchi={true}
          showFavorites={true}
          className=""
          customData={filteredAndSortedCoins}
        />
        
        {/* 결과 없음 상태 */}
        {filteredAndSortedCoins.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-textSecondary mb-2">검색 결과가 없습니다</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearch('');
                setFilterBy('all');
                setSortBy('priority');
              }}
              className="text-primary hover:underline"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>

      {/* 하단 정보 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-section p-6 rounded-lg">
          <h2 className="text-xl font-bold text-primary mb-4">거래소 정보</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-textSecondary">Bitget:</span>
              <span className="text-text">해외 거래소 (USD)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textSecondary">업비트:</span>
              <span className="text-text">국내 거래소 (KRW)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textSecondary">김치프리미엄:</span>
              <span className="text-text">국내외 가격 차이</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textSecondary">업데이트:</span>
              <span className="text-success">실시간 WebSocket</span>
            </div>
          </div>
        </div>
        
        <div className="bg-section p-6 rounded-lg">
          <h2 className="text-xl font-bold text-primary mb-4">시장 현황</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-textSecondary">전체 코인:</span>
              <span className="text-text">{stats.totalCoins}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textSecondary">실시간 연결:</span>
              <span className="text-text">{stats.connectedCoins}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textSecondary">김프 계산:</span>
              <span className="text-text">{stats.kimchiPremiumCount}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textSecondary">현재 환율:</span>
              <span className="text-primary">
                {exchangeRate ? formatKRW(exchangeRate) : '로딩중...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}