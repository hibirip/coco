/**
 * Twitter/X API v2 연동 서비스
 * 실제 크립토 인플루언서들의 최신 게시물을 불러오기
 */

import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/api';

// Twitter API 설정
const TWITTER_CONFIG = {
  // API v2 엔드포인트
  BASE_URL: 'https://api.twitter.com/2',
  
  // Bearer Token (환경변수에서 가져오기)
  BEARER_TOKEN: import.meta.env.VITE_TWITTER_BEARER_TOKEN || 'your-twitter-bearer-token',
  
  // 프록시 서버 사용 (CORS 이슈 방지) - 현재는 미구현이므로 false
  USE_PROXY: false,
  PROXY_URL: API_CONFIG.TWITTER.BASE_URL, // 프록시 서버 경로
  
  // API 제한 및 설정
  MAX_RESULTS: 20,
  CACHE_DURATION: 15 * 60 * 1000, // 15분 캐싱
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 2,
  
  // 요청 제한 (Free tier: 500/month)
  DAILY_LIMIT: 16, // 월 500 / 30일 ≈ 16/day
  REQUEST_INTERVAL: 15 * 60 * 1000 // 15분마다 최대 1회
};

// 크립토 인플루언서 목록 (실제 계정)
const CRYPTO_INFLUENCERS = {
  'elonmusk': {
    name: 'Elon Musk',
    username: 'elonmusk',
    verified: true,
    category: 'tech_ceo',
    priority: 1
  },
  'saylor': {
    name: 'Michael Saylor',
    username: 'saylor',
    verified: true,
    category: 'bitcoin_advocate',
    priority: 2
  },
  'VitalikButerin': {
    name: 'Vitalik Buterin',
    username: 'VitalikButerin',
    verified: true,
    category: 'ethereum_founder',
    priority: 3
  },
  'cz_binance': {
    name: 'Changpeng Zhao',
    username: 'cz_binance',
    verified: true,
    category: 'exchange_ceo',
    priority: 4
  },
  'CathieDWood': {
    name: 'Cathie Wood',
    username: 'CathieDWood',
    verified: true,
    category: 'investor',
    priority: 5
  },
  'brian_armstrong': {
    name: 'Brian Armstrong',
    username: 'brian_armstrong',
    verified: true,
    category: 'exchange_ceo',
    priority: 6
  },
  'coinbase': {
    name: 'Coinbase',
    username: 'coinbase',
    verified: true,
    category: 'exchange_official',
    priority: 7
  },
  'aantonop': {
    name: 'Andreas M. Antonopoulos',
    username: 'aantonop',
    verified: true,
    category: 'bitcoin_educator',
    priority: 8
  }
};

// 크립토 관련 키워드
const CRYPTO_KEYWORDS = [
  'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency',
  'blockchain', 'defi', 'nft', 'web3', 'hodl', 'altcoin',
  'trading', 'binance', 'coinbase', 'doge', 'ada', 'sol'
];

// 메모리 캐시
const twitterCache = new Map();
let lastRequestTime = 0;
let dailyRequestCount = 0;
let lastResetDate = new Date().toDateString();

/**
 * 캐시에서 데이터 조회
 * @param {string} key - 캐시 키
 * @returns {object|null} 캐시된 데이터 또는 null
 */
function getCachedData(key) {
  const cached = twitterCache.get(key);
  if (cached && Date.now() - cached.timestamp < TWITTER_CONFIG.CACHE_DURATION) {
    return cached.data;
  }
  twitterCache.delete(key);
  return null;
}

/**
 * 캐시에 데이터 저장
 * @param {string} key - 캐시 키
 * @param {object} data - 저장할 데이터
 */
