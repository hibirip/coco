/**
 * 환경 설정 관리
 * 개발/프로덕션 환경별 설정 분리
 */

// 환경 확인
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// 환경별 설정
export const ENV_CONFIG = {
  // 개발 환경 설정
  development: {
    API_TIMEOUT: 10000, // 10초
    CACHE_DURATION: 5 * 60 * 1000, // 5분
    LOG_LEVEL: 'debug',
    USE_MOCK_DATA: false,
    ENABLE_DEBUG_TOOLS: true,
    NEWS_UPDATE_INTERVAL: 5 * 60 * 1000, // 5분 (개발용)
    MAX_RETRIES: 3,
    WEBSOCKET_ENABLED: false // 개발환경에서도 REST만 사용
  },
  
  // 프로덕션 환경 설정
  production: {
    API_TIMEOUT: 8000, // 8초 (더 빠른 응답)
    CACHE_DURATION: 30 * 60 * 1000, // 30분
    LOG_LEVEL: 'error',
    USE_MOCK_DATA: false,
    ENABLE_DEBUG_TOOLS: false,
    NEWS_UPDATE_INTERVAL: 2 * 60 * 60 * 1000, // 2시간
    MAX_RETRIES: 2,
    WEBSOCKET_ENABLED: false // 프로덕션에서도 REST만 사용
  }
};

// 현재 환경 설정
export const currentConfig = isDevelopment ? ENV_CONFIG.development : ENV_CONFIG.production;

// 환경 변수 오버라이드
export const config = {
  ...currentConfig,
  
  // 환경 변수로 오버라이드 가능한 설정들
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA === 'true' || currentConfig.USE_MOCK_DATA,
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || currentConfig.LOG_LEVEL,
  
  // API 설정
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || (isDevelopment ? 'http://localhost:8080' : ''),
  
  // 기능 플래그
  FEATURES: {
    REAL_NEWS_SOURCES: !import.meta.env.VITE_USE_MOCK_DATA,
    TWITTER_INTEGRATION: !!import.meta.env.VITE_TWITTER_BEARER_TOKEN,
    PHOTO_SEARCH: !!(
      import.meta.env.VITE_UNSPLASH_ACCESS_KEY || 
      import.meta.env.VITE_PIXABAY_API_KEY || 
      import.meta.env.VITE_PEXELS_API_KEY
    ),
    WEBSOCKET_FALLBACK: true,
    AUTO_NEWS_UPDATE: true
  },
  
  // 성능 설정
  PERFORMANCE: {
    MAX_CACHE_SIZE: isDevelopment ? 50 : 100,
    MAX_MEMORY_USAGE: isDevelopment ? 50 * 1024 * 1024 : 100 * 1024 * 1024, // 50MB/100MB
    BATCH_SIZE: isDevelopment ? 10 : 20,
    DEBOUNCE_DELAY: 300
  }
};

// 환경 검증
export function validateEnvironment() {
  const warnings = [];
  const errors = [];
  
  // 필수 환경 변수 확인
  if (!import.meta.env.VITE_BACKEND_URL && isProduction) {
    errors.push('VITE_BACKEND_URL이 프로덕션 환경에서 설정되지 않았습니다.');
  }
  
  // 선택적 API 키 확인
  if (!config.FEATURES.PHOTO_SEARCH) {
    warnings.push('사진 검색 API 키가 설정되지 않아 기본 이미지를 사용합니다.');
  }
  
  if (!config.FEATURES.TWITTER_INTEGRATION) {
    warnings.push('Twitter API 키가 설정되지 않아 Mock 데이터를 사용합니다.');
  }
  
  // WebSocket 설정 확인
  if (!config.WEBSOCKET_ENABLED) {
    warnings.push('WebSocket이 비활성화되어 REST API만 사용합니다.');
  }
  
  return { warnings, errors };
}

// 설정 요약 출력
export function logEnvironmentInfo() {
  console.log('🌍 Environment:', isDevelopment ? 'Development' : 'Production');
  console.log('⚙️ Configuration:', {
    mockData: config.USE_MOCK_DATA,
    logLevel: config.LOG_LEVEL,
    features: Object.entries(config.FEATURES)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature),
    backendUrl: config.BACKEND_URL || 'Vite Proxy'
  });
  
  const validation = validateEnvironment();
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Warnings:', validation.warnings);
  }
  
  if (validation.errors.length > 0) {
    console.error('❌ Errors:', validation.errors);
  }
}

export default config;