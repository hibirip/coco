/**
 * CORS 우회 설정
 * 배포 환경에서 직접 API 호출 시 CORS 문제 해결
 */

const CORS_PROXY_SERVICES = [
  'https://api.allorigins.win/get?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://thingproxy.freeboard.io/fetch/'
];

/**
 * CORS 프록시를 사용한 API 호출
 * @param {string} url - 원본 API URL
 * @param {object} options - fetch 옵션
 * @returns {Promise<Response>} 프록시를 통한 응답
 */
export async function fetchWithCorsProxy(url, options = {}) {
  const IS_PRODUCTION = import.meta.env.PROD;
  
  // 개발 환경에서는 직접 호출
  if (!IS_PRODUCTION) {
    return fetch(url, options);
  }

  // 운영 환경에서는 CORS 프록시 사용
  for (const proxyService of CORS_PROXY_SERVICES) {
    try {
      let proxyUrl;
      
      if (proxyService.includes('allorigins')) {
        // AllOrigins 서비스 사용
        proxyUrl = `${proxyService}${encodeURIComponent(url)}`;
        
        const response = await fetch(proxyUrl, {
          ...options,
          method: 'GET' // AllOrigins는 GET만 지원
        });
        
        if (!response.ok) {
          throw new Error(`Proxy response: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.status && data.status.http_code === 200) {
          // AllOrigins 응답을 표준 Response로 변환
          return new Response(data.contents, {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        } else {
          throw new Error('AllOrigins proxy failed');
        }
      } else {
        // 다른 프록시 서비스 사용
        proxyUrl = `${proxyService}${url}`;
        
        const response = await fetch(proxyUrl, {
          ...options,
          headers: {
            ...options.headers,
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        if (response.ok) {
          return response;
        } else {
          throw new Error(`Proxy response: ${response.status}`);
        }
      }
    } catch (error) {
      console.warn(`CORS 프록시 실패 (${proxyService}):`, error.message);
      continue; // 다음 프록시 시도
    }
  }
  
  // 모든 프록시 실패 시 직접 호출 시도
  console.warn('모든 CORS 프록시 실패, 직접 호출 시도');
  return fetch(url, options);
}

/**
 * 안전한 JSON 파싱
 * @param {Response} response - fetch 응답
 * @returns {Promise<object>} 파싱된 JSON 데이터
 */
export async function safeJsonParse(response) {
  try {
    const text = await response.text();
    
    // 빈 응답 처리
    if (!text.trim()) {
      throw new Error('Empty response');
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON 파싱 오류:', error);
    throw new Error(`Invalid JSON response: ${error.message}`);
  }
}

export default {
  fetchWithCorsProxy,
  safeJsonParse
};