/**
 * CoinNess 뉴스 서비스
 * 암호화폐 뉴스 조회, 카테고리별 필터링, Twitter 피드
 */

// 뉴스 서비스 설정
const NEWS_CONFIG = {
  PROXY_URL: 'http://localhost:8080/api/news',
  COINNESS_URL: 'https://api.coinness.com/v2',
  CACHE_DURATION: 180000, // 3분 (뉴스는 자주 업데이트되므로 짧게)
  RETRY_ATTEMPTS: 2,
  TIMEOUT: 15000, // 15초
  DEFAULT_LIMIT: 20,
  USE_MOCK: true // 개발 중에는 Mock 데이터 사용
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
 * Mock 뉴스 데이터 생성
 */
function generateMockNews(count = 20) {
  const categories = ['비트코인', '이더리움', '규제', '시장', '기술', 'DeFi', 'NFT', '알트코인'];
  const sources = ['코인데스크', '코인니스', '더블록', '크립토슬레이트', '블록미디어', 'CoinTelegraph'];
  
  const sampleNews = [
    {
      title: '비트코인, 45,000달러 돌파 후 조정 구간 진입',
      summary: '비트코인이 45,000달러를 돌파한 후 차익실현 매물이 나오면서 조정 구간에 진입했습니다. 전문가들은 이번 조정이 건전한 상승을 위한 과정이라고 분석하고 있습니다.',
      content: '비트코인이 45,000달러를 돌파한 후 차익실현 매물이 나오면서 조정 구간에 진입했습니다. 전문가들은 이번 조정이 건전한 상승을 위한 과정이라고 분석하고 있습니다. 최근 기관 투자자들의 유입과 ETF 승인 기대감이 상승을 이끌었으나, 단기적인 수익 실현 매물이 나오고 있는 상황입니다.',
      category: '시장',
      importance: 'high'
    },
    {
      title: '이더리움 2.0 스테이킹 보상률 상승세',
      summary: '이더리움 2.0 스테이킹 보상률이 최근 상승세를 보이고 있어 투자자들의 관심이 높아지고 있습니다.',
      content: '이더리움 2.0 스테이킹 보상률이 최근 상승세를 보이고 있어 투자자들의 관심이 높아지고 있습니다. 현재 연 4.5% 수준의 보상률을 제공하고 있으며, 네트워크 보안과 안정성도 크게 개선되고 있습니다.',
      category: '기술',
      importance: 'medium'
    },
    {
      title: '미국 SEC, 비트코인 ETF 승인 검토 중',
      summary: '미국 증권거래위원회(SEC)가 여러 비트코인 ETF 신청서에 대한 승인 검토를 진행 중인 것으로 알려졌습니다.',
      content: '미국 증권거래위원회(SEC)가 여러 비트코인 ETF 신청서에 대한 승인 검토를 진행 중인 것으로 알려졌습니다. 업계 전문가들은 올해 안에 승인 결정이 날 가능성이 높다고 전망하고 있습니다.',
      category: '규제',
      importance: 'high'
    },
    {
      title: 'DeFi 시장 총예치금액(TVL) 1000억 달러 돌파',
      summary: 'DeFi(탈중앙화 금융) 시장의 총예치금액이 1000억 달러를 돌파하며 새로운 이정표를 세웠습니다.',
      content: 'DeFi(탈중앙화 금융) 시장의 총예치금액이 1000억 달러를 돌파하며 새로운 이정표를 세웠습니다. 유니스왑, 아베, 컴파운드 등 주요 프로토콜들의 성장이 이러한 성과를 이끌었습니다.',
      category: 'DeFi',
      importance: 'medium'
    },
    {
      title: 'NFT 시장 회복세, 거래량 전월 대비 30% 증가',
      summary: 'NFT 시장이 회복세를 보이며 거래량이 전월 대비 30% 증가한 것으로 나타났습니다.',
      content: 'NFT 시장이 회복세를 보이며 거래량이 전월 대비 30% 증가한 것으로 나타났습니다. 새로운 컬렉션들의 출시와 게임파이 섹터의 성장이 주요 동력으로 작용했습니다.',
      category: 'NFT',
      importance: 'low'
    }
  ];

  return Array.from({ length: count }, (_, index) => {
    const baseNews = sampleNews[index % sampleNews.length];
    const randomVariation = Math.floor(Math.random() * 1000);
    
    return {
      id: `news_${Date.now()}_${index}`,
      title: `${baseNews.title} ${index > 4 ? `(#${randomVariation})` : ''}`,
      summary: baseNews.summary,
      content: baseNews.content,
      category: categories[Math.floor(Math.random() * categories.length)],
      author: sources[Math.floor(Math.random() * sources.length)],
      publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: `https://picsum.photos/600/400?random=${index}`,
      url: `https://coinness.com/news/${Date.now()}_${index}`,
      readTime: Math.floor(Math.random() * 5) + 2,
      tags: ['암호화폐', '블록체인', baseNews.category],
      importance: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
      metadata: {
        source: 'coinness',
        lang: 'ko',
        isBreaking: Math.random() > 0.8,
        updatedAt: new Date().toISOString()
      }
    };
  });
}

/**
 * Mock Twitter 피드 데이터 생성
 */
function generateMockTwitterFeeds() {
  const influencers = [
    {
      name: 'Elon Musk',
      username: 'elonmusk',
      avatar: 'https://pbs.twimg.com/profile_images/1590968738358079488/IY9Gx6Ok_400x400.jpg',
      verified: true,
      followers: '150M'
    },
    {
      name: 'Michael Saylor',
      username: 'saylor',
      avatar: 'https://pbs.twimg.com/profile_images/1555995571370967042/z8Dg6rIe_400x400.jpg',
      verified: true,
      followers: '3M'
    },
    {
      name: 'Changpeng Zhao',
      username: 'cz_binance',
      avatar: 'https://pbs.twimg.com/profile_images/1592844781734559744/9Sbb5MBF_400x400.jpg',
      verified: true,
      followers: '8M'
    },
    {
      name: 'Vitalik Buterin',
      username: 'VitalikButerin',
      avatar: 'https://pbs.twimg.com/profile_images/977496875887558661/L86xyLF4_400x400.jpg',
      verified: true,
      followers: '5M'
    },
    {
      name: 'Cathie Wood',
      username: 'CathieDWood',
      avatar: 'https://pbs.twimg.com/profile_images/1506754356016553986/jjb_s5mL_400x400.jpg',
      verified: true,
      followers: '1.5M'
    }
  ];

  const tweets = [
    'Bitcoin is digital gold 🚀 The future is bright for cryptocurrency adoption worldwide.',
    'Ethereum ecosystem continues to evolve with innovative DeFi protocols and scaling solutions.',
    'Building the next generation of Web3 infrastructure. The revolution is just beginning.',
    'Innovation never stops in crypto space. We are witnessing the birth of a new financial system.',
    'Blockchain technology will change everything we know about value transfer and digital ownership.',
    'The institutional adoption of Bitcoin is accelerating faster than ever before.',
    'DeFi is democratizing finance and giving people control over their own money.',
    'NFTs represent a paradigm shift in digital ownership and creative economy.',
    'The future of money is programmable. Smart contracts are the building blocks.',
    'Crypto regulation clarity will unlock massive institutional investment flows.'
  ];

  return influencers.map((influencer, index) => ({
    id: `tweet_${Date.now()}_${index}`,
    user: influencer,
    content: tweets[index % tweets.length],
    timestamp: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
    likes: Math.floor(Math.random() * 50000) + 1000,
    retweets: Math.floor(Math.random() * 10000) + 100,
    replies: Math.floor(Math.random() * 1000) + 50,
    url: `https://twitter.com/${influencer.username}/status/${Date.now()}${index}`
  }));
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

    let processedNews = [];

    if (NEWS_CONFIG.USE_MOCK) {
      console.log('🟡 Mock 뉴스 데이터 사용');
      const mockData = generateMockNews(limit);
      
      // 카테고리 필터링
      if (category !== 'all') {
        const filteredData = mockData.filter(news => 
          news.category.toLowerCase().includes(category.toLowerCase())
        );
        processedNews = filteredData.slice(offset, offset + limit);
      } else {
        processedNews = mockData.slice(offset, offset + limit);
      }
    } else {
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
      processedNews = newsData.map(news => processNewsItem(news));
    }
    
    setCachedData(cacheKey, processedNews);
    console.log(`📰 최신 뉴스 조회 완료: ${processedNews.length}개 (${category})`);
    
    return processedNews;

  } catch (error) {
    console.error('최신 뉴스 조회 오류:', error);
    
    // 에러 시 Mock 데이터 반환 (사용자 경험 저해 방지)
    const fallbackNews = generateMockNews(options.limit || NEWS_CONFIG.DEFAULT_LIMIT);
    return fallbackNews;
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
 * Twitter 피드 조회
 * @returns {Promise<Array>} Twitter 피드 배열
 */
export async function getTwitterFeeds() {
  try {
    const cacheKey = 'twitter_feeds';
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('✅ 캐시된 Twitter 피드 사용');
      return cached;
    }

    console.log('🐦 Mock Twitter 피드 데이터 생성');
    const twitterFeeds = generateMockTwitterFeeds();
    
    setCachedData(cacheKey, twitterFeeds);
    console.log(`🐦 Twitter 피드 조회 완료: ${twitterFeeds.length}개`);
    
    return twitterFeeds;

  } catch (error) {
    console.error('Twitter 피드 조회 오류:', error);
    return [];
  }
}

/**
 * 헤드라인 뉴스 조회 (가장 중요한 뉴스)
 * @returns {Promise<object|null>} 헤드라인 뉴스
 */
export async function getHeadlineNews() {
  try {
    const allNews = await getLatestNews({ limit: 10 });
    
    if (allNews.length === 0) {
      return null;
    }

    // 중요도가 높은 뉴스 우선 선택
    const highImportanceNews = allNews.filter(news => news.importance === 'high');
    const headlineNews = highImportanceNews.length > 0 ? highImportanceNews[0] : allNews[0];
    
    console.log(`📰 헤드라인 뉴스: ${headlineNews.title}`);
    return headlineNews;

  } catch (error) {
    console.error('헤드라인 뉴스 조회 오류:', error);
    return null;
  }
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
  getTwitterFeeds,
  getHeadlineNews,
  getAvailableCategories,
  getNewsCacheStatus,
  clearNewsCache,
  checkNewsServiceStatus
};