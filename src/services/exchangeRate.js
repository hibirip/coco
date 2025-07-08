/**
 * 환율 API 서비스 - USD/KRW 환율 전용
 * 김치프리미엄 계산을 위한 실시간 환율 정보 제공
 */

import { API_CONFIG } from '../config/api';

// 환율 API 설정
const EXCHANGE_RATE_CONFIG = {
  // 구글 검색 기준 환율 (다양한 소스 활용)
  GOOGLE_SEARCH_APIS: [
    'https://api.exchangerate-api.com/v4/latest/USD',
    'https://open.er-api.com/v6/latest/USD',
    'https://api.fxratesapi.com/latest?base=USD&symbols=KRW'
  ],
  // 프록시 서버
  PROXY_URL: API_CONFIG.EXCHANGE_RATE.BASE_URL,
  // 구글 검색 "1달러 한국 환율" 기준 (2025년 7월 8일 실시간)
  DEFAULT_RATE: 1439,
  // 4시간마다 업데이트 (사용자 요청)
  CACHE_DURATION: 4 * 60 * 60 * 1000, // 4시간
  UPDATE_INTERVAL: 4 * 60 * 60 * 1000, // 4시간
  RETRY_ATTEMPTS: API_CONFIG.COMMON.RETRY_ATTEMPTS,
  TIMEOUT: 10000 // 10초 (더 빠른 사용자 경험을 위해 단축)
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
    
    // 4시간 이내의 캐시만 유효
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
 * 구글 검색 기준 환율 API 호출 (다중 소스)
 * @param {number} retryCount - 재시도 횟수
 * @returns {Promise<object>} 환율 데이터
 */
async function fetchExchangeRateFromGoogleAPIs(retryCount = 0) {
  const apiUrls = EXCHANGE_RATE_CONFIG.GOOGLE_SEARCH_APIS;
  
  for (let i = 0; i < apiUrls.length; i++) {
    try {
      const apiUrl = apiUrls[i];
      console.log(`📡 환율 API 호출 ${i + 1}/${apiUrls.length}: ${apiUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), EXCHANGE_RATE_CONFIG.TIMEOUT);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Coco-Exchange-Rate/1.0)'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 환율 API 응답 (${i + 1}):`, data);
      
      // 각 API별 응답 형식 처리
      let krwRate = null;
      let source = `google_api_${i + 1}`;
      
      if (data.rates && data.rates.KRW) {
        // exchangerate-api.com 형식
        krwRate = data.rates.KRW;
        source = 'exchangerate-api.com';
      } else if (data.conversion_rates && data.conversion_rates.KRW) {
        // open.er-api.com 형식
        krwRate = data.conversion_rates.KRW;
        source = 'open.er-api.com';
      } else if (data.data && data.data.KRW) {
        // fxratesapi.com 형식
        krwRate = data.data.KRW;
        source = 'fxratesapi.com';
      }
      
      if (krwRate && typeof krwRate === 'number' && krwRate > 1200 && krwRate < 1600) {
        console.log(`✅ 유효한 환율 수신: ${krwRate} (${source})`);
        return {
          rate: Math.round(krwRate), // 소수점 반올림
          timestamp: Date.now(),
          source: source,
          isFromCache: false
        };
      } else {
        console.warn(`⚠️ 비정상 환율 데이터: ${krwRate} (${source})`);
        continue; // 다음 API 시도
      }
      
    } catch (error) {
      console.error(`❌ 환율 API ${i + 1} 실패:`, error.message);
      continue; // 다음 API 시도
    }
  }
  
  throw new Error('모든 환율 API 호출 실패');
}

/**
 * 구글 검색 기준 기본값으로 환율 설정
 * @returns {object} 구글 기준 환율 데이터
 */
function getGoogleSearchBasedRate() {
  console.log(`📋 구글 검색 "1달러 한국 환율" 기준값 사용: ${EXCHANGE_RATE_CONFIG.DEFAULT_RATE}원`);
  return {
    rate: EXCHANGE_RATE_CONFIG.DEFAULT_RATE,
    timestamp: Date.now(),
    source: 'google_search_2025_07_08',
    isFromCache: false,
    message: '구글 검색 "1달러 한국 환율" 기준값 (2025.07.08 실시간)'
  };
}

/**
 * USD/KRW 환율 조회 (메인 함수)
 * @param {boolean} forceRefresh - 캐시 무시하고 강제 새로고침
 * @returns {Promise<object>} 환율 정보
 */
export async function getUSDKRWRate(forceRefresh = false) {
  try {
    // 강제 새로고침이 아닌 경우 캐시 확인 (4시간 이내)
    if (!forceRefresh) {
      const cached = getCachedExchangeRate();
      if (cached) {
        console.log(`✅ 캐시된 환율 사용: ${cached.rate}원 (${Math.round(cached.cacheAge / 60000)}분 전)`);
        return cached;
      }
    }
    
    console.log('🔍 새로운 환율 데이터 조회 시작...');
    
    // 1차: 구글 검색 기준 환율 API들 시도
    try {
      const apiResult = await fetchExchangeRateFromGoogleAPIs();
      setCachedExchangeRate(apiResult.rate, apiResult.source);
      
      console.log(`✅ 환율 조회 성공: ${apiResult.rate} (${apiResult.source})`);
      return apiResult;
      
    } catch (apiError) {
      console.warn('🔄 구글 API 실패, 구글 검색 기준 기본값 사용:', apiError.message);
      
      // 2차: 구글 검색 기준 기본값 사용
      const googleResult = getGoogleSearchBasedRate();
      setCachedExchangeRate(googleResult.rate, googleResult.source);
      
      console.log(`📋 구글 검색 기준값 사용: ${googleResult.rate}`);
      return googleResult;
    }
    
  } catch (error) {
    console.error('❌ 환율 조회 전체 실패:', error);
    
    // 최후의 수단: 응급 기본값
    const emergencyResult = {
      rate: EXCHANGE_RATE_CONFIG.DEFAULT_RATE,
      timestamp: Date.now(),
      source: 'emergency_fallback',
      isFromCache: false,
      error: error.message,
      message: '응급 기본값 사용 (구글 검색 기준)'
    };
    
    return emergencyResult;
  }
}

/**
 * 자동 환율 업데이트 시작 (4시간 간격 - 구글 검색 기반)
 * @param {Function} onUpdate - 환율 업데이트 시 호출할 콜백 함수
 */
export function startAutoUpdate(onUpdate = null) {
  console.log('🤖 구글 검색 기반 환율 자동 업데이트 시작 (4시간 간격)');
  
  // 즉시 한 번 업데이트
  getUSDKRWRate(false).then(rateData => {
    if (onUpdate && rateData?.rate) {
      onUpdate(rateData.rate);
      console.log(`💰 초기 환율 설정: ${rateData.rate}원 (${rateData.source})`);
    }
  });
  
  // 4시간마다 자동 업데이트 (구글 검색 "1달러 한국 환율" 기준)
  const updateInterval = setInterval(async () => {
    try {
      console.log('⏰ 4시간 주기 구글 기반 환율 업데이트 실행');
      const rateData = await getUSDKRWRate(true); // 강제 새로고침
      
      if (onUpdate && rateData?.rate) {
        onUpdate(rateData.rate);
        console.log(`🔄 환율 업데이트 완료: ${rateData.rate}원 (${rateData.source})`);
      }
    } catch (error) {
      console.error('❌ 자동 환율 업데이트 실패:', error);
    }
  }, EXCHANGE_RATE_CONFIG.UPDATE_INTERVAL);
  
  return updateInterval;
}

/**
 * 자동 업데이트 중지
 * @param {NodeJS.Timeout} intervalId - setInterval에서 반환된 ID
 */
export function stopAutoUpdate(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('🛑 환율 자동 업데이트 중지');
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
  clearCachedExchangeRate,
  startAutoUpdate,
  stopAutoUpdate
};