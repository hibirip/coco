/**
 * 한국은행 공식 환율 API 서비스
 * 정부 공식 기준환율 실시간 제공
 */

import { logger } from '../utils/logger';

// 한국은행 API 설정
const BOK_API_CONFIG = {
  BASE_URL: 'https://ecos.bok.or.kr/api',
  SERVICE_NAME: 'StatisticSearch', 
  // 통계표코드: 731Y001 (원/달러 환율)
  STAT_CODE: '731Y001',
  CYCLE_TYPE: 'DD', // 일별
  ITEM_CODE: '0000001', // 기준환율(매매기준율)
  DEFAULT_RATE: 1366.56,
  CACHE_DURATION: 30 * 60 * 1000, // 30분 캐시
  REQUEST_TIMEOUT: 10000
};

// 로컬 스토리지 키
const STORAGE_KEYS = {
  RATE: 'coco_bok_exchange_rate',
  TIMESTAMP: 'coco_bok_exchange_rate_timestamp',
  SOURCE: 'coco_bok_exchange_rate_source'
};

// 환율 캐시
let exchangeRateCache = {
  rate: null,
  timestamp: null,
  source: null
};

/**
 * 로컬 스토리지에서 캐시된 환율 조회
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
    
    // 30분 이내의 캐시만 유효
    if (cacheAge < BOK_API_CONFIG.CACHE_DURATION) {
      return {
        rate: parseFloat(rate),
        timestamp: parseInt(timestamp),
        source: source || 'bok_cache',
        cacheAge: cacheAge,
        isFromCache: true
      };
    }
    
    // 만료된 캐시 삭제
    clearCachedExchangeRate();
    return null;
  } catch (error) {
    logger.warn('한국은행 환율 캐시 조회 오류:', error);
    return null;
  }
}

/**
 * 환율 데이터를 로컬 스토리지에 캐시
 */
function setCachedExchangeRate(rate, source = 'bok_api') {
  try {
    const timestamp = Date.now().toString();
    localStorage.setItem(STORAGE_KEYS.RATE, rate.toString());
    localStorage.setItem(STORAGE_KEYS.TIMESTAMP, timestamp);
    localStorage.setItem(STORAGE_KEYS.SOURCE, source);
    
    // 메모리 캐시도 업데이트
    exchangeRateCache = {
      rate: rate,
      timestamp: Date.now(),
      source: source
    };
    
    console.log(`💾 한국은행 환율 캐시 저장: ${rate}원 (${source})`);
  } catch (error) {
    logger.warn('한국은행 환율 캐시 저장 오류:', error);
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
    
    exchangeRateCache = {
      rate: null,
      timestamp: null,
      source: null
    };
    
    console.log('🗑️ 한국은행 환율 캐시 삭제됨');
  } catch (error) {
    logger.warn('한국은행 환율 캐시 삭제 오류:', error);
  }
}

/**
 * 오늘 날짜를 YYYYMMDD 형식으로 반환
 */
function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 한국은행 ECOS API에서 환율 조회
 */
async function fetchBOKExchangeRate(apiKey) {
  try {
    if (!apiKey) {
      throw new Error('한국은행 API 키가 필요합니다');
    }
    
    const today = getTodayDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 3); // 3일 전까지 조회 (주말 고려)
    const yesterdayStr = yesterday.getFullYear() + 
                        String(yesterday.getMonth() + 1).padStart(2, '0') + 
                        String(yesterday.getDate()).padStart(2, '0');
    
    // 한국은행 ECOS API URL 구성
    const apiUrl = `${BOK_API_CONFIG.BASE_URL}/${BOK_API_CONFIG.SERVICE_NAME}/${apiKey}/json/kr/1/10/${BOK_API_CONFIG.STAT_CODE}/${BOK_API_CONFIG.CYCLE_TYPE}/${yesterdayStr}/${today}/${BOK_API_CONFIG.ITEM_CODE}`;
    
    console.log('🏛️ 한국은행 API 호출:', apiUrl.replace(apiKey, 'API_KEY'));
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BOK_API_CONFIG.REQUEST_TIMEOUT);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CoinTracker-BOK/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`한국은행 API HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📊 한국은행 API 응답:', data);
    
    // 한국은행 API 응답 구조 확인
    if (!data.StatisticSearch || !data.StatisticSearch.row || data.StatisticSearch.row.length === 0) {
      throw new Error('한국은행 API에서 환율 데이터를 찾을 수 없습니다');
    }
    
    // 가장 최근 데이터 사용 (마지막 요소)
    const latestData = data.StatisticSearch.row[data.StatisticSearch.row.length - 1];
    const exchangeRate = parseFloat(latestData.DATA_VALUE);
    
    if (!exchangeRate || isNaN(exchangeRate) || exchangeRate <= 0) {
      throw new Error(`잘못된 환율 데이터: ${latestData.DATA_VALUE}`);
    }
    
    console.log(`✅ 한국은행 기준환율: ${exchangeRate}원 (${latestData.TIME})`);
    
    return {
      rate: exchangeRate,
      timestamp: Date.now(),
      source: 'bank_of_korea',
      date: latestData.TIME,
      isFromCache: false,
      confidence: 'very_high',
      message: `한국은행 공식 기준환율 (${latestData.TIME})`
    };
    
  } catch (error) {
    logger.error('한국은행 API 조회 실패:', error);
    throw error;
  }
}

/**
 * 프록시 서버를 통한 한국은행 환율 조회
 */
async function fetchBOKRateViaProxy() {
  try {
    const proxyUrl = 'http://localhost:8080/api/exchange-rate';
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`프록시 서버 HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.rate) {
      return {
        rate: data.rate,
        source: data.source || 'proxy_bok',
        timestamp: data.timestamp || Date.now(),
        isFromCache: false
      };
    }
    
    throw new Error('프록시 서버 응답 오류');
    
  } catch (error) {
    logger.error('프록시 서버 한국은행 환율 조회 실패:', error);
    throw error;
  }
}

