/**
 * PriceContext - 실시간 가격 데이터 전역 상태 관리
 * WebSocket 데이터를 담을 전역 Context
 */

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { calculateKimchi } from '../utils/formatters';
import { getUSDKRWRate, startAutoUpdate, stopAutoUpdate } from '../services/exchangeRate';
import { getBatchSparklineData } from '../services/bitgetKline';
import { getBatchUpbitTickerData } from '../services/upbitTicker';
import { preloadLogos } from '../components/Common/CoinLogo';
import { logger } from '../utils/logger';

// 주요 10개 코인 (홈페이지용)
export const MAJOR_COINS = {
  BTC: {
    symbol: 'BTCUSDT',
    name: 'Bitcoin',
    upbitMarket: 'KRW-BTC',
    priority: 1
  },
  ETH: {
    symbol: 'ETHUSDT',
    name: 'Ethereum',
    upbitMarket: 'KRW-ETH',
    priority: 2
  },
  XRP: {
    symbol: 'XRPUSDT',
    name: 'XRP',
    upbitMarket: 'KRW-XRP',
    priority: 3
  },
  ADA: {
    symbol: 'ADAUSDT',
    name: 'Cardano',
    upbitMarket: 'KRW-ADA',
    priority: 4
  },
  SOL: {
    symbol: 'SOLUSDT',
    name: 'Solana',
    upbitMarket: 'KRW-SOL',
    priority: 5
  },
  DOT: {
    symbol: 'DOTUSDT',
    name: 'Polkadot',
    upbitMarket: 'KRW-DOT',
    priority: 6
  },
  LINK: {
    symbol: 'LINKUSDT',
    name: 'Chainlink',
    upbitMarket: 'KRW-LINK',
    priority: 7
  },
  MATIC: {
    symbol: 'MATICUSDT',
    name: 'Polygon',
    upbitMarket: null, // 업비트에 상장되지 않음
    priority: 8
  },
  UNI: {
    symbol: 'UNIUSDT',
    name: 'Uniswap',
    upbitMarket: 'KRW-UNI',
    priority: 9
  },
  AVAX: {
    symbol: 'AVAXUSDT',
    name: 'Avalanche',
    upbitMarket: 'KRW-AVAX',
    priority: 10
  }
};

