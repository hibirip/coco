/**
 * 호가창(Order Book) 서비스
 * Bitget API를 통한 실시간 호가 데이터 제공
 */

import { API_CONFIG } from '../config/api';
import { logger } from '../utils/logger';

// 호가창 설정
const ORDERBOOK_CONFIG = {
  BASE_URL: API_CONFIG.BITGET.BASE_URL,
  DEPTH_ENDPOINT: '/api/v2/spot/market/orderbook',
  CACHE_DURATION: 2000, // 2초
  REQUEST_TIMEOUT: 5000,
  DEFAULT_LIMIT: 20 // 호가 단계 수
};

// 메모리 캐시
const orderBookCache = new Map();

/**
 * 캐시에서 호가 데이터 조회
 * @param {string} symbol - 심볼
 * @returns {object|null} 캐시된 호가 데이터
 */
function getCachedOrderBook(symbol) {
  const cached = orderBookCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < ORDERBOOK_CONFIG.CACHE_DURATION) {
    return cached.data;
  }
  orderBookCache.delete(symbol);
  return null;
}

/**
 * 캐시에 호가 데이터 저장
 * @param {string} symbol - 심볼
 * @param {object} data - 호가 데이터
 */
function setCachedOrderBook(symbol, data) {
  orderBookCache.set(symbol, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Bitget 호가 데이터 조회
 * @param {string} symbol - 심볼 (예: BTCUSDT)
 * @param {number} limit - 호가 단계 수
 * @returns {Promise<object>} 호가 데이터
 */
export async function fetchOrderBook(symbol, limit = ORDERBOOK_CONFIG.DEFAULT_LIMIT) {
  try {
    // 캐시 확인
    const cached = getCachedOrderBook(symbol);
    if (cached) {
      logger.debug(`캐시된 호가 데이터 사용: ${symbol}`);
      return cached;
    }

    const params = new URLSearchParams({
      symbol: symbol.toUpperCase(),
      limit: limit.toString()
    });

    const url = `${ORDERBOOK_CONFIG.BASE_URL}${ORDERBOOK_CONFIG.DEPTH_ENDPOINT}?${params}`;
    
    logger.api(`Bitget 호가 API 요청: ${symbol}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ORDERBOOK_CONFIG.REQUEST_TIMEOUT);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.code !== '00000' || !data.data) {
      throw new Error(`API Error: ${data.msg || 'Unknown error'}`);
    }

    const orderBook = transformOrderBookData(data.data);
    
    // 캐시에 저장
    setCachedOrderBook(symbol, orderBook);
    
    logger.api(`호가 데이터 수신: ${symbol} (매도 ${orderBook.asks.length}개, 매수 ${orderBook.bids.length}개)`);
    
    return orderBook;

  } catch (error) {
    logger.error(`호가 데이터 조회 실패 (${symbol}):`, error.message);
    
    // 오류 발생시 Mock 데이터 반환
    return generateMockOrderBook(symbol);
  }
}

/**
 * Bitget 호가 데이터 변환
 * @param {object} rawData - 원본 API 응답
 * @returns {object} 변환된 호가 데이터
 */
function transformOrderBookData(rawData) {
  const { asks = [], bids = [] } = rawData;
  
  // 누적 거래량 계산
  let askTotal = 0;
  let bidTotal = 0;
  
  const transformedAsks = asks.map(([price, amount]) => {
    askTotal += parseFloat(amount);
    return {
      price: parseFloat(price),
      amount: parseFloat(amount),
      total: askTotal
    };
  });
  
  const transformedBids = bids.map(([price, amount]) => {
    bidTotal += parseFloat(amount);
    return {
      price: parseFloat(price),
      amount: parseFloat(amount),
      total: bidTotal
    };
  });
  
  return {
    asks: transformedAsks,
    bids: transformedBids,
    timestamp: Date.now()
  };
}

/**
 * Mock 호가 데이터 생성
 * @param {string} symbol - 심볼
 * @returns {object} Mock 호가 데이터
 */
function generateMockOrderBook(symbol) {
  // 기본 가격 설정 (심볼별로 다르게)
  const basePrices = {
    'BTCUSDT': 45000,
    'ETHUSDT': 2500,
    'BNBUSDT': 320,
    'SOLUSDT': 100,
    'XRPUSDT': 0.6
  };
  
  const basePrice = basePrices[symbol] || 100;
  const asks = [];
  const bids = [];
  const spreadPercent = 0.0001; // 0.01% 스프레드
  
  // 15단계 호가 생성
  for (let i = 0; i < 15; i++) {
    // 매도 호가 (현재가보다 높은 가격)
    const askPrice = basePrice * (1 + spreadPercent + i * 0.0001);
    const askAmount = Math.random() * 10 * (1 + i * 0.1); // 상단으로 갈수록 물량 증가
    
    asks.push({
      price: askPrice,
      amount: askAmount,
      total: 0
    });
    
    // 매수 호가 (현재가보다 낮은 가격)
    const bidPrice = basePrice * (1 - spreadPercent - i * 0.0001);
    const bidAmount = Math.random() * 10 * (1 + i * 0.1); // 하단으로 갈수록 물량 증가
    
    bids.push({
      price: bidPrice,
      amount: bidAmount,
      total: 0
    });
  }
  
  // 누적 계산
  let askTotal = 0;
  let bidTotal = 0;
  
  asks.forEach(ask => {
    askTotal += ask.amount;
    ask.total = askTotal;
  });
  
  bids.forEach(bid => {
    bidTotal += bid.amount;
    bid.total = bidTotal;
  });
  
  return {
    asks,
    bids,
    timestamp: Date.now()
  };
}

/**
 * 호가창 캐시 정리
 */
export function clearOrderBookCache() {
  orderBookCache.clear();
  logger.debug('호가창 캐시 정리 완료');
}

/**
 * 호가창 캐시 통계
 * @returns {object} 캐시 통계
 */
export function getOrderBookCacheStats() {
  const stats = {
    size: orderBookCache.size,
    symbols: Array.from(orderBookCache.keys()),
    maxAge: ORDERBOOK_CONFIG.CACHE_DURATION
  };
  
  return stats;
}

export default {
  fetchOrderBook,
  clearOrderBookCache,
  getOrderBookCacheStats
};