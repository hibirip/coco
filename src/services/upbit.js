/**
 * 업비트 API 서비스 - 한국 암호화폐 가격 전용
 * 김치프리미엄 계산을 위한 KRW 마켓 데이터 제공
 */

import { API_CONFIG } from '../config/api';

// 업비트 API 설정
const UPBIT_CONFIG = {
  PROXY_URL: API_CONFIG.UPBIT.BASE_URL,
  CACHE_DURATION: API_CONFIG.COMMON.CACHE_DURATION.TICKER,
  RETRY_ATTEMPTS: API_CONFIG.COMMON.RETRY_ATTEMPTS,
  TIMEOUT: API_CONFIG.COMMON.TIMEOUT,
  MAX_MARKETS_PER_REQUEST: 100 // 업비트 API 제한
};

// 심볼 매핑 (Bitget USDT 페어 <-> Upbit KRW 페어)
// 비트겟 기준으로 모든 매핑 포함 (업비트에 없어도 유지)
const SYMBOL_MAPPING = {
  // 메이저 코인
  'BTCUSDT': 'KRW-BTC',
  'ETHUSDT': 'KRW-ETH',
  'XRPUSDT': 'KRW-XRP',
  'ADAUSDT': 'KRW-ADA',
  'DOTUSDT': 'KRW-DOT',
  'LINKUSDT': 'KRW-LINK',
  'LTCUSDT': 'KRW-LTC',
  'BCHUSDT': 'KRW-BCH',
  'EOSUSDT': 'KRW-EOS',
  'TRXUSDT': 'KRW-TRX',
  'XLMUSDT': 'KRW-XLM',
  'ATOMUSDT': 'KRW-ATOM',
  'VETUSDT': 'KRW-VET',
  'IOTAUSDT': 'KRW-IOTA',
  'NEOUSDT': 'KRW-NEO',
  
  // DeFi & 알트코인
  'MKRUSDT': 'KRW-MKR',
  'BATUSDT': 'KRW-BAT',
  'ZRXUSDT': 'KRW-ZRX',
  'SNXUSDT': 'KRW-SNX',
  'COMPUSDT': 'KRW-COMP',
  'YFIUSDT': 'KRW-YFI',
  'UNIUSDT': 'KRW-UNI',
  'AAVEUSDT': 'KRW-AAVE',
  'SUSHIUSDT': 'KRW-SUSHI',
  'CRVUSDT': 'KRW-CRV',
  '1INCHUSDT': 'KRW-1INCH',
  'ALPHAUSDT': 'KRW-ALPHA',
  'ANKRUSDT': 'KRW-ANKR',
  'AXSUSDT': 'KRW-AXS',
  'CHZUSDT': 'KRW-CHZ',
  'ENJUSDT': 'KRW-ENJ',
  'FLOWUSDT': 'KRW-FLOW',
  'ICXUSDT': 'KRW-ICX',
  'KLAYUSDT': 'KRW-KLAY',
  'MANAUSDT': 'KRW-MANA',
  'SANDUSDT': 'KRW-SAND',
  'THETAUSDT': 'KRW-THETA',
  
  // 추가 메이저 코인
  'MATICUSDT': 'KRW-MATIC',
  'SOLUSDT': 'KRW-SOL',
  'AVAXUSDT': 'KRW-AVAX',
  'NEARUSDT': 'KRW-NEAR',
  'LUNAUSTD': 'KRW-LUNA'
};

// 역방향 매핑 (Upbit -> Bitget)
const REVERSE_SYMBOL_MAPPING = Object.fromEntries(
  Object.entries(SYMBOL_MAPPING).map(([key, value]) => [value, key])
);

// 메모리 캐시
const cache = new Map();

/**
 * 캐시에서 데이터 조회
 * @param {string} key - 캐시 키
 * @returns {object|null} 캐시된 데이터 또는 null
 */
function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < UPBIT_CONFIG.CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key); // 만료된 캐시 제거
  return null;
}

/**
 * 캐시에 데이터 저장
 * @param {string} key - 캐시 키
 * @param {object} data - 저장할 데이터
 */
function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * 업비트 API 호출 (재시도 로직 포함)
 * @param {string} endpoint - API 엔드포인트
 * @param {object} params - 쿼리 매개변수
 * @param {number} retryCount - 재시도 횟수
 * @returns {Promise<object>} API 응답
 */
