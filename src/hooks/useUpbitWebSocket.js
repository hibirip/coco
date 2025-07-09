/**
 * 업비트 WebSocket 훅
 * 실시간 가격 데이터를 위한 WebSocket 연결 및 관리
 * 업비트 API는 Binary 데이터를 사용하므로 Blob 처리 필요
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { logger } from '../utils/logger';

// 환경 감지 (hostname 기반)
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// WebSocket 설정
const UPBIT_WS_CONFIG = {
  // 배포 환경에서는 Render 프록시 서버 사용 (불변)
  URL: isDevelopment 
    ? 'wss://api.upbit.com/websocket/v1' 
    : 'wss://coco-proxy-server.onrender.com/ws/upbit',
  RECONNECT_INTERVAL: 3000, // 3초 재연결 간격
  MAX_RECONNECT_ATTEMPTS: 5, // 다시 5회로 복원
  CONNECTION_TIMEOUT: 10000 // 10초로 복원
};

// WebSocket 연결 상태
const WS_STATES = {
  DISCONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2,
  RECONNECTING: 3,
  FAILED: 4
};

// 업비트 마켓 코드 (KRW 마켓만)
const UPBIT_MARKETS = [
  'KRW-BTC',
  'KRW-ETH', 
  'KRW-XRP',
  'KRW-ADA',
  'KRW-SOL',
  'KRW-DOT',
  'KRW-LINK',
  'KRW-MATIC',
  'KRW-UNI',
  'KRW-AVAX'
];

/**
 * 업비트 WebSocket 훅
 * @param {Object} options - 연결 옵션
 * @param {boolean} options.enabled - WebSocket 연결 활성화 여부
 * @param {Array} options.markets - 구독할 마켓 배열
 * @param {Array} options.ALL_UPBIT_MARKETS - 전체 업비트 마켓 배열
 * @param {Function} options.updateUpbitPrice - 업비트 가격 업데이트 함수
 * @param {Function} options.addError - 에러 추가 함수
 * @param {Function} options.clearErrors - 에러 클리어 함수
 * @param {Function} options.setUpbitConnectionStatus - 연결 상태 설정 함수
 * @param {Function} options.setUpbitConnecting - 연결 중 상태 설정 함수
 * @returns {Object} WebSocket 상태 및 제어 함수
 */
