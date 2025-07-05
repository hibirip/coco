/**
 * useUpbitPrices 커스텀 훅
 * 업비트 KRW 마켓 가격을 실시간으로 관리하고 5초마다 갱신
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getMappedMarketPrices, 
  getUpbitMarkets, 
  getUpbitTickers,
  transformTickersToObject,
  clearUpbitCache,
  getUpbitCacheStatus 
} from '../services/upbit';
import { logger } from '../utils/logger';

// 훅 설정
const HOOK_CONFIG = {
  REFRESH_INTERVAL: 30000, // 30초 (요청 부하 감소)
  ERROR_RETRY_INTERVAL: 30000, // 30초 (에러 시 재시도)
  MAX_RETRY_COUNT: 2, // 재시도 횟수 감소
  BACKGROUND_REFRESH_THRESHOLD: 60000 // 60초 (백그라운드 복귀 시 새로고침)
};

/**
 * 업비트 가격 관리 커스텀 훅
 * @param {object} options - 훅 옵션
 * @param {boolean} options.autoRefresh - 자동 새로고침 활성화 (기본: true)
 * @param {boolean} options.loadOnMount - 마운트 시 즉시 로드 (기본: true)
 * @param {Array<string>} options.markets - 특정 마켓만 조회 (기본: 모든 매핑된 마켓)
 * @returns {object} 업비트 가격 상태 및 제어 함수들
 */