async function fetchUpbitAPI(endpoint, params = {}, retryCount = 0) {
  try {
    const url = new URL(`${UPBIT_CONFIG.PROXY_URL}${endpoint}`);
    
    // 쿼리 매개변수 추가
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        url.searchParams.append(key, params[key]);
      }
    });

    console.log(`📡 업비트 API 호출 (${retryCount + 1}/${UPBIT_CONFIG.RETRY_ATTEMPTS}):`, url.pathname);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPBIT_CONFIG.TIMEOUT);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ 업비트 API 응답: ${response.status} (${Array.isArray(data) ? data.length : 1}개 항목)`);
    
    return data;
    
  } catch (error) {
    console.error(`❌ 업비트 API 호출 실패 (${retryCount + 1}회):`, error.message);
    
    // 재시도 로직
    if (retryCount < UPBIT_CONFIG.RETRY_ATTEMPTS - 1) {
      const delay = Math.pow(2, retryCount) * 1000; // 지수 백오프
      console.log(`🔄 ${delay}ms 후 재시도...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchUpbitAPI(endpoint, params, retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * 업비트 전체 마켓 조회
 * @returns {Promise<Array>} 마켓 목록
 */
export async function getUpbitMarkets() {
  try {
    const cacheKey = 'upbit_markets';
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('✅ 캐시된 업비트 마켓 사용');
      return cached;
    }
    
    const markets = await fetchUpbitAPI('/v1/market/all');
    
    if (!Array.isArray(markets)) {
      throw new Error('업비트 마켓 응답이 배열이 아닙니다');
    }
    
    // KRW 마켓만 필터링
    const krwMarkets = markets.filter(market => 
      market.market && market.market.startsWith('KRW-')
    );
    
    console.log(`📊 업비트 KRW 마켓: ${krwMarkets.length}개`);
    
    setCachedData(cacheKey, krwMarkets);
    return krwMarkets;
    
  } catch (error) {
    console.error('업비트 마켓 조회 오류:', error);
    throw new Error(`업비트 마켓 조회 실패: ${error.message}`);
  }
}

/**
 * 업비트 현재가 조회 (여러 마켓)
 * @param {Array<string>} markets - 마켓 코드 배열 (예: ['KRW-BTC', 'KRW-ETH'])
 * @returns {Promise<Array>} 현재가 정보 배열
 */
