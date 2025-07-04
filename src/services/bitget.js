/**
 * Bitget API 직접 호출 테스트 (임시)
 * CORS 에러 발생 확인용
 */

// Bitget API 엔드포인트 (직접 호출)
const BITGET_ENDPOINTS = {
  BASE_URL: 'https://api.bitget.com',
  SPOT_TICKERS: '/api/v2/spot/market/tickers',
  SPOT_TICKER: '/api/v2/spot/market/ticker',
  // 믹스 마진 API (구 API)
  MIX_TICKERS: '/api/mix/v1/market/tickers',
  MIX_TICKER: '/api/mix/v1/market/ticker'
};

/**
 * Bitget API 직접 호출 (CORS 테스트)
 * @param {string} endpoint - API 엔드포인트
 * @param {object} params - 쿼리 매개변수
 * @returns {Promise<object>} API 응답
 */
export async function testBitgetDirectCall(endpoint, params = {}) {
  const url = new URL(BITGET_ENDPOINTS.BASE_URL + endpoint);
  
  // 쿼리 매개변수 추가
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });

  console.log('🚀 Bitget API 직접 호출 테스트:');
  console.log('URL:', url.toString());
  console.log('Params:', params);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CoinTracker/1.0'
      }
    });

    console.log('✅ 응답 상태:', response.status);
    console.log('✅ 응답 헤더:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 응답 데이터:', data);
    return data;

  } catch (error) {
    console.error('❌ CORS 에러 발생:', error);
    console.error('❌ 에러 타입:', error.name);
    console.error('❌ 에러 메시지:', error.message);
    
    // CORS 에러 구체적 확인
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('🚫 CORS 정책에 의해 차단됨');
      console.error('🔧 해결 방법: Proxy 서버 또는 서버 사이드 API 호출 필요');
    }
    
    throw error;
  }
}

/**
 * 여러 Bitget API 엔드포인트 테스트
 * @returns {Promise<object>} 테스트 결과
 */
export async function testAllBitgetEndpoints() {
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // 테스트할 엔드포인트 목록
  const testsToRun = [
    {
      name: 'Spot Market Tickers (v2)',
      endpoint: BITGET_ENDPOINTS.SPOT_TICKERS,
      params: {}
    },
    {
      name: 'Spot Market Single Ticker (v2)',
      endpoint: BITGET_ENDPOINTS.SPOT_TICKER,
      params: { symbol: 'BTCUSDT' }
    },
    {
      name: 'Mix Market Tickers (v1)',
      endpoint: BITGET_ENDPOINTS.MIX_TICKERS,
      params: { productType: 'UMCBL' }
    },
    {
      name: 'Mix Market Single Ticker (v1)',
      endpoint: BITGET_ENDPOINTS.MIX_TICKER,
      params: { symbol: 'BTCUSDT_UMCBL' }
    }
  ];

  console.log('🧪 모든 Bitget API 엔드포인트 테스트 시작...');

  for (const test of testsToRun) {
    console.log(`\n🔍 테스트: ${test.name}`);
    
    try {
      const startTime = performance.now();
      const result = await testBitgetDirectCall(test.endpoint, test.params);
      const endTime = performance.now();
      
      testResults.tests.push({
        name: test.name,
        endpoint: test.endpoint,
        params: test.params,
        success: true,
        responseTime: Math.round(endTime - startTime),
        dataReceived: result ? Object.keys(result).length : 0,
        error: null
      });
      
      console.log(`✅ ${test.name} 성공 (${Math.round(endTime - startTime)}ms)`);
      
    } catch (error) {
      testResults.tests.push({
        name: test.name,
        endpoint: test.endpoint,
        params: test.params,
        success: false,
        responseTime: null,
        dataReceived: 0,
        error: {
          name: error.name,
          message: error.message,
          isCORS: error.name === 'TypeError' && error.message.includes('fetch')
        }
      });
      
      console.log(`❌ ${test.name} 실패: ${error.message}`);
    }
  }

  // 테스트 결과 요약
  const successCount = testResults.tests.filter(t => t.success).length;
  const failCount = testResults.tests.filter(t => !t.success).length;
  const corsErrors = testResults.tests.filter(t => t.error && t.error.isCORS).length;

  console.log('\n📊 테스트 결과 요약:');
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`🚫 CORS 에러: ${corsErrors}개`);

  if (corsErrors > 0) {
    console.log('\n🔧 CORS 문제 해결 방법:');
    console.log('1. Vite 프록시 서버 사용 (개발 환경)');
    console.log('2. 백엔드 API 서버 구축 (프로덕션 환경)');
    console.log('3. 서버리스 함수 사용 (Vercel, Netlify 등)');
  }

  return testResults;
}

/**
 * 브라우저 개발자 도구에서 CORS 에러 확인 가이드
 */
export function showCORSDebugGuide() {
  console.log('\n🔍 CORS 에러 디버깅 가이드:');
  console.log('1. 브라우저 개발자 도구 열기 (F12)');
  console.log('2. Network 탭으로 이동');
  console.log('3. API 호출 실행');
  console.log('4. 빨간색으로 표시된 요청 클릭');
  console.log('5. 에러 메시지 확인:');
  console.log('   - "Access-Control-Allow-Origin" 헤더 누락');
  console.log('   - "CORS policy" 차단 메시지');
  console.log('   - Status: (blocked:mixed-content) 또는 (failed)');
  console.log('\n📋 확인해야 할 사항:');
  console.log('- Request URL: API 엔드포인트 정확성');
  console.log('- Request Method: GET/POST 등');
  console.log('- Response Headers: Access-Control-* 헤더 존재 여부');
  console.log('- Console 에러 메시지: 구체적인 CORS 에러 내용');
}

// 기본 export
export default {
  testBitgetDirectCall,
  testAllBitgetEndpoints,
  showCORSDebugGuide,
  BITGET_ENDPOINTS
};