/**
 * Bitget WebSocket Hook
 * 실시간 가격 데이터 WebSocket 연결 관리
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePrices } from '../contexts';
import { transformBitgetTickerData } from '../services/bitgetTicker';
import { logger } from '../utils/logger';

// Bitget WebSocket 설정
const BITGET_WS_CONFIG = {
  URL: 'wss://ws.bitget.com/spot/v1/stream',
  RECONNECT_INTERVAL: 5000, // 5초
  MAX_RECONNECT_ATTEMPTS: 10,
  PING_INTERVAL: 30000, // 30초
  CONNECTION_TIMEOUT: 10000, // 10초
  MESSAGE_TIMEOUT: 60000 // 1분
};

// 주요 코인 심볼들 (WebSocket 구독용)
const MAJOR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT',
  'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'UNIUSDT', 'AVAXUSDT',
  'DOGEUSDT', 'SHIBUSDT', 'TRXUSDT', 'LTCUSDT', 'BCHUSDT'
];

/**
 * Bitget WebSocket Hook
 * @param {Object} options - 연결 옵션
 * @param {boolean} options.enabled - WebSocket 활성화 여부 (기본값: true)
 * @param {Array} options.symbols - 구독할 심볼 목록 (기본값: MAJOR_SYMBOLS)
 * @returns {Object} WebSocket 상태 및 제어 함수들
 */
