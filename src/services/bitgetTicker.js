/**
 * Bitget Ticker 데이터 서비스
 * REST API를 통해 실시간 가격 정보를 가져옴 (WebSocket 보완용)
 */

import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/api';

// Bitget REST API 설정
const BITGET_TICKER_CONFIG = {
  // 환경별 API 설정
  get BASE_URL() {
    try {
      return API_CONFIG.BITGET.BASE_URL;
    } catch (error) {
      // 배포환경에서 Bitget API 사용 불가 시 null 반환
      logger.warn('Bitget REST API는 배포환경에서 사용할 수 없습니다 (WebSocket 사용)');
      return null;
    }
  },
  USE_MOCK: false,
  TICKERS_ENDPOINT: API_CONFIG.BITGET.TICKER,
  SINGLE_TICKER_ENDPOINT: API_CONFIG.BITGET.SINGLE_TICKER,
  CACHE_TTL: API_CONFIG.COMMON.CACHE_DURATION.TICKER,
  REQUEST_TIMEOUT: 3000
};

// 메모리 캐시
const tickerCache = new Map();

/**
 * 티커 데이터 캐시 키 생성
 */
function getCacheKey(symbol) {
  return `ticker_${symbol}`;
}

/**
 * 캐시된 데이터 확인
 */
function getCachedData(symbol) {
  const key = getCacheKey(symbol);
  const cached = tickerCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < BITGET_TICKER_CONFIG.CACHE_TTL) {
    return cached.data;
  }
  
  return null;
}

/**
 * 데이터 캐시에 저장
 */
