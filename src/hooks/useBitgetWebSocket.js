/**
 * Bitget WebSocket 훅
 * 실시간 가격 데이터를 위한 WebSocket 연결 및 관리
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePrices } from '../contexts/PriceContext';

// WebSocket 설정
const BITGET_WS_CONFIG = {
  URL: 'wss://ws.bitget.com/spot/v1/stream', // Spot market WebSocket URL
  FALLBACK_URL: 'wss://stream.binance.com:9443/ws/btcusdt@ticker', // Fallback for testing
  USE_FALLBACK: false, // 개발/테스트 모드에서 true로 설정
  USE_MOCK: false, // 실제 WebSocket 연결 사용
  RECONNECT_INTERVAL: 1000, // 초기 재연결 간격 (1초)
  MAX_RECONNECT_ATTEMPTS: 5, // 다시 5회로 복원
  PING_INTERVAL: 30000, // 30초마다 ping
  CONNECTION_TIMEOUT: 15000, // 15초로 복원
  MESSAGE_TIMEOUT: 10000 // 10초로 복원
};

// WebSocket 연결 상태
const WS_STATES = {
  DISCONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2,
  RECONNECTING: 3,
  FAILED: 4
};

/**
 * Bitget WebSocket 훅
 * @param {Object} options - 연결 옵션
 * @param {boolean} options.enabled - WebSocket 연결 활성화 여부
 * @param {Array} options.symbols - 구독할 심볼 배열
 * @returns {Object} WebSocket 상태 및 제어 함수
 */
