/**
 * API 설정 - 중앙화된 API 엔드포인트 관리
 * 환경에 따라 적절한 URL을 반환
 */

// API 기본 URL 설정
// 개발 환경: 비어있으면 Vite 프록시 사용 (상대 경로)
// 운영 환경: 환경 변수에서 설정된 URL 사용
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const IS_PRODUCTION = import.meta.env.PROD;

// API 타입별 경로 설정
const API_PATHS = {
  BITGET: '/api/bitget',
  UPBIT: '/api/upbit',
  EXCHANGE_RATE: '/api/exchange-rate',
  NEWS: '/api/news'
};

/**
 * API 엔드포인트 생성
 * @param {string} apiType - API 타입 (BITGET, UPBIT, EXCHANGE_RATE, NEWS)
 * @returns {string} 완성된 API URL
 */
export function getApiEndpoint(apiType) {
  const path = API_PATHS[apiType];
  if (!path) {
    throw new Error(`Unknown API type: ${apiType}`);
  }

  // 운영 환경에서 프록시 서버가 없는 경우 직접 API 호출
  if (IS_PRODUCTION && !API_BASE_URL) {
    switch (apiType) {
      case 'BITGET':
        return 'https://api.bitget.com';
      case 'UPBIT':
        return 'https://api.upbit.com';
      case 'EXCHANGE_RATE':
        return 'https://api.exchangerate-api.com/v4/latest/USD';
      case 'NEWS':
        return 'https://api.coinness.com/v2';
      default:
        return path;
    }
  }

  // API_BASE_URL이 비어있으면 상대 경로 반환 (Vite 프록시 사용)
  // API_BASE_URL이 있으면 절대 경로 반환 (운영 환경)
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

/**
 * API 설정 객체
 */
export const API_CONFIG = {
  // Bitget API
  BITGET: {
    BASE_URL: getApiEndpoint('BITGET'),
    TICKER: '/api/v2/spot/market/tickers',
    SINGLE_TICKER: '/api/v2/spot/market/ticker',
    KLINE: '/api/v2/spot/market/candles',
    WEBSOCKET: 'wss://ws.bitget.com/spot/v1/stream'
  },

  // Upbit API
  UPBIT: {
    BASE_URL: getApiEndpoint('UPBIT'),
    TICKER: '/v1/ticker',
    MARKET: '/v1/market/all',
    WEBSOCKET: 'wss://api.upbit.com/websocket/v1'
  },

  // 환율 API
  EXCHANGE_RATE: {
    BASE_URL: getApiEndpoint('EXCHANGE_RATE'),
    LATEST: ''
  },

  // 뉴스 API
  NEWS: {
    BASE_URL: getApiEndpoint('NEWS'),
    LATEST: '',
    SEARCH: '/search'
  },

  // 공통 설정
  COMMON: {
    TIMEOUT: 10000, // 10초
    RETRY_ATTEMPTS: 3,
    CACHE_DURATION: {
      TICKER: 5000, // 5초
      KLINE: 300000, // 5분
      NEWS: 180000, // 3분
      EXCHANGE_RATE: 3600000 // 1시간
    }
  }
};

/**
 * API URL 로깅 (디버깅용)
 */
export function logApiConfig() {
  console.log('=== API Configuration ===');
  console.log('API_BASE_URL:', API_BASE_URL || '(Using Vite Proxy)');
  console.log('Bitget:', API_CONFIG.BITGET.BASE_URL);
  console.log('Upbit:', API_CONFIG.UPBIT.BASE_URL);
  console.log('Exchange Rate:', API_CONFIG.EXCHANGE_RATE.BASE_URL);
  console.log('News:', API_CONFIG.NEWS.BASE_URL);
  console.log('========================');
}

// 개발 환경에서만 설정 로깅
if (import.meta.env.DEV) {
  logApiConfig();
}

export default API_CONFIG;