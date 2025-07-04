/**
 * CoinNess 뉴스 서비스
 * 암호화폐 뉴스 조회 및 카테고리별 필터링
 */

// 뉴스 서비스 설정
const NEWS_CONFIG = {
  PROXY_URL: 'http://localhost:8080/api/news',
  CACHE_DURATION: 180000, // 3분 (뉴스는 자주 업데이트되므로 짧게)
  RETRY_ATTEMPTS: 2,
  TIMEOUT: 15000, // 15초
  DEFAULT_LIMIT: 20
};

// 뉴스 카테고리 매핑
const NEWS_CATEGORIES = {
  all: '전체',
  bitcoin: '비트코인',
  ethereum: '이더리움',
  altcoin: '알트코인',
  defi: 'DeFi',
  nft: 'NFT',
  regulation: '규제',
  market: '시장',
  technology: '기술',
  adoption: '채택',
  exchange: '거래소'
};

// 메모리 캐시
const cache = new Map();

/**
 * 캐시에서 데이터 조회
 * @param {string} key - 캐시 키
 * @returns {object|null} 캐시된 데이터 또는 null
 */
function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < NEWS_CONFIG.CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key); // 만료된 캐시 제거
  return null;
}

/**
 * 캐시에 데이터 저장
 * @param {string} key - 캐시 키
 * @param {object} data - 저장할 데이터
 */
function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * 뉴스 API 호출 (재시도 로직 포함)
 * @param {string} endpoint - API 엔드포인트
 * @param {object} params - 쿼리 매개변수
 * @param {number} retryCount - 재시도 횟수
 * @returns {Promise<object>} API 응답
 */
async function fetchNewsAPI(endpoint = '/', params = {}, retryCount = 0) {
  try {
    const url = new URL(`${NEWS_CONFIG.PROXY_URL}${endpoint}`);
    
    // 쿼리 매개변수 추가
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    console.log(`📰 뉴스 API 호출 (${retryCount + 1}/${NEWS_CONFIG.RETRY_ATTEMPTS}):`, url.pathname);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NEWS_CONFIG.TIMEOUT);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ 뉴스 API 응답: ${response.status} (${data.count || 0}개 뉴스)`);
    
    return data;
    
  } catch (error) {
    console.error(`❌ 뉴스 API 호출 실패 (${retryCount + 1}회):`, error.message);
    
    // 재시도 로직
    if (retryCount < NEWS_CONFIG.RETRY_ATTEMPTS - 1) {
      const delay = Math.pow(2, retryCount) * 1000; // 지수 백오프
      console.log(`🔄 ${delay}ms 후 재시도...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchNewsAPI(endpoint, params, retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * 최신 뉴스 조회
 * @param {object} options - 조회 옵션
 * @param {string} options.category - 카테고리 (선택사항)
 * @param {number} options.limit - 제한 수량 (기본: 20)
 * @param {number} options.offset - 시작 위치 (기본: 0)
 * @param {string} options.lang - 언어 (기본: 'ko')
 * @returns {Promise<Array>} 뉴스 배열
 */
export async function getLatestNews(options = {}) {
  try {
    const {
      category = 'all',
      limit = NEWS_CONFIG.DEFAULT_LIMIT,
      offset = 0,
      lang = 'ko'
    } = options;

    const cacheKey = `latest_news_${category}_${limit}_${offset}_${lang}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`✅ 캐시된 뉴스 사용 (${category})`);
      return cached;
    }

    const params = {
      limit,
      offset,
      lang
    };

    // 카테고리가 'all'이 아닌 경우 추가
    if (category !== 'all') {
      params.category = category;
    }

    const response = await fetchNewsAPI('/', params);
    
    // 응답 데이터 정규화
    const newsData = response.success ? response.data : [];
    
    if (!Array.isArray(newsData)) {
      console.warn('뉴스 데이터가 배열이 아닙니다:', newsData);
      return [];
    }

    // 뉴스 데이터 후처리
    const processedNews = newsData.map(news => processNewsItem(news));
    
    setCachedData(cacheKey, processedNews);
    console.log(`📰 최신 뉴스 조회 완료: ${processedNews.length}개 (${category})`);
    
    return processedNews;

  } catch (error) {
    console.error('최신 뉴스 조회 오류:', error);
    
    // 에러 시 빈 배열 반환 (사용자 경험 저해 방지)
    return [];
  }
}

/**
 * 카테고리별 뉴스 조회
 * @param {string} category - 뉴스 카테고리
 * @param {number} limit - 제한 수량
 * @returns {Promise<Array>} 뉴스 배열
 */
export async function getNewsByCategory(category, limit = NEWS_CONFIG.DEFAULT_LIMIT) {
  try {
    if (!category || !NEWS_CATEGORIES[category]) {
      console.warn('유효하지 않은 카테고리:', category);
      return [];
    }

    return await getLatestNews({
      category,
      limit
    });

  } catch (error) {
    console.error(`카테고리별 뉴스 조회 오류 (${category}):`, error);
    return [];
  }
}

/**
 * 뉴스 검색
 * @param {string} query - 검색 쿼리
 * @param {object} options - 검색 옵션
 * @returns {Promise<Array>} 뉴스 배열
 */
export async function searchNews(query, options = {}) {
  try {
    if (!query || query.trim().length === 0) {
      console.warn('검색 쿼리가 비어있습니다');
      return [];
    }

    const {
      limit = NEWS_CONFIG.DEFAULT_LIMIT,
      offset = 0,
      lang = 'ko'
    } = options;

    const cacheKey = `search_news_${query}_${limit}_${offset}_${lang}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`✅ 캐시된 검색 결과 사용 (${query})`);
      return cached;
    }

    const params = {
      q: query.trim(),
      limit,
      offset,
      lang
    };

    const response = await fetchNewsAPI('/search', params);
    
    // 응답 데이터 정규화
    const newsData = response.success ? response.data : [];
    
    if (!Array.isArray(newsData)) {
      console.warn('검색 결과가 배열이 아닙니다:', newsData);
      return [];
    }

    // 뉴스 데이터 후처리
    const processedNews = newsData.map(news => processNewsItem(news));
    
    setCachedData(cacheKey, processedNews);
    console.log(`🔍 뉴스 검색 완료: ${processedNews.length}개 (${query})`);
    
    return processedNews;

  } catch (error) {
    console.error(`뉴스 검색 오류 (${query}):`, error);
    return [];
  }
}