// 전체 Bitget 코인 리스트 (시세 페이지용) - 100개
export const ALL_COINS = {
  // 주요 10개 코인
  ...MAJOR_COINS,
  
  // 추가 90개 코인 (업비트 상장 + 주요 해외 코인)
  DOGE: {
    symbol: 'DOGEUSDT',
    name: 'Dogecoin',
    upbitMarket: 'KRW-DOGE',
    priority: 11
  },
  SHIB: {
    symbol: 'SHIBUSDT',
    name: 'Shiba Inu',
    upbitMarket: 'KRW-SHIB',
    priority: 12
  },
  TRX: {
    symbol: 'TRXUSDT',
    name: 'TRON',
    upbitMarket: 'KRW-TRX',
    priority: 13
  },
  LTC: {
    symbol: 'LTCUSDT',
    name: 'Litecoin',
    upbitMarket: 'KRW-LTC',
    priority: 14
  },
  BCH: {
    symbol: 'BCHUSDT',
    name: 'Bitcoin Cash',
    upbitMarket: 'KRW-BCH',
    priority: 15
  },
  ETC: {
    symbol: 'ETCUSDT',
    name: 'Ethereum Classic',
    upbitMarket: 'KRW-ETC',
    priority: 16
  },
  ATOM: {
    symbol: 'ATOMUSDT',
    name: 'Cosmos',
    upbitMarket: 'KRW-ATOM',
    priority: 17
  },
  NEAR: {
    symbol: 'NEARUSDT',
    name: 'NEAR Protocol',
    upbitMarket: 'KRW-NEAR',
    priority: 18
  },
  ALGO: {
    symbol: 'ALGOUSDT',
    name: 'Algorand',
    upbitMarket: 'KRW-ALGO',
    priority: 19
  },
  HBAR: {
    symbol: 'HBARUSDT',
    name: 'Hedera',
    upbitMarket: 'KRW-HBAR',
    priority: 20
  },
  ICP: {
    symbol: 'ICPUSDT',
    name: 'Internet Computer',
    upbitMarket: 'KRW-ICP',
    priority: 21
  },
  VET: {
    symbol: 'VETUSDT',
    name: 'VeChain',
    upbitMarket: 'KRW-VET',
    priority: 22
  },
  FIL: {
    symbol: 'FILUSDT',
    name: 'Filecoin',
    upbitMarket: 'KRW-FIL',
    priority: 23
  },
  SAND: {
    symbol: 'SANDUSDT',
    name: 'The Sandbox',
    upbitMarket: 'KRW-SAND',
    priority: 24
  },
  MANA: {
    symbol: 'MANAUSDT',
    name: 'Decentraland',
    upbitMarket: 'KRW-MANA',
    priority: 25
  },
  THETA: {
    symbol: 'THETAUSDT',
    name: 'Theta Network',
    upbitMarket: 'KRW-THETA',
    priority: 26
  },
  XTZ: {
    symbol: 'XTZUSDT',
    name: 'Tezos',
    upbitMarket: 'KRW-XTZ',
    priority: 27
  },
  EOS: {
    symbol: 'EOSUSDT',
    name: 'EOS',
    upbitMarket: 'KRW-EOS',
    priority: 28
  },
  KSM: {
    symbol: 'KSMUSDT',
    name: 'Kusama',
    upbitMarket: 'KRW-KSM',
    priority: 29
  },
  FLOW: {
    symbol: 'FLOWUSDT',
    name: 'Flow',
    upbitMarket: 'KRW-FLOW',
    priority: 30
  },
  CHZ: {
    symbol: 'CHZUSDT',
    name: 'Chiliz',
    upbitMarket: 'KRW-CHZ',
    priority: 31
  },
  XLM: {
    symbol: 'XLMUSDT',
    name: 'Stellar',
    upbitMarket: 'KRW-XLM',
    priority: 32
  },
  AAVE: {
    symbol: 'AAVEUSDT',
    name: 'Aave',
    upbitMarket: 'KRW-AAVE',
    priority: 33
  },
  CRV: {
    symbol: 'CRVUSDT',
    name: 'Curve DAO Token',
    upbitMarket: 'KRW-CRV',
    priority: 34
  },
  COMP: {
    symbol: 'COMPUSDT',
    name: 'Compound',
    upbitMarket: 'KRW-COMP',
    priority: 35
  },
  YFI: {
    symbol: 'YFIUSDT',
    name: 'yearn.finance',
    upbitMarket: 'KRW-YFI',
    priority: 36
  },
  SNX: {
    symbol: 'SNXUSDT',
    name: 'Synthetix',
    upbitMarket: 'KRW-SNX',
    priority: 37
  },
  MKR: {
    symbol: 'MKRUSDT',
    name: 'Maker',
    upbitMarket: 'KRW-MKR',
    priority: 38
  },
  SUSHI: {
    symbol: 'SUSHIUSDT',
    name: 'SushiSwap',
    upbitMarket: 'KRW-SUSHI',
    priority: 39
  },
  BAT: {
    symbol: 'BATUSDT',
    name: 'Basic Attention Token',
    upbitMarket: 'KRW-BAT',
    priority: 40
  },
  ZRX: {
    symbol: 'ZRXUSDT',
    name: '0x',
    upbitMarket: 'KRW-ZRX',
    priority: 41
  },
  OMG: {
    symbol: 'OMGUSDT',
    name: 'OMG Network',
    upbitMarket: 'KRW-OMG',
    priority: 42
  },
  QTUM: {
    symbol: 'QTUMUSDT',
    name: 'Qtum',
    upbitMarket: 'KRW-QTUM',
    priority: 43
  },
  ZIL: {
    symbol: 'ZILUSDT',
    name: 'Zilliqa',
    upbitMarket: 'KRW-ZIL',
    priority: 44
  },
  ONT: {
    symbol: 'ONTUSDT',
    name: 'Ontology',
    upbitMarket: 'KRW-ONT',
    priority: 45
  },
  ICX: {
    symbol: 'ICXUSDT',
    name: 'ICON',
    upbitMarket: 'KRW-ICX',
    priority: 46
  },
  ZEC: {
    symbol: 'ZECUSDT',
    name: 'Zcash',
    upbitMarket: 'KRW-ZEC',
    priority: 47
  },
  DASH: {
    symbol: 'DASHUSDT',
    name: 'Dash',
    upbitMarket: 'KRW-DASH',
    priority: 48
  },
  WAVES: {
    symbol: 'WAVESUSDT',
    name: 'Waves',
    upbitMarket: 'KRW-WAVES',
    priority: 49
  },
  LSK: {
    symbol: 'LSKUSDT',
    name: 'Lisk',
    upbitMarket: 'KRW-LSK',
    priority: 50
  },
  STEEM: {
    symbol: 'STEEMUSDT',
    name: 'Steem',
    upbitMarket: 'KRW-STEEM',
    priority: 51
  },
  STRAX: {
    symbol: 'STRAXUSDT',
    name: 'Stratis',
    upbitMarket: 'KRW-STRAX',
    priority: 52
  },
  ARK: {
    symbol: 'ARKUSDT',
    name: 'Ark',
    upbitMarket: 'KRW-ARK',
    priority: 53
  },
  STORJ: {
    symbol: 'STORJUSDT',
    name: 'Storj',
    upbitMarket: 'KRW-STORJ',
    priority: 54
  },
  GRT: {
    symbol: 'GRTUSDT',
    name: 'The Graph',
    upbitMarket: 'KRW-GRT',
    priority: 55
  },
  ENJ: {
    symbol: 'ENJUSDT',
    name: 'Enjin Coin',
    upbitMarket: 'KRW-ENJ',
    priority: 56
  },
  AUDIO: {
    symbol: 'AUDIOUSDT',
    name: 'Audius',
    upbitMarket: 'KRW-AUDIO',
    priority: 57
  },
  MASK: {
    symbol: 'MASKUSDT',
    name: 'Mask Network',
    upbitMarket: 'KRW-MASK',
    priority: 58
  },
  ANKR: {
    symbol: 'ANKRUSDT',
    name: 'Ankr',
    upbitMarket: 'KRW-ANKR',
    priority: 59
  },
  CVC: {
    symbol: 'CVCUSDT',
    name: 'Civic',
    upbitMarket: 'KRW-CVC',
    priority: 60
  },
  SRM: {
    symbol: 'SRMUSDT',
    name: 'Serum',
    upbitMarket: 'KRW-SRM',
    priority: 61
  },
  ARDR: {
    symbol: 'ARDRUSDT',
    name: 'Ardor',
    upbitMarket: 'KRW-ARDR',
    priority: 62
  },
  PLA: {
    symbol: 'PLAUSDT',
    name: 'PlayDapp',
    upbitMarket: 'KRW-PLA',
    priority: 63
  },
  REQ: {
    symbol: 'REQUSDT',
    name: 'Request',
    upbitMarket: 'KRW-REQ',
    priority: 64
  },
  DNT: {
    symbol: 'DNTUSDT',
    name: 'district0x',
    upbitMarket: 'KRW-DNT',
    priority: 65
  },
  CRO: {
    symbol: 'CROUSDT',
    name: 'Cronos',
    upbitMarket: 'KRW-CRO',
    priority: 66
  },
  AXS: {
    symbol: 'AXSUSDT',
    name: 'Axie Infinity',
    upbitMarket: 'KRW-AXS',
    priority: 67
  },
  KNC: {
    symbol: 'KNCUSDT',
    name: 'Kyber Network Crystal v2',
    upbitMarket: 'KRW-KNC',
    priority: 68
  },
  LRC: {
    symbol: 'LRCUSDT',
    name: 'Loopring',
    upbitMarket: 'KRW-LRC',
    priority: 69
  },
  OXT: {
    symbol: 'OXTUSDT',
    name: 'Orchid',
    upbitMarket: 'KRW-OXT',
    priority: 70
  },
  MLK: {
    symbol: 'MLKUSDT',
    name: 'MiL.k',
    upbitMarket: 'KRW-MLK',
    priority: 71
  },
  WAXP: {
    symbol: 'WAXPUSDT',
    name: 'WAX',
    upbitMarket: 'KRW-WAXP',
    priority: 72
  },
  HIVE: {
    symbol: 'HIVEUSDT',
    name: 'Hive',
    upbitMarket: 'KRW-HIVE',
    priority: 73
  },
  KAVA: {
    symbol: 'KAVAUSDT',
    name: 'Kava',
    upbitMarket: 'KRW-KAVA',
    priority: 74
  },
  XEC: {
    symbol: 'XECUSDT',
    name: 'eCash',
    upbitMarket: 'KRW-XEC',
    priority: 75
  },
  BTT: {
    symbol: 'BTTUSDT',
    name: 'BitTorrent',
    upbitMarket: 'KRW-BTT',
    priority: 76
  },
  JST: {
    symbol: 'JSTUSDT',
    name: 'JUST',
    upbitMarket: 'KRW-JST',
    priority: 77
  },
  CKB: {
    symbol: 'CKBUSDT',
    name: 'Nervos Network',
    upbitMarket: 'KRW-CKB',
    priority: 78
  },
  SXP: {
    symbol: 'SXPUSDT',
    name: 'Swipe',
    upbitMarket: 'KRW-SXP',
    priority: 79
  },
  HUNT: {
    symbol: 'HUNTUSDT',
    name: 'HUNT',
    upbitMarket: 'KRW-HUNT',
    priority: 80
  },
  PYR: {
    symbol: 'PYRUSDT',
    name: 'Vulcan Forged PYR',
    upbitMarket: 'KRW-PYR',
    priority: 81
  },
  WEMIX: {
    symbol: 'WEMIXUSDT',
    name: 'WEMIX',
    upbitMarket: 'KRW-WEMIX',
    priority: 82
  },
  FCT2: {
    symbol: 'FCT2USDT',
    name: 'FirmaChain',
    upbitMarket: 'KRW-FCT2',
    priority: 83
  },
  AQT: {
    symbol: 'AQTUSDT',
    name: 'Alpha Quark Token',
    upbitMarket: 'KRW-AQT',
    priority: 84
  },
  GLM: {
    symbol: 'GLMUSDT',
    name: 'Golem',
    upbitMarket: 'KRW-GLM',
    priority: 85
  },
  SSX: {
    symbol: 'SSXUSDT',
    name: 'SOMESING',
    upbitMarket: null, // 업비트에 상장되지 않음
    priority: 86
  },
  META: {
    symbol: 'METAUSDT',
    name: 'Metadium',
    upbitMarket: 'KRW-META',
    priority: 87
  },
  FCT: {
    symbol: 'FCTUSDT',
    name: 'Factom',
    upbitMarket: null, // 업비트에서 제거됨
    priority: 88
  },
  CBK: {
    symbol: 'CBKUSDT',
    name: 'Cobak Token',
    upbitMarket: 'KRW-CBK',
    priority: 89
  },
  BORA: {
    symbol: 'BORAUSDT',
    name: 'BORA',
    upbitMarket: 'KRW-BORA',
    priority: 90
  },
  // 해외 주요 코인 10개 (업비트 미상장)
  BNB: {
    symbol: 'BNBUSDT',
    name: 'BNB',
    upbitMarket: null,
    priority: 91
  },
  TON: {
    symbol: 'TONUSDT',
    name: 'Toncoin',
    upbitMarket: null,
    priority: 92
  },
  RNDR: {
    symbol: 'RNDRUSDT',
    name: 'Render Token',
    upbitMarket: null,
    priority: 93
  },
  FTM: {
    symbol: 'FTMUSDT',
    name: 'Fantom',
    upbitMarket: null,
    priority: 94
  },
  RUNE: {
    symbol: 'RUNEUSDT',
    name: 'THORChain',
    upbitMarket: null,
    priority: 95
  },
  CAKE: {
    symbol: 'CAKEUSDT',
    name: 'PancakeSwap',
    upbitMarket: null,
    priority: 96
  },
  GALA: {
    symbol: 'GALAUSDT',
    name: 'Gala',
    upbitMarket: null,
    priority: 97
  },
  IMX: {
    symbol: 'IMXUSDT',
    name: 'Immutable X',
    upbitMarket: null,
    priority: 98
  },
  ROSE: {
    symbol: 'ROSEUSDT',
    name: 'Oasis Network',
    upbitMarket: null,
    priority: 99
  },
  XMR: {
    symbol: 'XMRUSDT',
    name: 'Monero',
    upbitMarket: null,
    priority: 100
  }
};

