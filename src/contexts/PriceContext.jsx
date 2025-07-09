/**
 * PriceContext - 실시간 가격 데이터 전역 상태 관리
 * Bitget WebSocket 데이터를 담을 전역 Context
 */

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { getUSDKRWRate, startAutoUpdate, stopAutoUpdate } from '../services/exchangeRate';
import { getBatchSparklineData } from '../services/bitgetKline';
import { getBatchTickerData } from '../services/bitgetTicker';
import { preloadLogos } from '../components/Common/CoinLogo';
import { logger } from '../utils/logger';

// 환경 감지 (hostname 기반)
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// 주요 10개 코인 (홈페이지용)
export const MAJOR_COINS = {
  BTC: {
    symbol: 'BTCUSDT',
    name: '비트코인',
    nameEn: 'Bitcoin',
    priority: 1
  },
  ETH: {
    symbol: 'ETHUSDT',
    name: '이더리움',
    nameEn: 'Ethereum',
    priority: 2
  },
  XRP: {
    symbol: 'XRPUSDT',
    name: '리플',
    nameEn: 'XRP',
    priority: 3
  },
  ADA: {
    symbol: 'ADAUSDT',
    name: '에이다',
    nameEn: 'Cardano',
    priority: 4
  },
  SOL: {
    symbol: 'SOLUSDT',
    name: '솔라나',
    nameEn: 'Solana',
    priority: 5
  },
  DOT: {
    symbol: 'DOTUSDT',
    name: '폴카닷',
    nameEn: 'Polkadot',
    priority: 6
  },
  LINK: {
    symbol: 'LINKUSDT',
    name: '체인링크',
    nameEn: 'Chainlink',
    priority: 7
  },
  MATIC: {
    symbol: 'POLUSDT',
    name: '폴리곤',
    nameEn: 'Polygon',
    priority: 8
  },
  UNI: {
    symbol: 'UNIUSDT',
    name: '유니스왑',
    nameEn: 'Uniswap',
    priority: 9
  },
  AVAX: {
    symbol: 'AVAXUSDT',
    name: '아발란체',
    nameEn: 'Avalanche',
    priority: 10
  }
};

