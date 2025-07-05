/**
 * WebSocket Fallback Hook
 * WebSocket 연결 실패 시 REST API로 폴백하는 훅
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { logger } from '../utils/logger';

// Fallback 설정
const FALLBACK_CONFIG = {
  ENABLE_FALLBACK: false, // WebSocket 실패 시 REST API 사용 비활성화
  FALLBACK_INTERVAL: 5000, // 5초마다 REST API 호출
  MAX_FAILED_ATTEMPTS: 3, // 최대 실패 횟수
  RETRY_DELAY: 10000, // 10초 후 WebSocket 재시도
  CONNECTION_CHECK_INTERVAL: 30000 // 30초마다 연결 상태 확인
};

/**
 * WebSocket Fallback Hook
 * @param {Object} options - 설정 옵션
 * @param {boolean} options.wsConnected - WebSocket 연결 상태
 * @param {Function} options.restApiFetcher - REST API 호출 함수
 * @param {Array} options.symbols - 가져올 심볼 목록
 * @param {boolean} options.enabled - 폴백 활성화 여부
 * @returns {Object} 폴백 상태 및 제어 함수
 */
export function useWebSocketFallback({
  wsConnected = false,
  restApiFetcher = null,
  symbols = [],
  enabled = true
}) {
  const [isFallbackActive, setIsFallbackActive] = useState(false);
  const [fallbackAttempts, setFallbackAttempts] = useState(0);
  const [lastFallbackData, setLastFallbackData] = useState(null);

  const fallbackIntervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const connectionCheckRef = useRef(null);
  const mountedRef = useRef(true);

  // REST API를 통한 데이터 가져오기
  const fetchRestData = useCallback(async () => {
    if (!restApiFetcher || !symbols.length || !mountedRef.current) {
      return;
    }

    try {
      logger.debug('WebSocket Fallback: REST API 데이터 가져오기 시작');
      
      const results = await Promise.allSettled(
        symbols.map(symbol => restApiFetcher(symbol))
      );

      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        setLastFallbackData(new Date().toLocaleTimeString());
        setFallbackAttempts(0); // 성공 시 실패 카운트 리셋
        
        logger.debug(`WebSocket Fallback: REST API 성공 (${successCount}/${results.length})`);
      } else {
        setFallbackAttempts(prev => prev + 1);
        logger.warn(`WebSocket Fallback: REST API 모두 실패 (${failedCount}/${results.length})`);
      }

    } catch (error) {
      setFallbackAttempts(prev => prev + 1);
      logger.error('WebSocket Fallback: REST API 오류:', error);
    }
  }, [restApiFetcher, symbols]);

  // Fallback 활성화
  const activateFallback = useCallback(() => {
    if (!enabled || !FALLBACK_CONFIG.ENABLE_FALLBACK || isFallbackActive || !restApiFetcher) {
      return;
    }

    logger.info('WebSocket Fallback: REST API 폴백 활성화');
    setIsFallbackActive(true);

    // 즉시 한 번 실행
    fetchRestData();

    // 정기적으로 REST API 호출
    fallbackIntervalRef.current = setInterval(() => {
      if (mountedRef.current && fallbackAttempts < FALLBACK_CONFIG.MAX_FAILED_ATTEMPTS) {
        fetchRestData();
      } else if (fallbackAttempts >= FALLBACK_CONFIG.MAX_FAILED_ATTEMPTS) {
        logger.error('WebSocket Fallback: 최대 실패 횟수 초과, 폴백 중단');
        deactivateFallback();
      }
    }, FALLBACK_CONFIG.FALLBACK_INTERVAL);

  }, [enabled, isFallbackActive, restApiFetcher, fetchRestData, fallbackAttempts]);

  // Fallback 비활성화
  const deactivateFallback = useCallback(() => {
    if (!isFallbackActive) {
      return;
    }

    logger.info('WebSocket Fallback: REST API 폴백 비활성화');
    setIsFallbackActive(false);
    setFallbackAttempts(0);

    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }

  }, [isFallbackActive]);

  // WebSocket 재연결 시도
  const retryWebSocket = useCallback((retryFunction) => {
    if (!retryFunction || retryTimeoutRef.current) {
      return;
    }

    logger.info(`WebSocket Fallback: ${FALLBACK_CONFIG.RETRY_DELAY / 1000}초 후 WebSocket 재연결 시도`);
    
    retryTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        logger.info('WebSocket Fallback: WebSocket 재연결 시도 실행');
        retryFunction();
        retryTimeoutRef.current = null;
      }
    }, FALLBACK_CONFIG.RETRY_DELAY);

  }, []);

  // WebSocket 연결 상태 감지
  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (wsConnected) {
      // WebSocket 연결됨 - Fallback 비활성화
      deactivateFallback();
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
    } else {
      // WebSocket 연결 안됨 - Fallback 활성화
      const activateDelay = setTimeout(() => {
        if (mountedRef.current && !wsConnected) {
          activateFallback();
        }
      }, 2000); // 2초 지연 후 활성화

      return () => clearTimeout(activateDelay);
    }

  }, [wsConnected, enabled, activateFallback, deactivateFallback]);

  // 주기적 연결 상태 확인
  useEffect(() => {
    if (!enabled) {
      return;
    }

    connectionCheckRef.current = setInterval(() => {
      if (!wsConnected && !isFallbackActive && restApiFetcher) {
        logger.warn('WebSocket Fallback: 연결 끊김 감지, 폴백 활성화');
        activateFallback();
      }
    }, FALLBACK_CONFIG.CONNECTION_CHECK_INTERVAL);

    return () => {
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
    };

  }, [enabled, wsConnected, isFallbackActive, restApiFetcher, activateFallback]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
    };
  }, []);

  return {
    isFallbackActive,
    fallbackAttempts,
    lastFallbackData,
    activateFallback,
    deactivateFallback,
    retryWebSocket,
    
    // 상태 정보
    config: FALLBACK_CONFIG,
    isEnabled: enabled,
    hasRestFetcher: !!restApiFetcher,
    symbolCount: symbols.length
  };
}

export default useWebSocketFallback;