export function useBitgetWebSocket(options = {}) {
  const {
    enabled = true,
    symbols = []
  } = options;

  // PriceContext 훅 사용
  const {
    ALL_SYMBOLS,
    setConnectionStatus,
    setConnecting,
    updatePrice,
    addError,
    clearErrors
  } = usePrices();

  // 상태 관리
  const [connectionState, setConnectionState] = useState(WS_STATES.DISCONNECTED);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastPingTime, setLastPingTime] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [dataReceived, setDataReceived] = useState(0);

  // 참조 변수
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const connectionTimeoutRef = useRef(null);
  const subscribeTimeoutRef = useRef(null);
  const mockDataIntervalRef = useRef(null);

  // 구독할 심볼 결정 (전달된 symbols 또는 기본 ALL_SYMBOLS)
  const symbolsToSubscribe = symbols.length > 0 ? symbols : ALL_SYMBOLS;

  /**
   * 연결 상태 업데이트
   */
  const updateConnectionState = useCallback((state) => {
    setConnectionState(state);
    
    // PriceContext에도 연결 상태 업데이트
    switch (state) {
      case WS_STATES.CONNECTED:
        setConnectionStatus(true);
        setConnecting(false);
        break;
      case WS_STATES.CONNECTING:
      case WS_STATES.RECONNECTING:
        setConnecting(true);
        break;
      case WS_STATES.DISCONNECTED:
      case WS_STATES.FAILED:
        setConnectionStatus(false);
        setConnecting(false);
        break;
    }
  }, [setConnectionStatus, setConnecting]);

  /**
   * 에러 로깅
   */
  const logError = useCallback((message) => {
    console.error('🔴 Bitget WebSocket:', message);
    addError(`WebSocket: ${message}`);
  }, [addError]);

  /**
   * 성공 로깅
   */
  const logSuccess = useCallback((message) => {
    console.log('🟢 Bitget WebSocket:', message);
  }, []);

  /**
   * Mock 데이터 생성
   */
  const generateMockData = useCallback((symbol) => {
    const basePrice = {
      'BTCUSDT': 108000,  // 현재 실제 가격에 가깝게
      'ETHUSDT': 2516,    // 현재 실제 가격에 가깝게
      'XRPUSDT': 2.22,    // 현재 실제 가격에 가깝게
      'ADAUSDT': 0.85,
      'SOLUSDT': 148,     // 현재 실제 가격에 가깝게
      'DOTUSDT': 3.35,    // 현재 실제 가격에 가깝게
      'LINKUSDT': 13.2,   // 현재 실제 가격에 가깝게
      'MATICUSDT': 0.48,
      'UNIUSDT': 6.98,    // 현재 실제 가격에 가깝게
      'AVAXUSDT': 17.86   // 현재 실제 가격에 가깝게
    }[symbol] || 100;

    const variance = 0.02; // 2% 변동
    const randomChange = (Math.random() - 0.5) * variance;
    const currentPrice = basePrice * (1 + randomChange);
    const change24h = basePrice * (Math.random() - 0.5) * 0.1; // 10% 범위 변동
    const changePercent24h = (change24h / basePrice) * 100;

    return {
      symbol,
      price: parseFloat(currentPrice.toFixed(symbol.includes('USD') && !symbol.includes('BTC') && !symbol.includes('ETH') ? 4 : 2)),
      change24h: parseFloat(change24h.toFixed(2)),
      changePercent24h: parseFloat(changePercent24h.toFixed(2)),
      volume24h: parseFloat((Math.random() * 1000000).toFixed(2)),
      high24h: parseFloat((currentPrice * 1.05).toFixed(2)),
      low24h: parseFloat((currentPrice * 0.95).toFixed(2)),
      bid: parseFloat((currentPrice * 0.999).toFixed(2)),
      ask: parseFloat((currentPrice * 1.001).toFixed(2)),
      timestamp: Date.now(),
      source: 'mock-ws'
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
    logSuccess('Mock WebSocket 연결 시뮬레이션 시작');

    mockDataIntervalRef.current = setInterval(() => {
      symbolsToSubscribe.forEach(symbol => {
        const mockData = generateMockData(symbol);
        updatePrice(symbol, mockData);
        setDataReceived(prev => prev + 1);
      });
      setMessageCount(prev => prev + 1);
    }, 12000); // 12초마다 데이터 업데이트

    // 첫 번째 데이터 즉시 전송
    setTimeout(() => {
      symbolsToSubscribe.forEach(symbol => {
        const mockData = generateMockData(symbol);
        updatePrice(symbol, mockData);
        setDataReceived(prev => prev + 1);
      });
      logSuccess(`Mock 데이터 생성 시작: ${symbolsToSubscribe.length}개 심볼`);
    }, 500);
  }, [symbolsToSubscribe, updateConnectionState, logSuccess, generateMockData, updatePrice]);

  /**
   * Mock 데이터 중지
   */
  const stopMockData = useCallback(() => {
    if (mockDataIntervalRef.current) {
      clearInterval(mockDataIntervalRef.current);
      mockDataIntervalRef.current = null;
    }
    updateConnectionState(WS_STATES.DISCONNECTED);
    logSuccess('Mock WebSocket 연결 해제');
  }, [updateConnectionState, logSuccess]);

  /**
   * Ping 메시지 전송
   */
  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        const pingMessage = {
          op: 'ping'
        };
        wsRef.current.send(JSON.stringify(pingMessage));
        setLastPingTime(Date.now());
        console.log('📡 Bitget WebSocket Ping 전송');
      } catch (error) {
        logError(`Ping 전송 실패: ${error.message}`);
      }
    }
  }, [logError]);

  /**
   * 구독 메시지 전송
   */
  const sendSubscribe = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        // Bitget Spot WebSocket 구독 메시지 형식 (올바른 형식으로 수정)
        const subscribeMessage = {
          op: 'subscribe',
          args: symbolsToSubscribe.map(symbol => ({
            instType: 'SPOT', // SPOT으로 변경
            channel: 'ticker',
            instId: symbol // BTCUSDT 그대로 사용
          }))
        };

        wsRef.current.send(JSON.stringify(subscribeMessage));
        logSuccess(`구독 메시지 전송: ${symbolsToSubscribe.length}개 심볼`);
        console.log('📡 구독 메시지:', JSON.stringify(subscribeMessage, null, 2));
        
        // 구독 응답 타임아웃 설정
        subscribeTimeoutRef.current = setTimeout(() => {
          logError('구독 응답 타임아웃');
        }, BITGET_WS_CONFIG.MESSAGE_TIMEOUT);

      } catch (error) {
        logError(`구독 실패: ${error.message}`);
      }
    }
  }, [symbolsToSubscribe, logSuccess, logError]);

  /**
   * WebSocket 메시지 처리
   */
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      setMessageCount(prev => prev + 1);

      // Pong 응답 처리
      if (data.event === 'pong') {
        console.log('📡 Bitget WebSocket Pong 수신');
        return;
      }

      // 구독 확인 응답
      if (data.event === 'subscribe') {
        if (subscribeTimeoutRef.current) {
          clearTimeout(subscribeTimeoutRef.current);
          subscribeTimeoutRef.current = null;
        }
        
        if (data.code === '0') {
          logSuccess(`구독 성공: ${data.arg?.channel} ${data.arg?.instId}`);
        } else {
          logError(`구독 실패: ${data.msg}`);
        }
        return;
      }

      // 실시간 Ticker 데이터 처리
      if (data.action === 'update' && data.arg?.channel === 'ticker') {
        const tickerData = data.data;
        
        if (Array.isArray(tickerData) && tickerData.length > 0) {
          tickerData.forEach(ticker => {
            const instId = ticker.instId; // BTC-USDT 형식
            const symbol = instId.replace('-', ''); // BTCUSDT 형식으로 변환
            
            if (symbolsToSubscribe.includes(symbol)) {
              // PriceContext에 가격 데이터 업데이트
              const priceData = {
                symbol,
                price: parseFloat(ticker.lastPr || ticker.last),
                change24h: parseFloat(ticker.change24h || 0),
                changePercent24h: parseFloat(ticker.changePercent24h || ticker.changeP || 0),
                volume24h: parseFloat(ticker.baseVolume || ticker.baseVol || 0),
                high24h: parseFloat(ticker.high24h || ticker.highP || 0),
                low24h: parseFloat(ticker.low24h || ticker.lowP || 0),
                bid: parseFloat(ticker.bidPx || ticker.bidP || 0),
                ask: parseFloat(ticker.askPx || ticker.askP || 0),
                timestamp: parseInt(ticker.ts || Date.now()),
                source: 'bitget-ws'
              };

              updatePrice(symbol, priceData);
              setDataReceived(prev => prev + 1);
              
              // 첫 번째 데이터 수신 시 로그
              if (dataReceived === 0) {
                logSuccess(`첫 실시간 데이터 수신: ${symbol} = $${priceData.price}`);
              }
            }
          });
        }
      }

    } catch (error) {
      logError(`메시지 파싱 실패: ${error.message}`);
    }
  }, [symbolsToSubscribe, updatePrice, logSuccess, logError, dataReceived]);

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
    if (BITGET_WS_CONFIG.USE_MOCK) {
      logSuccess('Mock 모드로 WebSocket 시뮬레이션 시작');
      startMockData();
      return;
    }

    updateConnectionState(WS_STATES.CONNECTING);
    logSuccess('WebSocket 연결 시도...');

    try {
      const wsUrl = BITGET_WS_CONFIG.USE_FALLBACK ? BITGET_WS_CONFIG.FALLBACK_URL : BITGET_WS_CONFIG.URL;
      wsRef.current = new WebSocket(wsUrl);

      // 연결 타임아웃 설정
      connectionTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
          logError('연결 타임아웃');
          handleReconnect();
        }
      }, BITGET_WS_CONFIG.CONNECTION_TIMEOUT);

      // 연결 성공
      wsRef.current.onopen = () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        updateConnectionState(WS_STATES.CONNECTED);
        setReconnectAttempts(0);
        clearErrors();
        logSuccess('WebSocket 연결 성공');

        // 구독 메시지 전송
        setTimeout(sendSubscribe, 100);

        // Ping 인터벌 시작
        pingIntervalRef.current = setInterval(sendPing, BITGET_WS_CONFIG.PING_INTERVAL);
      };

      // 메시지 수신
      wsRef.current.onmessage = handleMessage;

      // 연결 종료
      wsRef.current.onclose = (event) => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
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
  }, [connectionState, updateConnectionState, sendSubscribe, sendPing, handleMessage, clearErrors, logSuccess, logError, startMockData]);

  /**
   * 재연결 처리
   */
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts >= BITGET_WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      updateConnectionState(WS_STATES.FAILED);
      logError(`최대 재시도 횟수 (${BITGET_WS_CONFIG.MAX_RECONNECT_ATTEMPTS}회) 초과`);
      
      // 실제 WebSocket 연결 실패 시 Mock 모드로 전환
      if (!BITGET_WS_CONFIG.USE_MOCK) {
        logSuccess('실제 WebSocket 연결 실패, Mock 모드로 전환');
        BITGET_WS_CONFIG.USE_MOCK = true;
        setReconnectAttempts(0);
        setTimeout(() => {
          connect();
        }, 2000);
      }
      return;
    }

    updateConnectionState(WS_STATES.RECONNECTING);
    
    // 지수 백오프: 1초, 2초, 4초, 8초, 16초
    const delay = BITGET_WS_CONFIG.RECONNECT_INTERVAL * Math.pow(2, reconnectAttempts);
    
    logSuccess(`${delay}ms 후 재연결 시도 (${reconnectAttempts + 1}/${BITGET_WS_CONFIG.MAX_RECONNECT_ATTEMPTS})`);
    
    setReconnectAttempts(prev => prev + 1);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
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
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (subscribeTimeoutRef.current) {
      clearTimeout(subscribeTimeoutRef.current);
      subscribeTimeoutRef.current = null;
    }

    // WebSocket 연결 닫기
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }

    updateConnectionState(WS_STATES.DISCONNECTED);
    setReconnectAttempts(0);
    logSuccess('WebSocket 연결 해제');
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
    if (enabled && symbolsToSubscribe.length > 0) {
      connect();
    } else {
      disconnect();
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      disconnect();
    };
  }, [enabled, symbolsToSubscribe.length]); // connect, disconnect 제거

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
    lastPingTime,
    
    // 설정
    symbolsToSubscribe,
    
    // 제어 함수
    connect,
    disconnect,
    reconnect,
    
    // WebSocket 상태 (디버깅용)
    readyState: wsRef.current?.readyState || WebSocket.CLOSED
  };
}