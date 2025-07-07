/**
 * API 설정 - 환경별 API 관리
 * 개발환경: 로컬 Express 프록시 서버 사용
 * 배포환경: 배포된 Express 프록시 서버 사용
 */

// 환경별 설정
const isDevelopment = import.meta.env.DEV;

// 환경변수에서 백엔드 서버 URL 가져오기 (배포환경용)
const BACKEND_SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'https://coco-proxy-server.onrender.com';

// Express 프록시 서버 URL
const EXPRESS_SERVER_URL = isDevelopment ? 'http://localhost:8080' : BACKEND_SERVER_URL;

// 배포 환경에서 설정 확인
if (!isDevelopment) {
  console.log('[Production] API Configuration:', {
    BACKEND_SERVER_URL,
    EXPRESS_SERVER_URL,
    isDevelopment
  });
}

// API 타입별 경로 설정
const API_PATHS = {
  BITGET: '/api/bitget',
  UPBIT: '/api/upbit',
  EXCHANGE_RATE: '/api/exchange-rate',
  NEWS: '/api/news',
  TWITTER: '/api/twitter'
};

/**
 * API 엔드포인트 생성
 * @param {string} apiType - API 타입 (BITGET, UPBIT, EXCHANGE_RATE, NEWS, TWITTER)
 * @returns {string} Express 프록시 서버를 통한 API URL
 */
export function getApiEndpoint(apiType) {
  const path = API_PATHS[apiType];
  if (!path) {
    throw new Error(`Unknown API type: ${apiType}`);
  }
  
  // 모든 환경에서 Express 프록시 서버 사용
  return `${EXPRESS_SERVER_URL}${path}`;
}

/**
 * API 설정 객체
 */
export const API_CONFIG = {
  // Bitget API (프록시 서버를 통해 호출)
  BITGET: {
    BASE_URL: getApiEndpoint('BITGET'),
    TICKER: '/api/v2/spot/market/tickers',
    SINGLE_TICKER: '/api/v2/spot/market/ticker',
    KLINE: '/api/v2/spot/market/candles',
    WEBSOCKET: 'wss://ws.bitget.com/v2/ws/public' // WebSocket은 직접 연결
  },

  // Upbit API (프록시 서버를 통해 호출)
  UPBIT: {
    BASE_URL: getApiEndpoint('UPBIT'),
    TICKER: '/v1/ticker',
    MARKET: '/v1/market/all',
    WEBSOCKET: 'wss://api.upbit.com/websocket/v1' // WebSocket은 직접 연결
  },

  // 환율 API (프록시 서버를 통해 호출)
  EXCHANGE_RATE: {
    BASE_URL: getApiEndpoint('EXCHANGE_RATE'),
    LATEST: ''
  },

  // 뉴스 API (프록시 서버를 통해 호출)
  NEWS: {
    BASE_URL: getApiEndpoint('NEWS'),
    LATEST: '',
    SEARCH: '/search'
  },

  // Twitter API (프록시 서버를 통해 호출)
  TWITTER: {
    BASE_URL: getApiEndpoint('TWITTER'),
    SEARCH: '/search',
    FEEDS: '/feeds'
  },

  // 공통 설정
  COMMON: {
    TIMEOUT: 10000, // 10초
    RETRY_ATTEMPTS: 3,
    CACHE_DURATION: {
      TICKER: 2000, // 2초로 단축하여 실시간성 향상
      KLINE: 300000, // 5분
      NEWS: 180000, // 3분
      EXCHANGE_RATE: 3600000 // 1시간
    }
  }
};


export default API_CONFIG;