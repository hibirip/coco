/**
 * 업비트 REST API 서비스 - 실시간 ticker 데이터
 * WebSocket 백업용 REST API 호출
 */

import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/api';

// 업비트 API 설정
const UPBIT_API_CONFIG = {
  // 모든 환경에서 프록시 경유 (통일된 방식)
  BASE_URL: API_CONFIG.UPBIT.BASE_URL,
  TICKER_ENDPOINT: API_CONFIG.UPBIT.TICKER,
  USE_MOCK: true, // Mock 데이터 활성화 (API 실패시 백업)
  CACHE_DURATION: API_CONFIG.COMMON.CACHE_DURATION.TICKER,
  TIMEOUT: 8000 // 8초 타임아웃
};

// 캐시 저장소
const tickerCache = new Map();


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
    
    // 모든 환경에서 동일한 방식으로 직접 호출 (로컬 기준)
    const url = `${UPBIT_API_CONFIG.BASE_URL}${UPBIT_API_CONFIG.TICKER_ENDPOINT}?markets=${marketsParam}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPBIT_API_CONFIG.TIMEOUT);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // 모든 환경에서 동일한 방식으로 JSON 파싱 (로컬 기준)
    const tickerArray = await response.json();
    
    logger.performance(`업비트 ticker 응답: ${tickerArray.length}개 항목`);
    
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
    
    // API 실패시 Mock 데이터 생성
    if (UPBIT_API_CONFIG.USE_MOCK) {
      logger.info('업비트 API 실패, Mock 데이터 생성 중...');
      return generateMockUpbitTickerData(markets);
    }
    
    // Mock 데이터도 비활성화된 경우 빈 객체 반환
    logger.error('업비트 API 완전 실패 (Mock 비활성화)');
    return {};
  }
}

/**
 * Mock 업비트 ticker 데이터 생성
 * @param {Array} markets - 마켓 배열
 * @returns {Object} Mock ticker 데이터 맵
 */
function generateMockUpbitTickerData(markets) {
  const mockData = {};
  
  // 기본 가격 데이터 (환율 1380 기준 + 김치프리미엄)
  const baseData = {
    'KRW-BTC': {
      trade_price: 60500000,  // $42,750 * 1380 * 1.024 (2.4% 김프)
      change_price: 1200000,
      change_rate: 0.024, // 2.4%
      high_price: 62000000,
      low_price: 59000000,
      acc_trade_volume_24h: 2500.5
    },
    'KRW-ETH': {
      trade_price: 3480000,   // $2,465 * 1380 * 1.023 (2.3% 김프)
      change_price: 85000,
      change_rate: 0.025,
      high_price: 3550000,
      low_price: 3350000,
      acc_trade_volume_24h: 15800.3
    },
    'KRW-XRP': {
      trade_price: 730,       // $0.514 * 1380 * 1.03 (3% 김프)
      change_price: 35,
      change_rate: 0.05,
      high_price: 750,
      low_price: 680,
      acc_trade_volume_24h: 850000.8
    },
    'KRW-ADA': {
      trade_price: 535,       // $0.377 * 1380 * 1.029 (2.9% 김프)
      change_price: -12,
      change_rate: -0.022,
      high_price: 560,
      low_price: 520,
      acc_trade_volume_24h: 650000.2
    },
    'KRW-SOL': {
      trade_price: 132000,    // $94.2 * 1380 * 1.015 (1.5% 김프)
      change_price: 4500,
      change_rate: 0.035,
      high_price: 135000,
      low_price: 125000,
      acc_trade_volume_24h: 12800.4
    },
    'KRW-DOT': {
      trade_price: 8700,      // $6.16 * 1380 * 1.024 (2.4% 김프)
      change_price: -180,
      change_rate: -0.02,
      high_price: 9100,
      low_price: 8500,
      acc_trade_volume_24h: 45000.6
    },
    'KRW-LINK': {
      trade_price: 20300,     // $14.35 * 1380 * 1.025 (2.5% 김프)
      change_price: 850,
      change_rate: 0.043,
      high_price: 21000,
      low_price: 19200,
      acc_trade_volume_24h: 28000.7
    },
    'KRW-UNI': {
      trade_price: 9500,      // 약 2.2% 김프
      change_price: 250,
      change_rate: 0.027,
      high_price: 9800,
      low_price: 9100,
      acc_trade_volume_24h: 18500.9
    },
    'KRW-AVAX': {
      trade_price: 49000,     // 약 2% 김프
      change_price: -980,
      change_rate: -0.019,
      high_price: 51000,
      low_price: 47500,
      acc_trade_volume_24h: 8900.1
    }
  };
  
  markets.forEach(market => {
    const base = baseData[market];
    if (base) {
      // 약간의 랜덤 변동 추가 (±2%)
      const variation = (Math.random() - 0.5) * 0.04;
      const currentPrice = base.trade_price * (1 + variation);
      
      mockData[market] = {
        market,
        trade_price: Math.round(currentPrice),
        change: Math.round(base.change_price * (1 + variation * 0.5)),
        change_rate: base.change_rate + (variation * 0.1),
        change_percent: (base.change_rate + (variation * 0.1)) * 100,
        acc_trade_volume_24h: base.acc_trade_volume_24h * (1 + Math.random() * 0.1),
        high_price: Math.round(base.high_price * (1 + variation * 0.3)),
        low_price: Math.round(base.low_price * (1 + variation * 0.3)),
        timestamp: Date.now(),
        source: 'mock-upbit-rest'
      };
    } else {
      // 기본값이 없는 마켓은 기본 Mock 데이터 생성
      const basePrice = 10000 + Math.random() * 90000;
      const changeRate = (Math.random() - 0.5) * 0.1; // ±5%
      
      mockData[market] = {
        market,
        trade_price: Math.round(basePrice),
        change: Math.round(basePrice * changeRate),
        change_rate: changeRate,
        change_percent: changeRate * 100,
        acc_trade_volume_24h: Math.random() * 100000,
        high_price: Math.round(basePrice * 1.08),
        low_price: Math.round(basePrice * 0.92),
        timestamp: Date.now(),
        source: 'mock-upbit-rest'
      };
    }
  });
  
  logger.info(`Mock 업비트 데이터 생성: ${Object.keys(mockData).length}개 마켓`);
  return mockData;
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