export function useUpbitPrices(options = {}) {
  const {
    autoRefresh = true,
    loadOnMount = true,
    markets = null
  } = options;

  // 상태 관리
  const [prices, setPrices] = useState({});
  const [marketsData, setMarketsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // 타이머 및 레퍼런스
  const refreshTimerRef = useRef(null);
  const isInitializedRef = useRef(false);
  const abortControllerRef = useRef(null);
  const errorRetryTimerRef = useRef(null);

  /**
   * 업비트 가격 데이터 로드
   * @param {boolean} forceRefresh - 캐시 무시하고 강제 새로고침
   */
  const loadPrices = useCallback(async (forceRefresh = false) => {
    // 이미 로딩 중이면 중복 요청 방지
    if (loading && !forceRefresh) {
      return;
    }

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);

      logger.performance(`업비트 가격 로드 시작 (강제새로고침: ${forceRefresh})`);
      
      let priceData;
      
      if (markets && Array.isArray(markets)) {
        // 특정 마켓만 조회
        const tickers = await getUpbitTickers(markets);
        priceData = transformTickersToObject(tickers);
      } else {
        // 모든 매핑된 마켓 조회
        priceData = await getMappedMarketPrices();
      }
      
      // 요청이 취소되었는지 확인
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      setPrices(priceData);
      setLastUpdated(Date.now());
      setError(null);
      setRetryCount(0); // 성공 시 재시도 카운트 리셋
      
      logger.performance(`업비트 가격 로드 완료: ${Object.keys(priceData).length}개 마켓`);
      
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.debug('업비트 가격 요청이 취소되었습니다');
        return;
      }
      
      logger.error('업비트 가격 로드 실패:', err);
      setError(err.message || '업비트 가격을 불러올 수 없습니다');
      setRetryCount(prev => prev + 1);
      
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading, markets]);

  /**
   * 업비트 마켓 목록 로드
   */
  const loadMarkets = useCallback(async () => {
    try {
      logger.performance('업비트 마켓 목록 로드 중...');
      const marketsResponse = await getUpbitMarkets();
      setMarketsData(marketsResponse);
      logger.performance(`업비트 마켓 로드 완료: ${marketsResponse.length}개`);
    } catch (err) {
      logger.error('업비트 마켓 로드 실패:', err);
    }
  }, []);

  /**
   * 가격 강제 새로고침
   */
  const refresh = useCallback(async () => {
    logger.debug('업비트 가격 강제 새로고침 요청');
    await loadPrices(true);
  }, [loadPrices]);

  /**
   * 특정 마켓 가격 조회
   * @param {string} market - 마켓 코드 (예: 'KRW-BTC')
   * @returns {object|null} 해당 마켓의 가격 정보
   */
  const getPrice = useCallback((market) => {
    return prices[market] || null;
  }, [prices]);

  /**
   * 여러 마켓 가격 조회
   * @param {Array<string>} marketList - 마켓 코드 배열
   * @returns {object} 마켓별 가격 정보 객체
   */
  const getPrices = useCallback((marketList) => {
    if (!Array.isArray(marketList)) {
      return {};
    }
    
    const result = {};
    marketList.forEach(market => {
      if (prices[market]) {
        result[market] = prices[market];
      }
    });
    
    return result;
  }, [prices]);

  /**
   * 자동 새로고침 타이머 설정
   */
  const setupAutoRefresh = useCallback(() => {
    if (!autoRefresh) return;

    // 기존 타이머 제거
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    refreshTimerRef.current = setInterval(async () => {
      logger.performance('자동 업비트 가격 새로고침 (30초 경과)');
      await loadPrices(false); // 캐시 사용
    }, HOOK_CONFIG.REFRESH_INTERVAL);

    logger.debug('업비트 자동 새로고침 타이머 설정됨 (30초 간격)');
  }, [autoRefresh, loadPrices]);

  /**
   * 백그라운드에서 돌아왔을 때 필요 시 새로고침
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && lastUpdated) {
      const timeSinceUpdate = Date.now() - lastUpdated;
      
      // 60초 이상 지났으면 백그라운드 새로고침
      if (timeSinceUpdate > HOOK_CONFIG.BACKGROUND_REFRESH_THRESHOLD) {
        logger.debug('백그라운드에서 복귀, 업비트 가격 새로고침');
        loadPrices(false);
      }
    }
  }, [lastUpdated, loadPrices]);

  // 에러 재시도 로직
  useEffect(() => {
    if (error && retryCount < HOOK_CONFIG.MAX_RETRY_COUNT) {
      logger.debug(`업비트 API 에러 후 재시도 (${retryCount}/${HOOK_CONFIG.MAX_RETRY_COUNT})`);
      
      errorRetryTimerRef.current = setTimeout(() => {
        loadPrices(false);
      }, HOOK_CONFIG.ERROR_RETRY_INTERVAL);

      return () => {
        if (errorRetryTimerRef.current) {
          clearTimeout(errorRetryTimerRef.current);
        }
      };
    }
  }, [error, retryCount, loadPrices]);

  // 초기화 및 이벤트 리스너 설정
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      // 초기 로드
      if (loadOnMount) {
        loadMarkets();
        loadPrices(false);
      }
      
      // 자동 새로고침 설정
      setupAutoRefresh();
      
      // 백그라운드 복귀 감지
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      // 클린업
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      
      if (errorRetryTimerRef.current) {
        clearTimeout(errorRetryTimerRef.current);
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadOnMount, setupAutoRefresh, handleVisibilityChange, loadPrices, loadMarkets]);

  /**
   * 캐시 상태 정보 가져오기
   */
  const getCacheInfo = useCallback(() => {
    return getUpbitCacheStatus();
  }, []);

  /**
   * 데이터 나이 계산 (초 단위)
   */
  const getDataAge = useCallback(() => {
    if (!lastUpdated) return null;
    return Math.round((Date.now() - lastUpdated) / 1000);
  }, [lastUpdated]);

  /**
   * 가격 개수
   */
  const priceCount = Object.keys(prices).length;

  return {
    // 상태
    prices,
    markets: marketsData,
    loading,
    error,
    lastUpdated,
    retryCount,
    
    // 계산된 값
    priceCount,
    dataAgeSeconds: getDataAge(),
    hasData: priceCount > 0,
    
    // 제어 함수
    refresh,
    getPrice,
    getPrices,
    getCacheInfo,
    clearCache: clearUpbitCache,
    
    // 상태 확인
    isHealthy: !error && priceCount > 0,
    isStale: getDataAge() > 30, // 30초 이상 오래된 데이터
    
    // 디버그 정보
    debug: {
      autoRefresh,
      loadOnMount,
      markets: markets || 'all',
      hasTimer: !!refreshTimerRef.current,
      isInitialized: isInitializedRef.current
    }
  };
}

/**
 * 특정 마켓의 가격만 조회하는 훅
 * @param {string} market - 마켓 코드 (예: 'KRW-BTC')
 * @returns {object} 해당 마켓의 가격 정보
 */
export function useUpbitPrice(market) {
  const { getPrice, loading, error, lastUpdated } = useUpbitPrices({
    markets: [market],
    autoRefresh: true
  });
  
  return {
    price: getPrice(market),
    loading,
    error,
    lastUpdated
  };
}

/**
 * 업비트 가격 상태만 조회하는 훅 (자동 새로고침 없음)
 * @returns {object} 업비트 가격 상태 정보
 */
export function useUpbitPricesStatus() {
  const [cacheInfo, setCacheInfo] = useState(null);
  
  useEffect(() => {
    const updateCacheInfo = () => {
      setCacheInfo(getUpbitCacheStatus());
    };
    
    updateCacheInfo();
    const interval = setInterval(updateCacheInfo, 5000); // 5초마다 업데이트
    
    return () => clearInterval(interval);
  }, []);
  
  return cacheInfo;
}

export default useUpbitPrices;