function setCachedData(key, data) {
  twitterCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * API 요청 제한 확인
 * @returns {boolean} 요청 가능 여부
 */
function canMakeRequest() {
  const currentDate = new Date().toDateString();
  
  // 새로운 날이면 카운터 리셋
  if (currentDate !== lastResetDate) {
    dailyRequestCount = 0;
    lastResetDate = currentDate;
  }
  
  // 일일 제한 확인
  if (dailyRequestCount >= TWITTER_CONFIG.DAILY_LIMIT) {
    logger.warn('Twitter API 일일 요청 제한 도달');
    return false;
  }
  
  // 최소 간격 확인
  const timeSinceLastRequest = Date.now() - lastRequestTime;
  if (timeSinceLastRequest < TWITTER_CONFIG.REQUEST_INTERVAL) {
    logger.debug('Twitter API 요청 간격 제한');
    return false;
  }
  
  return true;
}

/**
 * 트윗이 크립토 관련인지 확인
 * @param {string} text - 트윗 텍스트
 * @returns {boolean} 크립토 관련 여부
 */
function isCryptoRelated(text) {
  if (!text || typeof text !== 'string') return false;
  
  const lowerText = text.toLowerCase();
  return CRYPTO_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
}

/**
 * 검색 쿼리 생성
 * @returns {string} Twitter API 검색 쿼리
 */
function buildSearchQuery() {
  // 인플루언서들의 계정에서 크립토 관련 키워드가 포함된 트윗 검색
  const userQueries = Object.keys(CRYPTO_INFLUENCERS).map(username => `from:${username}`);
  const keywordQuery = CRYPTO_KEYWORDS.slice(0, 5).join(' OR '); // API 제한으로 키워드 제한
  
  return `(${userQueries.join(' OR ')}) (${keywordQuery}) -is:retweet -is:reply`;
}

/**
 * 실제 Twitter API v2 호출
 * @param {string} query - 검색 쿼리
 * @returns {Promise<Array>} 트윗 데이터 배열
 */
async function fetchRealTwitterData(query) {
  try {
    const url = TWITTER_CONFIG.USE_PROXY 
      ? `${TWITTER_CONFIG.PROXY_URL}/search`
      : `${TWITTER_CONFIG.BASE_URL}/tweets/search/recent`;
    
    const params = new URLSearchParams({
      query: query,
      max_results: TWITTER_CONFIG.MAX_RESULTS,
      'tweet.fields': 'created_at,author_id,public_metrics,context_annotations,lang',
      'user.fields': 'name,username,verified,profile_image_url,public_metrics',
      'expansions': 'author_id'
    });
    
    const requestUrl = TWITTER_CONFIG.USE_PROXY 
      ? url 
      : `${url}?${params.toString()}`;
    
    logger.api(`Twitter API 요청: ${query.substring(0, 50)}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TWITTER_CONFIG.TIMEOUT);
    
    const response = await fetch(requestUrl, {
      method: TWITTER_CONFIG.USE_PROXY ? 'POST' : 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(TWITTER_CONFIG.USE_PROXY 
          ? {} 
          : { 'Authorization': `Bearer ${TWITTER_CONFIG.BEARER_TOKEN}` }
        )
      },
      ...(TWITTER_CONFIG.USE_PROXY && {
        body: JSON.stringify({
          query: query,
          max_results: TWITTER_CONFIG.MAX_RESULTS,
          tweet_fields: 'created_at,author_id,public_metrics,context_annotations,lang',
          user_fields: 'name,username,verified,profile_image_url,public_metrics',
          expansions: 'author_id'
        })
      })
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // API 요청 카운터 업데이트
    dailyRequestCount++;
    lastRequestTime = Date.now();
    
    logger.api(`Twitter API 응답: ${data.data?.length || 0}개 트윗`);
    
    return data;
    
  } catch (error) {
    logger.error('Twitter API 호출 실패:', error);
    throw error;
  }
}

/**
 * Twitter API 응답을 앱 형식으로 변환
 * @param {object} apiResponse - Twitter API 응답
 * @returns {Array} 변환된 트윗 배열
 */
function transformTwitterResponse(apiResponse) {
  try {
    if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
      return [];
    }
    
    const tweets = apiResponse.data;
    const users = apiResponse.includes?.users || [];
    
    // 사용자 정보 매핑
    const userMap = users.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {});
    
    const transformedTweets = tweets
      .filter(tweet => {
        // 크립토 관련 트윗만 필터링
        return tweet.lang === 'en' && isCryptoRelated(tweet.text);
      })
      .map(tweet => {
        const user = userMap[tweet.author_id];
        const influencer = CRYPTO_INFLUENCERS[user?.username] || {};
        
        return {
          id: tweet.id,
          user: {
            name: user?.name || influencer.name || 'Unknown',
            username: user?.username || 'unknown',
            avatar: user?.profile_image_url || `data:image/svg+xml;base64,${btoa(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#3B82F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#FFFFFF">${user?.username?.[0] || 'U'}</text></svg>`)}`,
            verified: user?.verified || influencer.verified || false,
            followers: formatFollowerCount(user?.public_metrics?.followers_count || 0)
          },
          content: tweet.text,
          timestamp: tweet.created_at,
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
          url: `https://twitter.com/${user?.username}/status/${tweet.id}`,
          isReal: true, // 실제 트윗임을 표시
          priority: influencer.priority || 999
        };
      })
      .sort((a, b) => {
        // 우선순위와 인기도로 정렬
        const priorityDiff = a.priority - b.priority;
        if (priorityDiff !== 0) return priorityDiff;
        
        const popularityA = a.likes + a.retweets * 2;
        const popularityB = b.likes + b.retweets * 2;
        return popularityB - popularityA;
      })
      .slice(0, 5); // 상위 5개만
    
    return transformedTweets;
    
  } catch (error) {
    logger.error('Twitter 응답 변환 오류:', error);
    return [];
  }
}

