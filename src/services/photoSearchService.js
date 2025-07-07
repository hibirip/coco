/**
 * 사진 검색 서비스
 * 뉴스 제목을 분석하여 관련 실제 사진을 검색하고 가져오기
 */

import { logger } from '../utils/logger';

// 사진 검색 API 설정
const PHOTO_CONFIG = {
  // Unsplash API (무료, 고품질)
  UNSPLASH: {
    BASE_URL: 'https://api.unsplash.com',
    ACCESS_KEY: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '',
    SEARCH_ENDPOINT: '/search/photos',
    PER_PAGE: 5,
    ORIENTATION: 'landscape'
  },
  
  // Pixabay API (무료, 다양한 이미지)
  PIXABAY: {
    BASE_URL: 'https://pixabay.com/api',
    API_KEY: import.meta.env.VITE_PIXABAY_API_KEY || '',
    PER_PAGE: 5,
    IMAGE_TYPE: 'photo',
    ORIENTATION: 'horizontal',
    MIN_WIDTH: 400,
    MIN_HEIGHT: 300
  },
  
  // Pexels API (무료, 고횈질)
  PEXELS: {
    BASE_URL: 'https://api.pexels.com/v1',
    API_KEY: import.meta.env.VITE_PEXELS_API_KEY || '',
    SEARCH_ENDPOINT: '/search',
    PER_PAGE: 5,
    ORIENTATION: 'landscape'
  },
  
  // 공통 설정
  TIMEOUT: 5000,
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24시간
  USE_FALLBACK: true
};

// 키워드 매핑 (한국어 -> 영어)
const KEYWORD_TRANSLATION = {
  // 암호화폐 관련
  '비트코인': 'bitcoin cryptocurrency',
  '이더리움': 'ethereum blockchain',
  '암호화폐': 'cryptocurrency digital money',
  '코인': 'cryptocurrency coin',
  '블록체인': 'blockchain technology',
  '디지털': 'digital technology',
  
  // 금융 관련
  '투자': 'investment finance',
  '거래': 'trading finance',
  '시장': 'market finance',
  '경제': 'economy business',
  '금융': 'finance banking',
  '은행': 'banking finance',
  '돈': 'money finance',
  '가격': 'price chart',
  
  // 기술 관련
  '기술': 'technology innovation',
  '개발': 'development programming',
  '혁신': 'innovation technology',
  '컴퓨터': 'computer technology',
  '인터넷': 'internet technology',
  '소프트웨어': 'software technology',
  
  // 규제/법률
  '규제': 'regulation law government',
  '법': 'law legal government',
  '정부': 'government politics',
  '정책': 'policy government',
  
  // DeFi/NFT
  'defi': 'decentralized finance',
  'nft': 'digital art blockchain',
  '디파이': 'decentralized finance',
  '탈중앙화': 'decentralized blockchain',
  
  // 거래소
  '거래소': 'exchange trading platform',
  '플랫폼': 'platform technology',
  
  // 일반적인 비즈니스
  '회사': 'business company',
  '기업': 'business corporation',
  '산업': 'industry business',
  '서비스': 'service business'
};

// 카테고리별 검색 키워드
const CATEGORY_KEYWORDS = {
  'bitcoin': ['bitcoin', 'cryptocurrency', 'digital currency', 'btc'],
  'ethereum': ['ethereum', 'blockchain', 'smart contracts', 'eth'],
  'defi': ['finance', 'banking', 'decentralized', 'financial technology'],
  'nft': ['digital art', 'collectibles', 'art', 'creative'],
  'regulation': ['government', 'law', 'legal', 'policy'],
  'market': ['charts', 'graphs', 'trading', 'financial data'],
  'technology': ['technology', 'innovation', 'computers', 'digital'],
  'exchange': ['trading platform', 'exchange', 'business', 'finance'],
  'default': ['business', 'technology', 'finance', 'digital']
};

// 메모리 캐시
const photoCache = new Map();

// 사용된 이미지 URL 추적 (중복 방지)
const usedImageUrls = new Set();

/**
 * 뉴스 제목에서 검색 키워드 추출
 * @param {string} title - 뉴스 제목
 * @param {string} category - 뉴스 카테고리
 * @returns {Array<string>} 검색 키워드 배열
 */
