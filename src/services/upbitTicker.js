/**
 * 업비트 REST API 서비스 - 실시간 ticker 데이터
 * WebSocket 백업용 REST API 호출
 */

import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/api';

// 환경 감지 (hostname 기반)
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// 업비트 API 설정
const UPBIT_API_CONFIG = {
  // 모든 환경에서 프록시 경유 (통일된 방식)
  BASE_URL: API_CONFIG.UPBIT.BASE_URL,
  TICKER_ENDPOINT: API_CONFIG.UPBIT.TICKER,
  USE_MOCK: false, // 실제 API 사용
  CACHE_DURATION: API_CONFIG.COMMON.CACHE_DURATION.TICKER,
  TIMEOUT: 30000, // 30초로 증가 (Render Cold Start 대응)
  RETRY_TIMEOUT: 15000, // 재시도 시 15초
  MAX_RETRIES: 2 // 최대 2회 재시도
};

// 캐시 저장소
const tickerCache = new Map();

// Mock 데이터는 사용하지 않음 - 실제 API 데이터만 사용

/**
 * 프록시 서버 상태 확인
 * @returns {Promise<boolean>} 프록시 서버가 정상인지 여부
 */
export async function checkProxyHealth() {
  try {
    const healthUrl = `${UPBIT_API_CONFIG.BASE_URL}/health`;
    console.log('🏥 프록시 서버 헬스체크:', healthUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    const isHealthy = response.ok;
    console.log('🏥 프록시 서버 상태:', isHealthy ? '✅ 정상' : '❌ 비정상', `(${response.status})`);
    
    return isHealthy;
  } catch (error) {
    console.error('🏥 프록시 서버 헬스체크 실패:', error.message);
    return false;
  }
}


/**
 * 업비트 API에서 ticker 데이터 가져오기
 * @param {Array} markets - 마켓 배열 (예: ['KRW-BTC', 'KRW-ETH'])
 * @returns {Promise<Object>} 심볼별 ticker 데이터 맵
 */
export async function getBatchUpbitTickerData(markets) {
  if (!markets || markets.length === 0) {
    logger.warn('업비트 ticker: 마켓 목록이 비어있음');
    return {};
  }

  // 실제 API만 사용 - Mock 데이터는 절대 사용하지 않음

  // 업비트 API는 한 번에 많은 마켓 요청 시 실패할 수 있음
  // 20개씩 나누어 요청 (안전한 청크 크기)
  const CHUNK_SIZE = 20;
  const chunks = [];
  
  for (let i = 0; i < markets.length; i += CHUNK_SIZE) {
    chunks.push(markets.slice(i, i + CHUNK_SIZE));
  }
  
  console.log(`[${isDevelopment ? 'Dev' : 'Prod'}] 업비트 마켓을 ${chunks.length}개 청크로 나누어 요청 (각 ${CHUNK_SIZE}개)`);

  try {
    // 배포 환경에서만 프록시 서버 헬스체크 수행
    if (!isDevelopment) {
      console.log('🔍 [Cold Start Detection] 프록시 서버 상태 확인 중...');
      const isProxyHealthy = await checkProxyHealth();
      if (!isProxyHealthy) {
        console.warn('⚠️ [Cold Start] 프록시 서버가 응답하지 않음 - Cold Start 가능성 높음');
        // Cold Start가 감지되면 첫 번째 요청 전에 추가 대기
        console.log('⏳ Cold Start 대응: 5초 추가 대기...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    logger.performance(`업비트 ticker API 호출: 총 ${markets.length}개 마켓 (${chunks.length}개 청크)`);
    
    // 모든 청크에서 데이터 수집
    const allTransformedData = {};
    
    // 각 청크별로 API 호출
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const marketsParam = chunk.join(',');
      const timestamp = Date.now();
      const url = `${UPBIT_API_CONFIG.BASE_URL}${UPBIT_API_CONFIG.TICKER_ENDPOINT}?markets=${marketsParam}&_t=${timestamp}`;
      
      console.log(`🔍 [레이어 1] 브라우저 → 프록시 서버 요청 시작 (청크 ${i + 1}/${chunks.length}):`, {
        url: url.substring(0, 100) + '...',
        markets: chunk.length,
        firstMarket: chunk[0],
        lastMarket: chunk[chunk.length - 1]
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), UPBIT_API_CONFIG.TIMEOUT);
      
      // 재시도 로직 추가
      let lastError = null;
      let retryCount = 0;
      
      while (retryCount <= UPBIT_API_CONFIG.MAX_RETRIES) {
        try {
          const fetchStart = Date.now();
          const currentTimeout = retryCount === 0 ? UPBIT_API_CONFIG.TIMEOUT : UPBIT_API_CONFIG.RETRY_TIMEOUT;
          
          if (retryCount > 0) {
            console.log(`🔄 재시도 ${retryCount}/${UPBIT_API_CONFIG.MAX_RETRIES} (청크 ${i + 1}), 타임아웃: ${currentTimeout}ms`);
          }
          
          const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Requested-With': 'XMLHttpRequest'
            },
            cache: 'no-store',
            mode: 'cors'
          });
          
          clearTimeout(timeoutId);
          const fetchTime = Date.now() - fetchStart;
          
          console.log(`🔍 [레이어 1] 응답 수신 (청크 ${i + 1}):`, {
            status: response.status,
            ok: response.ok,
            응답시간: `${fetchTime}ms`,
            headers: response.headers.get('content-type'),
            재시도횟수: retryCount
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [레이어 1] HTTP 에러 (청크 ${i + 1}):`, {
              status: response.status,
              statusText: response.statusText,
              errorBody: errorText.substring(0, 200)
            });
            
            // 404나 400 에러는 재시도하지 않음
            if (response.status === 404 || response.status === 400) {
              break;
            }
            
            // 5XX 에러나 타임아웃은 재시도
            if (response.status >= 500 || response.status === 408) {
              lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
              retryCount++;
              if (retryCount <= UPBIT_API_CONFIG.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // 재시도 전 대기
                continue;
              }
            }
            break;
          }
          
          // 🔍 레이어 2: 프록시 서버 → 업비트 API 응답 분석
          const responseText = await response.text();
          console.log(`🔍 [레이어 2] 프록시 서버 응답 크기:`, responseText.length, 'bytes');
          
          let tickerArray;
          try {
            tickerArray = JSON.parse(responseText);
          } catch (parseError) {
            console.error(`❌ [레이어 3] JSON 파싱 실패:`, {
              error: parseError.message,
              responsePreview: responseText.substring(0, 200)
            });
            lastError = parseError;
            retryCount++;
            if (retryCount <= UPBIT_API_CONFIG.MAX_RETRIES) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }
            break;
          }
          
          console.log(`✅ [레이어 2] 청크 ${i + 1} 성공:`, {
            데이터수: tickerArray.length,
            첫번째_마켓: tickerArray[0]?.market,
            첫번째_가격: tickerArray[0]?.trade_price
          });
          
          // 🔍 레이어 3: 데이터 파싱 및 변환
          console.log(`🔍 [레이어 3] 데이터 변환 시작 (청크 ${i + 1})`);
          let transformCount = 0;
          
          for (const ticker of tickerArray) {
            const transformedTicker = transformUpbitTickerData(ticker);
            if (transformedTicker) {
              allTransformedData[ticker.market] = transformedTicker;
              transformCount++;
            } else {
              console.warn(`⚠️ [레이어 3] 변환 실패:`, ticker.market);
            }
          }
          
          console.log(`✅ [레이어 3] 변환 완료:`, {
            원본데이터: tickerArray.length,
            변환성공: transformCount,
            누적데이터: Object.keys(allTransformedData).length
          });
          
          // 성공적으로 처리됨 - 재시도 루프 종료
          break;
          
        } catch (fetchError) {
          clearTimeout(timeoutId);
          lastError = fetchError;
          
          // AbortError (타임아웃) 또는 네트워크 에러는 재시도
          if (fetchError.name === 'AbortError' || fetchError.message.includes('fetch')) {
            console.warn(`⚠️ [Cold Start] 타임아웃/네트워크 에러 (청크 ${i + 1}, 시도 ${retryCount + 1}):`, fetchError.message);
            retryCount++;
            if (retryCount <= UPBIT_API_CONFIG.MAX_RETRIES) {
              // Render Cold Start 대응: 재시도 간격 증가
              const waitTime = 2000 + (retryCount * 1000); // 2초, 3초, 4초
              console.log(`⏳ ${waitTime}ms 대기 후 재시도...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }
          
          console.error(`❌ [최종실패] 청크 ${i + 1} 처리 실패:`, fetchError.message);
          break;
        }
      }
      
      // 청크 간 딜레이 (프록시 서버 부하 방지)
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`[${isDevelopment ? 'Dev' : 'Prod'}] Upbit API 전체 결과:`, {
      요청한_마켓수: markets.length,
      성공한_마켓수: Object.keys(allTransformedData).length,
      sampleMarket: allTransformedData['KRW-BTC']?.trade_price?.toLocaleString()
    });
    
    // 캐시 저장 (전체 결과)
    const cacheKey = markets.sort().join(',');
    tickerCache.set(cacheKey, {
      data: allTransformedData,
      timestamp: Date.now()
    });
    
    return allTransformedData;
    
  } catch (error) {
    logger.error('업비트 ticker API 실패:', error.message);
    
    // 캐시에서 이전 데이터 반환
    if (tickerCache.has(cacheKey)) {
      const cached = tickerCache.get(cacheKey);
      logger.debug('업비트 ticker 캐시 데이터 반환 (API 실패)');
      return cached.data;
    }
    
    // API 완전 실패시 빈 객체 반환 (Mock 데이터 사용하지 않음)
    console.error(`[${isDevelopment ? 'Dev' : 'Prod'}] Upbit API 완전 실패:`, {
      error: error.message,
      url: `${UPBIT_API_CONFIG.BASE_URL}${UPBIT_API_CONFIG.TICKER_ENDPOINT}`,
      markets: markets.length
    });
    return {};
  }
}

/**
 * 업비트 ticker 데이터를 표준 형식으로 변환
 * @param {Object} tickerData - 업비트 원본 ticker 데이터
 * @returns {Object} 변환된 ticker 데이터
 */
export function transformUpbitTickerData(tickerData) {
  if (!tickerData || !tickerData.market) {
    logger.warn('업비트 ticker 데이터가 비어있음:', tickerData);
    return null;
  }

  try {
    const changePercent = (tickerData.change_rate || 0) * 100; // 소수점 -> 퍼센트
    const tradePrice = parseFloat(tickerData.trade_price || 0);
    
    // 가격 유효성 검증
    if (tradePrice <= 0 || isNaN(tradePrice)) {
      logger.warn(`Invalid trade price for ${tickerData.market}: ${tickerData.trade_price}`);
      return null;
    }
    
    // 배포 환경에서 데이터 로깅 (BTC만)
    if (!isDevelopment && tickerData.market === 'KRW-BTC') {
      console.log('[Production] Upbit transform:', {
        market: tickerData.market,
        rawPrice: tickerData.trade_price,
        parsedPrice: tradePrice,
        changePercent: changePercent
      });
    }
    
    return {
      market: tickerData.market,
      trade_price: tradePrice,
      change: parseFloat(tickerData.change_price || 0),
      change_rate: parseFloat(tickerData.change_rate || 0),
      change_percent: changePercent,
      acc_trade_volume_24h: parseFloat(tickerData.acc_trade_volume_24h || 0),
      acc_trade_price_24h: parseFloat(tickerData.acc_trade_price_24h || 0),
      high_price: parseFloat(tickerData.high_price || 0),
      low_price: parseFloat(tickerData.low_price || 0),
      timestamp: tickerData.timestamp || Date.now(),
      source: 'upbit-rest-api'
    };
  } catch (error) {
    logger.error('업비트 ticker 데이터 변환 실패:', error, tickerData);
    return null;
  }
}

/**
 * 단일 마켓 ticker 데이터 가져오기
 * @param {string} market - 마켓 코드 (예: 'KRW-BTC')
 * @returns {Promise<Object>} ticker 데이터
 */
export async function getUpbitTickerData(market) {
  const result = await getBatchUpbitTickerData([market]);
  return result[market] || null;
}

/**
 * 캐시 초기화
 */
export function clearUpbitTickerCache() {
  tickerCache.clear();
  logger.debug('업비트 ticker 캐시 초기화');
}

// 기본 export
export default {
  getBatchUpbitTickerData,
  getUpbitTickerData,
  transformUpbitTickerData,
  clearUpbitTickerCache,
  checkProxyHealth
};