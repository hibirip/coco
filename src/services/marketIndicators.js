/**
 * 시장 지표 데이터 서비스
 * 8가지 주요 지표의 API 연동 및 데이터 처리
 */

import { logger } from '../utils/logger';

// API 엔드포인트 설정
const API_ENDPOINTS = {
  FEAR_GREED: 'https://api.alternative.me/fng/',
  COINGECKO_GLOBAL: 'https://api.coingecko.com/api/v3/global',
  EXCHANGE_RATE: 'https://api.exchangerate-api.com/v4/latest/USD',
  // 주식 데이터는 CORS 문제로 프록시 서버 필요
  YAHOO_FINANCE: 'https://query1.finance.yahoo.com/v8/finance/chart/',
};

// 데이터 캐시 (5분간 유지)
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * 캐시에서 데이터 조회
 * @param {string} key - 캐시 키
 * @returns {any|null} 캐시된 데이터 또는 null
 */
function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

/**
 * 캐시에 데이터 저장
 * @param {string} key - 캐시 키
 * @param {any} data - 저장할 데이터
 */
function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * 공포탐욕지수 조회
 * @returns {Promise<{value: number, classification: string}>}
 */
export async function getFearGreedIndex() {
  const cacheKey = 'fear-greed';
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    logger.info('공포탐욕지수 데이터 요청');
    const response = await fetch(API_ENDPOINTS.FEAR_GREED);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.data || !data.data[0]) {
      throw new Error('공포탐욕지수 데이터 형식 오류');
    }

    const result = {
      value: parseInt(data.data[0].value),
      classification: data.data[0].value_classification,
      timestamp: data.data[0].timestamp
    };

    setCache(cacheKey, result);
    logger.info(`공포탐욕지수: ${result.value} (${result.classification})`);
    return result;
  } catch (error) {
    logger.error('공포탐욕지수 조회 실패:', error);
    return { value: null, classification: '데이터 없음' };
  }
}

/**
 * 암호화폐 글로벌 데이터 조회 (도미넌스, 시가총액)
 * @returns {Promise<{btcDominance: number, totalMarketCap: number}>}
 */
export async function getCryptoGlobalData() {
  const cacheKey = 'crypto-global';
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    logger.info('암호화폐 글로벌 데이터 요청');
    const response = await fetch(API_ENDPOINTS.COINGECKO_GLOBAL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.data) {
      throw new Error('글로벌 데이터 형식 오류');
    }

    const result = {
      btcDominance: data.data.market_cap_percentage?.bitcoin || 0,
      totalMarketCap: data.data.total_market_cap?.usd || 0,
      totalVolume24h: data.data.total_volume?.usd || 0,
      marketCapChange24h: data.data.market_cap_change_percentage_24h_usd || 0
    };

    setCache(cacheKey, result);
    logger.info(`BTC 도미넌스: ${result.btcDominance.toFixed(2)}%, 총 시가총액: $${(result.totalMarketCap / 1e12).toFixed(2)}T`);
    return result;
  } catch (error) {
    logger.error('암호화폐 글로벌 데이터 조회 실패:', error);
    return {
      btcDominance: null,
      totalMarketCap: null,
      totalVolume24h: null,
      marketCapChange24h: null
    };
  }
}

/**
 * 환율 데이터 조회 (USD/KRW)
 * @returns {Promise<{usdKrw: number, change24h: number}>}
 */
export async function getExchangeRates() {
  const cacheKey = 'exchange-rates';
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    logger.info('환율 데이터 요청');
    const response = await fetch(API_ENDPOINTS.EXCHANGE_RATE);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.rates || !data.rates.KRW) {
      throw new Error('환율 데이터 형식 오류');
    }

    const result = {
      usdKrw: data.rates.KRW,
      lastUpdate: data.date,
      // 변화율 계산을 위해서는 이전 데이터와 비교 필요 (추후 구현)
      change24h: null,
      changePercent24h: null
    };

    setCache(cacheKey, result);
    logger.info(`USD/KRW: ₩${result.usdKrw.toFixed(0)}`);
    return result;
  } catch (error) {
    logger.error('환율 데이터 조회 실패:', error);
    return {
      usdKrw: null,
      change24h: null,
      changePercent24h: null
    };
  }
}

/**
 * 주식 지표 데이터 조회 (Yahoo Finance)
 * 주의: CORS 문제로 직접 호출 불가, 프록시 서버 또는 백엔드 필요
 * @returns {Promise<{sp500: object, nasdaq: object, dxy: object}>}
 */
export async function getStockIndicators() {
  const cacheKey = 'stock-indicators';
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    // 실제 API 호출은 CORS 문제로 현재 불가능
    // 임시로 모의 데이터 반환
    logger.warn('주식 지표: 모의 데이터 사용 (실제 API 연동 필요)');
    
    const result = {
      sp500: {
        symbol: '^GSPC',
        name: 'S&P 500',
        price: 4567.89 + (Math.random() - 0.5) * 100,
        change: (Math.random() - 0.5) * 50,
        changePercent: (Math.random() - 0.5) * 2,
        lastUpdate: new Date().toISOString()
      },
      nasdaq: {
        symbol: '^IXIC',
        name: 'NASDAQ',
        price: 14234.56 + (Math.random() - 0.5) * 300,
        change: (Math.random() - 0.5) * 80,
        changePercent: (Math.random() - 0.5) * 2,
        lastUpdate: new Date().toISOString()
      },
      dxy: {
        symbol: 'DX-Y.NYB',
        name: 'US Dollar Index',
        price: 103.45 + (Math.random() - 0.5) * 2,
        change: (Math.random() - 0.5) * 1,
        changePercent: (Math.random() - 0.5) * 0.5,
        lastUpdate: new Date().toISOString()
      }
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    logger.error('주식 지표 조회 실패:', error);
    return {
      sp500: { price: null, change: null, changePercent: null },
      nasdaq: { price: null, change: null, changePercent: null },
      dxy: { price: null, change: null, changePercent: null }
    };
  }
}