function extractSearchKeywords(title, category = 'default') {
  const keywords = new Set();
  
  // 카테고리 기반 키워드 추가
  if (CATEGORY_KEYWORDS[category]) {
    CATEGORY_KEYWORDS[category].forEach(keyword => keywords.add(keyword));
  }
  
  // 제목에서 키워드 추출 및 번역
  const lowerTitle = title.toLowerCase();
  
  Object.entries(KEYWORD_TRANSLATION).forEach(([korean, english]) => {
    if (lowerTitle.includes(korean.toLowerCase())) {
      english.split(' ').forEach(word => keywords.add(word));
    }
  });
  
  // 기본 키워드가 없으면 카테고리 기본값 사용
  if (keywords.size === 0) {
    CATEGORY_KEYWORDS.default.forEach(keyword => keywords.add(keyword));
  }
  
  return Array.from(keywords).slice(0, 3); // 최대 3개 키워드
}

/**
 * 캐시에서 사진 URL 조회
 * @param {string} cacheKey - 캐시 키
 * @returns {string|null} 캐시된 사진 URL 또는 null
 */
function getCachedPhoto(cacheKey) {
  const cached = photoCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < PHOTO_CONFIG.CACHE_DURATION) {
    return cached.url;
  }
  photoCache.delete(cacheKey);
  return null;
}

/**
 * 사진 URL을 캐시에 저장
 * @param {string} cacheKey - 캐시 키
 * @param {string} url - 사진 URL
 */
function setCachedPhoto(cacheKey, url) {
  photoCache.set(cacheKey, {
    url,
    timestamp: Date.now()
  });
}

/**
 * Unsplash에서 사진 검색 (중복 방지)
 * @param {Array<string>} keywords - 검색 키워드
 * @param {number} maxAttempts - 최대 시도 횟수
 * @returns {Promise<string|null>} 사진 URL 또는 null
 */
async function searchUnsplashPhoto(keywords, maxAttempts = 3) {
  try {
    const query = keywords.join(' ');
    const url = new URL(`${PHOTO_CONFIG.UNSPLASH.BASE_URL}${PHOTO_CONFIG.UNSPLASH.SEARCH_ENDPOINT}`);
    
    url.searchParams.append('query', query);
    url.searchParams.append('per_page', Math.min(20, PHOTO_CONFIG.UNSPLASH.PER_PAGE * 4)); // 더 많은 옵션
    url.searchParams.append('orientation', PHOTO_CONFIG.UNSPLASH.ORIENTATION);
    url.searchParams.append('client_id', PHOTO_CONFIG.UNSPLASH.ACCESS_KEY);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PHOTO_CONFIG.TIMEOUT);
    
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // 사용되지 않은 이미지 찾기
      const availablePhotos = data.results.filter(photo => {
        const imageUrl = photo.urls.regular || photo.urls.small;
        return !usedImageUrls.has(imageUrl);
      });
      
      if (availablePhotos.length > 0) {
        // 사용 가능한 이미지에서 랜덤 선택
        const randomIndex = Math.floor(Math.random() * availablePhotos.length);
        const photo = availablePhotos[randomIndex];
        const imageUrl = photo.urls.regular || photo.urls.small;
        
        // 사용된 이미지로 등록
        usedImageUrls.add(imageUrl);
        
        return imageUrl;
      } else if (maxAttempts > 1) {
        // 모든 이미지가 사용된 경우 다른 키워드로 재시도
        const newKeywords = [...keywords];
        newKeywords.push(`random-${Date.now()}`); // 랜덤성 추가
        return await searchUnsplashPhoto(newKeywords, maxAttempts - 1);
      }
    }
    
    return null;
    
  } catch (error) {
    logger.warn('Unsplash 사진 검색 실패:', error.message);
    return null;
  }
}

/**
 * Pixabay에서 사진 검색 (중복 방지)
 * @param {Array<string>} keywords - 검색 키워드
 * @param {number} maxAttempts - 최대 시도 횟수
 * @returns {Promise<string|null>} 사진 URL 또는 null
 */