export function useBitgetWebSocket({ 
  enabled = true, 
  symbols = MAJOR_SYMBOLS 
} = {}) {
  const { updatePriceData } = usePrices();
  
  // WebSocket 관련 상태
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastDataReceived, setLastDataReceived] = useState(null);
  const [dataCount, setDataCount] = useState(0);
  
  // refs
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const connectionTimeoutRef = useRef(null);
  const lastMessageTimeRef = useRef(Date.now());
  const mountedRef = useRef(true);

  // WebSocket 메시지 파싱 및 처리
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      lastMessageTimeRef.current = Date.now();
      
      // Ping 응답 처리
      if (data.event === 'pong') {
        logger.debug('Bitget WebSocket: Pong 수신');
        return;
      }
      
      // 구독 확인 응답 처리
      if (data.event === 'subscribe') {
        logger.api(`Bitget WebSocket: ${data.arg?.channel} 구독 확인`);
        return;
      }
      
      // 실제 가격 데이터 처리
      if (data.action === 'snapshot' || data.action === 'update') {
        const tickerData = data.data?.[0];
        if (!tickerData) return;
        
        // Bitget WebSocket 데이터 형식 변환
        const transformedData = transformBitgetTickerData({
          symbol: tickerData.instId,
          lastPr: tickerData.last,
          open: tickerData.open24h,
          high24h: tickerData.high24h,
          low24h: tickerData.low24h,
          change24h: tickerData.change24h,
          baseVolume: tickerData.baseVol,
          quoteVolume: tickerData.quoteVol,
          ts: tickerData.ts,
          bidPr: tickerData.bidPx,
          askPr: tickerData.askPx
        });
        
        if (transformedData) {
          // PriceContext 업데이트
          updatePriceData(transformedData.symbol, transformedData);
          
          setLastDataReceived(new Date().toLocaleTimeString());
          setDataCount(prev => prev + 1);
          
          logger.debug(`Bitget WebSocket 데이터 수신: ${transformedData.symbol} = $${transformedData.price}`);
        }
      }
      
    } catch (error) {
      logger.error('Bitget WebSocket 메시지 파싱 오류:', error);
    }
  }, [updatePriceData]);

  // WebSocket 연결 함수
  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) {
      logger.info('Bitget WebSocket: 연결 비활성화됨');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      logger.debug('Bitget WebSocket: 이미 연결 시도 중');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      logger.debug('Bitget WebSocket: 이미 연결됨');
      return;
    }

    setIsConnecting(true);
    logger.api('Bitget WebSocket 연결 시도...');

    try {
      wsRef.current = new WebSocket(BITGET_WS_CONFIG.URL);
      
      // 연결 타임아웃 설정
      connectionTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CONNECTING) {
          logger.warn('Bitget WebSocket: 연결 타임아웃');
          wsRef.current?.close();
        }
      }, BITGET_WS_CONFIG.CONNECTION_TIMEOUT);

      wsRef.current.onopen = () => {
        if (!mountedRef.current) return;
        
        clearTimeout(connectionTimeoutRef.current);
        setIsConnected(true);
        setIsConnecting(false);
        setReconnectAttempts(0);
        lastMessageTimeRef.current = Date.now();
        
        logger.api('Bitget WebSocket: 연결 성공');

        // 심볼 구독
        const subscribeMessage = {
          op: 'subscribe',
          args: symbols.map(symbol => ({
            channel: 'ticker',
            instId: symbol
          }))
        };
        
        wsRef.current.send(JSON.stringify(subscribeMessage));
        logger.api(`Bitget WebSocket: ${symbols.length}개 심볼 구독 요청`);

        // Ping 인터벌 설정
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ op: 'ping' }));
            logger.debug('Bitget WebSocket: Ping 전송');
          }
        }, BITGET_WS_CONFIG.PING_INTERVAL);
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onclose = (event) => {
        if (!mountedRef.current) return;
        
        clearTimeout(connectionTimeoutRef.current);
        clearInterval(pingIntervalRef.current);
        setIsConnected(false);
        setIsConnecting(false);
        
        logger.warn(`Bitget WebSocket: 연결 종료 (코드: ${event.code}, 이유: ${event.reason})`);

        // 재연결 시도 (최대 시도 횟수 내에서)
        if (reconnectAttempts < BITGET_WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
          setReconnectAttempts(prev => prev + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            logger.info(`Bitget WebSocket: 재연결 시도 (${reconnectAttempts + 1}/${BITGET_WS_CONFIG.MAX_RECONNECT_ATTEMPTS})`);
            connect();
          }, BITGET_WS_CONFIG.RECONNECT_INTERVAL);
        } else {
          logger.error('Bitget WebSocket: 최대 재연결 시도 횟수 초과');
        }
      };

      wsRef.current.onerror = (error) => {
        logger.error('Bitget WebSocket 오류:', error);
        setIsConnecting(false);
      };

    } catch (error) {
      logger.error('Bitget WebSocket 연결 생성 오류:', error);
      setIsConnecting(false);
    }
  }, [enabled, symbols, reconnectAttempts, handleMessage]);

  // WebSocket 연결 해제 함수
  const disconnect = useCallback(() => {
    logger.info('Bitget WebSocket: 연결 해제');
    
    clearTimeout(reconnectTimeoutRef.current);
    clearTimeout(connectionTimeoutRef.current);
    clearInterval(pingIntervalRef.current);
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setReconnectAttempts(0);
  }, []);

  // 수동 재연결 함수
  const reconnect = useCallback(() => {
    logger.info('Bitget WebSocket: 수동 재연결');
    disconnect();
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // 컴포넌트 마운트 시 연결
  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // 메시지 수신 타임아웃 감지
  useEffect(() => {
    if (!enabled || !isConnected) return;

    const checkMessageTimeout = setInterval(() => {
      const timeSinceLastMessage = Date.now() - lastMessageTimeRef.current;
      
      if (timeSinceLastMessage > BITGET_WS_CONFIG.MESSAGE_TIMEOUT) {
        logger.warn('Bitget WebSocket: 메시지 수신 타임아웃, 재연결 시도');
        reconnect();
      }
    }, BITGET_WS_CONFIG.MESSAGE_TIMEOUT / 2);

    return () => clearInterval(checkMessageTimeout);
  }, [enabled, isConnected, reconnect]);

  // 연결 상태 반환
  return {
    isConnected,
    isConnecting,
    reconnectAttempts,
    lastDataReceived,
    dataCount,
    readyState: wsRef.current?.readyState,
    connect,
    disconnect,
    reconnect,
    // 디버깅용 정보
    wsInstance: wsRef.current,
    config: BITGET_WS_CONFIG
  };
}

export default useBitgetWebSocket;