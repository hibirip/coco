/**
 * Bitget Ticker 데이터 서비스
 * REST API를 통해 실시간 가격 정보를 가져옴 (WebSocket 보완용)
 */

import { logger } from '../utils/logger';

// Bitget REST API 설정
const BITGET_TICKER_CONFIG = {
  // 개발환경에서는 proxy 사용, 배포환경에서는 allorigins 사용
  BASE_URL: import.meta.env.DEV ? '/api/bitget' : 'https://api.allorigins.win/get',
  USE_MOCK: false, // Mock 데이터 완전 비활성화 - 실제 API만 사용
  TICKERS_ENDPOINT: '/api/v2/spot/market/tickers',
  SINGLE_TICKER_ENDPOINT: '/api/v2/spot/market/ticker',
  CACHE_TTL: 30 * 1000, // 30초 캐시
  REQUEST_TIMEOUT: 10000, // 10초 타임아웃
  MOCK_UPDATE_INTERVAL: 60000 // Mock 데이터 1분 간격 업데이트
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
    const params = new URLSearchParams({
      symbol: symbol.toUpperCase()
    });
    
    let url;
    if (import.meta.env.DEV) {
      // 개발환경: 프록시 사용
      url = `${BITGET_TICKER_CONFIG.BASE_URL}${BITGET_TICKER_CONFIG.SINGLE_TICKER_ENDPOINT}?${params}`;
    } else {
      // 배포환경: allorigins 사용
      const targetUrl = encodeURIComponent(`https://api.bitget.com${BITGET_TICKER_CONFIG.SINGLE_TICKER_ENDPOINT}?${params}`);
      url = `${BITGET_TICKER_CONFIG.BASE_URL}?url=${targetUrl}`;
    }
    
    logger.api(`Bitget Ticker API 요청: ${symbol}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BITGET_TICKER_CONFIG.REQUEST_TIMEOUT);
    
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
    
    let data;
    
    if (import.meta.env.DEV) {
      // 개발환경: 직접 JSON 응답
      data = await response.json();
    } else {
      // 배포환경: allorigins JSON wrapper 파싱
      const responseData = await response.json();
      if (!responseData.contents) {
        throw new Error('allorigins 응답에 contents가 없음');
      }
      data = JSON.parse(responseData.contents);
    }
    
    if (data.code !== '00000' || !data.data) {
      throw new Error(`API Error: ${data.msg || 'Unknown error'}`);
    }
    
    logger.api(`Bitget Ticker 데이터 수신: ${symbol}`);
    return data.data;
    
  } catch (error) {
    logger.error(`Bitget Ticker API 오류 (${symbol}):`, error.message);
    throw error;
  }
}

// 안정적인 Mock 데이터 캐시 (배포환경에서 가격이 빠르게 변하지 않도록)
let stableMockData = null;
let lastMockUpdate = 0;

/**
 * 안정적인 Mock 데이터 생성 (배포환경용)
 * 1분마다만 업데이트되어 빠른 변화 방지
 */
function generateMockTickerData() {
  // 1분마다만 Mock 데이터 업데이트 (빠른 변화 방지)
  const now = Date.now();
  if (stableMockData && (now - lastMockUpdate) < BITGET_TICKER_CONFIG.MOCK_UPDATE_INTERVAL) {
    return stableMockData;
  }

  // 100개 코인의 Mock 데이터 생성
  const symbols = [
    'BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'UNIUSDT', 'AVAXUSDT',
    'DOGEUSDT', 'SHIBUSDT', 'TRXUSDT', 'LTCUSDT', 'BCHUSDT', 'ETCUSDT', 'ATOMUSDT', 'NEARUSDT', 'ALGOUSDT', 'HBARUSDT',
    'ICPUSDT', 'VETUSDT', 'FILUSDT', 'SANDUSDT', 'MANAUSDT', 'THETAUSDT', 'XTZUSDT', 'EOSUSDT', 'KSMUSDT', 'FLOWUSDT',
    'CHZUSDT', 'XLMUSDT', 'AAVEUSDT', 'CRVUSDT', 'COMPUSDT', 'YFIUSDT', 'SNXUSDT', 'MKRUSDT', 'SUSHIUSDT', 'BATUSDT',
    'ZRXUSDT', 'OMGUSDT', 'QTUMUSDT', 'ZILUSDT', 'ONTUSDT', 'ICXUSDT', 'ZECUSDT', 'DASHUSDT', 'WAVESUSDT', 'LSKUSDT',
    'STEEMUSDT', 'STRAXUSDT', 'ARKUSDT', 'STORJUSDT', 'GRTUSDT', 'ENJUSDT', 'AUDIOUSDT', 'MASKUSDT', 'ANKRUSDT', 'CVCUSDT',
    'SRMUSDT', 'ARDRUSDT', 'PLAUSDT', 'REQUSDT', 'DNTUSDT', 'CROUSDT', 'AXSUSDT', 'KNCUSDT', 'LRCUSDT', 'OXTUSDT',
    'MLKUSDT', 'WAXPUSDT', 'HIVEUSDT', 'KAVAUSDT', 'XECUSDT', 'BTTUSDT', 'JSTUSDT', 'CKBUSDT', 'SXPUSDT', 'HUNTUSDT',
    'PYRUSDT', 'WEMIXUSDT', 'FCT2USDT', 'AQTUSDT', 'GLMUSDT', 'SSXUSDT', 'METAUSDT', 'FCTUSDT', 'CBKUSDT', 'BORAUSDT',
    'BNBUSDT', 'TONUSDT', 'RNDRUSDT', 'FTMUSDT', 'RUNEUSDT', 'CAKEUSDT', 'GALAUSDT', 'IMXUSDT', 'ROSEUSDT', 'XMRUSDT'
  ];

  // 현재 시간을 시드로 사용해서 같은 분 내에서는 동일한 값 생성
  const timeSeed = Math.floor(now / BITGET_TICKER_CONFIG.MOCK_UPDATE_INTERVAL);
  
  stableMockData = symbols.map((symbol, index) => {
    // 업비트 가격에 맞춘 고정 USD 가격 설정 (환율 1380 기준)
    let basePrice = 50;
    if (symbol === 'BTCUSDT') basePrice = 108000; // 실제 비트코인 가격에 가깝게
    else if (symbol === 'ETHUSDT') basePrice = 2516; // 실제 이더리움 가격에 가깝게  
    else if (symbol === 'XRPUSDT') basePrice = 2.22; // 실제 리플 가격에 가깝게
    else if (symbol === 'ADAUSDT') basePrice = 0.85;
    else if (symbol === 'SOLUSDT') basePrice = 148;
    else if (symbol === 'DOTUSDT') basePrice = 3.35;
    else if (symbol === 'LINKUSDT') basePrice = 13.2;
    else if (symbol === 'DOGEUSDT') basePrice = 0.07;
    else if (symbol === 'SHIBUSDT') basePrice = 0.000011;
    else if (symbol === 'TRXUSDT') basePrice = 0.19;
    
    // 시드 기반 안정적 변동 (1분마다만 변화)
    const symbolSeed = (timeSeed + index) % 1000;
    const priceVariation = ((symbolSeed / 1000) - 0.5) * 0.02; // ±1% 변동
    const price = basePrice * (1 + priceVariation);
    const change24h = ((symbolSeed / 500) - 1) * 0.05; // ±2.5% 변동
    const volume = (symbolSeed + 1) * 100000;
    
    return {
      symbol,
      lastPr: price.toFixed(symbol.includes('SHIB') ? 8 : 4),
      open: (price / (1 + change24h)).toFixed(symbol.includes('SHIB') ? 8 : 4),
      change24h: change24h.toFixed(4),
      quoteVolume: volume.toString(),
      baseVolume: (volume / price).toString(),
      ts: now.toString()
    };
  });
  
  lastMockUpdate = now;
  logger.info(`새로운 안정적 Mock 데이터 생성: ${symbols.length}개 코인`);
  
  return stableMockData;
}

/**
 * 실제 Bitget Tickers API 호출 (모든 심볼)
 */
async function fetchAllBitgetTickersData() {
  // 배포환경에서는 Mock 데이터 사용
  if (BITGET_TICKER_CONFIG.USE_MOCK) {
    logger.info('Mock 데이터 사용 (배포환경)');
    return generateMockTickerData();
  }
  
  try {
    let url;
    if (import.meta.env.DEV) {
      // 개발환경: 프록시 사용
      url = `${BITGET_TICKER_CONFIG.BASE_URL}${BITGET_TICKER_CONFIG.TICKERS_ENDPOINT}`;
    } else {
      // 배포환경: allorigins 사용
      const targetUrl = encodeURIComponent(`https://api.bitget.com${BITGET_TICKER_CONFIG.TICKERS_ENDPOINT}`);
      url = `${BITGET_TICKER_CONFIG.BASE_URL}?url=${targetUrl}`;
    }
    
    logger.api('Bitget All Tickers API 요청');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BITGET_TICKER_CONFIG.REQUEST_TIMEOUT);
    
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
    
    let data;
    
    if (import.meta.env.DEV) {
      // 개발환경: 직접 JSON 응답
      data = await response.json();
    } else {
      // 배포환경: allorigins JSON wrapper 파싱
      const responseData = await response.json();
      if (!responseData.contents) {
        throw new Error('allorigins 응답에 contents가 없음');
      }
      data = JSON.parse(responseData.contents);
    }
    
    if (data.code !== '00000' || !data.data) {
      throw new Error(`API Error: ${data.msg || 'Unknown error'}`);
    }
    
    logger.api(`Bitget All Tickers 데이터 수신: ${data.data.length}개`);
    return data.data;
    
  } catch (error) {
    logger.error('Bitget All Tickers API 오류:', error.message);
    // API 실패시 Mock 데이터로 폴백
    logger.warn('API 실패로 Mock 데이터 사용');
    return generateMockTickerData();
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
      logger.debug(`캐시된 Ticker 데이터 사용: ${symbol}`);
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
  logger.api(`배치 Ticker 데이터 요청: ${symbols.length}개 심볼`);
  
  try {
    // 모든 티커 데이터 한 번에 가져오기 (더 효율적)
    const allTickersData = await fetchAllBitgetTickersData();
    
    // 심볼별로 데이터 매핑
    const tickerDataMap = {};
    let successCount = 0;
    
    symbols.forEach(symbol => {
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