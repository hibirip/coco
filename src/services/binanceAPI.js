/**
 * Binance API 서비스
 * REST API를 통해 실시간 가격 정보를 가져옴
 */

import { logger } from '../utils/logger';

// Binance REST API 설정
const BINANCE_API_CONFIG = {
  BASE_URL: 'https://api.binance.com',
  TICKER_24HR_ENDPOINT: '/api/v3/ticker/24hr',
  TICKER_PRICE_ENDPOINT: '/api/v3/ticker/price',
  CACHE_TTL: 30 * 1000, // 30초 캐시
  REQUEST_TIMEOUT: 10000, // 10초 타임아웃
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
  
  if (cached && Date.now() - cached.timestamp < BINANCE_API_CONFIG.CACHE_TTL) {
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
 * 실제 Binance Ticker API 호출 (단일 심볼)
 * @param {string} symbol - 심볼 (예: 'BTCUSDT')
 */
async function fetchBinanceTickerData(symbol) {
  try {
    const params = new URLSearchParams({
      symbol: symbol.toUpperCase()
    });
    
    const url = `${BINANCE_API_CONFIG.BASE_URL}${BINANCE_API_CONFIG.TICKER_24HR_ENDPOINT}?${params}`;
    
    logger.api(`Binance Ticker API 요청: ${symbol}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BINANCE_API_CONFIG.REQUEST_TIMEOUT);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    logger.api(`Binance Ticker 데이터 수신: ${symbol}`);
    return data;
    
  } catch (error) {
    logger.error(`Binance Ticker API 오류 (${symbol}):`, error.message);
    throw error;
  }
}

/**
 * 실제 Binance All Tickers API 호출 (모든 심볼)
 */
async function fetchAllBinanceTickersData() {
  try {
    const url = `${BINANCE_API_CONFIG.BASE_URL}${BINANCE_API_CONFIG.TICKER_24HR_ENDPOINT}`;
    
    logger.api('Binance All Tickers API 요청');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BINANCE_API_CONFIG.REQUEST_TIMEOUT);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    logger.api(`Binance All Tickers 데이터 수신: ${data.length}개`);
    return data;
    
  } catch (error) {
    logger.error('Binance All Tickers API 오류:', error.message);
    throw error;
  }
}

/**
 * Binance API 데이터를 표준 형식으로 변환
 * @param {Object} tickerData - Binance API에서 받은 ticker 데이터
 * @returns {Object} 표준화된 가격 데이터
 */
export function transformBinanceTickerData(tickerData) {
  if (!tickerData) return null;
  
  try {
    // Binance API 응답 형식:
    // {
    //   "symbol": "BTCUSDT",
    //   "priceChange": "-94.99999800",
    //   "priceChangePercent": "-0.317",
    //   "weightedAvgPrice": "46456.89040129",
    //   "prevClosePrice": "47094.00000000",
    //   "lastPrice": "46999.00000100",
    //   "lastQty": "0.00002000",
    //   "bidPrice": "46998.99000000",
    //   "bidQty": "0.78025000",
    //   "askPrice": "46999.00000000",
    //   "askQty": "0.36092000",
    //   "openPrice": "47094.00000000",
    //   "highPrice": "47294.00000000",
    //   "lowPrice": "46103.00000000",
    //   "volume": "18495.35066000",
    //   "quoteVolume": "858781639.93903900",
    //   "openTime": 1641895800000,
    //   "closeTime": 1641982199999,
    //   "count": 715432
    // }
    
    const symbol = tickerData.symbol;
    const price = parseFloat(tickerData.lastPrice || 0);
    const change24h = parseFloat(tickerData.priceChange || 0);
    const changePercent24h = parseFloat(tickerData.priceChangePercent || 0);
    
    return {
      symbol,
      price,
      change24h,
      changePercent24h,
      volume24h: parseFloat(tickerData.volume || 0),
      volumeUsdt24h: parseFloat(tickerData.quoteVolume || 0),
      high24h: parseFloat(tickerData.highPrice || 0),
      low24h: parseFloat(tickerData.lowPrice || 0),
      bid: parseFloat(tickerData.bidPrice || 0),
      ask: parseFloat(tickerData.askPrice || 0),
      timestamp: parseInt(tickerData.closeTime || Date.now()),
      source: 'binance-rest'
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
      logger.debug(`캐시된 Ticker 데이터 사용: ${symbol}`);
      return cachedData;
    }
    
    // API 호출
    const tickerData = await fetchBinanceTickerData(symbol);
    
    if (!tickerData) {
      throw new Error(`심볼을 찾을 수 없음: ${symbol}`);
    }
    
    // 데이터 변환
    const transformedData = transformBinanceTickerData(tickerData);
    
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
  logger.api(`배치 Ticker 데이터 요청: ${symbols.length}개 심볼`);
  
  try {
    // 모든 티커 데이터 한 번에 가져오기 (더 효율적)
    const allTickersData = await fetchAllBinanceTickersData();
    
    // 심볼별로 데이터 매핑
    const tickerDataMap = {};
    let successCount = 0;
    
    symbols.forEach(symbol => {
      const tickerData = allTickersData.find(ticker => ticker.symbol === symbol.toUpperCase());
      
      if (tickerData) {
        const transformedData = transformBinanceTickerData(tickerData);
        if (transformedData) {
          tickerDataMap[symbol] = transformedData;
          setCachedData(symbol, transformedData); // 캐시에도 저장
          successCount++;
        }
      } else {
        logger.warn(`Ticker 데이터 없음: ${symbol}`);
      }
    });
    
    logger.api(`배치 Ticker 완료: ${successCount}/${symbols.length}개 성공`);
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
    
    results.forEach(({ symbol, data, error }) => {
      if (data && !error) {
        tickerDataMap[symbol] = data;
        successCount++;
      } else {
        logger.warn(`Ticker 데이터 실패 (${symbol}): ${error}`);
      }
    });
    
    logger.api(`개별 Ticker 완료: ${successCount}/${symbols.length}개 성공`);
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
    if (currentTime - timestamp < BINANCE_API_CONFIG.CACHE_TTL) {
      validEntries++;
    }
  });
  
  return {
    total: totalEntries,
    valid: validEntries,
    expired: totalEntries - validEntries,
    ttl: BINANCE_API_CONFIG.CACHE_TTL
  };
}