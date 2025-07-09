/**
 * 업비트 REST API 서비스 - 실시간 ticker 데이터
 * WebSocket 백업용 REST API 호출
 */

import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/api';

// 환경 감지 (hostname 기반)
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// 업비트 API 설정
const UPBIT_API_CONFIG = {
  // 모든 환경에서 프록시 경유 (통일된 방식)
  BASE_URL: API_CONFIG.UPBIT.BASE_URL,
  TICKER_ENDPOINT: API_CONFIG.UPBIT.TICKER,
  USE_MOCK: false, // 실제 API 사용
  CACHE_DURATION: API_CONFIG.COMMON.CACHE_DURATION.TICKER,
  TIMEOUT: 8000 // 8초 타임아웃
};

// 캐시 저장소
const tickerCache = new Map();

// Mock 데이터는 사용하지 않음 - 실제 API 데이터만 사용


/**
 * 업비트 API에서 ticker 데이터 가져오기
 * @param {Array} markets - 마켓 배열 (예: ['KRW-BTC', 'KRW-ETH'])
 * @returns {Promise<Object>} 심볼별 ticker 데이터 맵
 */
export async function getBatchUpbitTickerData(markets) {
  if (!markets || markets.length === 0) {
    logger.warn('업비트 ticker: 마켓 목록이 비어있음');
    return {};
  }

  // 실제 API만 사용 - Mock 데이터는 절대 사용하지 않음


  const cacheKey = markets.sort().join(',');
  const now = Date.now();
  
  // 캐시 확인
  if (tickerCache.has(cacheKey)) {
    const cached = tickerCache.get(cacheKey);
    if (now - cached.timestamp < UPBIT_API_CONFIG.CACHE_DURATION) {
      logger.debug(`업비트 ticker 캐시 사용: ${markets.length}개 마켓`);
      return cached.data;
    }
  }

  try {
    logger.performance(`업비트 ticker API 호출: ${markets.length}개 마켓`);
    
    // 마켓 파라미터 생성
    const marketsParam = markets.join(',');
    
    // 캐시 무시를 위한 타임스탬프 추가
    const timestamp = Date.now();
    const url = `${UPBIT_API_CONFIG.BASE_URL}${UPBIT_API_CONFIG.TICKER_ENDPOINT}?markets=${marketsParam}&_t=${timestamp}`;
    
    // 환경별 상세 로깅
    console.log(`[${isDevelopment ? 'Dev' : 'Prod'}] Upbit API call:`, {
      url,
      isDevelopment,
      baseUrl: UPBIT_API_CONFIG.BASE_URL,
      endpoint: UPBIT_API_CONFIG.TICKER_ENDPOINT,
      markets: markets.length,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      timestamp: new Date().toISOString()
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPBIT_API_CONFIG.TIMEOUT);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Requested-With': 'XMLHttpRequest' // 명시적으로 AJAX 요청임을 표시
      },
      cache: 'no-store', // 캐시 완전 비활성화
      mode: 'cors' // CORS 모드 명시
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // 모든 환경에서 동일한 방식으로 JSON 파싱 (로컬 기준)
    const tickerArray = await response.json();
    
    logger.performance(`업비트 ticker 응답: ${tickerArray.length}개 항목`);
    
    // 환경별 성공 로깅
    console.log(`[${isDevelopment ? 'Dev' : 'Prod'}] Upbit API success:`, {
      receivedTickers: tickerArray.length,
      sampleMarket: tickerArray[0]?.market,
      samplePrice: tickerArray[0]?.trade_price?.toLocaleString()
    });
    
    // 데이터 변환
    const transformedData = {};
    for (let i = 0; i < tickerArray.length; i++) {
      const ticker = tickerArray[i];
      const transformedTicker = transformUpbitTickerData(ticker);
      if (transformedTicker) {
        transformedData[ticker.market] = transformedTicker;
      }
    }
    
    // 캐시 저장
    tickerCache.set(cacheKey, {
      data: transformedData,
      timestamp: now
    });
    
    logger.performance(`업비트 ticker 데이터 변환 완료: ${Object.keys(transformedData).length}개 마켓`);
    return transformedData;
    
  } catch (error) {
    logger.error('업비트 ticker API 실패:', error.message);
    
    // 캐시에서 이전 데이터 반환
    if (tickerCache.has(cacheKey)) {
      const cached = tickerCache.get(cacheKey);
      logger.debug('업비트 ticker 캐시 데이터 반환 (API 실패)');
      return cached.data;
    }
    
    // API 완전 실패시 Mock 데이터 사용
    logger.warn('업비트 API 완전 실패, Mock 데이터로 대체');
    return generateMockUpbitData(markets);
  }
}

/**
 * 업비트 ticker 데이터를 표준 형식으로 변환
 * @param {Object} tickerData - 업비트 원본 ticker 데이터
 * @returns {Object} 변환된 ticker 데이터
 */
export function transformUpbitTickerData(tickerData) {
  if (!tickerData || !tickerData.market) {
    logger.warn('업비트 ticker 데이터가 비어있음:', tickerData);
    return null;
  }

  try {
    const changePercent = (tickerData.change_rate || 0) * 100; // 소수점 -> 퍼센트
    const tradePrice = parseFloat(tickerData.trade_price || 0);
    
    // 가격 유효성 검증
    if (tradePrice <= 0 || isNaN(tradePrice)) {
      logger.warn(`Invalid trade price for ${tickerData.market}: ${tickerData.trade_price}`);
      return null;
    }
    
    // 배포 환경에서 데이터 로깅 (BTC만)
    if (!isDevelopment && tickerData.market === 'KRW-BTC') {
      console.log('[Production] Upbit transform:', {
        market: tickerData.market,
        rawPrice: tickerData.trade_price,
        parsedPrice: tradePrice,
        changePercent: changePercent
      });
    }
    
    return {
      market: tickerData.market,
      trade_price: tradePrice,
      change: parseFloat(tickerData.change_price || 0),
      change_rate: parseFloat(tickerData.change_rate || 0),
      change_percent: changePercent,
      acc_trade_volume_24h: parseFloat(tickerData.acc_trade_volume_24h || 0),
      acc_trade_price_24h: parseFloat(tickerData.acc_trade_price_24h || 0),
      high_price: parseFloat(tickerData.high_price || 0),
      low_price: parseFloat(tickerData.low_price || 0),
      timestamp: tickerData.timestamp || Date.now(),
      source: 'upbit-rest-api'
    };
  } catch (error) {
    logger.error('업비트 ticker 데이터 변환 실패:', error, tickerData);
    return null;
  }
}

/**
 * 단일 마켓 ticker 데이터 가져오기
 * @param {string} market - 마켓 코드 (예: 'KRW-BTC')
 * @returns {Promise<Object>} ticker 데이터
 */
export async function getUpbitTickerData(market) {
  const result = await getBatchUpbitTickerData([market]);
  return result[market] || null;
}

/**
 * 캐시 초기화
 */
export function clearUpbitTickerCache() {
  tickerCache.clear();
  logger.debug('업비트 ticker 캐시 초기화');
}

// 기본 export
export default {
  getBatchUpbitTickerData,
  getUpbitTickerData,
  transformUpbitTickerData,
  clearUpbitTickerCache
};