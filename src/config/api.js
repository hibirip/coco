/**
 * API 설정 - 환경별 API 관리
 * 개발환경: Express 프록시 서버 사용
 * 배포환경: 직접 API 호출
 */

// 환경별 설정
const isDevelopment = import.meta.env.DEV;
const EXPRESS_SERVER_URL = 'http://localhost:8080';

// 직접 API URL (배포환경용)
const DIRECT_API_URLS = {
  BITGET: null, // 배포환경에서는 WebSocket만 사용
  UPBIT: 'https://api.upbit.com', // 업비트는 CORS 허용
  EXCHANGE_RATE: 'https://api.exchangerate-api.com/v4/latest/USD',
  NEWS: 'https://api.coingecko.com'
};

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
 * @returns {string} 환경별 API URL
 */
export function getApiEndpoint(apiType) {
  // 개발환경: Express 프록시 서버 사용
  if (isDevelopment) {
    const path = API_PATHS[apiType];
    if (!path) {
      throw new Error(`Unknown API type: ${apiType}`);
    }
    return `${EXPRESS_SERVER_URL}${path}`;
  }
  
  // 배포환경: 직접 API 호출
  const directUrl = DIRECT_API_URLS[apiType];
  if (directUrl === null) {
    throw new Error(`API type ${apiType} is not available in production (use WebSocket instead)`);
  }
  if (!directUrl) {
    throw new Error(`Unknown API type: ${apiType}`);
  }
  
  return directUrl;
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


export default API_CONFIG;