export function useUpbitWebSocket(options = {}) {
  const {
    enabled = true,
    markets = [],
    ALL_UPBIT_MARKETS = [],
    updateUpbitPrice,
    addError,
    clearErrors,
    setUpbitConnectionStatus,
    setUpbitConnecting
  } = options;

  // 실제 구독할 마켓 결정 (전달된 markets 또는 ALL_UPBIT_MARKETS)
  const marketsToSubscribe = markets.length > 0 ? markets : ALL_UPBIT_MARKETS;

  // 상태 관리
  const [connectionState, setConnectionState] = useState(WS_STATES.DISCONNECTED);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [dataReceived, setDataReceived] = useState(0);
  const [lastDataTime, setLastDataTime] = useState(null);

  // 참조 변수
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const connectionTimeoutRef = useRef(null);

  /**
   * 연결 상태 업데이트
   */
  const updateConnectionState = useCallback((state) => {
    setConnectionState(state);
    
    // PriceContext에도 연결 상태 업데이트
    switch (state) {
      case WS_STATES.CONNECTED:
        setUpbitConnectionStatus(true);
        setUpbitConnecting(false);
        break;
      case WS_STATES.CONNECTING:
      case WS_STATES.RECONNECTING:
        setUpbitConnecting(true);
        break;
      case WS_STATES.DISCONNECTED:
      case WS_STATES.FAILED:
        setUpbitConnectionStatus(false);
        setUpbitConnecting(false);
        break;
    }
  }, [setUpbitConnectionStatus, setUpbitConnecting]);

  /**
   * 에러 로깅
   */
  const logError = useCallback((message) => {
    logger.error('업비트 WebSocket:', message);
    addError(`업비트 WebSocket: ${message}`);
  }, [addError]);

  /**
   * 성공 로깅
   */
  const logSuccess = useCallback((message) => {
    logger.websocket('업비트:', message);
  }, []);

  // Mock 데이터는 절대 사용하지 않음 - 실제 데이터만 사용

  // Mock 데이터 함수들은 모두 제거됨 - 실제 데이터만 사용

  /**
   * 구독 메시지 전송
   */
  const sendSubscribe = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        // 업비트 WebSocket 구독 메시지 (JSON -> Binary)
        const subscribeMessage = [
          {
            ticket: 'coco-upbit-ws',
            type: 'ticker',
            codes: marketsToSubscribe,
            isOnlySnapshot: false,
            isOnlyRealtime: true
          }
        ];

        const messageString = JSON.stringify(subscribeMessage);
        wsRef.current.send(messageString);
        logger.websocket(`구독 메시지 전송: ${marketsToSubscribe.length}개 마켓`);
        logger.debug('업비트 구독 메시지:', subscribeMessage);
        
      } catch (error) {
        logError(`구독 실패: ${error.message}`);
      }
    }
  }, [marketsToSubscribe, logSuccess, logError]);

  /**
   * Binary 데이터 처리
   */
  const processBinaryData = useCallback(async (blob) => {
    try {
      const text = await blob.text();
      const data = JSON.parse(text);
      
      if (data.type === 'ticker') {
        // 업비트 ticker 데이터 처리
        const tickerData = {
          market: data.code,
          trade_price: data.trade_price,
          change: data.change_price,
          change_rate: data.change_rate,
          change_percent: data.change_rate * 100,
          acc_trade_volume_24h: data.acc_trade_volume_24h,
          high_price: data.high_price,
          low_price: data.low_price,
          timestamp: data.timestamp,
          source: 'upbit-ws'
        };

        // PriceContext 업데이트
        updateUpbitPrice(data.code, tickerData);
        setDataReceived(prev => prev + 1);
        setLastDataTime(Date.now());

        // 디버깅: 첫 번째 코인만 로그 출력
        if (data.code === 'KRW-BTC') {
          logger.debug(`업비트 데이터 수신 (${data.code}):`, {
            trade_price: data.trade_price,
            tickerData
          });
        }

        // 첫 번째 데이터 수신 시 로그
        if (dataReceived === 0) {
          logger.info(`첫 업비트 데이터 수신: ${data.code} = ₩${data.trade_price?.toLocaleString()}`);
        }
      }
    } catch (error) {
      logError(`Binary 데이터 처리 실패: ${error.message}`);
    }
  }, [updateUpbitPrice, logSuccess, logError, dataReceived]);

  /**
   * WebSocket 메시지 처리
   */
  const handleMessage = useCallback((event) => {
    setMessageCount(prev => prev + 1);

    // 업비트는 Binary 데이터를 사용
    if (event.data instanceof Blob) {
      processBinaryData(event.data);
    } else {
      // 일반 텍스트 메시지 (연결 확인 등)
      try {
        const data = JSON.parse(event.data);
        logger.debug('업비트 WebSocket 메시지:', data);
      } catch (error) {
        logger.debug('업비트 WebSocket 텍스트:', event.data);
      }
    }
  }, [processBinaryData]);

  /**
   * WebSocket 연결
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || connectionState === WS_STATES.CONNECTED) {
      logSuccess('이미 연결되어 있습니다');
      return;
    }

    if (connectionState === WS_STATES.CONNECTING) {
      return;
    }

    // Mock 모드는 사용하지 않음 - 실제 데이터만 사용

    updateConnectionState(WS_STATES.CONNECTING);
    logSuccess(`업비트 WebSocket 연결 시도: ${UPBIT_WS_CONFIG.URL}`);
    
    // 배포 환경에서 연결 시도 로깅
    console.log('[Upbit WebSocket] 연결 시도:', {
      url: UPBIT_WS_CONFIG.URL,
      isDevelopment,
      environment: isDevelopment ? 'development' : 'production',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      import_meta_env: {
        DEV: import.meta.env.DEV,
        MODE: import.meta.env.MODE,
        PROD: import.meta.env.PROD
      },
      timestamp: new Date().toISOString()
    });

    try {
      wsRef.current = new WebSocket(UPBIT_WS_CONFIG.URL);

      // 연결 타임아웃 설정
      connectionTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
          logError('연결 타임아웃');
          handleReconnect();
        }
      }, UPBIT_WS_CONFIG.CONNECTION_TIMEOUT);

      // 연결 성공
      wsRef.current.onopen = () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        updateConnectionState(WS_STATES.CONNECTED);
        setReconnectAttempts(0);
        clearErrors();
        logSuccess('업비트 WebSocket 연결 성공');
        
        // 배포 환경에서 연결 상태 확인
        if (!import.meta.env.DEV) {
          console.log('[Production] Upbit WebSocket connected:', {
            url: UPBIT_WS_CONFIG.URL,
            markets: marketsToSubscribe.length,
            timestamp: new Date().toISOString()
          });
        }

        // 구독 메시지 전송
        setTimeout(sendSubscribe, 100);
      };

      // 메시지 수신
      wsRef.current.onmessage = handleMessage;

      // 연결 종료
      wsRef.current.onclose = (event) => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        updateConnectionState(WS_STATES.DISCONNECTED);
        
        if (event.wasClean) {
          logSuccess(`연결 정상 종료 (코드: ${event.code})`);
        } else {
          logError(`연결 비정상 종료 (코드: ${event.code})`);
          handleReconnect();
        }
      };

      // 에러 처리
      wsRef.current.onerror = (error) => {
        logError(`WebSocket 에러: ${error.message || 'Unknown error'}`);
        handleReconnect();
      };

    } catch (error) {
      logError(`연결 생성 실패: ${error.message}`);
      handleReconnect();
    }
  }, [connectionState, updateConnectionState, sendSubscribe, handleMessage, clearErrors, logSuccess, logError, startMockData]);

  /**
   * 재연결 처리
   */
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts >= UPBIT_WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      updateConnectionState(WS_STATES.FAILED);
      logError(`최대 재시도 횟수 (${UPBIT_WS_CONFIG.MAX_RECONNECT_ATTEMPTS}회) 초과`);
      
      // WebSocket 연결 실패 시 에러 상태 유지 (Mock 사용하지 않음)
      logError('업비트 WebSocket 연결 실패 - 실제 데이터만 사용');
      return;
    }

    updateConnectionState(WS_STATES.RECONNECTING);
    
    logSuccess(`${UPBIT_WS_CONFIG.RECONNECT_INTERVAL}ms 후 재연결 시도 (${reconnectAttempts + 1}/${UPBIT_WS_CONFIG.MAX_RECONNECT_ATTEMPTS})`);
    
    setReconnectAttempts(prev => prev + 1);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, UPBIT_WS_CONFIG.RECONNECT_INTERVAL);
  }, [reconnectAttempts, updateConnectionState, connect, logSuccess, logError]);

  /**
   * WebSocket 연결 해제
   */
  const disconnect = useCallback(() => {
    // 모든 타이머 정리
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    // WebSocket 연결 닫기
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }

    updateConnectionState(WS_STATES.DISCONNECTED);
    setReconnectAttempts(0);
    logSuccess('업비트 WebSocket 연결 해제');
  }, [updateConnectionState, logSuccess]);

  /**
   * 수동 재연결
   */
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  /**
   * WebSocket 연결 관리
   */
  useEffect(() => {
    if (enabled && marketsToSubscribe.length > 0) {
      connect();
    } else {
      disconnect();
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      disconnect();
    };
  }, [enabled, marketsToSubscribe.length]); // connect, disconnect 제거

  // 상태 및 제어 함수 반환
  return {
    // 연결 상태
    isConnected: connectionState === WS_STATES.CONNECTED,
    isConnecting: connectionState === WS_STATES.CONNECTING,
    isReconnecting: connectionState === WS_STATES.RECONNECTING,
    isFailed: connectionState === WS_STATES.FAILED,
    connectionState,
    
    // 통계
    reconnectAttempts,
    messageCount,
    dataReceived,
    lastDataTime,
    
    // 설정
    marketsToSubscribe: markets,
    
    // 제어 함수
    connect,
    disconnect,
    reconnect,
    
    // WebSocket 상태 (디버깅용)
    readyState: wsRef.current?.readyState || WebSocket.CLOSED
  };
}