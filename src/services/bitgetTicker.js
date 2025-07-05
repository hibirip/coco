/**
 * Bitget Ticker 데이터 서비스
 * REST API를 통해 실시간 가격 정보를 가져옴 (WebSocket 보완용)
 */

// Bitget REST API 설정
const BITGET_TICKER_CONFIG = {
  // 개발환경에서는 proxy 사용, 배포환경에서는 Mock 모드 사용
  BASE_URL: '/api/bitget',
  USE_MOCK: !import.meta.env.DEV, // 배포환경에서는 Mock 데이터 사용
  TICKERS_ENDPOINT: '/api/v2/spot/market/tickers',
  SINGLE_TICKER_ENDPOINT: '/api/v2/spot/market/ticker',
  CACHE_TTL: 30 * 1000, // 30초 캐시
  REQUEST_TIMEOUT: 10000 // 10초 타임아웃
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
    
    const url = `${BITGET_TICKER_CONFIG.BASE_URL}${BITGET_TICKER_CONFIG.SINGLE_TICKER_ENDPOINT}?${params}`;
    
    console.log(`📊 Bitget Ticker API 요청: ${symbol}`);
    
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
    
    const data = await response.json();
    
    if (data.code !== '00000' || !data.data) {
      throw new Error(`API Error: ${data.msg || 'Unknown error'}`);
    }
    
    console.log(`✅ Bitget Ticker 데이터 수신: ${symbol}`);
    return data.data;
    
  } catch (error) {
    console.error(`❌ Bitget Ticker API 오류 (${symbol}):`, error.message);
    throw error;
  }
}

/**
 * Mock 데이터 생성 (배포환경용)
 */
function generateMockTickerData() {
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

  return symbols.map(symbol => {
    // 각 코인별로 다른 가격대 설정
    let basePrice = 50;
    if (symbol === 'BTCUSDT') basePrice = 43000;
    else if (symbol === 'ETHUSDT') basePrice = 2500;
    else if (symbol === 'BNBUSDT') basePrice = 300;
    else if (symbol === 'XRPUSDT') basePrice = 0.5;
    else if (symbol === 'ADAUSDT') basePrice = 0.4;
    else if (symbol === 'DOGEUSDT') basePrice = 0.08;
    else if (symbol === 'SHIBUSDT') basePrice = 0.000012;
    
    const price = basePrice * (1 + (Math.random() - 0.5) * 0.05); // ±2.5% 변동
    const change24h = (Math.random() - 0.5) * 0.1; // ±5% 변동
    const volume = Math.random() * 100000000;
    
    return {
      symbol,
      lastPr: price.toString(),
      open: (price / (1 + change24h)).toString(),
      change24h: change24h.toString(),
      quoteVolume: volume.toString(),
      baseVolume: (volume / price).toString(),
      ts: Date.now().toString()
    };
  });
}

/**
 * 실제 Bitget Tickers API 호출 (모든 심볼)
 */
async function fetchAllBitgetTickersData() {
  // 배포환경에서는 Mock 데이터 사용
  if (BITGET_TICKER_CONFIG.USE_MOCK) {
    console.log('📊 Mock 데이터 사용 (배포환경)');
    return generateMockTickerData();
  }
  
  try {
    const url = `${BITGET_TICKER_CONFIG.BASE_URL}${BITGET_TICKER_CONFIG.TICKERS_ENDPOINT}`;
    
    console.log('📊 Bitget All Tickers API 요청');
    
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
    
    const data = await response.json();
    
    if (data.code !== '00000' || !data.data) {
      throw new Error(`API Error: ${data.msg || 'Unknown error'}`);
    }
    
    console.log(`✅ Bitget All Tickers 데이터 수신: ${data.data.length}개`);
    return data.data;
    
  } catch (error) {
    console.error('❌ Bitget All Tickers API 오류:', error.message);
    // API 실패시 Mock 데이터로 폴백
    console.log('📊 API 실패로 Mock 데이터 사용');
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
    console.error('❌ Ticker 데이터 변환 오류:', error);
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
      console.log(`🔄 캐시된 Ticker 데이터 사용: ${symbol}`);
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
    console.error(`❌ Ticker 데이터 가져오기 실패 (${symbol}):`, error.message);
    throw error;
  }
}

/**
 * 여러 심볼의 Ticker 데이터를 병렬로 가져오기
 * @param {Array} symbols - 심볼 배열
 * @returns {Promise<Object>} 심볼별 티커 데이터 객체
 */
export async function getBatchTickerData(symbols) {
  console.log(`📊 배치 Ticker 데이터 요청: ${symbols.length}개 심볼`);
  
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
        console.warn(`⚠️ Ticker 데이터 없음: ${symbol}`);
      }
    });
    
    console.log(`✅ 배치 Ticker 완료: ${successCount}/${symbols.length}개 성공`);
    return tickerDataMap;
    
  } catch (error) {
    console.error('❌ 배치 Ticker 데이터 오류:', error);
    
    // 실패 시 개별 요청으로 대체
    console.log('🔄 개별 Ticker 요청으로 대체 시도');
    
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
        console.warn(`⚠️ Ticker 데이터 실패 (${symbol}): ${error}`);
      }
    });
    
    console.log(`✅ 개별 Ticker 완료: ${successCount}/${symbols.length}개 성공`);
    return tickerDataMap;
  }
}

/**
 * 캐시 정리
 */
export function clearTickerCache() {
  tickerCache.clear();
  console.log('🧹 Ticker 캐시 정리 완료');
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