/**
 * PricesPage - 메인 시세판
 * 전체 코인 리스트, 검색, 정렬, 필터 기능 제공
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { CoinTable } from '../components/Common';
import { usePrices } from '../contexts';

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

  // 필터링 및 정렬된 코인 데이터 - 동적 로딩 지원
  const filteredAndSortedCoins = useMemo(() => {
    // 실제로 로드된 가격 데이터에서 코인 목록 생성 (동적)
    const availableSymbols = Object.keys(prices);
    
    // 디버깅: 실제 데이터 상태 확인
    console.log('🔍 DEBUG: PricesPage 필터링 시작:', {
      availableSymbolsCount: availableSymbols.length,
      upbitPricesCount: Object.keys(upbitPrices).length,
      first10Symbols: availableSymbols.slice(0, 10),
      searchQuery: debouncedSearch,
      sortBy,
      filterBy
    });
    
    let coins = availableSymbols.map(symbol => {
      // ALL_COINS에서 해당 코인 정보 찾기 (없으면 동적 생성)
      let coin = Object.values(ALL_COINS).find(c => c.symbol === symbol);
      
      // 동적 코인 정보 생성 (ALL_COINS에 없는 새로운 코인)
      if (!coin) {
        const baseCoin = symbol.replace('USDT', '');
        coin = {
          symbol: symbol,
          name: baseCoin, // 기본 이름 (API에서 가져올 수 있으면 더 좋음)
          upbitMarket: `KRW-${baseCoin}`, // 추정 업비트 마켓
          priority: 999 // 낮은 우선순위
        };
      }
      
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
        hasData: bitgetPrice?.price || upbitPrice?.trade_price,
        // 추가 정보 (정렬용)
        volume24hUSD: bitgetPrice?.volume24h && bitgetPrice?.price ? 
          bitgetPrice.volume24h * bitgetPrice.price : 0
      };
    }).filter(item => item.hasData); // 데이터가 있는 코인만

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
          // USD 거래량 기준으로 정렬 (더 정확함)
          const aVolumeUSD = a.volume24hUSD || 0;
          const bVolumeUSD = b.volume24hUSD || 0;
          return bVolumeUSD - aVolumeUSD;
        });
        break;
      case 'kimchi_desc':
        coins.sort((a, b) => (b.kimchiPremium?.premium || 0) - (a.kimchiPremium?.premium || 0));
        break;
      case 'kimchi_asc':
        coins.sort((a, b) => (a.kimchiPremium?.premium || 0) - (b.kimchiPremium?.premium || 0));
        break;
      default: // priority + volume
        // 기본 정렬: 거래량 내림차순 (동적 코인 리스트에 최적화)
        coins.sort((a, b) => {
          // 우선순위가 있는 코인 (주요 코인) 우선
          if (a.priority < 100 && b.priority >= 100) return -1;
          if (a.priority >= 100 && b.priority < 100) return 1;
          
          // 같은 우선순위 그룹 내에서는 거래량 순
          return (b.volume24hUSD || 0) - (a.volume24hUSD || 0);
        });
        break;
    }

    // 디버깅: 최종 결과 확인
    console.log('🔍 DEBUG: PricesPage 필터링 완료:', {
      finalCoinsCount: coins.length,
      first5Coins: coins.slice(0, 5).map(c => ({
        symbol: c.symbol,
        hasData: c.hasData,
        priority: c.priority
      }))
    });

    return coins;
  }, [
    prices, // 동적 코인 리스트의 기준이 됨
    ALL_COINS, 
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
      {/* 메인 코인 테이블 */}
      <div className="bg-section rounded-lg overflow-hidden">
        <CoinTable 
          showKimchi={true}
          showFavorites={true}
          className=""
          customData={filteredAndSortedCoins}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
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

    </div>
  );
}