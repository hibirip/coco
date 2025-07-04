/**
 * useExchangeRate 커스텀 훅
 * USD/KRW 환율을 관리하고 5시간마다 자동 갱신
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getUSDKRWRate, refreshExchangeRate, getExchangeRateCacheStatus } from '../services/exchangeRate';

// 훅 설정
const HOOK_CONFIG = {
  AUTO_REFRESH_INTERVAL: 5 * 60 * 60 * 1000, // 5시간 (밀리초)
  ERROR_RETRY_INTERVAL: 5 * 60 * 1000, // 5분 (에러 시 재시도)
  BACKGROUND_REFRESH_THRESHOLD: 30 * 60 * 1000 // 30분 (백그라운드 새로고침 임계값)
};

/**
 * 환율 관리 커스텀 훅
 * @param {object} options - 훅 옵션
 * @param {boolean} options.autoRefresh - 자동 새로고침 활성화 (기본: true)
 * @param {boolean} options.loadOnMount - 마운트 시 즉시 로드 (기본: true)
 * @returns {object} 환율 상태 및 제어 함수들
 */
export function useExchangeRate(options = {}) {
  const {
    autoRefresh = true,
    loadOnMount = true
  } = options;

  // 상태 관리
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [source, setSource] = useState(null);

  // 타이머 및 레퍼런스
  const refreshTimerRef = useRef(null);
  const isInitializedRef = useRef(false);
  const abortControllerRef = useRef(null);

  /**
   * 환율 데이터 로드
   * @param {boolean} forceRefresh - 강제 새로고침 여부
   */
  const loadExchangeRate = useCallback(async (forceRefresh = false) => {
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

      console.log(`🔄 환율 로드 시작 (강제새로고침: ${forceRefresh})`);
      
      const rateData = await getUSDKRWRate(forceRefresh);
      
      // 요청이 취소되었는지 확인
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      setExchangeRate(rateData.rate);
      setLastUpdated(rateData.timestamp);
      setSource(rateData.source);
      setError(null);
      
      console.log(`✅ 환율 로드 완료: ${rateData.rate} (${rateData.source})`);
      
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('환율 요청이 취소되었습니다');
        return;
      }
      
      console.error('환율 로드 실패:', err);
      setError(err.message || '환율을 불러올 수 없습니다');
      
      // 에러 시에도 기본값 설정
      if (!exchangeRate) {
        setExchangeRate(1320); // 기본값
        setSource('error_fallback');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading, exchangeRate]);

  /**
   * 환율 강제 새로고침
   */
  const forceRefresh = useCallback(async () => {
    console.log('🔄 환율 강제 새로고침 요청');
    await loadExchangeRate(true);
  }, [loadExchangeRate]);

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
      console.log('⏰ 자동 환율 새로고침 (5시간 경과)');
      await loadExchangeRate(true);
    }, HOOK_CONFIG.AUTO_REFRESH_INTERVAL);

    console.log('⏰ 자동 새로고침 타이머 설정됨 (5시간 간격)');
  }, [autoRefresh, loadExchangeRate]);

  /**
   * 백그라운드에서 돌아왔을 때 필요 시 새로고침
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && lastUpdated) {
      const timeSinceUpdate = Date.now() - lastUpdated;
      
      // 30분 이상 지났으면 백그라운드 새로고침
      if (timeSinceUpdate > HOOK_CONFIG.BACKGROUND_REFRESH_THRESHOLD) {
        console.log('👁️ 백그라운드에서 복귀, 환율 새로고침');
        loadExchangeRate(false); // 캐시 먼저 확인
      }
    }
  }, [lastUpdated, loadExchangeRate]);

  // 초기화 및 이벤트 리스너 설정
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      // 초기 로드
      if (loadOnMount) {
        loadExchangeRate(false);
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
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadOnMount, setupAutoRefresh, handleVisibilityChange, loadExchangeRate]);

  // 에러 발생 시 재시도 로직
  useEffect(() => {
    if (error && autoRefresh) {
      const retryTimer = setTimeout(() => {
        console.log('🔄 에러 후 자동 재시도');
        loadExchangeRate(false);
      }, HOOK_CONFIG.ERROR_RETRY_INTERVAL);

      return () => clearTimeout(retryTimer);
    }
  }, [error, autoRefresh, loadExchangeRate]);

  /**
   * 캐시 상태 정보 가져오기
   */
  const getCacheInfo = useCallback(() => {
    return getExchangeRateCacheStatus();
  }, []);

  /**
   * 환율이 유효한지 확인
   */
  const isRateValid = useCallback(() => {
    return exchangeRate && typeof exchangeRate === 'number' && exchangeRate > 0;
  }, [exchangeRate]);

  /**
   * 데이터 나이 계산 (분 단위)
   */
  const getDataAge = useCallback(() => {
    if (!lastUpdated) return null;
    return Math.round((Date.now() - lastUpdated) / 60000);
  }, [lastUpdated]);

  return {
    // 상태
    exchangeRate,
    loading,
    error,
    lastUpdated,
    source,
    
    // 계산된 값
    isValid: isRateValid(),
    dataAgeMinutes: getDataAge(),
    
    // 제어 함수
    refresh: forceRefresh,
    getCacheInfo,
    
    // 상태 확인
    isFromCache: source?.includes('cache') || false,
    isFromAPI: source === 'api' || source === 'exchangerate-api',
    isFromFallback: source === 'fallback' || source === 'emergency_fallback',
    
    // 디버그 정보
    debug: {
      autoRefresh,
      loadOnMount,
      hasTimer: !!refreshTimerRef.current,
      isInitialized: isInitializedRef.current
    }
  };
}

/**
 * 간단한 환율 조회 훅 (읽기 전용)
 * @returns {number|null} 현재 환율
 */
export function useCurrentExchangeRate() {
  const { exchangeRate } = useExchangeRate({ 
    autoRefresh: false, 
    loadOnMount: true 
  });
  
  return exchangeRate;
}

/**
 * 환율 상태만 조회하는 훅 (로딩 없음)
 * @returns {object} 환율 상태 정보
 */
export function useExchangeRateStatus() {
  const [cacheInfo, setCacheInfo] = useState(null);
  
  useEffect(() => {
    const updateCacheInfo = () => {
      setCacheInfo(getExchangeRateCacheStatus());
    };
    
    updateCacheInfo();
    const interval = setInterval(updateCacheInfo, 60000); // 1분마다 업데이트
    
    return () => clearInterval(interval);
  }, []);
  
  return cacheInfo;
}

export default useExchangeRate;