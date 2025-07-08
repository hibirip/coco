/**
 * Bitget Ticker 데이터 서비스
 * REST API를 통해 실시간 가격 정보를 가져옴 (WebSocket 보완용)
 */

import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/api';
import { apiMonitor } from '../utils/apiMonitor';

// 환경 감지
const isDevelopment = import.meta.env.DEV;

// Bitget REST API 설정 - 모든 환경에서 동일한 프록시 사용
const BITGET_TICKER_CONFIG = {
  // 모든 환경에서 프록시 서버 사용 (환경별 일관성 확보)
  BASE_URL: API_CONFIG.BITGET.BASE_URL,
  USE_MOCK: false,
  TICKERS_ENDPOINT: API_CONFIG.BITGET.TICKER,
  SINGLE_TICKER_ENDPOINT: API_CONFIG.BITGET.SINGLE_TICKER,
  CACHE_TTL: API_CONFIG.COMMON.CACHE_DURATION.TICKER,
  REQUEST_TIMEOUT: 8000
};

// 설정 로그 출력 (개발 환경에서만)
if (isDevelopment) {
  console.log('🔧 Bitget API Configuration:', {
    isDevelopment,
    BASE_URL: BITGET_TICKER_CONFIG.BASE_URL,
    TICKERS_ENDPOINT: BITGET_TICKER_CONFIG.TICKERS_ENDPOINT,
    FULL_URL: `${BITGET_TICKER_CONFIG.BASE_URL}${BITGET_TICKER_CONFIG.TICKERS_ENDPOINT}`
  });
}

// 메모리 캐시
const tickerCache = new Map();

// 동적 코인 리스트 캐시 (1시간 유지) - 즉시 새 데이터 로드를 위해 캐시 무효화
const coinListCache = {
  data: null,
  timestamp: 0,
  ttl: 60 * 60 * 1000 // 1시간
};

// 경고 로그 중복 방지를 위한 캐시 (5분간 같은 경고 무시)
const warningCache = new Map();
const WARNING_CACHE_DURATION = 5 * 60 * 1000; // 5분

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
    
    logger.performance(`Bitget Ticker API 요청: ${symbol}`);
    
    // 배포 환경에서 API 호출 로깅
    if (!isDevelopment) {
      console.log(`[Production] Bitget API call for ${symbol}:`, url);
    }
    
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
    
    // 배포 환경에서 에러 상세 로깅
    if (!isDevelopment) {
      console.error(`[Production] Bitget API error for ${symbol}:`, {
        message: error.message,
        name: error.name,
        url: url
      });
    }
    
    throw error;
  }
}


/**
 * 실제 Bitget Tickers API 호출 (모든 심볼)
 */
