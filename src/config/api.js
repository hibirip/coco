/**
 * API 설정 - Express 서버 통합 API 관리
 * 모든 환경에서 Express 서버(localhost:8080)를 통해 API 호출
 */

// Express 서버 URL (모든 환경에서 동일)
const EXPRESS_SERVER_URL = 'http://localhost:8080';

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
 * @returns {string} Express 서버를 통한 API URL
 */
export function getApiEndpoint(apiType) {
  const path = API_PATHS[apiType];
  if (!path) {
    throw new Error(`Unknown API type: ${apiType}`);
  }

  // 모든 환경에서 Express 서버를 통해 API 호출
  return `${EXPRESS_SERVER_URL}${path}`;
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