async function searchPixabayPhoto(keywords, maxAttempts = 3) {
  try {
    const query = keywords.join(' ');
    const url = new URL(PHOTO_CONFIG.PIXABAY.BASE_URL);
    
    url.searchParams.append('key', PHOTO_CONFIG.PIXABAY.API_KEY);
    url.searchParams.append('q', query);
    url.searchParams.append('image_type', PHOTO_CONFIG.PIXABAY.IMAGE_TYPE);
    url.searchParams.append('orientation', PHOTO_CONFIG.PIXABAY.ORIENTATION);
    url.searchParams.append('min_width', PHOTO_CONFIG.PIXABAY.MIN_WIDTH);
    url.searchParams.append('min_height', PHOTO_CONFIG.PIXABAY.MIN_HEIGHT);
    url.searchParams.append('per_page', Math.min(20, PHOTO_CONFIG.PIXABAY.PER_PAGE * 4)); // 더 많은 옵션
    url.searchParams.append('safesearch', 'true');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PHOTO_CONFIG.TIMEOUT);
    
    const response = await fetch(url.toString(), {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.hits && data.hits.length > 0) {
      // 사용되지 않은 이미지 찾기
      const availablePhotos = data.hits.filter(photo => {
        const imageUrl = photo.webformatURL || photo.largeImageURL;
        return !usedImageUrls.has(imageUrl);
      });
      
      if (availablePhotos.length > 0) {
        // 사용 가능한 이미지에서 랜덤 선택
        const randomIndex = Math.floor(Math.random() * availablePhotos.length);
        const photo = availablePhotos[randomIndex];
        const imageUrl = photo.webformatURL || photo.largeImageURL;
        
        // 사용된 이미지로 등록
        usedImageUrls.add(imageUrl);
        
        return imageUrl;
      } else if (maxAttempts > 1) {
        // 모든 이미지가 사용된 경우 다른 키워드로 재시도
        const newKeywords = [...keywords];
        newKeywords.push(`random-${Date.now()}`); // 랜덤성 추가
        return await searchPixabayPhoto(newKeywords, maxAttempts - 1);
      }
    }
    
    return null;
    
  } catch (error) {
    logger.warn('Pixabay 사진 검색 실패:', error.message);
    return null;
  }
}

/**
 * 큐레이션된 암호화폐 관련 이미지 제공 (폴백용, 중복 방지)
 * @param {Array<string>} keywords - 검색 키워드
 * @param {string} newsId - 뉴스 고유 ID (중복 방지용)
 * @returns {string} 큐레이션된 이미지 URL
 */
function getCuratedCryptoImage(keywords, newsId = null) {
  // 암호화폐 관련 고품질 이미지 URL들 (더 많은 옵션으로 확장)
  const cryptoImages = {
    bitcoin: [
      'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1624996379697-f01d168b1a52?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1617857364583-2763ea010c5b?w=600&h=400&fit=crop'
    ],
    blockchain: [
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1585421514738-01798e348774?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1634207421650-b6d5f6a75dce?w=600&h=400&fit=crop'
    ],
    finance: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1543699936-c29d25d2acc3?w=600&h=400&fit=crop'
    ],
    technology: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1526378800651-c32d170fe6f8?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=400&fit=crop'
    ],
    chart: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1560472355-536de3962603?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1543699936-c29d25d2acc3?w=600&h=400&fit=crop'
    ],
    regulation: [
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop'
    ]
  };
  
  // 키워드에 맞는 이미지 카테고리 찾기
  let selectedCategory = 'technology'; // 기본값
  
  for (const keyword of keywords) {
    if (keyword.includes('bitcoin') || keyword.includes('btc')) {
      selectedCategory = 'bitcoin';
      break;
    } else if (keyword.includes('blockchain') || keyword.includes('ethereum')) {
      selectedCategory = 'blockchain';
      break;
    } else if (keyword.includes('finance') || keyword.includes('trading')) {
      selectedCategory = 'finance';
      break;
    } else if (keyword.includes('chart') || keyword.includes('market')) {
      selectedCategory = 'chart';
      break;
    } else if (keyword.includes('regulation') || keyword.includes('law')) {
      selectedCategory = 'regulation';
      break;
    }
  }
  
  const images = cryptoImages[selectedCategory];
  
  // 사용되지 않은 이미지 찾기
  const availableImages = images.filter(imageUrl => !usedImageUrls.has(imageUrl));
  
  let selectedImage;
  if (availableImages.length > 0) {
    // 사용 가능한 이미지에서 선택
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    selectedImage = availableImages[randomIndex];
  } else {
    // 모든 이미지가 사용된 경우, 뉴스 ID 기반으로 고유한 이미지 선택
    const index = newsId ? (newsId.charCodeAt(newsId.length - 1) % images.length) : 
                           Math.floor(Math.random() * images.length);
    selectedImage = images[index];
  }
  
  // 사용된 이미지로 등록
  usedImageUrls.add(selectedImage);
  
  return selectedImage;
}

/**
 * 뉴스 제목에 맞는 사진 검색 (중복 방지)
 * @param {string} title - 뉴스 제목
 * @param {string} category - 뉴스 카테고리
 * @param {string} newsId - 뉴스 고유 ID
 * @returns {Promise<string>} 사진 URL
 */
