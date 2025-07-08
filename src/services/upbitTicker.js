/**
 * 업비트 REST API 서비스 - 실시간 ticker 데이터
 * WebSocket 백업용 REST API 호출
 */

import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/api';

// 환경 감지
const isDevelopment = import.meta.env.DEV;

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

/**
 * Mock 데이터 생성
 */
function generateMockUpbitData(markets) {
  const mockPrices = {
    'KRW-BTC': 148300000,
    'KRW-ETH': 4750000,
    'KRW-XRP': 1030,
    'KRW-ADA': 720,
    'KRW-SOL': 269000,
    'KRW-DOT': 11800,
    'KRW-LINK': 27000,
    'KRW-MATIC': 1450,
    'KRW-UNI': 16800,
    'KRW-AVAX': 68000,
    'KRW-DOGE': 315,
    'KRW-SHIB': 0.0463,
    'KRW-LTC': 162000,
    'KRW-BCH': 685000,
    'KRW-ETC': 41200,
    'KRW-ATOM': 15200,
    'KRW-XLM': 531,
    'KRW-ALGO': 435,
    'KRW-NEAR': 12300,
    'KRW-VET': 69.8
  };

  const result = {};
  markets.forEach(market => {
    const basePrice = mockPrices[market] || Math.random() * 10000 + 1000;
    const changeRate = (Math.random() - 0.5) * 0.1; // -5% ~ +5%
    const change = basePrice * changeRate;
    
    result[market] = {
      market: market,
      trade_price: basePrice,
      change: change,
      change_rate: changeRate,
      change_percent: changeRate * 100,
      acc_trade_volume_24h: Math.random() * 1000000,
      acc_trade_price_24h: Math.random() * 100000000000,
      high_price: basePrice * 1.05,
      low_price: basePrice * 0.95,
      timestamp: Date.now(),
      source: 'upbit-mock'
    };
  });
  
  return result;
}


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

  // Mock 모드 사용 시
  if (UPBIT_API_CONFIG.USE_MOCK) {
    logger.debug('업비트 Mock 데이터 사용');
    return generateMockUpbitData(markets);
  }


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
    
    // 마켓을 작은 청크로 나누어 요청 (한 번에 너무 많은 마켓 요청 시 에러 발생 가능)
    const chunkSize = 20;
    const marketChunks = [];
    for (let i = 0; i < markets.length; i += chunkSize) {
      marketChunks.push(markets.slice(i, i + chunkSize));
    }
    
    const allTransformedData = {};
    
    // 각 청크별로 요청
    for (const chunk of marketChunks) {
      try {
        const marketsParam = chunk.join(',');
        const timestamp = Date.now();
        const url = `${UPBIT_API_CONFIG.BASE_URL}${UPBIT_API_CONFIG.TICKER_ENDPOINT}?markets=${marketsParam}&_t=${timestamp}`;
        
        // 배포 환경에서 상세 로깅
        if (!isDevelopment) {
          console.log(`[Production] Upbit API call:`, {
            url,
            markets: chunk.length,
            timestamp: new Date().toISOString()
          });
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), UPBIT_API_CONFIG.TIMEOUT);
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Requested-With': 'XMLHttpRequest'
          },
          cache: 'no-store',
          mode: 'cors'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          logger.warn(`업비트 API 청크 실패 (${response.status}): ${chunk.join(',')}`);
          continue; // 이 청크는 건너뛰고 다음 청크 처리
        }
        
        const tickerArray = await response.json();
        logger.performance(`업비트 ticker 응답: ${tickerArray.length}개 항목 (청크)`);
        
        // 데이터 변환
        for (let i = 0; i < tickerArray.length; i++) {
          const ticker = tickerArray[i];
          const transformedTicker = transformUpbitTickerData(ticker);
          if (transformedTicker) {
            allTransformedData[ticker.market] = transformedTicker;
          }
        }
        
      } catch (chunkError) {
        logger.warn(`업비트 API 청크 에러: ${chunkError.message} (마켓: ${chunk.join(',')})`);
        continue; // 이 청크는 건너뛰고 다음 청크 처리
      }
    }
    
    // 배포 환경에서 성공 로깅
    if (!isDevelopment) {
      const sampleMarket = Object.keys(allTransformedData)[0];
      console.log(`[Production] Upbit API success:`, {
        receivedTickers: Object.keys(allTransformedData).length,
        sampleMarket: sampleMarket,
        samplePrice: allTransformedData[sampleMarket]?.trade_price
      });
    }
    
    // 캐시 저장
    tickerCache.set(cacheKey, {
      data: allTransformedData,
      timestamp: now
    });
    
    logger.performance(`업비트 ticker 데이터 변환 완료: ${Object.keys(allTransformedData).length}개 마켓`);
    return allTransformedData;
    
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