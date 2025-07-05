/**
 * Binance WebSocket 훅
 * 실시간 가격 데이터를 위한 WebSocket 연결 및 관리
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePrices } from '../contexts/PriceContext';
import { logger } from '../utils/logger';

// WebSocket 설정
const BINANCE_WS_CONFIG = {
  URL: 'wss://stream.binance.com:9443/ws/', // Binance WebSocket URL
  RECONNECT_INTERVAL: 1000, // 초기 재연결 간격 (1초)
  MAX_RECONNECT_ATTEMPTS: 5, // 최대 재연결 시도 횟수
  PING_INTERVAL: 30000, // 30초마다 ping
  CONNECTION_TIMEOUT: 15000, // 15초 연결 타임아웃
  MESSAGE_TIMEOUT: 10000 // 10초 메시지 타임아웃
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
 * Binance WebSocket 훅
 * @param {Object} options - 연결 옵션
 * @param {boolean} options.enabled - WebSocket 연결 활성화 여부
 * @param {Array} options.symbols - 구독할 심볼 배열
 * @returns {Object} WebSocket 상태 및 제어 함수
 */
export function useBinanceWebSocket(options = {}) {
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
    setError
  } = usePrices();

  // WebSocket 관련 상태
  const [wsState, setWsState] = useState(WS_STATES.DISCONNECTED);
  const [lastMessage, setLastMessage] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // WebSocket 및 타이머 참조
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const connectionTimeoutRef = useRef(null);
  const messageTimeoutRef = useRef(null);

  // 구독할 심볼 목록 (옵션으로 받은 심볼 또는 전체 심볼)
  const targetSymbols = symbols.length > 0 ? symbols : ALL_SYMBOLS;

  // WebSocket 연결 함수
  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    logger.api('Binance WebSocket 연결 시도');
    setWsState(WS_STATES.CONNECTING);
    setConnecting(true);

    try {
      // 기존 연결 정리
      cleanup();

      // 테스트를 위해 먼저 BTCUSDT만 구독
      const testSymbol = 'BTCUSDT';
      const url = `wss://stream.binance.com:9443/ws/${testSymbol.toLowerCase()}@ticker`;
      
      logger.api(`Binance WebSocket URL: ${url}`);
      wsRef.current = new WebSocket(url);

      // 연결 타임아웃 설정
      connectionTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CONNECTING) {
          logger.error('Binance WebSocket 연결 타임아웃');
          wsRef.current?.close();
          handleReconnect();
        }
      }, BINANCE_WS_CONFIG.CONNECTION_TIMEOUT);

      // WebSocket 이벤트 리스너
      wsRef.current.onopen = () => {
        logger.api('Binance WebSocket 연결 성공');
        setWsState(WS_STATES.CONNECTED);
        setConnectionStatus(true);
        setConnecting(false);
        setReconnectAttempts(0);

        // 연결 타임아웃 해제
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        // Ping 시작
        startPing();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
          setLastMessage(data);

          // 메시지 타임아웃 리셋
          resetMessageTimeout();
        } catch (error) {
          logger.error('Binance WebSocket 메시지 파싱 오류:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        logger.error('Binance WebSocket 오류:', error);
        setError('Binance WebSocket 연결 오류');
      };

      wsRef.current.onclose = (event) => {
        logger.api(`Binance WebSocket 연결 종료 (${event.code}: ${event.reason})`);
        setWsState(WS_STATES.DISCONNECTED);
        setConnectionStatus(false);
        setConnecting(false);
        cleanup();

        if (enabled && event.code !== 1000) { // 정상 종료가 아닌 경우
          handleReconnect();
        }
      };

    } catch (error) {
      logger.error('Binance WebSocket 연결 실패:', error);
      setWsState(WS_STATES.FAILED);
      setConnectionStatus(false);
      setConnecting(false);
      setError('Binance WebSocket 연결 실패');
      handleReconnect();
    }
  }, [enabled, targetSymbols, setConnectionStatus, setConnecting, setError]);

  // 메시지 처리
  const handleMessage = useCallback((data) => {
    // Binance ticker 스트림 데이터 형식:
    // {
    //   "e": "24hrTicker",  // 이벤트 타입
    //   "E": 123456789,     // 이벤트 시간
    //   "s": "BNBBTC",      // 심볼
    //   "p": "0.0015",      // 24시간 가격 변화
    //   "P": "250.00",      // 24시간 가격 변화율
    //   "w": "0.0018",      // 24시간 가중평균가격
    //   "x": "0.0009",      // 전 거래일 종가
    //   "c": "0.0025",      // 현재가
    //   "Q": "10",          // 현재가 거래량
    //   "b": "0.0024",      // 최고 매수호가
    //   "B": "10",          // 최고 매수호가 거래량
    //   "a": "0.0026",      // 최고 매도호가
    //   "A": "100",         // 최고 매도호가 거래량
    //   "o": "0.0010",      // 24시간 시가
    //   "h": "0.0025",      // 24시간 고가
    //   "l": "0.0010",      // 24시간 저가
    //   "v": "10000",       // 24시간 거래량
    //   "q": "18",          // 24시간 거래대금
    //   "O": 0,             // 통계 시작 시간
    //   "C": 86400000,      // 통계 종료 시간
    //   "F": 0,             // 첫 거래 ID
    //   "L": 18150,         // 마지막 거래 ID
    //   "n": 18151          // 총 거래 횟수
    // }

    // pong 메시지 처리
    if (data === 'pong') {
      logger.debug('Binance WebSocket pong 수신');
      return;
    }

    // 24hrTicker 이벤트 처리
    if (data.e === '24hrTicker') {
      const symbol = data.s;
      const price = parseFloat(data.c);
      const change24h = parseFloat(data.p);
      const changePercent24h = parseFloat(data.P);

      const priceData = {
        symbol,
        price,
        change24h,
        changePercent24h,
        volume24h: parseFloat(data.v),
        volumeUsdt24h: parseFloat(data.q),
        high24h: parseFloat(data.h),
        low24h: parseFloat(data.l),
        bid: parseFloat(data.b),
        ask: parseFloat(data.a),
        timestamp: parseInt(data.E),
        source: 'binance-websocket'
      };

      // PriceContext 업데이트
      updatePrice(symbol, priceData);
      
      logger.debug(`Binance 가격 업데이트: ${symbol} = $${price} (${changePercent24h > 0 ? '+' : ''}${changePercent24h.toFixed(2)}%)`);
    } else {
      logger.debug('알 수 없는 Binance 메시지:', data);
    }
  }, [updatePrice]);

  // 재연결 처리
  const handleReconnect = useCallback(() => {
    if (!enabled || reconnectAttempts >= BINANCE_WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      logger.error('Binance WebSocket 최대 재연결 시도 횟수 초과');
      setWsState(WS_STATES.FAILED);
      setError('Binance WebSocket 재연결 실패');
      return;
    }

    const delay = Math.min(
      BINANCE_WS_CONFIG.RECONNECT_INTERVAL * Math.pow(2, reconnectAttempts),
      30000 // 최대 30초
    );

    logger.api(`Binance WebSocket ${delay}ms 후 재연결 시도 (${reconnectAttempts + 1}/${BINANCE_WS_CONFIG.MAX_RECONNECT_ATTEMPTS})`);
    setWsState(WS_STATES.RECONNECTING);
    setReconnectAttempts(prev => prev + 1);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [enabled, reconnectAttempts, connect, setError]);

  // Ping 시작
  const startPing = useCallback(() => {
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          // 바이낸스는 특별한 ping 메시지가 필요하지 않음. 단순히 연결 확인
          wsRef.current.send('ping');
          logger.debug('Binance WebSocket ping 전송');
        } catch (error) {
          logger.error('Binance WebSocket ping 전송 실패:', error);
        }
      }
    }, BINANCE_WS_CONFIG.PING_INTERVAL);
  }, []);

  // 메시지 타임아웃 리셋
  const resetMessageTimeout = useCallback(() => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    messageTimeoutRef.current = setTimeout(() => {
      logger.warn('Binance WebSocket 메시지 타임아웃 - 재연결 시도');
      if (wsRef.current) {
        wsRef.current.close();
      }
    }, BINANCE_WS_CONFIG.MESSAGE_TIMEOUT);
  }, []);

  // 리소스 정리
  const cleanup = useCallback(() => {
    // WebSocket 연결 정리
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    // 타이머 정리
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
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
  }, []);

  // 연결 종료
  const disconnect = useCallback(() => {
    logger.api('Binance WebSocket 연결 종료');
    cleanup();
    setWsState(WS_STATES.DISCONNECTED);
    setConnectionStatus(false);
    setConnecting(false);
    setReconnectAttempts(0);
  }, [cleanup, setConnectionStatus, setConnecting]);

  // 수동 재연결
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      setReconnectAttempts(0);
      connect();
    }, 1000);
  }, [disconnect, connect]);

  // 컴포넌트 마운트/언마운트 처리
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      cleanup();
    };
  }, [enabled, connect, cleanup]);

  // 심볼 변경 시 재연결
  useEffect(() => {
    if (enabled && wsState === WS_STATES.CONNECTED) {
      logger.api('Binance WebSocket 심볼 변경으로 재연결');
      reconnect();
    }
  }, [targetSymbols.join(','), enabled, wsState, reconnect]);

  return {
    // 상태
    isConnected: wsState === WS_STATES.CONNECTED,
    isConnecting: wsState === WS_STATES.CONNECTING,
    isReconnecting: wsState === WS_STATES.RECONNECTING,
    isFailed: wsState === WS_STATES.FAILED,
    reconnectAttempts,
    lastMessage,
    
    // 제어 함수
    connect,
    disconnect,
    reconnect,
    
    // 설정
    config: BINANCE_WS_CONFIG
  };
}