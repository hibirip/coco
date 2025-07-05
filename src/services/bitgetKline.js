/**
 * Bitget Kline (캔들스틱) 데이터 서비스
 * 스파크라인 차트용 24시간 가격 데이터 제공
 */

import { logger } from '../utils/logger';

// Bitget Kline API 설정 - 로컬과 배포환경 100% 동일하게 설정
const BITGET_KLINE_CONFIG = {
  // 모든 환경에서 프록시 사용 (로컬 기준)
  BASE_URL: '/api/bitget',
  KLINE_ENDPOINT: '/api/v2/spot/market/candles',
  CACHE_TTL: 5 * 60 * 1000, // 5분 캐시
  REQUEST_TIMEOUT: 3000, // 3초 타임아웃 (로컬과 동일)
  INTERVALS: {
    '1h': '1H',
    '4h': '4H', 
    '1d': '1D'
  }
};

// 메모리 캐시
const klineCache = new Map();

/**
 * Kline 데이터 캐시 키 생성
 */
function getCacheKey(symbol, interval = '1h') {
  return `kline_${symbol}_${interval}`;
}

/**
 * 캐시된 데이터 확인
 */
function getCachedKlineData(symbol, interval = '1h') {
  const key = getCacheKey(symbol, interval);
  const cached = klineCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < BITGET_KLINE_CONFIG.CACHE_TTL) {
    return cached.data;
  }
  
  return null;
}

/**
 * 데이터 캐시에 저장
 */
function setCachedKlineData(symbol, data, interval = '1h') {
  const key = getCacheKey(symbol, interval);
  klineCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * 실제 Bitget Kline API 호출
 * @param {string} symbol - 심볼 (예: 'BTCUSDT')
 * @param {string} interval - 시간 간격 (기본값: '1h')
 * @param {number} limit - 데이터 개수 (기본값: 24)
 */
async function fetchBitgetKlineData(symbol, interval = '1h', limit = 24) {
  try {
    // 24시간 전 시간 계산
    const endTime = Date.now();
    const startTime = endTime - (24 * 60 * 60 * 1000); // 24시간 전
    
    const params = new URLSearchParams({
      symbol: symbol.toUpperCase(),
      granularity: BITGET_KLINE_CONFIG.INTERVALS[interval] || '1H',
      startTime: startTime.toString(),
      endTime: endTime.toString(),
      limit: limit.toString()
    });
    
    // 모든 환경에서 동일한 프록시 사용 (로컬 기준)
    const url = `${BITGET_KLINE_CONFIG.BASE_URL}${BITGET_KLINE_CONFIG.KLINE_ENDPOINT}?${params}`;
    
    logger.api(`Bitget Kline API 요청: ${symbol} (${interval})`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BITGET_KLINE_CONFIG.REQUEST_TIMEOUT);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // 모든 환경에서 동일한 방식으로 JSON 파싱 (로컬 기준)
    const data = await response.json();
    
    if (data.code !== '00000' || !data.data) {
      throw new Error(`API Error: ${data.msg || 'Unknown error'}`);
    }
    
    logger.api(`Bitget Kline 데이터 수신: ${symbol} (${data.data.length}개)`);
    return data.data;
    
  } catch (error) {
    logger.error(`Bitget Kline API 오류 (${symbol}):`, error.message);
    throw error;
  }
}

/**
 * 안정적인 Mock Kline 데이터 생성 (API 실패시 폴백용)
 */
function generateMockKlineData(symbol, changePercent = 0) {
  const dataPoints = 24;
  const basePrice = 50000; // 기본 가격
  const data = [];
  
  // 현재 시간부터 24시간 전까지
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const timestamp = now - (i * hourMs);
    
    // 전체 변화율을 기반으로 한 가격 트렌드
    const progress = (dataPoints - 1 - i) / (dataPoints - 1);
    const trendPrice = basePrice * (1 + (changePercent / 100) * progress);
    
    // 시간별 랜덤 변동 (±2%)
    const randomVariation = ((Math.random() - 0.5) * 0.04);
    const price = trendPrice * (1 + randomVariation);
    
    // Bitget Kline 형식: [timestamp, open, high, low, close, volume, quoteVolume]
    data.push([
      timestamp.toString(),
      price.toFixed(2),
      (price * 1.005).toFixed(2), // high
      (price * 0.995).toFixed(2), // low
      price.toFixed(2),
      (Math.random() * 1000).toFixed(2), // volume
      (Math.random() * 50000000).toFixed(2) // quoteVolume
    ]);
  }
  
  return data;
}