export async function getUpbitTickers(markets) {
  try {
    if (!Array.isArray(markets) || markets.length === 0) {
      throw new Error('마켓 배열이 비어있습니다');
    }
    
    // 최대 요청 수 제한
    const limitedMarkets = markets.slice(0, UPBIT_CONFIG.MAX_MARKETS_PER_REQUEST);
    const marketsParam = limitedMarkets.join(',');
    
    const cacheKey = `upbit_tickers_${marketsParam.replace(/,/g, '_')}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`✅ 캐시된 업비트 현재가 사용 (${limitedMarkets.length}개)`);
      return cached;
    }
    
    const tickers = await fetchUpbitAPI('/v1/ticker', {
      markets: marketsParam
    });
    
    if (!Array.isArray(tickers)) {
      throw new Error('업비트 현재가 응답이 배열이 아닙니다');
    }
    
    console.log(`📊 업비트 현재가 조회: ${tickers.length}개`);
    
    setCachedData(cacheKey, tickers);
    return tickers;
    
  } catch (error) {
    console.error('업비트 현재가 조회 오류:', error);
    throw new Error(`업비트 현재가 조회 실패: ${error.message}`);
  }
}

/**
 * 단일 마켓 현재가 조회
 * @param {string} market - 마켓 코드 (예: 'KRW-BTC')
 * @returns {Promise<object>} 현재가 정보
 */
export async function getUpbitTickerSingle(market) {
  try {
    const tickers = await getUpbitTickers([market]);
    if (tickers.length === 0) {
      throw new Error(`${market} 마켓의 현재가를 찾을 수 없습니다`);
    }
    return tickers[0];
  } catch (error) {
    console.error(`업비트 ${market} 현재가 조회 오류:`, error);
    throw error;
  }
}

/**
 * Bitget 심볼을 업비트 마켓으로 변환
 * @param {string} bitgetSymbol - Bitget 심볼 (예: 'BTCUSDT')
 * @returns {string|null} 업비트 마켓 코드 (예: 'KRW-BTC') 또는 null
 */
export function bitgetToUpbit(bitgetSymbol) {
  return SYMBOL_MAPPING[bitgetSymbol] || null;
}

/**
 * 업비트 마켓을 Bitget 심볼로 변환
 * @param {string} upbitMarket - 업비트 마켓 (예: 'KRW-BTC')
 * @returns {string|null} Bitget 심볼 (예: 'BTCUSDT') 또는 null
 */
export function upbitToBitget(upbitMarket) {
  return REVERSE_SYMBOL_MAPPING[upbitMarket] || null;
}

/**
 * 매핑 가능한 모든 심볼 쌍 조회
 * @returns {Array<object>} 심볼 매핑 정보 배열
 */
export function getAllSymbolMappings() {
  return Object.entries(SYMBOL_MAPPING).map(([bitget, upbit]) => ({
    bitget,
    upbit,
    coin: upbit.replace('KRW-', '').toLowerCase()
  }));
}

/**
 * KRW 마켓 현재가를 객체로 변환 (빠른 조회용)
 * @param {Array} tickers - 업비트 현재가 배열
 * @returns {object} 마켓별 현재가 객체
 */
export function transformTickersToObject(tickers) {
  if (!Array.isArray(tickers)) {
    return {};
  }
  
  const result = {};
  
  tickers.forEach(ticker => {
    if (ticker.market) {
      result[ticker.market] = {
        market: ticker.market,
        price: ticker.trade_price,
        change: ticker.change_price,
        changePercent: ticker.change_rate * 100,
        volume24h: ticker.acc_trade_volume_24h,
        high24h: ticker.high_price,
        low24h: ticker.low_price,
        timestamp: Date.now(),
        source: 'upbit'
      };
    }
  });
  
  return result;
}

/**
 * 김치프리미엄 계산용 매핑된 마켓 현재가 조회
 * 업비트에 없는 마켓도 처리 (빈 객체로 유지)
 * @returns {Promise<object>} 매핑된 마켓의 현재가 객체
 */
export async function getMappedMarketPrices() {
  try {
    // 1. 실제 업비트 마켓 목록 조회
    const allMarkets = await getUpbitMarkets();
    const existingMarketCodes = new Set(allMarkets.map(m => m.market));
    
    // 2. 매핑된 마켓 중 실제 존재하는 것만 필터링
    const mappedMarkets = Object.values(SYMBOL_MAPPING);
    const validMarkets = mappedMarkets.filter(market => existingMarketCodes.has(market));
    const invalidMarkets = mappedMarkets.filter(market => !existingMarketCodes.has(market));
    
    console.log(`📊 매핑된 마켓: ${mappedMarkets.length}개`);
    console.log(`✅ 업비트 존재: ${validMarkets.length}개`);
    console.log(`❌ 업비트 미존재: ${invalidMarkets.length}개 (${invalidMarkets.join(', ')})`);
    
    // 3. 존재하는 마켓만 API 호출
    let priceObject = {};
    
    if (validMarkets.length > 0) {
      const tickers = await getUpbitTickers(validMarkets);
      priceObject = transformTickersToObject(tickers);
    }
    
    // 4. 존재하지 않는 마켓은 null로 표시
    invalidMarkets.forEach(market => {
      priceObject[market] = null; // 김프 계산 시 제외 표시
    });
    
    console.log(`✅ 업비트 가격 조회 완료: ${Object.keys(priceObject).length}개 (실제 데이터: ${validMarkets.length}개)`);
    return priceObject;
    
  } catch (error) {
    console.error('매핑된 마켓 현재가 조회 오류:', error);
    throw error;
  }
}

/**
 * 캐시 상태 정보
 * @returns {object} 캐시 상태
 */
export function getUpbitCacheStatus() {
  const entries = Array.from(cache.entries()).map(([key, value]) => ({
    key,
    age: Date.now() - value.timestamp,
    expired: Date.now() - value.timestamp > UPBIT_CONFIG.CACHE_DURATION
  }));
  
  return {
    size: cache.size,
    maxAge: UPBIT_CONFIG.CACHE_DURATION,
    entries: entries
  };
}

/**
 * 캐시 초기화
 */
export function clearUpbitCache() {
  cache.clear();
  console.log('🗑️ 업비트 캐시 초기화됨');
}

// 기본 export
export default {
  getUpbitMarkets,
  getUpbitTickers,
  getUpbitTickerSingle,
  getMappedMarketPrices,
  transformTickersToObject,
  bitgetToUpbit,
  upbitToBitget,
  getAllSymbolMappings,
  getUpbitCacheStatus,
  clearUpbitCache
};