// 전체 Bitget 코인 리스트 (시세 페이지용) - 100개
export const ALL_COINS = {
  // 주요 10개 코인
  ...MAJOR_COINS,
  
  // 추가 90개 코인
  DOGE: {
    symbol: 'DOGEUSDT',
    name: '도지코인',
    nameEn: 'Dogecoin',
    priority: 11
  },
  SHIB: {
    symbol: 'SHIBUSDT',
    name: '시바이누',
    nameEn: 'Shiba Inu',
    priority: 12
  },
  TRX: {
    symbol: 'TRXUSDT',
    name: '트론',
    nameEn: 'TRON',
    priority: 13
  },
  LTC: {
    symbol: 'LTCUSDT',
    name: '라이트코인',
    nameEn: 'Litecoin',
    priority: 14
  },
  BCH: {
    symbol: 'BCHUSDT',
    name: '비트코인캐시',
    nameEn: 'Bitcoin Cash',
    priority: 15
  },
  ETC: {
    symbol: 'ETCUSDT',
    name: '이더리움클래식',
    nameEn: 'Ethereum Classic',
    priority: 16
  },
  ATOM: {
    symbol: 'ATOMUSDT',
    name: '코스모스',
    nameEn: 'Cosmos',
    priority: 17
  },
  NEAR: {
    symbol: 'NEARUSDT',
    name: '니어프로토콜',
    nameEn: 'NEAR Protocol',
    priority: 18
  },
  ALGO: {
    symbol: 'ALGOUSDT',
    name: '알고랜드',
    nameEn: 'Algorand',
    priority: 19
  },
  HBAR: {
    symbol: 'HBARUSDT',
    name: '헤데라',
    nameEn: 'Hedera',
    priority: 20
  },
  ICP: {
    symbol: 'ICPUSDT',
    name: '인터넷컴퓨터',
    nameEn: 'Internet Computer',
    priority: 21
  },
  VET: {
    symbol: 'VETUSDT',
    name: '비체인',
    nameEn: 'VeChain',
    priority: 22
  },
  FIL: {
    symbol: 'FILUSDT',
    name: '파일코인',
    nameEn: 'Filecoin',
    priority: 23
  },
  SAND: {
    symbol: 'SANDUSDT',
    name: '샌드박스',
    nameEn: 'The Sandbox',
    priority: 24
  },
  MANA: {
    symbol: 'MANAUSDT',
    name: '디센트럴랜드',
    nameEn: 'Decentraland',
    priority: 25
  },
  THETA: {
    symbol: 'THETAUSDT',
    name: '쎄타토큰',
    nameEn: 'Theta Network',
    priority: 26
  },
  XTZ: {
    symbol: 'XTZUSDT',
    name: '테조스',
    nameEn: 'Tezos',
    priority: 27
  },
  EOS: {
    symbol: 'EOSUSDT',
    name: '이오스',
    nameEn: 'EOS',
    priority: 28
  },
  KSM: {
    symbol: 'KSMUSDT',
    name: '쿠사마',
    nameEn: 'Kusama',
    priority: 29
  },
  FLOW: {
    symbol: 'FLOWUSDT',
    name: '플로우',
    nameEn: 'Flow',
    priority: 30
  },
  CHZ: {
    symbol: 'CHZUSDT',
    name: '칠리즈',
    nameEn: 'Chiliz',
    priority: 31
  },
  XLM: {
    symbol: 'XLMUSDT',
    name: '스텔라루멘',
    nameEn: 'Stellar',
    priority: 32
  },
  AAVE: {
    symbol: 'AAVEUSDT',
    name: '에이브',
    nameEn: 'Aave',
    priority: 33
  },
  CRV: {
    symbol: 'CRVUSDT',
    name: 'Curve DAO Token',
    priority: 34
  },
  COMP: {
    symbol: 'COMPUSDT',
    name: 'Compound',
    priority: 35
  },
  YFI: {
    symbol: 'YFIUSDT',
    name: 'yearn.finance',
    priority: 36
  },
  SNX: {
    symbol: 'SNXUSDT',
    name: 'Synthetix',
    priority: 37
  },
  MKR: {
    symbol: 'MKRUSDT',
    name: 'Maker',
    priority: 38
  },
  SUSHI: {
    symbol: 'SUSHIUSDT',
    name: 'SushiSwap',
    priority: 39
  },
  BAT: {
    symbol: 'BATUSDT',
    name: 'Basic Attention Token',
    priority: 40
  },
  ZRX: {
    symbol: 'ZRXUSDT',
    name: '0x',
    priority: 41
  },
  OMG: {
    symbol: 'OMGUSDT',
    name: 'OMG Network',
    priority: 42
  },
  QTUM: {
    symbol: 'QTUMUSDT',
    name: 'Qtum',
    priority: 43
  },
  ZIL: {
    symbol: 'ZILUSDT',
    name: 'Zilliqa',
    priority: 44
  },
  ONT: {
    symbol: 'ONTUSDT',
    name: 'Ontology',
    priority: 45
  },
  ICX: {
    symbol: 'ICXUSDT',
    name: 'ICON',
    priority: 46
  },
  ZEC: {
    symbol: 'ZECUSDT',
    name: 'Zcash',
    priority: 47
  },
  DASH: {
    symbol: 'DASHUSDT',
    name: 'Dash',
    priority: 48
  },
  WAVES: {
    symbol: 'WAVESUSDT',
    name: 'Waves',
    priority: 49
  },
  LSK: {
    symbol: 'LSKUSDT',
    name: 'Lisk',
    priority: 50
  },
  STEEM: {
    symbol: 'STEEMUSDT',
    name: 'Steem',
    priority: 51
  },
  STRAX: {
    symbol: 'STRAXUSDT',
    name: 'Stratis',
    priority: 52
  },
  ARK: {
    symbol: 'ARKUSDT',
    name: 'Ark',
    priority: 53
  },
  STORJ: {
    symbol: 'STORJUSDT',
    name: 'Storj',
    priority: 54
  },
  GRT: {
    symbol: 'GRTUSDT',
    name: 'The Graph',
    priority: 55
  },
  ENJ: {
    symbol: 'ENJUSDT',
    name: 'Enjin Coin',
    priority: 56
  },
  AUDIO: {
    symbol: 'AUDIOUSDT',
    name: 'Audius',
    priority: 57
  },
  MASK: {
    symbol: 'MASKUSDT',
    name: 'Mask Network',
    priority: 58
  },
  ANKR: {
    symbol: 'ANKRUSDT',
    name: 'Ankr',
    priority: 59
  },
  CVC: {
    symbol: 'CVCUSDT',
    name: 'Civic',
    priority: 60
  },
  SRM: {
    symbol: 'SRMUSDT',
    name: 'Serum',
    priority: 61
  },
  ARDR: {
    symbol: 'ARDRUSDT',
    name: 'Ardor',
    priority: 62
  },
  PLA: {
    symbol: 'PLAUSDT',
    name: 'PlayDapp',
    priority: 63
  },
  REQ: {
    symbol: 'REQUSDT',
    name: 'Request',
    priority: 64
  },
  DNT: {
    symbol: 'DNTUSDT',
    name: 'district0x',
    priority: 65
  },
  CRO: {
    symbol: 'CROUSDT',
    name: 'Cronos',
    priority: 66
  },
  AXS: {
    symbol: 'AXSUSDT',
    name: 'Axie Infinity',
    priority: 67
  },
  KNC: {
    symbol: 'KNCUSDT',
    name: 'Kyber Network Crystal v2',
    priority: 68
  },
  LRC: {
    symbol: 'LRCUSDT',
    name: 'Loopring',
    priority: 69
  },
  OXT: {
    symbol: 'OXTUSDT',
    name: 'Orchid',
    priority: 70
  },
  MLK: {
    symbol: 'MLKUSDT',
    name: 'MiL.k',
    priority: 71
  },
  WAXP: {
    symbol: 'WAXPUSDT',
    name: 'WAX',
    priority: 72
  },
  HIVE: {
    symbol: 'HIVEUSDT',
    name: 'Hive',
    priority: 73
  },
  KAVA: {
    symbol: 'KAVAUSDT',
    name: 'Kava',
    priority: 74
  },
  XEC: {
    symbol: 'XECUSDT',
    name: 'eCash',
    priority: 75
  },
  BTT: {
    symbol: 'BTTUSDT',
    name: 'BitTorrent',
    priority: 76
  },
  JST: {
    symbol: 'JSTUSDT',
    name: 'JUST',
    priority: 77
  },
  CKB: {
    symbol: 'CKBUSDT',
    name: 'Nervos Network',
    priority: 78
  },
  SXP: {
    symbol: 'SXPUSDT',
    name: 'Swipe',
    priority: 79
  },
  HUNT: {
    symbol: 'HUNTUSDT',
    name: 'HUNT',
    priority: 80
  },
  PYR: {
    symbol: 'PYRUSDT',
    name: 'Vulcan Forged PYR',
    priority: 81
  },
  WEMIX: {
    symbol: 'WEMIXUSDT',
    name: 'WEMIX',
    priority: 82
  },
  FCT2: {
    symbol: 'FCT2USDT',
    name: 'FirmaChain',
    priority: 83
  },
  AQT: {
    symbol: 'AQTUSDT',
    name: 'Alpha Quark Token',
    priority: 84
  },
  GLM: {
    symbol: 'GLMUSDT',
    name: 'Golem',
    priority: 85
  },
  SSX: {
    symbol: 'SSXUSDT',
    name: 'SOMESING',
    priority: 86
  },
  META: {
    symbol: 'METAUSDT',
    name: 'Metadium',
    priority: 87
  },
  FCT: {
    symbol: 'FCTUSDT',
    name: 'Factom',
    priority: 88
  },
  CBK: {
    symbol: 'CBKUSDT',
    name: 'Cobak Token',
    priority: 89
  },
  BORA: {
    symbol: 'BORAUSDT',
    name: 'BORA',
    priority: 90
  },
  // 해외 주요 코인 10개
  BNB: {
    symbol: 'BNBUSDT',
    name: '바이낸스코인',
    nameEn: 'BNB',
    priority: 91
  },
  TON: {
    symbol: 'TONUSDT',
    name: '톤코인',
    nameEn: 'Toncoin',
    priority: 92
  },
  RNDR: {
    symbol: 'RNDRUSDT',
    name: '렌더토큰',
    nameEn: 'Render Token',
    priority: 93
  },
  FTM: {
    symbol: 'FTMUSDT',
    name: '팬텀',
    nameEn: 'Fantom',
    priority: 94
  },
  RUNE: {
    symbol: 'RUNEUSDT',
    name: '토르체인',
    nameEn: 'THORChain',
    priority: 95
  },
  CAKE: {
    symbol: 'CAKEUSDT',
    name: '팬케이크스왑',
    nameEn: 'PancakeSwap',
    priority: 96
  },
  GALA: {
    symbol: 'GALAUSDT',
    name: '갈라',
    nameEn: 'Gala',
    priority: 97
  },
  IMX: {
    symbol: 'IMXUSDT',
    name: '이뮤터블엑스',
    nameEn: 'Immutable X',
    priority: 98
  },
  ROSE: {
    symbol: 'ROSEUSDT',
    name: '오아시스네트워크',
    nameEn: 'Oasis Network',
    priority: 99
  },
  XMR: {
    symbol: 'XMRUSDT',
    name: '모네로',
    nameEn: 'Monero',
    priority: 100
  }
};