/**
 * Bitget Kline 데이터를 스파크라인 형식으로 변환
 * @param {Array} klineData - Bitget API Kline 데이터
 * @returns {Array} 스파크라인용 가격 배열
 */
export function klineToSparklineData(klineData) {
  if (!klineData || !Array.isArray(klineData) || klineData.length === 0) {
    return [];
  }
  
  try {
    // Bitget Kline 형식: [timestamp, open, high, low, close, volume, quoteVolume]
    // close 가격만 추출하여 스파크라인 데이터로 변환
    return klineData.map(candle => {
      const closePrice = parseFloat(candle[4]); // close price
      return isNaN(closePrice) ? 0 : closePrice;
    }).filter(price => price > 0);
  } catch (error) {
    logger.error('Kline 데이터 변환 오류:', error);
    return [];
  }
}

/**
 * 단일 심볼의 스파크라인 데이터 가져오기
 * @param {string} symbol - 심볼
 * @param {string} interval - 시간 간격 (기본값: '1h')
 * @returns {Promise<Array>} 스파크라인 데이터
 */
export async function getSparklineData(symbol, interval = '1h') {
  try {
    // 캐시 확인
    const cachedData = getCachedKlineData(symbol, interval);
    if (cachedData) {
      logger.debug(`캐시된 Kline 데이터 사용: ${symbol}`);
      return klineToSparklineData(cachedData);
    }
    
    // API 호출
    const klineData = await fetchBitgetKlineData(symbol, interval, 24);
    
    // 캐시에 저장
    setCachedKlineData(symbol, klineData, interval);
    
    // 스파크라인 데이터로 변환
    return klineToSparklineData(klineData);
    
  } catch (error) {
    logger.warn(`Kline 데이터 가져오기 실패 (${symbol}), Mock 데이터 사용:`, error.message);
    
    // API 실패시 Mock 데이터로 폴백
    const mockKlineData = generateMockKlineData(symbol, Math.random() * 10 - 5);
    return klineToSparklineData(mockKlineData);
  }
}

/**
 * 여러 심볼의 스파크라인 데이터를 병렬로 가져오기
 * @param {Array} symbols - 심볼 배열
 * @param {string} interval - 시간 간격 (기본값: '1h')
 * @returns {Promise<Object>} 심볼별 스파크라인 데이터 객체
 */
export async function getBatchSparklineData(symbols, interval = '1h') {
  logger.api(`배치 스파크라인 데이터 요청: ${symbols.length}개 심볼`);
  
  try {
    // 병렬로 모든 심볼의 데이터 요청
    const promises = symbols.map(symbol => 
      getSparklineData(symbol, interval)
        .then(data => ({ symbol, data, error: null }))
        .catch(error => ({ symbol, data: [], error: error.message }))
    );
    
    const results = await Promise.all(promises);
    
    // 결과를 객체로 변환
    const sparklineDataMap = {};
    let successCount = 0;
    
    results.forEach(({ symbol, data, error }) => {
      if (data && data.length > 0 && !error) {
        sparklineDataMap[symbol] = data;
        successCount++;
      } else {
        logger.warn(`스파크라인 데이터 실패 (${symbol}): ${error}`);
        // 실패한 경우 빈 배열로 설정 (MockSparkline이 사용됨)
        sparklineDataMap[symbol] = [];
      }
    });
    
    logger.api(`배치 스파크라인 완료: ${successCount}/${symbols.length}개 성공`);
    return sparklineDataMap;
    
  } catch (error) {
    logger.error('배치 스파크라인 데이터 오류:', error);
    
    // 전체 실패시 모든 심볼에 빈 배열 반환
    const sparklineDataMap = {};
    symbols.forEach(symbol => {
      sparklineDataMap[symbol] = [];
    });
    
    return sparklineDataMap;
  }
}

/**
 * 캐시 정리
 */
export function clearKlineCache() {
  klineCache.clear();
  logger.debug('Kline 캐시 정리 완료');
}

/**
 * 캐시 통계
 */
export function getKlineCacheStats() {
  const totalEntries = klineCache.size;
  const currentTime = Date.now();
  let validEntries = 0;
  
  klineCache.forEach(({ timestamp }) => {
    if (currentTime - timestamp < BITGET_KLINE_CONFIG.CACHE_TTL) {
      validEntries++;
    }
  });
  
  return {
    total: totalEntries,
    valid: validEntries,
    expired: totalEntries - validEntries,
    ttl: BITGET_KLINE_CONFIG.CACHE_TTL
  };
}