/**
 * 실제 Yahoo Finance API 호출 (프록시 서버 필요)
 * @param {string} symbol - 주식 심볼 (예: ^GSPC, ^IXIC)
 * @returns {Promise<object>} 주식 데이터
 */
async function fetchYahooFinanceData(symbol) {
  try {
    // 실제 구현 시 프록시 서버 또는 백엔드 API 엔드포인트 사용
    const proxyUrl = `${API_ENDPOINTS.YAHOO_FINANCE}${symbol}`;
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const result = data.chart.result[0];
    const quote = result.indicators.quote[0];
    const meta = result.meta;

    return {
      symbol: meta.symbol,
      price: meta.regularMarketPrice,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      volume: quote.volume[quote.volume.length - 1],
      lastUpdate: new Date(meta.regularMarketTime * 1000).toISOString()
    };
  } catch (error) {
    logger.error(`Yahoo Finance API 호출 실패 (${symbol}):`, error);
    throw error;
  }
}

/**
 * 김치프리미엄 계산
 * PriceContext의 데이터를 사용하여 계산
 * @param {object} prices - 비트겟 가격 데이터
 * @param {object} upbitPrices - 업비트 가격 데이터
 * @param {number} exchangeRate - 환율
 * @returns {number} 김치프리미엄 (%)
 */
export function calculateKimchiPremium(prices, upbitPrices, exchangeRate) {
  try {
    const btcPrice = prices['BTCUSDT']?.price;
    const upbitBtcPrice = upbitPrices['KRW-BTC']?.trade_price;

    if (!btcPrice || !upbitBtcPrice || !exchangeRate) {
      return null;
    }

    const btcPriceKRW = btcPrice * exchangeRate;
    const premium = ((upbitBtcPrice - btcPriceKRW) / btcPriceKRW) * 100;

    logger.debug(`김치프리미엄 계산: ${premium.toFixed(2)}%`);
    return premium;
  } catch (error) {
    logger.error('김치프리미엄 계산 실패:', error);
    return null;
  }
}

/**
 * 모든 시장 지표 데이터 조회
 * @param {object} priceData - PriceContext 데이터 (김치프리미엄 계산용)
 * @returns {Promise<object>} 모든 지표 데이터
 */
export async function getAllMarketIndicators(priceData = {}) {
  try {
    logger.info('모든 시장 지표 데이터 조회 시작');

    const [fearGreed, cryptoGlobal, exchangeRates, stockData] = await Promise.allSettled([
      getFearGreedIndex(),
      getCryptoGlobalData(),
      getExchangeRates(),
      getStockIndicators()
    ]);

    // 김치프리미엄 계산
    const kimchiPremium = priceData.prices && priceData.upbitPrices && priceData.exchangeRate ?
      calculateKimchiPremium(priceData.prices, priceData.upbitPrices, priceData.exchangeRate) :
      null;

    const result = {
      fearGreed: fearGreed.status === 'fulfilled' ? fearGreed.value : { value: null, classification: '오류' },
      btcDominance: cryptoGlobal.status === 'fulfilled' ? cryptoGlobal.value.btcDominance : null,
      totalMarketCap: cryptoGlobal.status === 'fulfilled' ? cryptoGlobal.value.totalMarketCap : null,
      sp500: stockData.status === 'fulfilled' ? stockData.value.sp500 : { price: null, change: null, changePercent: null },
      nasdaq: stockData.status === 'fulfilled' ? stockData.value.nasdaq : { price: null, change: null, changePercent: null },
      dxy: stockData.status === 'fulfilled' ? stockData.value.dxy : { price: null, change: null, changePercent: null },
      kimchiPremium,
      usdKrw: exchangeRates.status === 'fulfilled' ? exchangeRates.value.usdKrw : null,
      lastUpdate: new Date().toISOString()
    };

    logger.info('모든 시장 지표 데이터 조회 완료');
    return result;
  } catch (error) {
    logger.error('시장 지표 데이터 조회 실패:', error);
    throw error;
  }
}

/**
 * 캐시 초기화
 */
export function clearCache() {
  cache.clear();
  logger.info('시장 지표 캐시 초기화 완료');
}

/**
 * 캐시 통계
 * @returns {object} 캐시 통계 정보
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    memoryUsage: JSON.stringify([...cache.entries()]).length
  };
}

export default {
  getFearGreedIndex,
  getCryptoGlobalData,
  getExchangeRates,
  getStockIndicators,
  calculateKimchiPremium,
  getAllMarketIndicators,
  clearCache,
  getCacheStats
};