/**
 * API 서비스 - 실시간 암호화폐 가격 데이터 fetching
 */

import { API_CONFIG } from '../config/api';

// API 엔드포인트 - 중앙화된 설정 사용
const API_ENDPOINTS = {
  BITGET: {
    BASE_URL: API_CONFIG.BITGET.BASE_URL,
    TICKER: API_CONFIG.BITGET.TICKER,
    PRICE: API_CONFIG.BITGET.TICKER
  },
  UPBIT: {
    BASE_URL: API_CONFIG.UPBIT.BASE_URL,
    TICKER: API_CONFIG.UPBIT.TICKER,
    MARKET: API_CONFIG.UPBIT.MARKET
  },
  EXCHANGE_RATE: {
    BASE_URL: API_CONFIG.EXCHANGE_RATE.BASE_URL,
    LATEST: API_CONFIG.EXCHANGE_RATE.LATEST
  }
};

// 요청 재시도 설정
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2
};

// 캐시 설정
const CACHE_CONFIG = {
  priceCache: new Map(),
  cacheTimeout: 10000 // 10초
};

/**
 * HTTP 요청 함수 (재시도 로직 포함)
 * @param {string} url - 요청 URL
 * @param {object} options - fetch 옵션
 * @param {number} retries - 재시도 횟수
 * @returns {Promise<Response>} fetch 응답
 */
async function fetchWithRetry(url, options = {}, retries = RETRY_CONFIG.maxRetries) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Coindex/1.0',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    if (retries > 0 && !error.name === 'AbortError') {
      console.warn(`API 요청 실패, ${retries}회 재시도 중...`, error.message);
      await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.retryDelay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * 캐시에서 데이터 가져오기
 * @param {string} key - 캐시 키
 * @returns {object|null} 캐시된 데이터 또는 null
 */
function getCachedData(key) {
  const cached = CACHE_CONFIG.priceCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_CONFIG.cacheTimeout) {
    return cached.data;
  }
  return null;
}

/**
 * 캐시에 데이터 저장
 * @param {string} key - 캐시 키
 * @param {object} data - 저장할 데이터
 */