// 심볼 배열 추출
export const MAJOR_SYMBOLS = Object.values(MAJOR_COINS).map(coin => coin.symbol);

// 전체 코인 배열 추출 (시세 페이지용)
export const ALL_SYMBOLS = Object.values(ALL_COINS).map(coin => coin.symbol);

// 디버깅: 전체 코인 개수 확인
console.log('🔍 PriceContext ALL_SYMBOLS 개수:', ALL_SYMBOLS.length);
console.log('🔍 WebSocket 구독 코인 개수:', MAJOR_SYMBOLS.length);
console.log('🔍 처음 10개 심볼:', ALL_SYMBOLS.slice(0, 10));
console.log('🔍 마지막 10개 심볼:', ALL_SYMBOLS.slice(-10));

// 초기 상태 정의
const initialState = {
  // 가격 데이터 (Bitget만 사용)
  prices: {},
  
  // K-line 데이터 (스파크라인용)
  klineData: {},
  klineLastUpdated: null,
  
  // 연결 상태
  isConnected: false,
  isConnecting: false,
  
  // 환율 정보 (기본값 설정)
  exchangeRate: 1380, // 구글 검색 기준 기본값
  
  // 메타데이터
  lastUpdated: null,
  connectionCount: 0,
  errors: [],
  
  // 통계
  stats: {
    totalCoins: ALL_SYMBOLS.length,
    connectedCoins: 0
  }
};