export async function searchNewsPhoto(title, category = 'default', newsId = null) {
  try {
    // 고유한 캐시 키 생성 (뉴스 ID 포함)
    const cacheKey = `photo_${newsId || title}_${category}`;
    const cachedPhoto = getCachedPhoto(cacheKey);
    if (cachedPhoto && !usedImageUrls.has(cachedPhoto)) {
      logger.debug(`캐시된 사진 사용: ${title.substring(0, 30)}...`);
      usedImageUrls.add(cachedPhoto); // 사용된 이미지로 등록
      return cachedPhoto;
    }
    
    // 검색 키워드 추출
    const keywords = extractSearchKeywords(title, category);
    logger.debug(`사진 검색 키워드: ${keywords.join(', ')}`);
    
    let photoUrl = null;
    
    // 여러 API를 순차적으로 시도 (실제 API 키가 있는 경우)
    if (PHOTO_CONFIG.UNSPLASH.ACCESS_KEY && PHOTO_CONFIG.UNSPLASH.ACCESS_KEY !== 'your-unsplash-access-key') {
      photoUrl = await searchUnsplashPhoto(keywords);
    }
    
    if (!photoUrl && PHOTO_CONFIG.PIXABAY.API_KEY && PHOTO_CONFIG.PIXABAY.API_KEY !== 'your-pixabay-api-key') {
      photoUrl = await searchPixabayPhoto(keywords);
    }
    
    // 모든 API가 실패한 경우 큐레이션된 이미지 사용
    if (!photoUrl) {
      photoUrl = getCuratedCryptoImage(keywords, newsId);
      logger.debug('큐레이션된 암호화폐 이미지 사용');
    }
    
    // 캐시에 저장
    setCachedPhoto(cacheKey, photoUrl);
    
    logger.debug(`사진 검색 완료: ${title.substring(0, 30)}...`);
    return photoUrl;
    
  } catch (error) {
    logger.error('사진 검색 오류:', error);
    
    // 오류 발생시 기본 큐레이션된 이미지 반환
    return getCuratedCryptoImage(['technology'], newsId);
  }
}

/**
 * 뉴스 배열에 사진 추가
 * @param {Array} newsList - 뉴스 배열
 * @returns {Promise<Array>} 사진이 추가된 뉴스 배열
 */
export async function addPhotosToNews(newsList) {
  if (!Array.isArray(newsList) || newsList.length === 0) {
    return newsList;
  }

  try {
    logger.debug(`${newsList.length}개 뉴스에 사진 검색 중...`);
    
    const newsWithPhotos = await Promise.all(
      newsList.map(async (news) => {
        try {
          // 기존 이미지가 있고 placeholder가 아닌 경우 그대로 사용
          if (news.imageUrl && 
              !news.imageUrl.includes('picsum.photos') && 
              !news.imageUrl.includes('placeholder')) {
            return news;
          }
          
          // 제목에 맞는 사진 검색 (뉴스 ID 전달로 중복 방지)
          const searchedPhoto = await searchNewsPhoto(news.title, news.category, news.id);
          
          return {
            ...news,
            imageUrl: searchedPhoto,
            photoSearched: true,
            searchKeywords: extractSearchKeywords(news.title, news.category)
          };
          
        } catch (error) {
          logger.warn(`뉴스 사진 검색 실패 (${news.id}):`, error);
          
          // 실패한 경우 큐레이션된 기본 이미지 사용
          return {
            ...news,
            imageUrl: getCuratedCryptoImage(['technology'], news.id),
            photoSearched: true,
            searchKeywords: ['technology']
          };
        }
      })
    );
    
    logger.debug(`사진 검색 완료: ${newsWithPhotos.length}개`);
    return newsWithPhotos;
    
  } catch (error) {
    logger.error('뉴스 사진 배치 검색 오류:', error);
    return newsList; // 실패한 경우 원본 반환
  }
}

/**
 * 사진 검색 캐시 정리
 */
export function clearPhotoCache() {
  photoCache.clear();
  logger.debug('사진 검색 캐시 정리 완료');
}

/**
 * 사용된 이미지 추적 초기화 (새 세션 시작시)
 */
export function resetUsedImages() {
  usedImageUrls.clear();
  logger.debug('사용된 이미지 추적 초기화 완료');
}

/**
 * 사용된 이미지 수 조회
 * @returns {number} 사용된 이미지 수
 */
export function getUsedImagesCount() {
  return usedImageUrls.size;
}

/**
 * 사진 검색 통계
 * @returns {Object} 통계 정보
 */
export function getPhotoSearchStats() {
  return {
    cacheSize: photoCache.size,
    keywords: Object.keys(KEYWORD_TRANSLATION),
    categories: Object.keys(CATEGORY_KEYWORDS),
    apis: ['unsplash', 'pixabay', 'curated']
  };
}

export default {
  searchNewsPhoto,
  addPhotosToNews,
  clearPhotoCache,
  resetUsedImages,
  getUsedImagesCount,
  getPhotoSearchStats
};