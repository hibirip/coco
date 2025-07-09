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

  // 업비트 API는 한 번에 많은 마켓 요청 시 실패할 수 있음
  // 20개씩 나누어 요청 (안전한 청크 크기)
  const CHUNK_SIZE = 20;
  const chunks = [];
  
  for (let i = 0; i < markets.length; i += CHUNK_SIZE) {
    chunks.push(markets.slice(i, i + CHUNK_SIZE));
  }
  
  console.log(`[${isDevelopment ? 'Dev' : 'Prod'}] 업비트 마켓을 ${chunks.length}개 청크로 나누어 요청 (각 ${CHUNK_SIZE}개)`);

  try {
    logger.performance(`업비트 ticker API 호출: 총 ${markets.length}개 마켓 (${chunks.length}개 청크)`);
    
    // 모든 청크에서 데이터 수집
    const allTransformedData = {};
    
    // 각 청크별로 API 호출
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const marketsParam = chunk.join(',');
      const timestamp = Date.now();
      const url = `${UPBIT_API_CONFIG.BASE_URL}${UPBIT_API_CONFIG.TICKER_ENDPOINT}?markets=${marketsParam}&_t=${timestamp}`;
      
      console.log(`[${isDevelopment ? 'Dev' : 'Prod'}] Upbit API 청크 ${i + 1}/${chunks.length} 호출:`, {
        markets: chunk.length,
        firstMarket: chunk[0],
        lastMarket: chunk[chunk.length - 1]
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), UPBIT_API_CONFIG.TIMEOUT);
      
      try {
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
          console.error(`청크 ${i + 1} 실패: HTTP ${response.status}`);
          continue; // 실패한 청크는 건너뛰고 계속 진행
        }
        
        const tickerArray = await response.json();
        console.log(`청크 ${i + 1} 성공: ${tickerArray.length}개 데이터`);
        
        // 데이터 변환 및 병합
        for (const ticker of tickerArray) {
          const transformedTicker = transformUpbitTickerData(ticker);
          if (transformedTicker) {
            allTransformedData[ticker.market] = transformedTicker;
          }
        }
        
        // 청크 간 딜레이 (프록시 서버 부하 방지)
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } catch (chunkError) {
        console.error(`청크 ${i + 1} 에러:`, chunkError.message);
        // 에러가 발생해도 다음 청크 계속 처리
      }
    }
    
    console.log(`[${isDevelopment ? 'Dev' : 'Prod'}] Upbit API 전체 결과:`, {
      요청한_마켓수: markets.length,
      성공한_마켓수: Object.keys(allTransformedData).length,
      sampleMarket: allTransformedData['KRW-BTC']?.trade_price?.toLocaleString()
    });
    
    // 캐시 저장 (전체 결과)
    const cacheKey = markets.sort().join(',');
    tickerCache.set(cacheKey, {
      data: allTransformedData,
      timestamp: Date.now()
    });
    
    return allTransformedData;
    
  } catch (error) {
    logger.error('업비트 ticker API 실패:', error.message);
    
    // 캐시에서 이전 데이터 반환
    if (tickerCache.has(cacheKey)) {
      const cached = tickerCache.get(cacheKey);
      logger.debug('업비트 ticker 캐시 데이터 반환 (API 실패)');
      return cached.data;
    }
    
    // API 완전 실패시 빈 객체 반환 (Mock 데이터 사용하지 않음)
    console.error(`[${isDevelopment ? 'Dev' : 'Prod'}] Upbit API 완전 실패:`, {
      error: error.message,
      url: `${UPBIT_API_CONFIG.BASE_URL}${UPBIT_API_CONFIG.TICKER_ENDPOINT}`,
      markets: markets.length
    });
    return {};
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