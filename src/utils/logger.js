/**
 * 프로덕션 환경을 위한 로거 유틸리티
 * 개발 환경에서만 로그를 출력하고, 프로덕션에서는 에러만 출력
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = !isDevelopment;

// 로그 레벨 정의
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1, 
  INFO: 2,
  DEBUG: 3
};

// 프로덕션 환경에서는 ERROR와 WARN만 출력
const currentLogLevel = isProduction ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

/**
 * 조건부 로거 - 개발 환경에서만 출력
 */
export const logger = {
  // 에러는 항상 출력 (프로덕션에서도)
  error: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error('[ERROR]', ...args);
    }
  },

  // 경고는 프로덕션에서도 출력
  warn: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn('[WARN]', ...args);
    }
  },

  // 정보성 로그는 개발 환경에서만
  info: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log('[INFO]', ...args);
    }
  },

  // 디버그 로그는 개발 환경에서만
  debug: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  },

  // 특정 기능별 로거들 (개발 환경에서만)
  websocket: (...args) => {
    if (isDevelopment) {
      console.log('🔌 WebSocket:', ...args);
    }
  },

  api: (...args) => {
    if (isDevelopment) {
      console.log('🌐 API:', ...args);
    }
  },

  price: (...args) => {
    if (isDevelopment) {
      console.log('💰 Price:', ...args);
    }
  },

  exchange: (...args) => {
    if (isDevelopment) {
      console.log('💱 Exchange:', ...args);
    }
  },

  // 성능에 민감한 영역용 (샘플링 로그)
  performance: (...args) => {
    if (isDevelopment && Math.random() < 0.1) { // 10% 확률로만 출력
      console.log('⚡ Performance:', ...args);
    }
  }
};

/**
 * 배치 로깅 - 여러 개의 로그를 하나로 묶어서 출력
 */
export const batchLogger = {
  logs: [],
  
  add: (level, ...args) => {
    batchLogger.logs.push({ level, args, timestamp: Date.now() });
  },
  
  flush: () => {
    if (batchLogger.logs.length === 0) return;
    
    const summary = batchLogger.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});
    
    if (isDevelopment) {
      console.log('📊 Batch Log Summary:', summary);
      console.log('📋 Details:', batchLogger.logs);
    }
    
    batchLogger.logs = [];
  }
};

// 5초마다 배치 로그 플러시 (개발 환경에서만)
if (isDevelopment) {
  setInterval(() => {
    batchLogger.flush();
  }, 5000);
}

export default logger;