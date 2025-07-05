/**
 * Bitget K-line 데이터 서비스
 * 24시간 가격 변동 데이터를 가져와서 스파크라인 차트용 데이터 제공
 */

// Bitget API 설정 (V2 API 사용)
const BITGET_API_CONFIG = {
  BASE_URL: '/api/bitget', // 프록시 경로 사용으로 CORS 회피
  SPOT_KLINE_ENDPOINT: '/api/v2/spot/market/candles',
  USE_MOCK: false, // 실제 API 연결 시도, 실패 시 Mock으로 폴백
  CACHE_TTL: 5 * 60 * 1000, // 5분 캐시
  REQUEST_TIMEOUT: 10000 // 10초 타임아웃
};

// 메모리 캐시
const klineCache = new Map();

/**
 * K-line 데이터 캐시 키 생성
 */
function getCacheKey(symbol, granularity) {
  return `${symbol}_${granularity}`;
}

/**
 * 캐시된 데이터 확인
 */
function getCachedData(symbol, granularity) {
  const key = getCacheKey(symbol, granularity);
  const cached = klineCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < BITGET_API_CONFIG.CACHE_TTL) {
    return cached.data;
  }
  
  return null;
}

/**
 * 데이터 캐시에 저장
 */
function setCachedData(symbol, granularity, data) {
  const key = getCacheKey(symbol, granularity);
  klineCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Mock K-line 데이터 생성
 * @param {string} symbol - 심볼 (예: 'BTCUSDT')
 * @param {number} points - 데이터 포인트 수
 * @param {number} basePrice - 기준 가격
 * @param {number} trend - 트렌드 (-1 ~ 1)
 */
function generateMockKlineData(symbol, points = 24, basePrice = 45000, trend = 0) {
  const data = [];
  let currentPrice = basePrice;
  
  // 심볼별 기준 가격 설정
  const symbolPrices = {
    'BTCUSDT': 45000,
    'ETHUSDT': 2800,
    'XRPUSDT': 0.65,
    'ADAUSDT': 0.42,
    'SOLUSDT': 95,
    'DOTUSDT': 6.5,
    'LINKUSDT': 14.5,
    'MATICUSDT': 0.85,
    'UNIUSDT': 7.2,
    'AVAXUSDT': 38
  };
  
  currentPrice = symbolPrices[symbol] || basePrice;
  const startTime = Date.now() - (points * 60 * 60 * 1000); // 24시간 전부터
  
  for (let i = 0; i < points; i++) {
    const timestamp = startTime + (i * 60 * 60 * 1000); // 1시간 간격
    
    // 전체적인 트렌드 + 랜덤 변동
    const trendFactor = trend * (i / points) * 0.1; // 10% 범위의 트렌드
    const randomFactor = (Math.random() - 0.5) * 0.03; // ±1.5% 랜덤 변동
    const hourlyVariation = Math.sin(i * 0.5) * 0.01; // 시간대별 작은 변동
    
    const priceChange = trendFactor + randomFactor + hourlyVariation;
    currentPrice = currentPrice * (1 + priceChange);
    
    // K-line 데이터 형식 (timestamp, open, high, low, close, volume)
    const open = currentPrice;
    const close = currentPrice * (1 + (Math.random() - 0.5) * 0.005); // ±0.25% 변동
    const high = Math.max(open, close) * (1 + Math.random() * 0.005); // 약간 높게
    const low = Math.min(open, close) * (1 - Math.random() * 0.005); // 약간 낮게
    const volume = Math.random() * 1000000;
    
    data.push([
      timestamp.toString(),
      open.toFixed(symbol.includes('USD') && !symbol.includes('BTC') && !symbol.includes('ETH') ? 4 : 2),
      high.toFixed(symbol.includes('USD') && !symbol.includes('BTC') && !symbol.includes('ETH') ? 4 : 2),
      low.toFixed(symbol.includes('USD') && !symbol.includes('BTC') && !symbol.includes('ETH') ? 4 : 2),
      close.toFixed(symbol.includes('USD') && !symbol.includes('BTC') && !symbol.includes('ETH') ? 4 : 2),
      volume.toFixed(2)
    ]);
    
    currentPrice = close;
  }
  
  return data;
}

/**
 * 실제 Bitget K-line API 호출 (V2 API)
 * @param {string} symbol - 심볼 (예: 'BTCUSDT')
 * @param {string} granularity - 시간 간격 ('1h', '1d', '5m' 등)
 * @param {number} limit - 최대 데이터 수 (기본값: 24)
 */
async function fetchBitgetKlineData(symbol, granularity = '1h', limit = 24) {
  try {
    // V2 API 파라미터 설정
    const endTime = Date.now(); // 현재 시간
    const params = new URLSearchParams({
      symbol: symbol.toUpperCase(), // V2에서는 대문자 필수
      granularity: granularity.toLowerCase(), // V2에서는 소문자 (1h, 1d 등)
      endTime: endTime.toString(),
      limit: Math.min(limit, 200).toString() // V2에서는 최대 200개
    });
    
    const url = `${BITGET_API_CONFIG.BASE_URL}${BITGET_API_CONFIG.SPOT_KLINE_ENDPOINT}?${params}`;
    
    console.log(`📊 Bitget K-line API 요청: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BITGET_API_CONFIG.REQUEST_TIMEOUT);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.code !== '00000' || !data.data) {
      throw new Error(`API Error: ${data.msg || 'Unknown error'}`);
    }
    
    console.log(`✅ Bitget K-line 데이터 수신: ${symbol} (${data.data.length}개)`);
    return data.data;
    
  } catch (error) {
    console.error(`❌ Bitget K-line API 오류 (${symbol}):`, error.message);
    throw error;
  }
}

/**
 * K-line 데이터 가져오기 (캐시 + API)
 * @param {string} symbol - 심볼
 * @param {string} granularity - 시간 간격 (기본값: '1H')
 * @param {number} limit - 데이터 수 (기본값: 24)
 * @returns {Promise<Array>} K-line 데이터 배열
 */
export async function getKlineData(symbol, granularity = '1H', limit = 24) {
  try {
    // 캐시 확인
    const cachedData = getCachedData(symbol, granularity);
    if (cachedData) {
      console.log(`🔄 캐시된 K-line 데이터 사용: ${symbol}`);
      return cachedData;
    }
    
    let klineData;
    
    if (BITGET_API_CONFIG.USE_MOCK) {
      // Mock 모드
      console.log(`🎭 Mock K-line 데이터 생성: ${symbol}`);
      
      // 랜덤한 트렌드 생성 (-0.5 ~ 0.5)
      const trend = (Math.random() - 0.5);
      klineData = generateMockKlineData(symbol, limit, undefined, trend);
      
      // 약간의 지연 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      
    } else {
      // 실제 API 호출
      klineData = await fetchBitgetKlineData(symbol, granularity, limit);
    }
    
    // 캐시에 저장
    setCachedData(symbol, granularity, klineData);
    
    return klineData;
    
  } catch (error) {
    console.error(`❌ K-line 데이터 가져오기 실패 (${symbol}):`, error.message);
    
    // 오류 시 Mock 데이터 반환
    console.log(`🎭 오류 복구: Mock 데이터로 대체 (${symbol})`);
    const trend = (Math.random() - 0.5);
    return generateMockKlineData(symbol, limit, undefined, trend);
  }
}

/**
 * K-line 데이터를 스파크라인용 가격 배열로 변환
 * @param {Array} klineData - K-line 데이터 ([timestamp, open, high, low, close, volume])
 * @returns {Array} 종가 배열
 */
export function klineToSparklineData(klineData) {
  if (!Array.isArray(klineData) || klineData.length === 0) {
    return [];
  }
  
  return klineData.map(candle => {
    // K-line 데이터: [timestamp, open, high, low, close, volume]
    const close = parseFloat(candle[4]); // 종가 사용
    return isNaN(close) ? 0 : close;
  });
}

/**
 * 여러 심볼의 K-line 데이터를 병렬로 가져오기
 * @param {Array} symbols - 심볼 배열
 * @param {string} granularity - 시간 간격
 * @param {number} limit - 데이터 수
 * @returns {Promise<Object>} 심볼별 K-line 데이터 객체
 */
export async function getBatchKlineData(symbols, granularity = '1H', limit = 24) {
  console.log(`📊 배치 K-line 데이터 요청: ${symbols.length}개 심볼`);
  
  try {
    const promises = symbols.map(symbol => 
      getKlineData(symbol, granularity, limit)
        .then(data => ({ symbol, data, error: null }))
        .catch(error => ({ symbol, data: null, error: error.message }))
    );
    
    const results = await Promise.all(promises);
    
    const klineDataMap = {};
    let successCount = 0;
    
    results.forEach(({ symbol, data, error }) => {
      if (data && !error) {
        klineDataMap[symbol] = data;
        successCount++;
      } else {
        console.warn(`⚠️ K-line 데이터 실패 (${symbol}): ${error}`);
      }
    });
    
    console.log(`✅ 배치 K-line 완료: ${successCount}/${symbols.length}개 성공`);
    return klineDataMap;
    
  } catch (error) {
    console.error('❌ 배치 K-line 데이터 오류:', error);
    return {};
  }
}

/**
 * 캐시 정리
 */
export function clearKlineCache() {
  klineCache.clear();
  console.log('🧹 K-line 캐시 정리 완료');
}

/**
 * 캐시 통계
 */
export function getKlineCacheStats() {
  const totalEntries = klineCache.size;
  const currentTime = Date.now();
  let validEntries = 0;
  
  klineCache.forEach(({ timestamp }) => {
    if (currentTime - timestamp < BITGET_API_CONFIG.CACHE_TTL) {
      validEntries++;
    }
  });
  
  return {
    total: totalEntries,
    valid: validEntries,
    expired: totalEntries - validEntries,
    ttl: BITGET_API_CONFIG.CACHE_TTL
  };
}