/**
 * 특정 뉴스 상세 조회
 * @param {string} newsId - 뉴스 ID
 * @returns {Promise<object|null>} 뉴스 상세 정보
 */
export async function getNewsDetail(newsId) {
  try {
    if (!newsId) {
      console.warn('뉴스 ID가 없습니다');
      return null;
    }

    const cacheKey = `news_detail_${newsId}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`✅ 캐시된 뉴스 상세 사용 (${newsId})`);
      return cached;
    }

    const response = await fetchNewsAPI(`/${newsId}`);
    
    if (!response.success || !response.data) {
      console.warn('뉴스 상세 정보를 찾을 수 없습니다:', newsId);
      return null;
    }

    const newsDetail = processNewsItem(response.data);
    
    setCachedData(cacheKey, newsDetail);
    console.log(`📄 뉴스 상세 조회 완료: ${newsId}`);
    
    return newsDetail;

  } catch (error) {
    console.error(`뉴스 상세 조회 오류 (${newsId}):`, error);
    return null;
  }
}

/**
 * 뉴스 아이템 후처리
 * @param {object} news - 원본 뉴스 데이터
 * @returns {object} 후처리된 뉴스 데이터
 */
function processNewsItem(news) {
  if (!news || typeof news !== 'object') {
    return null;
  }

  try {
    return {
      id: news.id || news._id || `news_${Date.now()}_${Math.random()}`,
      title: news.title || '제목 없음',
      content: news.content || news.description || '',
      summary: news.summary || news.excerpt || '',
      url: news.url || news.link || '',
      imageUrl: news.image || news.imageUrl || news.thumbnail || '',
      author: news.author || news.source || '알 수 없음',
      publishedAt: news.publishedAt || news.published_at || news.createdAt || Date.now(),
      category: news.category || 'general',
      tags: Array.isArray(news.tags) ? news.tags : [],
      sentiment: news.sentiment || 'neutral',
      readTime: news.readTime || estimateReadTime(news.content || news.description || ''),
      
      // 메타데이터
      metadata: {
        source: 'coinness',
        lang: news.lang || 'ko',
        isBreaking: news.isBreaking || false,
        importance: news.importance || 'normal',
        updatedAt: news.updatedAt || news.updated_at || Date.now()
      }
    };

  } catch (error) {
    console.error('뉴스 아이템 후처리 오류:', error);
    return null;
  }
}

/**
 * 읽기 시간 추정 (분)
 * @param {string} content - 콘텐츠 텍스트
 * @returns {number} 추정 읽기 시간 (분)
 */
function estimateReadTime(content) {
  if (!content || typeof content !== 'string') {
    return 1;
  }

  const wordsPerMinute = 200; // 분당 단어 수
  const wordCount = content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  
  return Math.max(1, readTime); // 최소 1분
}

/**
 * 사용 가능한 뉴스 카테고리 목록
 * @returns {object} 카테고리 매핑
 */
export function getAvailableCategories() {
  return { ...NEWS_CATEGORIES };
}

/**
 * 뉴스 캐시 상태 정보
 * @returns {object} 캐시 상태
 */
export function getNewsCacheStatus() {
  const entries = Array.from(cache.entries()).map(([key, value]) => ({
    key,
    age: Date.now() - value.timestamp,
    expired: Date.now() - value.timestamp > NEWS_CONFIG.CACHE_DURATION
  }));
  
  return {
    size: cache.size,
    maxAge: NEWS_CONFIG.CACHE_DURATION,
    entries: entries
  };
}

/**
 * 뉴스 캐시 초기화
 */
export function clearNewsCache() {
  cache.clear();
  console.log('🗑️ 뉴스 캐시 초기화됨');
}

/**
 * 뉴스 서비스 상태 확인
 * @returns {Promise<object>} 서비스 상태
 */
export async function checkNewsServiceStatus() {
  try {
    const testNews = await getLatestNews({
      limit: 1
    });

    return {
      available: true,
      healthy: Array.isArray(testNews) && testNews.length >= 0,
      lastCheck: Date.now(),
      cacheSize: cache.size,
      error: null
    };

  } catch (error) {
    return {
      available: false,
      healthy: false,
      lastCheck: Date.now(),
      cacheSize: cache.size,
      error: error.message
    };
  }
}

// 기본 export
export default {
  getLatestNews,
  getNewsByCategory,
  searchNews,
  getNewsDetail,
  getAvailableCategories,
  getNewsCacheStatus,
  clearNewsCache,
  checkNewsServiceStatus
};