// 액션 타입 정의
const ACTIONS = {
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  SET_CONNECTING: 'SET_CONNECTING',
  UPDATE_PRICE: 'UPDATE_PRICE',
  UPDATE_EXCHANGE_RATE: 'UPDATE_EXCHANGE_RATE',
  SET_PRICES_BULK: 'SET_PRICES_BULK',
  UPDATE_KLINE_DATA: 'UPDATE_KLINE_DATA',
  SET_KLINE_DATA_BULK: 'SET_KLINE_DATA_BULK',
  ADD_ERROR: 'ADD_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  RESET_STATE: 'RESET_STATE',
  UPDATE_STATS: 'UPDATE_STATS'
};

// 리듀서 함수
function priceReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CONNECTION_STATUS:
      return {
        ...state,
        isConnected: action.payload,
        isConnecting: false,
        connectionCount: action.payload ? state.connectionCount + 1 : state.connectionCount,
        lastUpdated: Date.now()
      };
      
    case ACTIONS.SET_CONNECTING:
      return {
        ...state,
        isConnecting: action.payload
      };
      
    case ACTIONS.UPDATE_PRICE:
      return {
        ...state,
        prices: {
          ...state.prices,
          [action.payload.symbol]: {
            ...state.prices[action.payload.symbol],
            ...action.payload.data,
            lastUpdated: Date.now()
          }
        },
        lastUpdated: Date.now()
      };
      
    case ACTIONS.UPDATE_EXCHANGE_RATE:
      logger.debug('PriceContext UPDATE_EXCHANGE_RATE:', {
        oldRate: state.exchangeRate,
        newRate: action.payload
      });
      
      return {
        ...state,
        exchangeRate: action.payload,
        lastUpdated: Date.now()
      };
      
    case ACTIONS.SET_PRICES_BULK:
      return {
        ...state,
        prices: {
          ...state.prices,
          ...action.payload
        },
        lastUpdated: Date.now()
      };
      
    case ACTIONS.UPDATE_KLINE_DATA:
      return {
        ...state,
        klineData: {
          ...state.klineData,
          [action.payload.symbol]: action.payload.data
        },
        klineLastUpdated: Date.now()
      };
      
    case ACTIONS.SET_KLINE_DATA_BULK:
      return {
        ...state,
        klineData: {
          ...state.klineData,
          ...action.payload
        },
        klineLastUpdated: Date.now()
      };
      
    case ACTIONS.ADD_ERROR:
      return {
        ...state,
        errors: [
          ...state.errors.slice(-4), // 최근 5개 에러만 유지
          {
            id: Date.now(),
            message: action.payload,
            timestamp: Date.now()
          }
        ]
      };
      
    case ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        errors: []
      };
      
    case ACTIONS.UPDATE_STATS:
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.payload
        }
      };
      
    case ACTIONS.RESET_STATE:
      return {
        ...initialState,
        connectionCount: state.connectionCount
      };
      
    default:
      return state;
  }
}