function setCachedData(symbol, data) {
  const key = getCacheKey(symbol);
  tickerCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * 실제 Bitget Ticker API 호출 (단일 심볼)
 * @param {string} symbol - 심볼 (예: 'BTCUSDT')
 */
async function fetchBitgetTickerData(symbol) {
  try {
    // 배포환경에서는 REST API 사용 불가
    if (!BITGET_TICKER_CONFIG.BASE_URL) {
      throw new Error('Bitget REST API not available in production environment');
    }
    
    const params = new URLSearchParams({
      symbol: symbol.toUpperCase()
    });
    
    const url = `${BITGET_TICKER_CONFIG.BASE_URL}${BITGET_TICKER_CONFIG.SINGLE_TICKER_ENDPOINT}?${params}`;
    
    logger.performance(`Bitget Ticker API 요청: ${symbol}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BITGET_TICKER_CONFIG.REQUEST_TIMEOUT);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // 모든 환경에서 동일한 방식으로 JSON 파싱 (로컬 기준)
    const data = await response.json();
    
    if (data.code !== '00000' || !data.data) {
      throw new Error(`API Error: ${data.msg || 'Unknown error'}`);
    }
    
    logger.performance(`Bitget Ticker 데이터 수신: ${symbol}`);
    return data.data;
    
  } catch (error) {
    logger.error(`Bitget Ticker API 오류 (${symbol}):`, error.message);
    throw error;
  }
}


/**
 * 실제 Bitget Tickers API 호출 (모든 심볼)
 */
async function fetchAllBitgetTickersData() {
  
  try {
    // 모든 환경에서 동일한 프록시 사용 (로컬 기준)
    const url = `${BITGET_TICKER_CONFIG.BASE_URL}${BITGET_TICKER_CONFIG.TICKERS_ENDPOINT}`;
    
    logger.performance('Bitget All Tickers API 요청');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BITGET_TICKER_CONFIG.REQUEST_TIMEOUT);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // 모든 환경에서 동일한 방식으로 JSON 파싱 (로컬 기준)
    const data = await response.json();
    
    if (data.code !== '00000' || !data.data) {
      throw new Error(`API Error: ${data.msg || 'Unknown error'}`);
    }
    
    logger.performance(`Bitget All Tickers 데이터 수신: ${data.data.length}개`);
    return data.data;
    
  } catch (error) {
    logger.error('Bitget All Tickers API 오류:', error.message);
    // API 실패시 에러 반환
    throw error;
  }
}

/**
 * Bitget API 데이터를 표준 형식으로 변환
 * @param {Object} tickerData - Bitget API에서 받은 ticker 데이터
 * @returns {Object} 표준화된 가격 데이터
 */
export function transformBitgetTickerData(tickerData) {
  if (!tickerData) return null;
  
  try {
    // Bitget API 응답 형식:
    // {
    //   "symbol": "BTCUSDT",
    //   "open": "109037",
    //   "high24h": "109037.01",
    //   "low24h": "107253.11",
    //   "lastPr": "108206.54",
    //   "quoteVolume": "287476852.004261",
    //   "baseVolume": "2663.697135",
    //   "usdtVolume": "287476852.004260036699",
    //   "ts": "1751716111258",
    //   "bidPr": "108206.54",
    //   "askPr": "108206.55",
    //   "change24h": "-0.00762",
    //   "changeUtc24h": "0.00193"
    // }
    
    const symbol = tickerData.symbol;
    const price = parseFloat(tickerData.lastPr || 0);
    const open24h = parseFloat(tickerData.open || price);
    const change24h = price - open24h;
    const changePercent24h = parseFloat(tickerData.change24h || 0) * 100; // Bitget은 소수로 제공 (0.01 = 1%)
    
    return {
      symbol,
      price,
      change24h,
      changePercent24h,
      volume24h: parseFloat(tickerData.baseVolume || 0),
      volumeUsdt24h: parseFloat(tickerData.usdtVolume || 0),
      high24h: parseFloat(tickerData.high24h || 0),
      low24h: parseFloat(tickerData.low24h || 0),
      bid: parseFloat(tickerData.bidPr || 0),
      ask: parseFloat(tickerData.askPr || 0),
      timestamp: parseInt(tickerData.ts || Date.now()),
      source: 'bitget-rest'
    };
  } catch (error) {
    logger.error('Ticker 데이터 변환 오류:', error);
    return null;
  }
}

/**
 * 단일 심볼 Ticker 데이터 가져오기 (캐시 + API)
 * @param {string} symbol - 심볼
 * @returns {Promise<Object>} 티커 데이터
 */
export async function getTickerData(symbol) {
  try {
    // 캐시 확인
    const cachedData = getCachedData(symbol);
    if (cachedData) {
      logger.performance(`캐시된 Ticker 데이터 사용: ${symbol}`);
      return cachedData;
    }
    
    
    // 전체 티커에서 단일 심볼 찾기 (단일 API가 작동하지 않으므로)
    const allTickersData = await fetchAllBitgetTickersData();
    const tickerData = allTickersData.find(ticker => ticker.symbol === symbol.toUpperCase());
    
    if (!tickerData) {
      throw new Error(`심볼을 찾을 수 없음: ${symbol}`);
    }
    
    // 데이터 변환
    const transformedData = transformBitgetTickerData(tickerData);
    
    if (!transformedData) {
      throw new Error('데이터 변환 실패');
    }
    
    // 캐시에 저장
    setCachedData(symbol, transformedData);
    
    return transformedData;
    
  } catch (error) {
    logger.error(`Ticker 데이터 가져오기 실패 (${symbol}):`, error.message);
    
    throw error;
  }
}

/**
 * 여러 심볼의 Ticker 데이터를 병렬로 가져오기
 * @param {Array} symbols - 심볼 배열
 * @returns {Promise<Object>} 심볼별 티커 데이터 객체
 */
export async function getBatchTickerData(symbols) {
  logger.performance(`배치 Ticker 데이터 요청: ${symbols.length}개 심볼`);
  
  try {
    // 모든 티커 데이터 한 번에 가져오기 (더 효율적)
    const allTickersData = await fetchAllBitgetTickersData();
    
    // 심볼별로 데이터 매핑
    const tickerDataMap = {};
    let successCount = 0;
    
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const tickerData = allTickersData.find(ticker => ticker.symbol === symbol.toUpperCase());
      
      if (tickerData) {
        const transformedData = transformBitgetTickerData(tickerData);
        if (transformedData) {
          tickerDataMap[symbol] = transformedData;
          setCachedData(symbol, transformedData); // 캐시에도 저장
          successCount++;
        }
      } else {
        logger.warn(`Ticker 데이터 없음: ${symbol}`);
      }
    }
    
    logger.performance(`배치 Ticker 완료: ${successCount}/${symbols.length}개 성공`);
    return tickerDataMap;
    
  } catch (error) {
    logger.error('배치 Ticker 데이터 오류:', error);
    
    // 실패 시 개별 요청으로 대체
    logger.info('개별 Ticker 요청으로 대체 시도');
    
    const promises = symbols.map(symbol => 
      getTickerData(symbol)
        .then(data => ({ symbol, data, error: null }))
        .catch(error => ({ symbol, data: null, error: error.message }))
    );
    
    const results = await Promise.all(promises);
    
    const tickerDataMap = {};
    let successCount = 0;
    
    for (let i = 0; i < results.length; i++) {
      const { symbol, data, error } = results[i];
      if (data && !error) {
        tickerDataMap[symbol] = data;
        successCount++;
      } else {
        logger.warn(`Ticker 데이터 실패 (${symbol}): ${error}`);
      }
    }
    
    logger.performance(`개별 Ticker 완료: ${successCount}/${symbols.length}개 성공`);
    return tickerDataMap;
  }
}

/**
 * 캐시 정리
 */
export function clearTickerCache() {
  tickerCache.clear();
  logger.debug('Ticker 캐시 정리 완료');
}

/**
 * 캐시 통계
 */
export function getTickerCacheStats() {
  const totalEntries = tickerCache.size;
  const currentTime = Date.now();
  let validEntries = 0;
  
  tickerCache.forEach(({ timestamp }) => {
    if (currentTime - timestamp < BITGET_TICKER_CONFIG.CACHE_TTL) {
      validEntries++;
    }
  });
  
  return {
    total: totalEntries,
    valid: validEntries,
    expired: totalEntries - validEntries,
    ttl: BITGET_TICKER_CONFIG.CACHE_TTL
  };
}