/**
 * USD/KRW 환율 조회 (메인 함수)
 */
export async function getUSDKRWRate(forceRefresh = false) {
  try {
    // 강제 새로고침이 아닌 경우 캐시 확인
    if (!forceRefresh) {
      const cached = getCachedExchangeRate();
      if (cached) {
        console.log(`💾 캐시된 한국은행 환율 사용: ${cached.rate}원 (${Math.round(cached.cacheAge / 60000)}분 전)`);
        return cached;
      }
    }
    
    // 환경변수에서 한국은행 API 키 확인
    const bokApiKey = process.env.BOK_API_KEY || import.meta.env?.VITE_BOK_API_KEY;
    
    if (bokApiKey) {
      // 1순위: 한국은행 직접 API 호출
      try {
        const bokResult = await fetchBOKExchangeRate(bokApiKey);
        setCachedExchangeRate(bokResult.rate, bokResult.source);
        console.log(`🏛️ 한국은행 공식 환율: ${bokResult.rate}원`);
        return bokResult;
      } catch (bokError) {
        console.warn('한국은행 직접 API 실패:', bokError.message);
      }
    } else {
      console.warn('⚠️ 한국은행 API 키가 설정되지 않았습니다. BOK_API_KEY 환경변수를 설정해주세요.');
    }
    
    // 2순위: 프록시 서버를 통한 한국은행 API 호출
    try {
      const proxyResult = await fetchBOKRateViaProxy();
      setCachedExchangeRate(proxyResult.rate, proxyResult.source);
      console.log(`🔄 프록시를 통한 한국은행 환율: ${proxyResult.rate}원`);
      return proxyResult;
    } catch (proxyError) {
      console.warn('프록시 서버 실패:', proxyError.message);
    }
    
    // 3순위: 기본값 사용
    const fallbackResult = {
      rate: BOK_API_CONFIG.DEFAULT_RATE,
      timestamp: Date.now(),
      source: 'fallback_default',
      isFromCache: false,
      confidence: 'low',
      message: '한국은행 API 연결 실패, 기본값 사용'
    };
    
    console.log(`📋 기본값 사용: ${fallbackResult.rate}원`);
    return fallbackResult;
    
  } catch (error) {
    logger.error('환율 조회 전체 실패:', error);
    
    // 최종 응급 처리
    return {
      rate: BOK_API_CONFIG.DEFAULT_RATE,
      timestamp: Date.now(),
      source: 'emergency_fallback',
      isFromCache: false,
      error: error.message,
      message: '응급 기본값 사용'
    };
  }
}

/**
 * 자동 환율 업데이트 시작 (30분 간격)
 */
export function startAutoUpdate(onUpdate = null) {
  console.log('🤖 한국은행 환율 자동 업데이트 시작 (30분 간격)');
  
  // 즉시 한 번 업데이트
  getUSDKRWRate(false).then(rateData => {
    if (onUpdate && rateData?.rate) {
      onUpdate(rateData.rate);
      console.log(`💰 초기 한국은행 환율 설정: ${rateData.rate}원`);
    }
  });
  
  // 30분마다 자동 업데이트
  const updateInterval = setInterval(async () => {
    try {
      console.log('⏰ 30분 주기 한국은행 환율 업데이트 실행');
      const rateData = await getUSDKRWRate(true); // 강제 새로고침
      
      if (onUpdate && rateData?.rate) {
        onUpdate(rateData.rate);
        console.log(`🔄 한국은행 환율 업데이트 완료: ${rateData.rate}원`);
      }
    } catch (error) {
      logger.error('자동 환율 업데이트 실패:', error);
    }
  }, BOK_API_CONFIG.CACHE_DURATION);
  
  return updateInterval;
}

/**
 * 자동 업데이트 중지
 */
export function stopAutoUpdate(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('🛑 한국은행 환율 자동 업데이트 중지');
  }
}

/**
 * 환율 데이터 강제 새로고침
 */
export async function refreshExchangeRate() {
  console.log('🔄 한국은행 환율 강제 새로고침...');
  clearCachedExchangeRate();
  return await getUSDKRWRate(true);
}

/**
 * 환율 캐시 상태 확인
 */
export function getExchangeRateCacheStatus() {
  const cached = getCachedExchangeRate();
  
  if (!cached) {
    return {
      hasCachedData: false,
      message: '캐시된 한국은행 환율 데이터가 없습니다'
    };
  }
  
  const ageMinutes = Math.round(cached.cacheAge / 60000);
  const remainingMinutes = Math.round((BOK_API_CONFIG.CACHE_DURATION - cached.cacheAge) / 60000);
  
  return {
    hasCachedData: true,
    rate: cached.rate,
    source: cached.source,
    ageMinutes: ageMinutes,
    remainingMinutes: Math.max(0, remainingMinutes),
    isExpired: cached.cacheAge >= BOK_API_CONFIG.CACHE_DURATION,
    message: `캐시된 한국은행 환율: ${cached.rate}원 (${ageMinutes}분 전, ${Math.max(0, remainingMinutes)}분 후 만료)`
  };
}

/**
 * 환율 서비스 상태 정보
 */
export function getExchangeRateServiceStatus() {
  const cacheStatus = getExchangeRateCacheStatus();
  
  return {
    config: {
      provider: '한국은행(BOK)',
      defaultRate: BOK_API_CONFIG.DEFAULT_RATE,
      cacheDurationMinutes: BOK_API_CONFIG.CACHE_DURATION / (60 * 1000),
      statCode: BOK_API_CONFIG.STAT_CODE
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