// Context 생성
const PriceContext = createContext(null);

/**
 * PriceProvider 컴포넌트
 * 실시간 가격 데이터 상태를 관리하고 하위 컴포넌트에 제공
 */
export function PriceProvider({ children }) {
  const [state, dispatch] = useReducer(priceReducer, initialState);
  
  // 연결 상태 설정
  const setConnectionStatus = useCallback((isConnected) => {
    dispatch({
      type: ACTIONS.SET_CONNECTION_STATUS,
      payload: isConnected
    });
  }, []);
  
  // 연결 중 상태 설정
  const setConnecting = useCallback((isConnecting) => {
    dispatch({
      type: ACTIONS.SET_CONNECTING,
      payload: isConnecting
    });
  }, []);
  
  // 개별 가격 업데이트 (Bitget)
  const updatePrice = useCallback((symbol, priceData) => {
    dispatch({
      type: ACTIONS.UPDATE_PRICE,
      payload: {
        symbol,
        data: priceData
      }
    });
  }, []);
  
  // 환율 업데이트
  const updateExchangeRate = useCallback((rate) => {
    dispatch({
      type: ACTIONS.UPDATE_EXCHANGE_RATE,
      payload: rate
    });
  }, []);
  
  // 대량 가격 업데이트 (Bitget)
  const setPricesBulk = useCallback((prices) => {
    dispatch({
      type: ACTIONS.SET_PRICES_BULK,
      payload: prices
    });
  }, []);
  
  // K-line 데이터 업데이트 (개별)
  const updateKlineData = useCallback((symbol, klineData) => {
    dispatch({
      type: ACTIONS.UPDATE_KLINE_DATA,
      payload: {
        symbol,
        data: klineData
      }
    });
  }, []);
  
  // K-line 데이터 업데이트 (대량)
  const setKlineDataBulk = useCallback((klineDataMap) => {
    dispatch({
      type: ACTIONS.SET_KLINE_DATA_BULK,
      payload: klineDataMap
    });
  }, []);
  
  // 에러 추가
  const addError = useCallback((message) => {
    dispatch({
      type: ACTIONS.ADD_ERROR,
      payload: message
    });
  }, []);
  
  // 에러 초기화
  const clearErrors = useCallback(() => {
    dispatch({
      type: ACTIONS.CLEAR_ERRORS
    });
  }, []);
  
  // 상태 초기화
  const resetState = useCallback(() => {
    dispatch({
      type: ACTIONS.RESET_STATE
    });
  }, []);
  
  // 환율 자동 업데이트 시작 (컴포넌트 마운트 시) - 단순화
  useEffect(() => {
    logger.info('환율 기본값 설정: 1380');
    dispatch({
      type: ACTIONS.UPDATE_EXCHANGE_RATE,
      payload: 1380
    });
    
    // 간단한 환율 로드 (에러 처리 강화) - 즉시 로드
    const loadExchangeRate = async () => {
      try {
        const rateData = await getUSDKRWRate(false);
        if (rateData && rateData.rate && rateData.rate > 1000) {
          dispatch({
            type: ACTIONS.UPDATE_EXCHANGE_RATE,
            payload: rateData.rate
          });
          logger.info(`환율 업데이트: ${rateData.rate}`);
          
          // 배포 환경에서 환율 확인
          if (!isDevelopment) {
            console.log('[Production] Exchange rate updated:', rateData.rate, 'source:', rateData.source);
          }
        }
      } catch (error) {
        logger.warn('환율 로드 실패, 기본값 유지:', error.message);
        // 배포 환경에서 환율 로드 실패 로깅
        if (!isDevelopment) {
          console.error('[Production] Exchange rate load failed:', error.message);
        }
      }
    };
    
    // 즉시 환율 로드 시도
    loadExchangeRate();
    
    // 30분마다 환율 재로드
    const exchangeRateInterval = setInterval(loadExchangeRate, 30 * 60 * 1000);
    
    return () => {
      clearInterval(exchangeRateInterval);
    };
  }, []);
  
  // 스파크라인 데이터 자동 업데이트 (5분마다)
  useEffect(() => {
    let sparklineInterval;
    
    const loadSparklineData = async () => {
      try {
        logger.info('스파크라인 데이터 로딩 시작');
        
        // 모든 코인들의 스파크라인 데이터 로드 (단계적 로딩)
        // 1단계: 주요 코인 먼저 로드
        try {
          const majorSparklineData = await getBatchSparklineData(MAJOR_SYMBOLS, '1h');
          if (majorSparklineData && Object.keys(majorSparklineData).length > 0) {
            setKlineDataBulk(majorSparklineData);
            logger.info(`주요 코인 스파크라인 데이터 업데이트: ${Object.keys(majorSparklineData).length}개`);
          }
        } catch (error) {
          logger.warn('주요 코인 스파크라인 데이터 로딩 실패:', error.message);
          // 실패해도 앱은 계속 실행
        }
        
        // 2단계: 나머지 코인들 로드 (지연 로딩)
        setTimeout(async () => {
          try {
            const remainingSymbols = ALL_SYMBOLS.filter(s => !MAJOR_SYMBOLS.includes(s));
            if (remainingSymbols.length > 0) {
              const remainingSparklineData = await getBatchSparklineData(remainingSymbols, '1h');
              if (remainingSparklineData && Object.keys(remainingSparklineData).length > 0) {
                setKlineDataBulk(remainingSparklineData);
                logger.info(`추가 코인 스파크라인 데이터 업데이트: ${Object.keys(remainingSparklineData).length}개`);
              }
            }
          } catch (error) {
            logger.warn('추가 스파크라인 데이터 로딩 실패:', error.message);
            // 실패해도 앱은 계속 실행
          }
        }, 200); // 0.2초 지연
        
      } catch (error) {
        logger.warn('스파크라인 데이터 로딩 실패:', error.message);
      }
    };
    
    // 즉시 로드
    loadSparklineData();
    
    // 5분마다 업데이트
    sparklineInterval = setInterval(loadSparklineData, 5 * 60 * 1000);
    
    return () => {
      if (sparklineInterval) {
        clearInterval(sparklineInterval);
      }
    };
  }, [setKlineDataBulk]);
  
  // 코인 로고 프리로드 (앱 시작 시 한번만)
  useEffect(() => {
    const preloadAllLogos = async () => {
      try {
        logger.info('코인 로고 프리로드 시작...');
        await preloadLogos(ALL_SYMBOLS);
        logger.info('코인 로고 프리로드 완료');
      } catch (error) {
        logger.warn('코인 로고 프리로드 실패:', error);
      }
    };
    
    // 3초 후에 백그라운드에서 프리로드 (앱 로딩에 영향 없도록)
    const timeout = setTimeout(preloadAllLogos, 3000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Bitget REST API Ticker 데이터 자동 업데이트
  useEffect(() => {
    let bitgetTickerInterval = null;
    let updateCounter = 0;
    
    const fetchBitgetTickerData = async () => {
      try {
        updateCounter++;
        const currentTime = new Date().toLocaleTimeString();
        
        // 배포 환경에서 API 호출 로깅
        if (!isDevelopment) {
          console.log(`[Production] Bitget ticker update #${updateCounter} at ${currentTime}`);
        }
        
        logger.api(`[${updateCounter}번째 업데이트 - ${currentTime}] Bitget REST API 데이터 로드 중...`);
        
        // Bitget API 호출 - 전체 100개 코인
        console.log('🔍 getBatchTickerData 호출 전 - ALL_SYMBOLS 개수:', ALL_SYMBOLS.length);
        const bitgetData = await getBatchTickerData(ALL_SYMBOLS);
        console.log('🔍 getBatchTickerData 응답 - 실제 받은 데이터:', Object.keys(bitgetData).length);
        logger.api(`Bitget API 응답: ${Object.keys(bitgetData).length}개 심볼`);
        
        // 데이터 변환 및 업데이트
        let updateCount = 0;
        const timestamp = Date.now();
        
        Object.entries(bitgetData).forEach(([symbol, ticker]) => {
          updatePrice(symbol, {
            ...ticker,
            updateTimestamp: timestamp,
            updateCounter: updateCounter
          });
          updateCount++;
        });
        
        logger.api(`[${updateCounter}번째] Bitget 데이터 업데이트 완료: ${updateCount}개 심볼`);
        
        // 배포 환경에서 디버깅 (BTC 데이터 샘플 포함)
        if (!isDevelopment && bitgetData['BTCUSDT']) {
          console.log(`[Production] Bitget price update #${updateCounter} at ${currentTime}: BTC $${bitgetData['BTCUSDT'].price}`);
        }
        
      } catch (error) {
        logger.error('Bitget 데이터 로드 실패:', error);
        
        // 배포 환경에서 에러 로깅
        if (!isDevelopment) {
          console.error(`[Production] Bitget ticker update failed:`, error.message);
        }
      }
    };
    
    // 즉시 한 번 실행
    fetchBitgetTickerData();
    
    // 10초마다 업데이트
    bitgetTickerInterval = setInterval(fetchBitgetTickerData, 10000);
    
    // 배포 환경에서 시작 로깅
    if (!isDevelopment) {
      console.log('[Production] Bitget REST API auto-update enabled (every 10s)');
    }
    
    return () => {
      if (bitgetTickerInterval) {
        clearInterval(bitgetTickerInterval);
      }
    };
  }, [updatePrice, setPricesBulk]);
  
  // 통계 업데이트
  useEffect(() => {
    const bitgetCount = Object.keys(state.prices).length;
    
    // 디버깅: Bitget API 데이터 상태 확인
    console.log('=== Bitget API 데이터 상태 ===');
    console.log('Bitget 데이터:', bitgetCount, '개');
    
    // 핵심 코인들의 개별 상태 확인
    ['BTCUSDT', 'ETHUSDT', 'XRPUSDT'].forEach(symbol => {
      const bitgetPrice = state.prices[symbol]?.price;
      console.log(`${symbol}:`, {
        bitget: bitgetPrice ? `$${bitgetPrice}` : '❌'
      });
    });
    
    dispatch({
      type: ACTIONS.UPDATE_STATS,
      payload: {
        connectedCoins: bitgetCount
      }
    });
  }, [state.prices]);
  
  // Context 값 준비
  const contextValue = {
    // 상태
    ...state,
    
    // 액션
    setConnectionStatus,
    setConnecting,
    updatePrice,
    updateExchangeRate,
    setPricesBulk,
    updateKlineData,
    setKlineDataBulk,
    addError,
    clearErrors,
    resetState,
    
    // 상수
    MAJOR_COINS,
    MAJOR_SYMBOLS,
    ALL_COINS,
    ALL_SYMBOLS
  };
  
  return (
    <PriceContext.Provider value={contextValue}>
      {children}
    </PriceContext.Provider>
  );
}

/**
 * usePrices 훅
 * PriceContext에 접근하기 위한 커스텀 훅
 */
export function usePrices() {
  const context = useContext(PriceContext);
  
  if (!context) {
    throw new Error('usePrices는 PriceProvider 내부에서만 사용할 수 있습니다.');
  }
  
  return context;
}

// 기본 export
export default PriceContext;