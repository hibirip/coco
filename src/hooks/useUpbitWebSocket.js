/**
 * 업비트 WebSocket 훅
 * 실시간 가격 데이터를 위한 WebSocket 연결 및 관리
 * 업비트 API는 Binary 데이터를 사용하므로 Blob 처리 필요
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePrices } from '../contexts/PriceContext';

// WebSocket 설정
const UPBIT_WS_CONFIG = {
  URL: 'wss://api.upbit.com/websocket/v1',
  RECONNECT_INTERVAL: 3000, // 3초 재연결 간격
  MAX_RECONNECT_ATTEMPTS: 5, // 다시 5회로 복원
  CONNECTION_TIMEOUT: 10000, // 10초로 복원
  USE_MOCK: false, // Mock WebSocket 비활성화 (REST API만 사용)
  MOCK_INTERVAL: 30000 // Mock 데이터 30초 간격으로 변경
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
 * @returns {Object} WebSocket 상태 및 제어 함수
 */
export function useUpbitWebSocket(options = {}) {
  const {
    enabled = true,
    markets = []
  } = options;

  // PriceContext 훅 사용
  const {
    ALL_UPBIT_MARKETS,
    updateUpbitPrice,
    addError,
    clearErrors,
    setUpbitConnectionStatus,
    setUpbitConnecting
  } = usePrices();

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
  const mockDataIntervalRef = useRef(null);

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
    console.error('🔴 업비트 WebSocket:', message);
    addError(`업비트 WebSocket: ${message}`);
  }, [addError]);

  /**
   * 성공 로깅
   */
  const logSuccess = useCallback((message) => {
    console.log('🟢 업비트 WebSocket:', message);
  }, []);

  /**
   * Mock 데이터 생성
   */
  const generateMockUpbitData = useCallback((market) => {
    // 비트겟 Mock 데이터와 연동된 가격 (환율 1380 기준 + 김치프리미엄)
    const basePrice = {
      'KRW-BTC': 60500000,  // Bitget $42,750 * 1380 * 1.024 (2.4% 김프)
      'KRW-ETH': 3480000,   // Bitget $2,465 * 1380 * 1.023 (2.3% 김프)
      'KRW-XRP': 730,       // Bitget $0.514 * 1380 * 1.03 (3% 김프)
      'KRW-ADA': 535,       // Bitget $0.377 * 1380 * 1.029 (2.9% 김프)
      'KRW-SOL': 132000,    // Bitget $94.2 * 1380 * 1.015 (1.5% 김프)
      'KRW-DOT': 8700,      // Bitget $6.16 * 1380 * 1.024 (2.4% 김프)
      'KRW-LINK': 20300,    // Bitget $14.35 * 1380 * 1.025 (2.5% 김프)
      'KRW-MATIC': 1490,    // 약 2% 김프
      'KRW-UNI': 9500,      // 약 2.2% 김프
      'KRW-AVAX': 49000     // 약 2% 김프
    }[market] || 10000;

    const variance = 0.01; // 1% 변동 (작게)
    const randomChange = (Math.random() - 0.5) * variance;
    const currentPrice = basePrice * (1 + randomChange);
    const change = basePrice * (Math.random() - 0.5) * 0.06; // 6% 범위 변동
    const changePercent = (change / basePrice) * 100;

    return {
      market,
      trade_price: currentPrice,
      change,
      change_rate: changePercent / 100,
      change_percent: changePercent,
      acc_trade_volume_24h: Math.random() * 1000000,
      high_price: currentPrice * 1.06,
      low_price: currentPrice * 0.94,
      timestamp: Date.now(),
      source: 'mock-upbit-ws'
    };
  }, []);

  /**
   * Mock 데이터 시작
   */
  const startMockData = useCallback(() => {
    if (mockDataIntervalRef.current) {
      clearInterval(mockDataIntervalRef.current);
    }

    updateConnectionState(WS_STATES.CONNECTED);
    logSuccess('Mock 업비트 WebSocket 시뮬레이션 시작');

    mockDataIntervalRef.current = setInterval(() => {
      marketsToSubscribe.forEach(market => {
        const mockData = generateMockUpbitData(market);
        updateUpbitPrice(market, mockData);
        setDataReceived(prev => prev + 1);
      });
      setMessageCount(prev => prev + 1);
      setLastDataTime(Date.now());
    }, UPBIT_WS_CONFIG.MOCK_INTERVAL);

    // 첫 번째 데이터 즉시 전송
    setTimeout(() => {
      marketsToSubscribe.forEach(market => {
        const mockData = generateMockUpbitData(market);
        updateUpbitPrice(market, mockData);
        setDataReceived(prev => prev + 1);
      });
      setLastDataTime(Date.now());
      logSuccess(`Mock 업비트 데이터 생성 시작: ${marketsToSubscribe.length}개 마켓`);
    }, 500);
  }, [marketsToSubscribe, updateConnectionState, logSuccess, generateMockUpbitData, updateUpbitPrice]);

  /**
   * Mock 데이터 중지
   */
  const stopMockData = useCallback(() => {
    if (mockDataIntervalRef.current) {
      clearInterval(mockDataIntervalRef.current);
      mockDataIntervalRef.current = null;
    }
    updateConnectionState(WS_STATES.DISCONNECTED);
    logSuccess('Mock 업비트 WebSocket 연결 해제');
  }, [updateConnectionState, logSuccess]);

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
        logSuccess(`구독 메시지 전송: ${marketsToSubscribe.length}개 마켓`);
        console.log('📡 업비트 구독 메시지:', subscribeMessage);
        
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
          console.log(`🔍 업비트 데이터 수신 (${data.code}):`, {
            trade_price: data.trade_price,
            tickerData,
            updateUpbitPriceType: typeof updateUpbitPrice
          });
        }

        // 첫 번째 데이터 수신 시 로그
        if (dataReceived === 0) {
          logSuccess(`첫 실시간 데이터 수신: ${data.code} = ₩${data.trade_price?.toLocaleString()}`);
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
        console.log('📡 업비트 WebSocket 메시지:', data);
      } catch (error) {
        console.log('📡 업비트 WebSocket 텍스트:', event.data);
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

    // Mock 모드 사용 시
    if (UPBIT_WS_CONFIG.USE_MOCK) {
      logSuccess('Mock 모드로 업비트 WebSocket 시뮬레이션 시작');
      startMockData();
      return;
    }

    updateConnectionState(WS_STATES.CONNECTING);
    logSuccess('업비트 WebSocket 연결 시도...');

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
      
      // 실제 WebSocket 연결 실패 시 Mock 모드로 전환
      if (!UPBIT_WS_CONFIG.USE_MOCK) {
        logSuccess('실제 업비트 WebSocket 연결 실패, Mock 모드로 전환');
        UPBIT_WS_CONFIG.USE_MOCK = true;
        setReconnectAttempts(0);
        setTimeout(() => {
          connect();
        }, 2000);
      }
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
    // Mock 데이터 중지
    stopMockData();
    
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
  }, [stopMockData, updateConnectionState, logSuccess]);

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