/**
 * 팔로워 수를 읽기 쉬운 형식으로 변환
 * @param {number} count - 팔로워 수
 * @returns {string} 포맷된 팔로워 수
 */
function formatFollowerCount(count) {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * 인플루언서 아바타 이미지 URL 가져오기
 * @param {string} username - 사용자명
 * @returns {string} 아바타 이미지 URL
 */
function getInfluencerAvatar(username) {
  const avatars = {
    'elonmusk': 'https://pbs.twimg.com/profile_images/1590968738358079488/IY9Gx6Ok_400x400.jpg',
    'saylor': 'https://pbs.twimg.com/profile_images/1555995571370967042/z8Dg6rIe_400x400.jpg',
    'VitalikButerin': 'https://pbs.twimg.com/profile_images/977496875887558661/L86xyLF4_400x400.jpg',
    'cz_binance': 'https://pbs.twimg.com/profile_images/1592844781734559744/9Sbb5MBF_400x400.jpg',
    'CathieDWood': 'https://pbs.twimg.com/profile_images/1506754356016553986/jjb_s5mL_400x400.jpg'
  };
  
  return avatars[username] || `data:image/svg+xml;base64,${btoa(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#3B82F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#FFFFFF">${username[0].toUpperCase()}</text></svg>`)}`;
}

/**
 * Mock Twitter 피드 데이터 생성 (폴백용)
 */
function generateFallbackTwitterFeeds() {
  const fallbackTweets = [
    {
      user: CRYPTO_INFLUENCERS.elonmusk,
      content: 'Bitcoin is digital gold 🚀 The future is bright for cryptocurrency adoption worldwide.',
      priority: 1
    },
    {
      user: CRYPTO_INFLUENCERS.saylor,
      content: 'Ethereum ecosystem continues to evolve with innovative DeFi protocols and scaling solutions.',
      priority: 2
    },
    {
      user: CRYPTO_INFLUENCERS.VitalikButerin,
      content: 'Building the next generation of Web3 infrastructure. The revolution is just beginning.',
      priority: 3
    },
    {
      user: CRYPTO_INFLUENCERS.cz_binance,
      content: 'Innovation never stops in crypto space. We are witnessing the birth of a new financial system.',
      priority: 4
    },
    {
      user: CRYPTO_INFLUENCERS.CathieDWood,
      content: 'Blockchain technology will change everything we know about value transfer and digital ownership.',
      priority: 5
    }
  ];
  
  return fallbackTweets.map((tweet, index) => ({
    id: `fallback_tweet_${Date.now()}_${index}`,
    user: {
      name: tweet.user.name,
      username: tweet.user.username,
      avatar: getInfluencerAvatar(tweet.user.username),
      verified: tweet.user.verified,
      followers: ['150M', '3M', '5M', '8M', '1.5M'][index]
    },
    content: tweet.content,
    timestamp: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
    likes: Math.floor(Math.random() * 50000) + 1000,
    retweets: Math.floor(Math.random() * 10000) + 100,
    replies: Math.floor(Math.random() * 1000) + 50,
    url: `https://twitter.com/${tweet.user.username}/status/${Date.now()}${index}`,
    isReal: false, // Mock 데이터임을 표시
    priority: tweet.priority
  }));
}