function setCachedData(key, data) {
  CACHE_CONFIG.priceCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Bitget API - 단일 코인 가격 조회
 * @param {string} symbol - 코인 심볼 (예: 'BTCUSDT')
 * @returns {Promise<object>} 가격 정보
 */
export async function getBitgetPrice(symbol) {
  try {
    const cacheKey = `bitget_${symbol}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    // 심볼을 대문자로 변환
    const upperSymbol = symbol.toUpperCase();
    const url = `${API_ENDPOINTS.BITGET.BASE_URL}${API_ENDPOINTS.BITGET.PRICE}?symbol=${upperSymbol}`;
    
    console.log('📡 Bitget API 호출 (프록시):', url);
    const response = await fetchWithRetry(url);
    const data = await response.json();

    console.log('📊 Bitget API 응답:', data);

    if (data.code !== '00000' || !data.data) {
      throw new Error(`Bitget API 오류 (${data.code}): ${data.msg || '알 수 없는 오류'}`);
    }

    // data.data가 배열일 수 있으므로 확인
    const tickerData = Array.isArray(data.data) ? data.data[0] : data.data;
    
    if (!tickerData) {
      throw new Error('Bitget API: 티커 데이터가 없습니다');
    }

    const priceData = {
      symbol: tickerData.symbol,
      price: parseFloat(tickerData.lastPr || 0),
      change24h: parseFloat(tickerData.change24h || 0),
      changePercent24h: parseFloat(tickerData.change24h || 0) * 100, // 퍼센트로 변환
      volume24h: parseFloat(tickerData.baseVolume || 0),
      high24h: parseFloat(tickerData.high24h || 0),
      low24h: parseFloat(tickerData.low24h || 0),
      timestamp: Date.now(),
      source: 'bitget'
    };

    setCachedData(cacheKey, priceData);
    return priceData;
  } catch (error) {
    console.error('Bitget API 오류:', error);
    throw new Error(`Bitget API 호출 실패: ${error.message}`);
  }
}

/**
 * Upbit API - 단일 코인 가격 조회
 * @param {string} market - 마켓 코드 (예: 'KRW-BTC')
 * @returns {Promise<object>} 가격 정보
 */
export async function getUpbitPrice(market) {
  try {
    const cacheKey = `upbit_${market}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const url = `${API_ENDPOINTS.UPBIT.BASE_URL}${API_ENDPOINTS.UPBIT.TICKER}?markets=${market}`;
    const response = await fetchWithRetry(url);
    const data = await response.json();

    if (!data || !data[0]) {
      throw new Error('Upbit API 응답 데이터가 없습니다');
    }

    const tickerData = data[0];
    const priceData = {
      market: tickerData.market,
      price: tickerData.trade_price,
      change24h: tickerData.change_price,
      changePercent24h: tickerData.change_rate * 100,
      volume24h: tickerData.acc_trade_volume_24h,
      high24h: tickerData.high_price,
      low24h: tickerData.low_price,
      timestamp: Date.now(),
      source: 'upbit'
    };

    setCachedData(cacheKey, priceData);
    return priceData;
  } catch (error) {
    console.error('Upbit API 오류:', error);
    throw new Error(`Upbit API 호출 실패: ${error.message}`);
  }
}

/**
 * 환율 정보 조회 (USD -> KRW)
 * @returns {Promise<number>} USD/KRW 환율
 */
export async function getExchangeRate() {
  try {
    const cacheKey = 'exchange_rate_usd_krw';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    // Express 프록시 서버를 통한 환율 API 호출
    const url = `${API_ENDPOINTS.EXCHANGE_RATE.BASE_URL}${API_ENDPOINTS.EXCHANGE_RATE.LATEST}`;
    
    try {
      const response = await fetchWithRetry(url);
      const data = await response.json();
      
      if (data.success && data.rate) {
        setCachedData(cacheKey, data.rate);
        return data.rate;
      }
    } catch (apiError) {
      console.warn('환율 API 호출 실패, 고정값 사용:', apiError.message);
    }
    
    // 환율 API 실패 시 고정값 사용
    const fallbackRate = 1300;
    setCachedData(cacheKey, fallbackRate);
    return fallbackRate;
  } catch (error) {
    console.error('환율 조회 오류:', error);
    return 1300; // 기본값
  }
}

/**
 * 김치프리미엄 계산용 가격 쌍 조회
 * @param {string} coinSymbol - 코인 심볼 (예: 'BTC')
 * @returns {Promise<object>} 한국/해외 가격 정보
 */
export async function getKimchiPremiumData(coinSymbol) {
  try {
    const upperSymbol = coinSymbol.toUpperCase();
    
    // 병렬로 API 호출
    const [bitgetData, upbitData, exchangeRate] = await Promise.all([
      getBitgetPrice(`${upperSymbol}USDT`),
      getUpbitPrice(`KRW-${upperSymbol}`),
      getExchangeRate()
    ]);

    return {
      coinSymbol: upperSymbol,
      bitget: bitgetData,
      upbit: upbitData,
      exchangeRate: exchangeRate,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('김치프리미엄 데이터 조회 오류:', error);
    throw new Error(`김치프리미엄 데이터 조회 실패: ${error.message}`);
  }
}

/**
 * 여러 코인의 가격 정보를 한번에 조회
 * @param {Array<string>} symbols - 코인 심볼 배열
 * @returns {Promise<Array<object>>} 가격 정보 배열
 */
export async function getMultiplePrices(symbols) {
  try {
    const promises = symbols.map(symbol => 
      getKimchiPremiumData(symbol).catch(error => {
        console.error(`${symbol} 가격 조회 실패:`, error);
        return null;
      })
    );
    
    const results = await Promise.all(promises);
    return results.filter(Boolean); // null 제거
  } catch (error) {
    console.error('다중 가격 조회 오류:', error);
    throw new Error(`다중 가격 조회 실패: ${error.message}`);
  }
}

/**
 * 캐시 초기화
 */
export function clearCache() {
  CACHE_CONFIG.priceCache.clear();
  console.log('API 캐시가 초기화되었습니다.');
}

/**
 * API 상태 확인
 * @returns {Promise<object>} API 상태 정보
 */
export async function checkApiStatus() {
  const status = {
    bitget: false,
    upbit: false,
    exchangeRate: false,
    timestamp: Date.now()
  };

  try {
    // Bitget API 상태 확인
    await getBitgetPrice('BTCUSDT');
    status.bitget = true;
  } catch (error) {
    console.error('Bitget API 상태 확인 실패:', error.message);
  }

  try {
    // Upbit API 상태 확인
    await getUpbitPrice('KRW-BTC');
    status.upbit = true;
  } catch (error) {
    console.error('Upbit API 상태 확인 실패:', error.message);
  }

  try {
    // 환율 API 상태 확인
    await getExchangeRate();
    status.exchangeRate = true;
  } catch (error) {
    console.error('환율 API 상태 확인 실패:', error.message);
  }

  return status;
}

// 기본 export
export default {
  getBitgetPrice,
  getUpbitPrice,
  getExchangeRate,
  getKimchiPremiumData,
  getMultiplePrices,
  clearCache,
  checkApiStatus
};