// 심볼 배열 추출
export const MAJOR_SYMBOLS = Object.values(MAJOR_COINS).map(coin => coin.symbol);
export const UPBIT_MARKETS = Object.values(MAJOR_COINS).map(coin => coin.upbitMarket);
export const MAJOR_UPBIT_MARKETS = Object.values(MAJOR_COINS)
  .map(coin => coin.upbitMarket)
  .filter(market => market !== null);

// 전체 코인 배열 추출 (시세 페이지용)
export const ALL_SYMBOLS = Object.values(ALL_COINS).map(coin => coin.symbol);
export const ALL_UPBIT_MARKETS = Object.values(ALL_COINS)
  .map(coin => coin.upbitMarket)
  .filter(market => market !== null); // null 값 제거

// 초기 상태 정의
const initialState = {
  // 가격 데이터
  prices: {},
  upbitPrices: {},
  
  // K-line 데이터 (스파크라인용)
  klineData: {},
  klineLastUpdated: null,
  
  // 연결 상태
  isConnected: false,
  isConnecting: false,
  
  // 업비트 연결 상태
  upbitIsConnected: false,
  upbitIsConnecting: false,
  
  // 환율 정보 (기본값 설정)
  exchangeRate: 1380, // 구글 검색 기준 기본값
  
  // 메타데이터
  lastUpdated: null,
  connectionCount: 0,
  errors: [],
  
  // 통계
  stats: {
    totalCoins: ALL_SYMBOLS.length,
    connectedCoins: 0,
    kimchiPremiumCount: 0
  }
};