async function fetchAllBitgetTickersData() {
  const startTime = Date.now();
  
  try {
    // 모든 환경에서 동일한 프록시 사용 (로컬 기준)
    const url = `${BITGET_TICKER_CONFIG.BASE_URL}${BITGET_TICKER_CONFIG.TICKERS_ENDPOINT}`;
    
    logger.performance('Bitget All Tickers API 요청');
    
    // 배포 환경에서 API 호출 로깅
    if (!isDevelopment) {
      console.log(`[Production] Bitget All Tickers API call:`, url);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      apiMonitor.recordTimeout('bitget');
    }, BITGET_TICKER_CONFIG.REQUEST_TIMEOUT);
    
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
    
    // API 성공 기록
    const responseTime = Date.now() - startTime;
    apiMonitor.recordSuccess('bitget', responseTime);
    
    logger.performance(`Bitget All Tickers 데이터 수신: ${data.data.length}개`);
    
    // 배포 환경에서 성공 로깅
    if (!isDevelopment) {
      console.log(`[Production] Bitget All Tickers success: ${data.data.length} tickers received`);
      // BTC 데이터 샘플 출력
      const btcData = data.data.find(ticker => ticker.symbol === 'BTCUSDT');
      if (btcData) {
        console.log(`[Production] BTC sample data:`, {
          symbol: btcData.symbol,
          lastPr: btcData.lastPr,
          change24h: btcData.change24h
        });
      }
    }
    
    return data.data;
    
  } catch (error) {
    // API 실패 기록
    apiMonitor.recordFailure('bitget', error);
    
    logger.error('Bitget All Tickers API 오류:', error.message);
    
    // 배포 환경에서 에러 상세 로깅
    if (!isDevelopment) {
      console.error(`[Production] Bitget All Tickers error:`, {
        message: error.message,
        name: error.name,
        url: `${BITGET_TICKER_CONFIG.BASE_URL}${BITGET_TICKER_CONFIG.TICKERS_ENDPOINT}`
      });
    }
    
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
    const price = parseFloat(tickerData.lastPr || tickerData.last || 0);
    const open24h = parseFloat(tickerData.open || tickerData.open24h || price);
    const change24h = price - open24h;
    const changePercent24h = parseFloat(tickerData.change24h || 0) * 100; // Bitget은 소수로 제공 (0.01 = 1%)
    
    // 가격 유효성 검증
    if (price <= 0 || isNaN(price)) {
      logger.warn(`Invalid price for ${symbol}: ${tickerData.lastPr}`);
      return null;
    }
    
    // 배포 환경에서 데이터 로깅 (BTC만)
    if (!isDevelopment && symbol === 'BTCUSDT') {
      console.log('[Production] Bitget transform:', {
        symbol,
        rawPrice: tickerData.lastPr,
        parsedPrice: price,
        changePercent: changePercent24h
      });
    }
    
    return {
      symbol,
      price,
      change24h,
      changePercent24h,
      volume24h: parseFloat(tickerData.baseVolume || tickerData.baseVol || 0),
      volumeUsdt24h: parseFloat(tickerData.usdtVolume || tickerData.quoteVolume || 0),
      high24h: parseFloat(tickerData.high24h || 0),
      low24h: parseFloat(tickerData.low24h || 0),
      bid: parseFloat(tickerData.bidPr || tickerData.bidPx || 0),
      ask: parseFloat(tickerData.askPr || tickerData.askPx || 0),
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
 * 모든 사용 가능한 USDT 페어 심볼 가져오기
 * @returns {Promise<Array>} USDT 페어 심볼 배열
 */
export async function getAvailableUSDTPairs() {
  try {
    const allTickersData = await fetchAllBitgetTickersData();
    
    // USDT 페어만 필터링하고 거래량 기준으로 정렬
    const usdtPairs = allTickersData
      .filter(ticker => 
        ticker.symbol.endsWith('USDT') && 
        ticker.symbol !== 'USDT' && // USDT 자체 제외
        ticker.usdtVolume && // usdtVolume 필드 존재 확인
        parseFloat(ticker.usdtVolume || '0') > 1000 // 최소 거래량 $1K (거의 모든 코인 포함)
      )
      .sort((a, b) => parseFloat(b.usdtVolume || '0') - parseFloat(a.usdtVolume || '0')) // 거래량 내림차순
      .map(ticker => ticker.symbol);
    
    logger.info(`사용 가능한 USDT 페어: ${usdtPairs.length}개 (제한 없음)`);
    
    // 모든 USDT 페어 반환 (제한 없음)
    return usdtPairs;
    
  } catch (error) {
    logger.error('USDT 페어 목록 가져오기 실패:', error);
    
    // 폴백: 기본 주요 코인들
    return [
      'BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT',
      'DOTUSDT', 'LINKUSDT', 'POLUSDT', 'UNIUSDT', 'AVAXUSDT',
      'DOGEUSDT', 'SHIBUSDT', 'TRXUSDT', 'LTCUSDT', 'BCHUSDT'
    ];
  }
}

/**
 * 동적으로 거래량 기준 상위 코인 가져오기
 * @param {number} limit - 가져올 코인 개수 (기본 50개)
 * @returns {Promise<Array>} 상위 코인 심볼 배열
 */
export async function getTopCoinsByVolume(limit = 50) {
  // 캐시 확인 (1시간 유지) - 테스트를 위해 캐시 비활성화
  const now = Date.now();
  if (false && coinListCache.data && now - coinListCache.timestamp < coinListCache.ttl) {
    logger.performance('캐시된 상위 코인 리스트 사용');
    return coinListCache.data.slice(0, limit);
  }
  
  try {
    const allTickersData = await fetchAllBitgetTickersData();
    
    // USDT 페어 중 거래량 상위 코인 선별
    const topCoins = allTickersData
      .filter(ticker => {
        const symbol = ticker.symbol;
        const volumeUsd = parseFloat(ticker.usdtVolume || '0');
        
        return (
          symbol.endsWith('USDT') && 
          symbol !== 'USDT' &&
          ticker.usdtVolume && // usdtVolume 필드 존재 확인
          volumeUsd > 1000 && // 최소 거래량 $1K (거의 모든 코인 포함)
          !symbol.includes('UP') && // 레버리지 토큰 제외
          !symbol.includes('DOWN') && // 레버리지 토큰 제외
          !symbol.includes('BEAR') && // 레버리지 토큰 제외
          !symbol.includes('BULL') && // 레버리지 토큰 제외
          !symbol.includes('3L') && // 3배 레버리지 토큰 제외
          !symbol.includes('3S') // 3배 숏 토큰 제외
        );
      })
      .sort((a, b) => parseFloat(b.usdtVolume || '0') - parseFloat(a.usdtVolume || '0'))
      .map(ticker => ticker.symbol);
    
    // 캐시 업데이트
    coinListCache.data = topCoins;
    coinListCache.timestamp = now;
    
    // 디버깅: 실제 반환되는 코인 리스트 확인
    console.log('🔍 DEBUG: getTopCoinsByVolume 결과:', {
      totalFiltered: topCoins.length,
      requestedLimit: limit,
      actualReturned: topCoins.slice(0, limit).length,
      first10Coins: topCoins.slice(0, 10),
      volumeSample: allTickersData.slice(0, 3).map(t => ({
        symbol: t.symbol,
        usdtVolume: t.usdtVolume,
        parsed: parseFloat(t.usdtVolume || 0)
      }))
    });
    
    logger.info(`거래량 상위 코인 캐시 업데이트: ${topCoins.length}개 → ${limit}개 반환`);
    return topCoins.slice(0, limit);
    
  } catch (error) {
    logger.error('상위 코인 선별 실패:', error);
    
    // 캐시된 데이터가 있으면 사용 (만료되었어도)
    if (coinListCache.data) {
      logger.warn('API 실패, 만료된 캐시 데이터 사용');
      return coinListCache.data.slice(0, limit);
    }
    
    return [];
  }
}

/**
 * 업비트 상장 코인과 매칭되는 심볼 가져오기
 * @param {Array} upbitMarkets - 업비트 마켓 배열 
 * @returns {Promise<Array>} 매칭되는 Bitget 심볼 배열
 */
export async function getMatchingSymbolsWithUpbit(upbitMarkets = []) {
  try {
    const availableSymbols = await getAvailableUSDTPairs();
    
    // 업비트 마켓에서 코인 심볼 추출
    const upbitCoins = upbitMarkets
      .filter(market => market.startsWith('KRW-'))
      .map(market => market.replace('KRW-', '') + 'USDT');
    
    // Bitget에서 사용 가능하고 업비트에도 상장된 코인 필터링
    const matchingSymbols = availableSymbols.filter(symbol => {
      const baseCoin = symbol.replace('USDT', '');
      return upbitCoins.includes(symbol) || 
             upbitCoins.includes(baseCoin + 'USDT') ||
             (baseCoin === 'POL' && upbitCoins.includes('MATICUSDT')); // POL-MATIC 매핑
    });
    
    logger.info(`업비트 매칭 코인: ${matchingSymbols.length}개`);
    return matchingSymbols;
    
  } catch (error) {
    logger.error('업비트 매칭 심볼 가져오기 실패:', error);
    return [];
  }
}

/**
 * 여러 심볼의 Ticker 데이터를 병렬로 가져오기
 * @param {Array} symbols - 심볼 배열
 * @returns {Promise<Object>} 심볼별 티커 데이터 객체
 */
export async function getBatchTickerData(symbols) {
  logger.performance(`배치 Ticker 데이터 요청: ${symbols.length}개 심볼`);
  console.log('🔍 getBatchTickerData - 요청된 심볼 개수:', symbols.length);
  console.log('🔍 getBatchTickerData - 처음 10개:', symbols.slice(0, 10));
  
  try {
    // 모든 티커 데이터 한 번에 가져오기 (더 효율적)
    const allTickersData = await fetchAllBitgetTickersData();
    console.log('🔍 fetchAllBitgetTickersData - 받은 전체 티커 개수:', allTickersData.length);
    
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
        // 중복 경고 방지 - 5분간 같은 심볼에 대한 경고 무시
        const warningKey = `missing_ticker_${symbol}`;
        const lastWarning = warningCache.get(warningKey);
        
        if (!lastWarning || Date.now() - lastWarning > WARNING_CACHE_DURATION) {
          logger.warn(`Ticker 데이터 없음: ${symbol} (5분간 동일 경고 무시)`);
          warningCache.set(warningKey, Date.now());
        }
      }
    }
    
    console.log('🔍 getBatchTickerData - 성공한 심볼 개수:', successCount);
    console.log('🔍 getBatchTickerData - 찾지 못한 심볼:', symbols.filter(s => !tickerDataMap[s]));
    
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
        // 중복 경고 방지 - 5분간 같은 심볼에 대한 경고 무시
        const warningKey = `failed_ticker_${symbol}`;
        const lastWarning = warningCache.get(warningKey);
        
        if (!lastWarning || Date.now() - lastWarning > WARNING_CACHE_DURATION) {
          logger.warn(`Ticker 데이터 실패 (${symbol}): ${error} (5분간 동일 경고 무시)`);
          warningCache.set(warningKey, Date.now());
        }
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