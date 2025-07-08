/**
 * Coco 프로젝트 - Express Proxy Server
 * CORS 문제 해결 및 모든 외부 API 통합
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// CORS 허용 도메인 설정 (환경 변수 사용)
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];

// 배포 환경에서는 모든 도메인 허용 (임시)
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  corsOrigins.push('*');
}

// 보안 및 미들웨어 설정
app.use(helmet());
app.use(cors({
  origin: isProduction ? true : corsOrigins, // 배포 환경에서는 모든 origin 허용
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'], // HEAD 메소드 추가
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control', 'X-Requested-With', 'Pragma'],
  optionsSuccessStatus: 200 // Internet Explorer (11) 호환성
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 응답 캐시 (간단한 메모리 캐시)
const cache = new Map();
const CACHE_DURATION = 8000; // 8초로 설정하여 클라이언트와 동기화

// 캐시 헬퍼 함수
function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// 에러 핸들링 미들웨어
function handleApiError(error, endpoint) {
  console.error(`❌ ${endpoint} API 오류:`, error.message);
  
  if (error.response) {
    return {
      success: false,
      error: `API 오류 (${error.response.status}): ${error.response.statusText}`,
      status: error.response.status,
      endpoint
    };
  } else if (error.request) {
    return {
      success: false,
      error: '네트워크 오류: API 서버에 연결할 수 없습니다',
      status: 503,
      endpoint
    };
  } else {
    return {
      success: false,
      error: `요청 오류: ${error.message}`,
      status: 500,
      endpoint
    };
  }
}

// 한국은행 API 설정
const BOK_CONFIG = {
  BASE_URL: 'https://ecos.bok.or.kr/api',
  SERVICE_NAME: 'StatisticSearch',
  STAT_CODE: '731Y001', // 원/달러 환율
  CYCLE_TYPE: 'DD', // 일별
  ITEM_CODE: '0000001', // 기준환율(매매기준율)
  CACHE_DURATION: 30 * 60 * 1000 // 30분
};

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
async function fetchBOKExchangeRate() {
  const bokApiKey = process.env.BOK_API_KEY;
  
  if (!bokApiKey) {
    throw new Error('한국은행 API 키가 설정되지 않았습니다. BOK_API_KEY 환경변수를 설정해주세요.');
  }
  
  try {
    const today = getTodayDateString();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const startDate = threeDaysAgo.getFullYear() + 
                     String(threeDaysAgo.getMonth() + 1).padStart(2, '0') + 
                     String(threeDaysAgo.getDate()).padStart(2, '0');
    
    // 한국은행 ECOS API URL 구성
    const apiUrl = `${BOK_CONFIG.BASE_URL}/${BOK_CONFIG.SERVICE_NAME}/${bokApiKey}/json/kr/1/10/${BOK_CONFIG.STAT_CODE}/${BOK_CONFIG.CYCLE_TYPE}/${startDate}/${today}/${BOK_CONFIG.ITEM_CODE}`;
    
    console.log('🏛️ 한국은행 API 호출:', apiUrl.replace(bokApiKey, 'API_KEY'));
    
    const response = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'CoinTracker-BOK/1.0',
        'Accept': 'application/json'
      }
    });
    
    const data = response.data;
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
      success: true,
      rate: exchangeRate,
      timestamp: Date.now(),
      source: 'bank_of_korea',
      date: latestData.TIME,
      message: `한국은행 공식 기준환율 (${latestData.TIME})`
    };
    
  } catch (error) {
    console.error('한국은행 API 조회 실패:', error.message);
    throw error;
  }
}

// === Bitget API 프록시 ===
app.use('/api/bitget', async (req, res) => {
  try {
    const path = req.path;
    const url = `https://api.bitget.com${path}`;
    const cacheKey = `bitget_${req.path}_${JSON.stringify(req.query)}`;
    
    // 로그 축소: 중요한 정보만 기록
    console.log(`📡 Bitget 프록시: ${req.method} ${path}`);
    
    // HEAD 요청 처리 - GET과 동일하게 처리하되 body는 없이 헤더만 반환
    if (req.method === 'HEAD') {
      try {
        const response = await axios.head(url, {
          params: req.query,
          timeout: 10000,
          headers: {
            'User-Agent': 'CoinTracker-Proxy/1.0',
            'Accept': 'application/json'
          }
        });
        
        // 응답 헤더만 설정하고 body 없이 응답
        Object.keys(response.headers).forEach(key => {
          res.setHeader(key, response.headers[key]);
        });
        res.status(200).end();
        return;
      } catch (error) {
        // HEAD 요청 실패 시 200으로 응답 (브라우저 호환성)
        res.status(200).end();
        return;
      }
    }
    
    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control, X-Requested-With, Pragma');
      res.status(200).end();
      return;
    }
    
    // 캐시 확인 (GET 요청에 대해서만)
    const cached = getFromCache(cacheKey);
    if (cached) {
      // 캐시 히트 로그 제거 (불필요한 로그 축소)
      return res.json(cached);
    }
    
    const response = await axios.get(url, {
      params: req.query,
      timeout: 10000,
      headers: {
        'User-Agent': 'CoinTracker-Proxy/1.0',
        'Accept': 'application/json'
      }
    });
    
    // 응답 성공 로그 제거 (불필요한 로그 축소)
    setCache(cacheKey, response.data);
    res.json(response.data);
    
  } catch (error) {
    const errorResponse = handleApiError(error, 'Bitget');
    res.status(errorResponse.status).json(errorResponse);
  }
});

// === Upbit API 프록시 ===
app.use('/api/upbit', async (req, res) => {
  try {
    const path = req.path;
    const url = `https://api.upbit.com${path}`;
    const cacheKey = `upbit_${req.path}_${JSON.stringify(req.query)}`;
    
    // 로그 축소: 중요한 정보만 기록
    console.log(`📡 Upbit 프록시: ${req.method} ${path}`);
    
    // HEAD 요청 처리 - GET과 동일하게 처리하되 body는 없이 헤더만 반환
    if (req.method === 'HEAD') {
      try {
        const response = await axios.head(url, {
          params: req.query,
          timeout: 10000,
          headers: {
            'User-Agent': 'CoinTracker-Proxy/1.0',
            'Accept': 'application/json'
          }
        });
        
        // 응답 헤더만 설정하고 body 없이 응답
        Object.keys(response.headers).forEach(key => {
          res.setHeader(key, response.headers[key]);
        });
        res.status(200).end();
        return;
      } catch (error) {
        // HEAD 요청 실패 시 200으로 응답 (브라우저 호환성)
        res.status(200).end();
        return;
      }
    }
    
    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control, X-Requested-With, Pragma');
      res.status(200).end();
      return;
    }
    
    // 캐시 확인 (GET 요청에 대해서만)
    const cached = getFromCache(cacheKey);
    if (cached) {
      // 캐시 히트 로그 제거 (불필요한 로그 축소)
      return res.json(cached);
    }
    
    const response = await axios.get(url, {
      params: req.query,
      timeout: 10000,
      headers: {
        'User-Agent': 'CoinTracker-Proxy/1.0',
        'Accept': 'application/json'
      }
    });
    
    // 응답 성공 로그 제거 (불필요한 로그 축소)
    setCache(cacheKey, response.data);
    res.json(response.data);
    
  } catch (error) {
    const errorResponse = handleApiError(error, 'Upbit');
    res.status(errorResponse.status).json(errorResponse);
  }
});

// === 한국은행 환율 API 프록시 ===
app.get('/api/exchange-rate', async (req, res) => {
  try {
    const cacheKey = 'bok_exchange_rate';
    
    // 캐시 확인 (30분)
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < BOK_CONFIG.CACHE_DURATION) {
      console.log('💾 캐시된 한국은행 환율 사용');
      return res.json(cached.data);
    }
    
    // 한국은행 API 직접 호출
    try {
      const bokResult = await fetchBOKExchangeRate();
      
      // 캐시 저장
      cache.set(cacheKey, {
        data: bokResult,
        timestamp: Date.now()
      });
      
      console.log(`🏛️ 한국은행 공식 환율: ${bokResult.rate}원`);
      return res.json(bokResult);
      
    } catch (bokError) {
      console.warn('한국은행 API 실패:', bokError.message);
      
      // 백업 환율 API들 시도
      const backupApis = [
        {
          url: 'https://api.exchangerate-api.com/v4/latest/USD',
          parser: (data) => data.rates?.KRW,
          name: 'exchangerate-api'
        },
        {
          url: 'https://open.er-api.com/v6/latest/USD',
          parser: (data) => data.conversion_rates?.KRW,
          name: 'er-api'
        }
      ];
      
      for (const api of backupApis) {
        try {
          const response = await axios.get(api.url, {
            timeout: 8000,
            headers: {
              'User-Agent': 'CoinTracker-Proxy/1.0'
            }
          });
          
          const krwRate = api.parser(response.data);
          
          if (krwRate && typeof krwRate === 'number' && krwRate > 1200 && krwRate < 1600) {
            const result = {
              success: true,
              rate: krwRate,
              timestamp: Date.now(),
              source: `backup_${api.name}`,
              message: `한국은행 API 실패로 백업 API 사용: ${api.name}`
            };
            
            console.log(`🔄 백업 API 사용 (${api.name}): ${krwRate}원`);
            return res.json(result);
          }
        } catch (apiError) {
          console.warn(`백업 API ${api.name} 실패:`, apiError.message);
          continue;
        }
      }
      
      // 모든 API 실패 시 기본값
      const fallbackResult = {
        success: true,
        rate: 1366.56,
        timestamp: Date.now(),
        source: 'fallback_default',
        message: '모든 환율 API 실패, 기본값 사용'
      };
      
      console.log('⚠️ 모든 API 실패, 기본값 사용: 1366.56원');
      res.json(fallbackResult);
    }
    
  } catch (error) {
    const errorResponse = handleApiError(error, 'Exchange Rate');
    res.status(errorResponse.status).json(errorResponse);
  }
});

// === CoinNess 뉴스 API 프록시 ===
app.use('/api/news', async (req, res) => {
  try {
    // CoinNess API 설정
    const COINNESS_BASE_URL = 'https://api.coinness.com';
    const path = req.path === '/' ? '/v1/news' : req.path;
    const url = `${COINNESS_BASE_URL}${path}`;
    const cacheKey = `news_${req.path}_${JSON.stringify(req.query)}`;
    
    console.log(`📰 CoinNess 뉴스 프록시: ${req.method} ${url}`);
    
    // 캐시 확인 (뉴스는 3분 캐싱)
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 180000) { // 3분
      console.log('✅ 캐시된 뉴스 응답');
      return res.json(cached.data);
    }
    
    // 요청 헤더 설정
    const headers = {
      'User-Agent': 'CoinTracker-Proxy/1.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    // Authorization 헤더 처리 (환경변수에서 가져오기)
    if (process.env.COINNESS_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.COINNESS_API_KEY}`;
    } else if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    
    // API 요청
    const response = await axios.get(url, {
      params: req.query,
      timeout: 15000, // 뉴스는 15초 타임아웃
      headers: headers
    });
    
    console.log(`✅ CoinNess 뉴스 응답: ${response.status}`);
    
    // 응답 데이터 정규화
    let newsData = response.data;
    
    // CoinNess API 응답 형식에 맞춰 정규화
    if (newsData && typeof newsData === 'object') {
      // API 응답이 배열이 아닌 경우 래핑
      if (!Array.isArray(newsData) && newsData.data) {
        newsData = newsData.data;
      }
      
      // 최종 형식 통일
      const normalizedData = {
        success: true,
        data: Array.isArray(newsData) ? newsData : [newsData],
        count: Array.isArray(newsData) ? newsData.length : 1,
        timestamp: Date.now(),
        source: 'coinness'
      };
      
      // 캐시 저장
      cache.set(cacheKey, {
        data: normalizedData,
        timestamp: Date.now()
      });
      
      res.json(normalizedData);
    } else {
      throw new Error('Invalid response format from CoinNess API');
    }
    
  } catch (error) {
    console.error('❌ CoinNess 뉴스 API 오류:', error.message);
    
    // 에러 시 빈 뉴스 배열 반환 (사용자 경험 저해 방지)
    const fallbackResponse = {
      success: false,
      data: [],
      count: 0,
      error: error.message,
      timestamp: Date.now(),
      source: 'fallback'
    };
    
    // 404나 인증 오류가 아닌 경우에만 500 반환
    if (error.response?.status === 404 || error.response?.status === 401) {
      res.status(error.response.status).json(fallbackResponse);
    } else {
      res.status(200).json(fallbackResponse); // 뉴스는 실패해도 200으로 반환
    }
  }
});

// === CoinMarketCap API 프록시 ===
app.use('/api/cmc', async (req, res) => {
  try {
    // CoinMarketCap API Key 확인
    const CMC_API_KEY = process.env.CMC_API_KEY;
    
    if (!CMC_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'CoinMarketCap API 키가 설정되지 않았습니다. CMC_API_KEY 환경변수를 설정해주세요.',
        code: 'CMC_API_KEY_MISSING',
        status: 503,
        endpoint: 'CoinMarketCap'
      });
    }
    
    // CoinMarketCap API 설정
    const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com';
    const path = req.path === '/' ? '/v1/cryptocurrency/listings/latest' : req.path;
    const url = `${CMC_BASE_URL}${path}`;
    const cacheKey = `cmc_${req.path}_${JSON.stringify(req.query)}`;
    
    console.log(`💰 CoinMarketCap 프록시: ${req.method} ${url}`);
    
    // 캐시 확인 (CMC 데이터는 1분 캐싱)
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 60000) { // 1분
      console.log('✅ 캐시된 CMC 응답');
      return res.json(cached.data);
    }
    
    // 요청 헤더 설정
    const headers = {
      'X-CMC_PRO_API_KEY': CMC_API_KEY,
      'User-Agent': 'CoinTracker-Proxy/1.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    // API 요청
    const response = await axios.get(url, {
      params: req.query,
      timeout: 15000, // 15초 타임아웃
      headers: headers
    });
    
    console.log(`✅ CoinMarketCap 응답: ${response.status}`);
    
    // 응답 데이터 정규화
    let cmcData = response.data;
    
    // CoinMarketCap API 응답 형식에 맞춰 정규화
    if (cmcData && typeof cmcData === 'object') {
      const normalizedData = {
        success: true,
        data: cmcData.data || cmcData,
        status: cmcData.status || { error_code: 0, error_message: 'OK' },
        timestamp: Date.now(),
        source: 'coinmarketcap'
      };
      
      // 캐시 저장
      cache.set(cacheKey, {
        data: normalizedData,
        timestamp: Date.now()
      });
      
      res.json(normalizedData);
    } else {
      throw new Error('Invalid response format from CoinMarketCap API');
    }
    
  } catch (error) {
    console.error('❌ CoinMarketCap API 오류:', error.message);
    
    // API 키 관련 오류 처리
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(401).json({
        success: false,
        error: 'CoinMarketCap API 인증 오류. API 키를 확인해주세요.',
        code: 'CMC_AUTH_ERROR',
        status: 401,
        endpoint: 'CoinMarketCap'
      });
    }
    
    // 할당량 초과 오류
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'CoinMarketCap API 할당량이 초과되었습니다.',
        code: 'CMC_RATE_LIMIT',
        status: 429,
        endpoint: 'CoinMarketCap',
        retryAfter: error.response.headers['retry-after'] || '3600'
      });
    }
    
    // 기타 에러는 일반 에러 핸들러로 처리
    const errorResponse = handleApiError(error, 'CoinMarketCap');
    res.status(errorResponse.status).json(errorResponse);
  }
});

// === 루트 엔드포인트 (API 정보 페이지) ===
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Coco Proxy Server API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      cache: {
        status: '/cache/status',
        clear: 'DELETE /cache'
      },
      apis: {
        bitget: '/api/bitget/*',
        upbit: '/api/upbit/*',
        exchangeRate: '/api/exchange-rate (한국은행 공식)',
        news: '/api/news',
        coinMarketCap: '/api/cmc/*'
      }
    },
    examples: {
      bitget: '/api/bitget/api/v2/spot/market/tickers?symbol=BTCUSDT',
      upbit: '/api/upbit/v1/ticker?markets=KRW-BTC',
      exchangeRate: '/api/exchange-rate',
      news: '/api/news?limit=10&category=bitcoin',
      coinMarketCap: '/api/cmc?start=1&limit=100&convert=USD'
    }
  });
});

// === 헬스체크 엔드포인트 ===
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Coco Proxy Server is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cacheSize: cache.size,
    bokApiKey: process.env.BOK_API_KEY ? '설정됨' : '미설정'
  });
});

// === 캐시 상태 확인 ===
app.get('/cache/status', (req, res) => {
  const cacheInfo = Array.from(cache.entries()).map(([key, value]) => ({
    key,
    age: Date.now() - value.timestamp,
    expired: Date.now() - value.timestamp > CACHE_DURATION
  }));
  
  res.json({
    success: true,
    cacheSize: cache.size,
    cacheDuration: CACHE_DURATION,
    entries: cacheInfo
  });
});

// === 캐시 초기화 ===
app.delete('/cache', (req, res) => {
  cache.clear();
  res.json({
    success: true,
    message: '캐시가 초기화되었습니다.'
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `엔드포인트를 찾을 수 없습니다: ${req.method} ${req.path}`,
    status: 404
  });
});

// 글로벌 에러 핸들러
app.use((error, req, res, next) => {
  console.error('❌ 서버 에러:', error);
  res.status(500).json({
    success: false,
    error: '내부 서버 오류가 발생했습니다.',
    status: 500
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log('🚀 Coco Proxy Server 시작!');
  console.log(`📡 포트: ${PORT}`);
  console.log(`🌐 Health Check: http://localhost:${PORT}/health`);
  console.log('📋 지원 엔드포인트:');
  console.log('  • /api/bitget/* - Bitget API 프록시');
  console.log('  • /api/upbit/* - Upbit API 프록시');
  console.log('  • /api/exchange-rate - 한국은행 공식 환율 API');
  console.log('  • /api/news - CoinNess 뉴스 API');
  console.log('  • /api/cmc/* - CoinMarketCap API');
  console.log(`🏛️ 한국은행 API 키: ${process.env.BOK_API_KEY ? '✅ 설정됨' : '❌ 미설정'}`);
});