// 액션 타입 정의
const ACTIONS = {
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  SET_CONNECTING: 'SET_CONNECTING',
  SET_UPBIT_CONNECTION_STATUS: 'SET_UPBIT_CONNECTION_STATUS',
  SET_UPBIT_CONNECTING: 'SET_UPBIT_CONNECTING',
  UPDATE_PRICE: 'UPDATE_PRICE',
  UPDATE_UPBIT_PRICE: 'UPDATE_UPBIT_PRICE',
  UPDATE_EXCHANGE_RATE: 'UPDATE_EXCHANGE_RATE',
  SET_PRICES_BULK: 'SET_PRICES_BULK',
  SET_UPBIT_PRICES_BULK: 'SET_UPBIT_PRICES_BULK',
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
      
    case ACTIONS.SET_UPBIT_CONNECTION_STATUS:
      return {
        ...state,
        upbitIsConnected: action.payload,
        upbitIsConnecting: false,
        lastUpdated: Date.now()
      };
      
    case ACTIONS.SET_UPBIT_CONNECTING:
      return {
        ...state,
        upbitIsConnecting: action.payload
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
      
    case ACTIONS.UPDATE_UPBIT_PRICE:
      // 디버깅: BTC만 로그 출력
      if (action.payload.market === 'KRW-BTC') {
        logger.debug(`PriceContext UPDATE_UPBIT_PRICE (${action.payload.market}):`, {
          market: action.payload.market,
          newData: action.payload.data
        });
      }
      
      return {
        ...state,
        upbitPrices: {
          ...state.upbitPrices,
          [action.payload.market]: {
            ...state.upbitPrices[action.payload.market],
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
      
    case ACTIONS.SET_UPBIT_PRICES_BULK:
      return {
        ...state,
        upbitPrices: {
          ...state.upbitPrices,
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
  
  // 업비트 연결 상태 설정
  const setUpbitConnectionStatus = useCallback((isConnected) => {
    dispatch({
      type: ACTIONS.SET_UPBIT_CONNECTION_STATUS,
      payload: isConnected
    });
  }, []);
  
  // 업비트 연결 중 상태 설정
  const setUpbitConnecting = useCallback((isConnecting) => {
    dispatch({
      type: ACTIONS.SET_UPBIT_CONNECTING,
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
  
  // 개별 가격 업데이트 (Upbit)
  const updateUpbitPrice = useCallback((market, priceData) => {
    // 디버깅: BTC만 로그 출력
    if (market === 'KRW-BTC') {
      logger.debug(`PriceContext updateUpbitPrice (${market}):`, {
        market,
        priceData
      });
    }
    
    dispatch({
      type: ACTIONS.UPDATE_UPBIT_PRICE,
      payload: {
        market,
        data: priceData
      }
    });
  }, [state.upbitPrices]);
  
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
  
  // 대량 가격 업데이트 (Upbit)
  const setUpbitPricesBulk = useCallback((prices) => {
    dispatch({
      type: ACTIONS.SET_UPBIT_PRICES_BULK,
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
  
  // 김치프리미엄 계산
  const calculateKimchiPremium = useCallback((symbol) => {
    if (!state.exchangeRate) {
      logger.debug(`김치프리미엄 계산 불가: 환율 없음 (${symbol})`);
      return null;
    }
    
    const coin = Object.values(ALL_COINS).find(coin => coin.symbol === symbol);
    if (!coin) {
      logger.debug(`김치프리미엄 계산 불가: 코인 정보 없음 (${symbol})`);
      return null;
    }
    
    // 업비트에 상장되지 않은 코인은 김치프리미엄 계산 불가
    if (!coin.upbitMarket) {
      return null;
    }
    
    const bitgetPrice = state.prices[symbol];
    const upbitPrice = state.upbitPrices[coin.upbitMarket];
    
    // 업비트는 trade_price 필드 사용
    if (!bitgetPrice?.price || !upbitPrice?.trade_price) {
      // 디버깅 정보 출력 (BTC만)
      if (symbol === 'BTCUSDT') {
        logger.debug(`김치프리미엄 계산 불가 (${symbol}):`, {
          bitgetPrice: bitgetPrice?.price,
          upbitPrice: upbitPrice?.trade_price,
          exchangeRate: state.exchangeRate,
          upbitMarket: coin.upbitMarket
        });
      }
      return null;
    }
    
    try {
      const result = calculateKimchi(upbitPrice.trade_price, bitgetPrice.price, state.exchangeRate);
      
      
      return result;
    } catch (error) {
      logger.error('김치프리미엄 계산 오류:', error);
      return null;
    }
  }, [state.prices, state.upbitPrices, state.exchangeRate]);
  
  // 모든 김치프리미엄 계산
  const getAllKimchiPremiums = useCallback(() => {
    const premiums = {};
    
    MAJOR_SYMBOLS.forEach(symbol => {
      const premium = calculateKimchiPremium(symbol);
      if (premium) {
        premiums[symbol] = premium;
      }
    });
    
    return premiums;
  }, [calculateKimchiPremium]);
  
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
        }
      } catch (error) {
        logger.warn('환율 로드 실패, 기본값 유지:', error.message);
      }
    };
    
    // 즉시 환율 로드 시도
    loadExchangeRate();
    
    return () => {};
  }, []);
  
  // 스파크라인 데이터 자동 업데이트 (5분마다)
  useEffect(() => {
    let sparklineInterval;
    
    const loadSparklineData = async () => {
      try {
        logger.info('스파크라인 데이터 로딩 시작');
        
        // 모든 코인들의 스파크라인 데이터 로드 (단계적 로딩)
        // 1단계: 주요 코인 먼저 로드
        const majorSparklineData = await getBatchSparklineData(MAJOR_SYMBOLS, '1h');
        if (majorSparklineData && Object.keys(majorSparklineData).length > 0) {
          setKlineDataBulk(majorSparklineData);
          logger.info(`주요 코인 스파크라인 데이터 업데이트: ${Object.keys(majorSparklineData).length}개`);
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

  // Bitget REST API는 WebSocket이 처리하므로 비활성화
  // (중복 요청 방지)
  
  // 업비트 REST API Ticker 데이터 자동 업데이트
  useEffect(() => {
    let upbitTickerInterval = null;
    
    const fetchUpbitTickerData = async () => {
      try {
        logger.api('업비트 REST API 데이터 로드 중...');
        
        // 초기 로드시 주요 코인만 먼저 로드
        const isInitialLoad = Object.keys(state.upbitPrices).length === 0;
        const upbitMarkets = isInitialLoad ? MAJOR_UPBIT_MARKETS : ALL_UPBIT_MARKETS;
        
        logger.debug('업비트 마켓 목록:', upbitMarkets);
        
        if (upbitMarkets.length === 0) {
          logger.warn('업비트 마켓 목록이 비어있음');
          return;
        }
        
        // 업비트 API 호출 (빠른 배치 방식)
        const validMarkets = upbitMarkets.filter(market => market && market !== 'null');
        
        logger.api('업비트 API 빠른 호출 시작');
        logger.debug('유효한 마켓:', validMarkets);
        
        // 환경별 API 호출
        const upbitData = await getBatchUpbitTickerData(validMarkets);
        logger.api(`업비트 API 응답: ${Object.keys(upbitData).length}개 마켓 (요청: ${validMarkets.length}개)`);
        
        // 데이터 변환 및 업데이트
        let updateCount = 0;
        Object.values(upbitData).forEach(ticker => {
          updateUpbitPrice(ticker.market, ticker);
          updateCount++;
        });
        
        logger.api(`업비트 데이터 업데이트: ${updateCount}개 마켓`);
        
      } catch (error) {
        logger.error('업비트 REST API 실패:', error);
        logger.info('Mock 데이터로 대체 시도...');
        
        // CORS 에러 등으로 실패 시 Mock 데이터 사용
        try {
          const mockTickerData = await getBatchUpbitTickerData(validMarkets);
          let mockUpdateCount = 0;
          
          Object.entries(mockTickerData).forEach(([market, ticker]) => {
            updateUpbitPrice(market, ticker);
            mockUpdateCount++;
          });
          
          logger.api(`Mock 업비트 데이터 업데이트: ${mockUpdateCount}개 마켓`);
        } catch (mockError) {
          logger.error('Mock 데이터 생성도 실패:', mockError);
          addError(`업비트 API 실패: ${error.message}`);
        }
      }
    };
    
    // 즉시 시작 (Binance와 동시에)
    fetchUpbitTickerData();
    
    // 모든 환경에서 동일한 간격으로 업데이트 (로컬 기준)
    const upbitUpdateInterval = 60 * 1000; // 60초 간격으로 통일
    upbitTickerInterval = setInterval(fetchUpbitTickerData, upbitUpdateInterval);
    
    logger.info(`업비트 REST API 자동 업데이트 활성화 (${upbitUpdateInterval/1000}초 간격)`);
    
    return () => {
      if (upbitTickerInterval) {
        clearInterval(upbitTickerInterval);
        logger.info('업비트 REST API 업데이트 정리');
      }
    };
  }, [updateUpbitPrice, addError, MAJOR_COINS]);
  
  // 통계 업데이트 (자동)
  useEffect(() => {
    const connectedCoins = Object.keys(state.prices).length;
    const kimchiPremiums = getAllKimchiPremiums();
    const kimchiPremiumCount = Object.keys(kimchiPremiums).length;
    
    dispatch({
      type: ACTIONS.UPDATE_STATS,
      payload: {
        connectedCoins,
        kimchiPremiumCount
      }
    });
  }, [state.prices, state.upbitPrices, getAllKimchiPremiums]);
  
  // Context 값 준비
  const contextValue = {
    // 상태
    ...state,
    
    // 액션
    setConnectionStatus,
    setConnecting,
    setUpbitConnectionStatus,
    setUpbitConnecting,
    updatePrice,
    updateUpbitPrice,
    updateExchangeRate,
    setPricesBulk,
    setUpbitPricesBulk,
    updateKlineData,
    setKlineDataBulk,
    addError,
    clearErrors,
    resetState,
    
    // 계산 함수
    calculateKimchiPremium,
    getAllKimchiPremiums,
    
    // 상수
    MAJOR_COINS,
    MAJOR_SYMBOLS,
    UPBIT_MARKETS,
    ALL_COINS,
    ALL_SYMBOLS,
    ALL_UPBIT_MARKETS
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