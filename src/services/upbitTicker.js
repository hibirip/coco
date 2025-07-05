/**
 * 업비트 REST API 서비스 - 실시간 ticker 데이터
 * WebSocket 백업용 REST API 호출
 */

import { logger } from '../utils/logger';

// 업비트 API 설정
const UPBIT_API_CONFIG = {
  BASE_URL: 'https://api.upbit.com',
  TICKER_ENDPOINT: '/v1/ticker',
  USE_MOCK: false, // Mock 모드 비활성화 - 실제 API 사용
  CACHE_DURATION: 5000, // 5초 캐시
  TIMEOUT: 8000 // 8초 타임아웃
};

// 캐시 저장소
const tickerCache = new Map();

/**
 * Mock 업비트 데이터 생성 (배포환경용)
 */
function generateMockUpbitData(markets) {
  // 환율 1380 기준으로 김치프리미엄이 발생하도록 가격 설정
  const mockPrices = {
    'KRW-BTC': 60500000,  // Bitget $42,750 * 1380 = 59,055,000 -> 약 2.4% 프리미엄
    'KRW-ETH': 3480000,   // Bitget $2,465 * 1380 = 3,401,700 -> 약 2.3% 프리미엄
    'KRW-XRP': 730,       // Bitget $0.514 * 1380 = 709 -> 약 3.0% 프리미엄
    'KRW-ADA': 535,       // Bitget $0.377 * 1380 = 520 -> 약 2.9% 프리미엄
    'KRW-SOL': 132000,    // Bitget $94.2 * 1380 = 130,000 -> 약 1.5% 프리미엄
    'KRW-DOT': 8700,      // Bitget $6.16 * 1380 = 8,500 -> 약 2.4% 프리미엄
    'KRW-LINK': 20300,    // Bitget $14.35 * 1380 = 19,800 -> 약 2.5% 프리미엄
    'KRW-UNI': 9500,      // 약간의 프리미엄 추가
    'KRW-AVAX': 49000,    // 약간의 프리미엄 추가
    'KRW-DOGE': 112,      // Bitget $0.079 * 1380 = 109 -> 약 2.8% 프리미엄
    'KRW-SHIB': 0.0165,   // Bitget $0.0000116 * 1380 = 0.016 -> 약 3.1% 프리미엄
    'KRW-TRX': 282,       // Bitget $0.199 * 1380 = 275 -> 약 2.5% 프리미엄
    // 추가 코인들
    'KRW-LTC': 125000,
    'KRW-BCH': 680000,
    'KRW-ETC': 38500,
    'KRW-ATOM': 15200,
    'KRW-NEAR': 8900,
    'KRW-ALGO': 250,
    'KRW-HBAR': 145
  };

  return markets.reduce((acc, market) => {
    const basePrice = mockPrices[market] || 10000;
    // 작은 변동성 추가 (±1.5%)
    const price = basePrice * (1 + (Math.random() - 0.5) * 0.03);
    // 전일대비 변동 (±5%)
    const change = (Math.random() - 0.5) * 0.1;
    
    acc[market] = {
      market,
      trade_price: price,
      change_price: price * change,
      change_rate: change,
      change_percent: change * 100,
      acc_trade_volume_24h: Math.random() * 1000000000,
      high_price: price * 1.05,
      low_price: price * 0.95,
      timestamp: Date.now(),
      source: 'upbit-mock-api'
    };
    return acc;
  }, {});
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

  // 배포환경에서는 Mock 데이터 사용
  if (UPBIT_API_CONFIG.USE_MOCK) {
    logger.info('업비트 Mock 데이터 사용 (배포환경)');
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
    logger.api(`업비트 ticker API 호출: ${markets.length}개 마켓`);
    
    // 마켓 파라미터 생성
    const marketsParam = markets.join(',');
    const url = `${UPBIT_API_CONFIG.BASE_URL}${UPBIT_API_CONFIG.TICKER_ENDPOINT}?markets=${marketsParam}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPBIT_API_CONFIG.TIMEOUT);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Coco-Upbit-Ticker/1.0)'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const tickerArray = await response.json();
    logger.api(`업비트 ticker 응답: ${tickerArray.length}개 항목`);
    
    // 데이터 변환
    const transformedData = {};
    tickerArray.forEach(ticker => {
      const transformedTicker = transformUpbitTickerData(ticker);
      if (transformedTicker) {
        transformedData[ticker.market] = transformedTicker;
      }
    });
    
    // 캐시 저장
    tickerCache.set(cacheKey, {
      data: transformedData,
      timestamp: now
    });
    
    logger.api(`업비트 ticker 데이터 변환 완료: ${Object.keys(transformedData).length}개 마켓`);
    return transformedData;
    
  } catch (error) {
    logger.error('업비트 ticker API 실패:', error.message);
    
    // 캐시에서 이전 데이터 반환
    if (tickerCache.has(cacheKey)) {
      const cached = tickerCache.get(cacheKey);
      logger.debug('업비트 ticker 캐시 데이터 반환 (API 실패)');
      return cached.data;
    }
    
    // 마지막 수단: Mock 데이터 반환
    logger.warn('API 실패로 업비트 Mock 데이터 사용');
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
    
    return {
      market: tickerData.market,
      trade_price: parseFloat(tickerData.trade_price || 0),
      change: parseFloat(tickerData.change_price || 0),
      change_rate: parseFloat(tickerData.change_rate || 0),
      change_percent: changePercent,
      acc_trade_volume_24h: parseFloat(tickerData.acc_trade_volume_24h || 0),
      high_price: parseFloat(tickerData.high_price || 0),
      low_price: parseFloat(tickerData.low_price || 0),
      timestamp: tickerData.timestamp || Date.now(),
      source: 'upbit-rest-api'
    };
  } catch (error) {
    console.error('❌ 업비트 ticker 데이터 변환 실패:', error, tickerData);
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
  console.log('🗑️ 업비트 ticker 캐시 초기화');
}

// 기본 export
export default {
  getBatchUpbitTickerData,
  getUpbitTickerData,
  transformUpbitTickerData,
  clearUpbitTickerCache
};