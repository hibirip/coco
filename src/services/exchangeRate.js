/**
 * 환율 API 서비스 - USD/KRW 환율 전용
 * 김치프리미엄 계산을 위한 실시간 환율 정보 제공
 */

// 환율 API 설정
const EXCHANGE_RATE_CONFIG = {
  PROXY_URL: 'http://localhost:8080/api/exchange-rate',
  DEFAULT_RATE: 1320, // "1달러 원화" 구글 검색 기준 (2025년 1월)
  CACHE_DURATION: 5 * 60 * 60 * 1000, // 5시간 (밀리초)
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 10000 // 10초
};

// 로컬 스토리지 키
const STORAGE_KEYS = {
  RATE: 'coco_exchange_rate',
  TIMESTAMP: 'coco_exchange_rate_timestamp',
  SOURCE: 'coco_exchange_rate_source'
};

/**
 * 로컬 스토리지에서 캐시된 환율 조회
 * @returns {object|null} 캐시된 환율 데이터 또는 null
 */
function getCachedExchangeRate() {
  try {
    const rate = localStorage.getItem(STORAGE_KEYS.RATE);
    const timestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);
    const source = localStorage.getItem(STORAGE_KEYS.SOURCE);
    
    if (!rate || !timestamp) {
      return null;
    }
    
    const now = Date.now();
    const cacheAge = now - parseInt(timestamp);
    
    // 5시간 이내의 캐시만 유효
    if (cacheAge < EXCHANGE_RATE_CONFIG.CACHE_DURATION) {
      return {
        rate: parseFloat(rate),
        timestamp: parseInt(timestamp),
        source: source || 'cache',
        cacheAge: cacheAge,
        isFromCache: true
      };
    }
    
    // 만료된 캐시 삭제
    clearCachedExchangeRate();
    return null;
  } catch (error) {
    console.warn('환율 캐시 조회 오류:', error);
    return null;
  }
}

/**
 * 환율 데이터를 로컬 스토리지에 캐시
 * @param {number} rate - 환율
 * @param {string} source - 데이터 소스
 */
function setCachedExchangeRate(rate, source = 'api') {
  try {
    const timestamp = Date.now().toString();
    localStorage.setItem(STORAGE_KEYS.RATE, rate.toString());
    localStorage.setItem(STORAGE_KEYS.TIMESTAMP, timestamp);
    localStorage.setItem(STORAGE_KEYS.SOURCE, source);
    
    console.log(`💾 환율 캐시 저장: ${rate} (${source})`);
  } catch (error) {
    console.warn('환율 캐시 저장 오류:', error);
  }
}

/**
 * 캐시된 환율 데이터 삭제
 */
function clearCachedExchangeRate() {
  try {
    localStorage.removeItem(STORAGE_KEYS.RATE);
    localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
    localStorage.removeItem(STORAGE_KEYS.SOURCE);
    console.log('🗑️ 환율 캐시 삭제됨');
  } catch (error) {
    console.warn('환율 캐시 삭제 오류:', error);
  }
}

/**
 * 프록시 서버를 통한 환율 API 호출
 * @param {number} retryCount - 재시도 횟수
 * @returns {Promise<object>} 환율 데이터
 */