/**
 * 실제 Twitter 피드 조회
 * @returns {Promise<Array>} Twitter 피드 배열
 */
export async function getRealTwitterFeeds() {
  try {
    const cacheKey = 'real_twitter_feeds';
    const cached = getCachedData(cacheKey);
    if (cached) {
      logger.debug('캐시된 Twitter 피드 사용');
      return cached;
    }
    
    // 현재는 프록시 서버 미구현으로 항상 폴백 데이터 사용
    // API 키가 있어도 CORS 문제로 직접 호출 불가
    if (TWITTER_CONFIG.BEARER_TOKEN === 'your-twitter-bearer-token' || !TWITTER_CONFIG.USE_PROXY || !canMakeRequest()) {
      logger.warn('Twitter API 사용 불가 (프록시 서버 미구현), 폴백 데이터 사용');
      const fallbackFeeds = generateFallbackTwitterFeeds();
      setCachedData(cacheKey, fallbackFeeds);
      return fallbackFeeds;
    }
    
    // 검색 쿼리 생성
    const query = buildSearchQuery();
    
    // API 호출 (재시도 로직 포함)
    let apiResponse = null;
    for (let attempt = 1; attempt <= TWITTER_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        apiResponse = await fetchRealTwitterData(query);
        break;
      } catch (error) {
        logger.warn(`Twitter API 호출 실패 (${attempt}회 시도):`, error.message);
        if (attempt === TWITTER_CONFIG.RETRY_ATTEMPTS) {
          throw error;
        }
        // 재시도 전 대기
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    // 응답 데이터 변환
    const transformedFeeds = transformTwitterResponse(apiResponse);
    
    // 데이터가 충분하지 않으면 폴백 데이터와 혼합
    let finalFeeds = transformedFeeds;
    if (finalFeeds.length < 3) {
      logger.warn('충분한 Twitter 데이터 없음, 폴백 데이터 혼합');
      const fallbackFeeds = generateFallbackTwitterFeeds();
      finalFeeds = [...finalFeeds, ...fallbackFeeds].slice(0, 5);
    }
    
    // 캐시에 저장
    setCachedData(cacheKey, finalFeeds);
    
    logger.api(`실제 Twitter 피드 조회 완료: ${finalFeeds.length}개`);
    return finalFeeds;
    
  } catch (error) {
    logger.error('실제 Twitter 피드 조회 실패:', error);
    
    // 모든 시도 실패시 폴백 데이터 반환
    const fallbackFeeds = generateFallbackTwitterFeeds();
    logger.warn('폴백 Twitter 피드 사용');
    return fallbackFeeds;
  }
}

/**
 * Twitter 캐시 정리
 */
export function clearTwitterCache() {
  twitterCache.clear();
  logger.debug('Twitter 캐시 정리 완료');
}

/**
 * Twitter API 사용량 통계
 * @returns {object} 사용량 통계
 */
export function getTwitterApiStats() {
  return {
    dailyRequestCount,
    dailyLimit: TWITTER_CONFIG.DAILY_LIMIT,
    remainingRequests: Math.max(0, TWITTER_CONFIG.DAILY_LIMIT - dailyRequestCount),
    lastRequestTime: new Date(lastRequestTime).toISOString(),
    cacheSize: twitterCache.size,
    resetDate: lastResetDate
  };
}

/**
 * 크립토 인플루언서 목록 조회
 * @returns {object} 인플루언서 목록
 */
export function getCryptoInfluencers() {
  return { ...CRYPTO_INFLUENCERS };
}

export default {
  getRealTwitterFeeds,
  clearTwitterCache,
  getTwitterApiStats,
  getCryptoInfluencers
};