async function fetchExchangeRateFromAPI(retryCount = 0) {
  try {
    console.log(`📡 환율 API 호출 (${retryCount + 1}/${EXCHANGE_RATE_CONFIG.RETRY_ATTEMPTS})`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXCHANGE_RATE_CONFIG.TIMEOUT);
    
    const response = await fetch(EXCHANGE_RATE_CONFIG.PROXY_URL, {
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
    console.log('📊 환율 API 응답:', data);
    
    if (data.success && data.rate && typeof data.rate === 'number') {
      return {
        rate: data.rate,
        timestamp: Date.now(),
        source: data.source || 'api',
        isFromCache: false
      };
    } else {
      throw new Error('환율 API 응답 형식이 올바르지 않습니다');
    }
    
  } catch (error) {
    console.error(`❌ 환율 API 호출 실패 (${retryCount + 1}회):`, error.message);
    
    // 재시도 로직
    if (retryCount < EXCHANGE_RATE_CONFIG.RETRY_ATTEMPTS - 1) {
      const delay = Math.pow(2, retryCount) * 1000; // 지수 백오프
      console.log(`🔄 ${delay}ms 후 재시도...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchExchangeRateFromAPI(retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * USD/KRW 환율 조회 (메인 함수)
 * @param {boolean} forceRefresh - 캐시 무시하고 강제 새로고침
 * @returns {Promise<object>} 환율 정보
 */
export async function getUSDKRWRate(forceRefresh = false) {
  try {
    // 강제 새로고침이 아닌 경우 캐시 확인
    if (!forceRefresh) {
      const cached = getCachedExchangeRate();
      if (cached) {
        console.log(`✅ 캐시된 환율 사용: ${cached.rate} (${Math.round(cached.cacheAge / 60000)}분 전)`);
        return cached;
      }
    }
    
    // API를 통해 환율 조회
    try {
      const apiResult = await fetchExchangeRateFromAPI();
      setCachedExchangeRate(apiResult.rate, apiResult.source);
      
      console.log(`✅ 환율 조회 성공: ${apiResult.rate} (${apiResult.source})`);
      return apiResult;
      
    } catch (apiError) {
      console.warn('환율 API 실패, 기본값 사용:', apiError.message);
      
      // API 실패 시 기본값 반환
      const fallbackResult = {
        rate: EXCHANGE_RATE_CONFIG.DEFAULT_RATE,
        timestamp: Date.now(),
        source: 'fallback',
        isFromCache: false,
        error: apiError.message
      };
      
      // 기본값도 캐시에 저장 (짧은 시간)
      setCachedExchangeRate(fallbackResult.rate, 'fallback');
      
      return fallbackResult;
    }
    
  } catch (error) {
    console.error('환율 조회 전체 실패:', error);
    
    // 최후의 수단으로 기본값 반환
    return {
      rate: EXCHANGE_RATE_CONFIG.DEFAULT_RATE,
      timestamp: Date.now(),
      source: 'emergency_fallback',
      isFromCache: false,
      error: error.message
    };
  }
}

/**
 * 환율 캐시 상태 확인
 * @returns {object} 캐시 상태 정보
 */
export function getExchangeRateCacheStatus() {
  const cached = getCachedExchangeRate();
  
  if (!cached) {
    return {
      hasCachedData: false,
      message: '캐시된 환율 데이터가 없습니다'
    };
  }
  
  const ageMinutes = Math.round(cached.cacheAge / 60000);
  const remainingMinutes = Math.round((EXCHANGE_RATE_CONFIG.CACHE_DURATION - cached.cacheAge) / 60000);
  
  return {
    hasCachedData: true,
    rate: cached.rate,
    source: cached.source,
    ageMinutes: ageMinutes,
    remainingMinutes: Math.max(0, remainingMinutes),
    isExpired: cached.cacheAge >= EXCHANGE_RATE_CONFIG.CACHE_DURATION,
    message: `캐시된 환율: ${cached.rate} (${ageMinutes}분 전, ${Math.max(0, remainingMinutes)}분 후 만료)`
  };
}

/**
 * 환율 데이터 강제 새로고침
 * @returns {Promise<object>} 새로운 환율 정보
 */
export async function refreshExchangeRate() {
  console.log('🔄 환율 강제 새로고침...');
  clearCachedExchangeRate();
  return await getUSDKRWRate(true);
}

/**
 * 환율 상태 정보 (디버깅용)
 * @returns {object} 환율 서비스 상태
 */
export function getExchangeRateServiceStatus() {
  const cacheStatus = getExchangeRateCacheStatus();
  
  return {
    config: {
      defaultRate: EXCHANGE_RATE_CONFIG.DEFAULT_RATE,
      cacheDurationHours: EXCHANGE_RATE_CONFIG.CACHE_DURATION / (60 * 60 * 1000),
      proxyUrl: EXCHANGE_RATE_CONFIG.PROXY_URL
    },
    cache: cacheStatus,
    lastCheck: new Date().toISOString()
  };
}

// 기본 export
export default {
  getUSDKRWRate,
  refreshExchangeRate,
  getExchangeRateCacheStatus,
  getExchangeRateServiceStatus,
  clearCachedExchangeRate
};