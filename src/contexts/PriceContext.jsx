/**
 * PriceContext - 실시간 가격 데이터 전역 상태 관리
 * WebSocket 데이터를 담을 전역 Context
 */

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { calculateKimchi } from '../utils/formatters';
import { getUSDKRWRate, startAutoUpdate, stopAutoUpdate } from '../services/exchangeRate';

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
    upbitMarket: 'KRW-MATIC',
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

// 전체 Bitget 코인 리스트 (시세 페이지용)
export const ALL_COINS = {
  // 주요 10개 코인
  ...MAJOR_COINS,
  
  // 실제 업비트에 상장된 추가 코인들만 포함
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
  VET: {
    symbol: 'VETUSDT',
    name: 'VeChain',
    upbitMarket: 'KRW-VET',
    priority: 20
  },
  ICP: {
    symbol: 'ICPUSDT',
    name: 'Internet Computer',
    upbitMarket: 'KRW-ICP',
    priority: 21
  },
  FTM: {
    symbol: 'FTMUSDT',
    name: 'Fantom',
    upbitMarket: 'KRW-FTM',
    priority: 22
  },
  SAND: {
    symbol: 'SANDUSDT',
    name: 'The Sandbox',
    upbitMarket: 'KRW-SAND',
    priority: 23
  },
  MANA: {
    symbol: 'MANAUSDT',
    name: 'Decentraland',
    upbitMarket: 'KRW-MANA',
    priority: 24
  },
  AXS: {
    symbol: 'AXSUSDT',
    name: 'Axie Infinity',
    upbitMarket: 'KRW-AXS',
    priority: 25
  },
  CHZ: {
    symbol: 'CHZUSDT',
    name: 'Chiliz',
    upbitMarket: 'KRW-CHZ',
    priority: 26
  },
  APT: {
    symbol: 'APTUSDT',
    name: 'Aptos',
    upbitMarket: 'KRW-APT',
    priority: 27
  },
  ARB: {
    symbol: 'ARBUSDT',
    name: 'Arbitrum',
    upbitMarket: 'KRW-ARB',
    priority: 28
  },
  OP: {
    symbol: 'OPUSDT',
    name: 'Optimism',
    upbitMarket: 'KRW-OP',
    priority: 29
  },
  PEPE: {
    symbol: 'PEPEUSDT',
    name: 'Pepe',
    upbitMarket: 'KRW-PEPE',
    priority: 30
  },
  STX: {
    symbol: 'STXUSDT',
    name: 'Stacks',
    upbitMarket: 'KRW-STX',
    priority: 31
  },
  HBAR: {
    symbol: 'HBARUSDT',
    name: 'Hedera',
    upbitMarket: 'KRW-HBAR',
    priority: 32
  },
  FLOW: {
    symbol: 'FLOWUSDT',
    name: 'Flow',
    upbitMarket: 'KRW-FLOW',
    priority: 33
  },
  XTZ: {
    symbol: 'XTZUSDT',
    name: 'Tezos',
    upbitMarket: 'KRW-XTZ',
    priority: 34
  },
  AAVE: {
    symbol: 'AAVEUSDT',
    name: 'Aave',
    upbitMarket: 'KRW-AAVE',
    priority: 35
  },
  
  // 추가 65개 인기 코인들 (비트겟 기준)
  BNB: {
    symbol: 'BNBUSDT',
    name: 'BNB',
    upbitMarket: null, // 업비트 미상장
    priority: 36
  },
  SUI: {
    symbol: 'SUIUSDT',
    name: 'Sui',
    upbitMarket: 'KRW-SUI',
    priority: 37
  },
  INJ: {
    symbol: 'INJUSDT',
    name: 'Injective',
    upbitMarket: 'KRW-INJ',
    priority: 38
  },
  SEI: {
    symbol: 'SEIUSDT',
    name: 'Sei',
    upbitMarket: 'KRW-SEI',
    priority: 39
  },
  TON: {
    symbol: 'TONUSDT',
    name: 'Toncoin',
    upbitMarket: 'KRW-TON',
    priority: 40
  },
  IMX: {
    symbol: 'IMXUSDT',
    name: 'Immutable X',
    upbitMarket: 'KRW-IMX',
    priority: 41
  },
  LDO: {
    symbol: 'LDOUSDT',
    name: 'Lido DAO',
    upbitMarket: 'KRW-LDO',
    priority: 42
  },
  MKR: {
    symbol: 'MKRUSDT',
    name: 'Maker',
    upbitMarket: 'KRW-MKR',
    priority: 43
  },
  COMP: {
    symbol: 'COMPUSDT',
    name: 'Compound',
    upbitMarket: 'KRW-COMP',
    priority: 44
  },
  CRV: {
    symbol: 'CRVUSDT',
    name: 'Curve DAO',
    upbitMarket: 'KRW-CRV',
    priority: 45
  },
  SUSHI: {
    symbol: 'SUSHIUSDT',
    name: 'SushiSwap',
    upbitMarket: 'KRW-SUSHI',
    priority: 46
  },
  YFI: {
    symbol: 'YFIUSDT',
    name: 'yearn.finance',
    upbitMarket: 'KRW-YFI',
    priority: 47
  },
  BAT: {
    symbol: 'BATUSDT',
    name: 'Basic Attention',
    upbitMarket: 'KRW-BAT',
    priority: 48
  },
  ZRX: {
    symbol: 'ZRXUSDT',
    name: '0x Protocol',
    upbitMarket: 'KRW-ZRX',
    priority: 49
  },
  EGLD: {
    symbol: 'EGLDUSDT',
    name: 'MultiversX',
    upbitMarket: 'KRW-EGLD',
    priority: 50
  },
  AVAIL: {
    symbol: 'AVAILUSDT',
    name: 'Avail',
    upbitMarket: null,
    priority: 51
  },
  JTO: {
    symbol: 'JTOUSDT',
    name: 'Jito',
    upbitMarket: null,
    priority: 52
  },
  WIF: {
    symbol: 'WIFUSDT',
    name: 'dogwifhat',
    upbitMarket: null,
    priority: 53
  },
  BONK: {
    symbol: 'BONKUSDT',
    name: 'Bonk',
    upbitMarket: null,
    priority: 54
  },
  BOME: {
    symbol: 'BOMEUSDT',
    name: 'BOOK OF MEME',
    upbitMarket: null,
    priority: 55
  },
  W: {
    symbol: 'WUSDT',
    name: 'Wormhole',
    upbitMarket: null,
    priority: 56
  },
  ENA: {
    symbol: 'ENAUSDT',
    name: 'Ethena',
    upbitMarket: null,
    priority: 57
  },
  ORDI: {
    symbol: 'ORDIUSDT',
    name: 'ORDI',
    upbitMarket: null,
    priority: 58
  },
  SATS: {
    symbol: 'SATSUSDT',
    name: '1000SATS',
    upbitMarket: null,
    priority: 59
  },
  RATS: {
    symbol: 'RATSUSDT',
    name: '1000RATS',
    upbitMarket: null,
    priority: 60
  },
  NOT: {
    symbol: 'NOTUSDT',
    name: 'Notcoin',
    upbitMarket: null,
    priority: 61
  },
  FLOKI: {
    symbol: 'FLOKIUSDT',
    name: 'FLOKI',
    upbitMarket: 'KRW-FLOKI',
    priority: 62
  },
  BRETT: {
    symbol: 'BRETTUSDT',
    name: 'Brett',
    upbitMarket: null,
    priority: 63
  },
  DOGS: {
    symbol: 'DOGSUSDT',
    name: 'DOGS',
    upbitMarket: null,
    priority: 64
  },
  POPCAT: {
    symbol: 'POPCATUSDT',
    name: 'Popcat',
    upbitMarket: null,
    priority: 65
  },
  PENDLE: {
    symbol: 'PENDLEUSDT',
    name: 'Pendle',
    upbitMarket: null,
    priority: 66
  },
  JUP: {
    symbol: 'JUPUSDT',
    name: 'Jupiter',
    upbitMarket: null,
    priority: 67
  },
  PYTH: {
    symbol: 'PYTHUSDT',
    name: 'Pyth Network',
    upbitMarket: null,
    priority: 68
  },
  WLD: {
    symbol: 'WLDUSDT',
    name: 'Worldcoin',
    upbitMarket: null,
    priority: 69
  },
  ONDO: {
    symbol: 'ONDOUSDT',
    name: 'Ondo',
    upbitMarket: null,
    priority: 70
  },
  RENDER: {
    symbol: 'RENDERUSDT',
    name: 'Render Token',
    upbitMarket: null,
    priority: 71
  },
  FET: {
    symbol: 'FETUSDT',
    name: 'Fetch.ai',
    upbitMarket: null,
    priority: 72
  },
  GRT: {
    symbol: 'GRTUSDT',
    name: 'The Graph',
    upbitMarket: 'KRW-GRT',
    priority: 73
  },
  THETA: {
    symbol: 'THETAUSDT',
    name: 'THETA',
    upbitMarket: 'KRW-THETA',
    priority: 74
  },
  FIL: {
    symbol: 'FILUSDT',
    name: 'Filecoin',
    upbitMarket: 'KRW-FIL',
    priority: 75
  },
  MEME: {
    symbol: 'MEMEUSDT',
    name: 'Memecoin',
    upbitMarket: null,
    priority: 76
  },
  JASMY: {
    symbol: 'JASMYUSDT',
    name: 'JasmyCoin',
    upbitMarket: 'KRW-JASMY',
    priority: 77
  },
  KAS: {
    symbol: 'KASUSDT',
    name: 'Kaspa',
    upbitMarket: null,
    priority: 78
  },
  TAO: {
    symbol: 'TAOUSDT',
    name: 'Bittensor',
    upbitMarket: null,
    priority: 79
  },
  RUNE: {
    symbol: 'RUNEUSDT',
    name: 'THORChain',
    upbitMarket: null,
    priority: 80
  },
  AR: {
    symbol: 'ARUSDT',
    name: 'Arweave',
    upbitMarket: 'KRW-AR',
    priority: 81
  },
  STRK: {
    symbol: 'STRKUSDT',
    name: 'Starknet',
    upbitMarket: null,
    priority: 82
  },
  TIA: {
    symbol: 'TIAUSDT',
    name: 'Celestia',
    upbitMarket: null,
    priority: 83
  },
  MANTA: {
    symbol: 'MANTAUSDT',
    name: 'Manta Network',
    upbitMarket: null,
    priority: 84
  },
  ALT: {
    symbol: 'ALTUSDT',
    name: 'AltLayer',
    upbitMarket: null,
    priority: 85
  },
  PIXEL: {
    symbol: 'PIXELUSDT',
    name: 'Pixels',
    upbitMarket: null,
    priority: 86
  },
  DYM: {
    symbol: 'DYMUSDT',
    name: 'Dymension',
    upbitMarket: null,
    priority: 87
  },
  PORTAL: {
    symbol: 'PORTALUSDT',
    name: 'Portal',
    upbitMarket: null,
    priority: 88
  },
  AEVO: {
    symbol: 'AEVOUSDT',
    name: 'Aevo',
    upbitMarket: null,
    priority: 89
  },
  METIS: {
    symbol: 'METISUSDT',
    name: 'Metis',
    upbitMarket: null,
    priority: 90
  },
  BLUR: {
    symbol: 'BLURUSDT',
    name: 'Blur',
    upbitMarket: null,
    priority: 91
  },
  AGIX: {
    symbol: 'AGIXUSDT',
    name: 'SingularityNET',
    upbitMarket: null,
    priority: 92
  },
  OCEAN: {
    symbol: 'OCEANUSDT',
    name: 'Ocean Protocol',
    upbitMarket: null,
    priority: 93
  },
  LPT: {
    symbol: 'LPTUSDT',
    name: 'Livepeer',
    upbitMarket: null,
    priority: 94
  },
  API3: {
    symbol: 'API3USDT',
    name: 'API3',
    upbitMarket: null,
    priority: 95
  },
  ENS: {
    symbol: 'ENSUSDT',
    name: 'Ethereum Name Service',
    upbitMarket: 'KRW-ENS',
    priority: 96
  },
  LOOM: {
    symbol: 'LOOMUSDT',
    name: 'Loom Network',
    upbitMarket: 'KRW-LOOM',
    priority: 97
  },
  MASK: {
    symbol: 'MASKUSDT',
    name: 'Mask Network',
    upbitMarket: 'KRW-MASK',
    priority: 98
  },
  CTSI: {
    symbol: 'CTSIUSDT',
    name: 'Cartesi',
    upbitMarket: 'KRW-CTSI',
    priority: 99
  },
  REQ: {
    symbol: 'REQUSDT',
    name: 'Request',
    upbitMarket: 'KRW-REQ',
    priority: 100
  }
};

// 심볼 배열 추출
export const MAJOR_SYMBOLS = Object.values(MAJOR_COINS).map(coin => coin.symbol);
export const UPBIT_MARKETS = Object.values(MAJOR_COINS).map(coin => coin.upbitMarket);

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
    totalCoins: MAJOR_SYMBOLS.length,
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
        console.log(`🔍 PriceContext 리듀서 UPDATE_UPBIT_PRICE (${action.payload.market}):`, {
          market: action.payload.market,
          newData: action.payload.data,
          currentState: state.upbitPrices[action.payload.market]
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
      console.log('🔍 PriceContext 리듀서 UPDATE_EXCHANGE_RATE:', {
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
  
  console.log('🔍 PriceProvider 렌더링:', {
    exchangeRate: state.exchangeRate,
    hasChildren: !!children
  });
  
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
      console.log(`🔍 PriceContext updateUpbitPrice 호출 (${market}):`, {
        market,
        priceData,
        previousPrice: state.upbitPrices[market]?.trade_price
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
      console.log(`⚠️ 김치프리미엄 계산 불가: 환율 없음 (${symbol})`);
      return null;
    }
    
    const coin = Object.values(ALL_COINS).find(coin => coin.symbol === symbol);
    if (!coin) {
      console.log(`⚠️ 김치프리미엄 계산 불가: 코인 정보 없음 (${symbol})`);
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
        console.log(`⚠️ 김치프리미엄 계산 불가 (${symbol}):`, {
          bitgetPrice: bitgetPrice?.price,
          bitgetPriceObject: bitgetPrice,
          upbitPrice: upbitPrice?.trade_price,
          upbitPriceObject: upbitPrice,
          exchangeRate: state.exchangeRate,
          upbitMarket: coin.upbitMarket,
          hasBitgetData: !!bitgetPrice,
          hasUpbitData: !!upbitPrice,
          allBitgetPrices: Object.keys(state.prices),
          allUpbitPrices: Object.keys(state.upbitPrices)
        });
      }
      return null;
    }
    
    try {
      const result = calculateKimchi(upbitPrice.trade_price, bitgetPrice.price, state.exchangeRate);
      
      // 디버깅 정보 출력 (BTC만)
      if (symbol === 'BTCUSDT') {
        console.log(`✅ 김치프리미엄 계산 성공 (${symbol}):`, {
          upbitPrice: upbitPrice.trade_price,
          bitgetPrice: bitgetPrice.price,
          exchangeRate: state.exchangeRate,
          premium: result.premium,
          formatted: result.formatted
        });
      }
      
      return result;
    } catch (error) {
      console.error('김치프리미엄 계산 오류:', error);
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
  
  // 환율 자동 업데이트 시작 (컴포넌트 마운트 시)
  useEffect(() => {
    let exchangeRateInterval = null;
    
    // 초기 환율 로드
    const initExchangeRate = async () => {
      try {
        console.log('💱 초기 환율 로드 시작...');
        console.log('💱 getUSDKRWRate 함수 타입:', typeof getUSDKRWRate);
        
        const rateData = await getUSDKRWRate(false); // 캐시 우선
        console.log('💱 환율 API 응답:', rateData);
        
        if (rateData && rateData.rate) {
          dispatch({
            type: ACTIONS.UPDATE_EXCHANGE_RATE,
            payload: rateData.rate
          });
          console.log(`✅ 초기 환율 설정: ${rateData.rate} (${rateData.source})`);
        } else {
          console.warn('💱 환율 데이터가 비어있음, 기본값 사용');
          dispatch({
            type: ACTIONS.UPDATE_EXCHANGE_RATE,
            payload: 1380 // 구글 검색 기준
          });
        }
      } catch (error) {
        console.error('❌ 초기 환율 로드 실패:', error);
        console.error('❌ 에러 상세:', error.stack);
        // 기본값 설정
        dispatch({
          type: ACTIONS.UPDATE_EXCHANGE_RATE,
          payload: 1380 // 구글 검색 기준
        });
        console.log('💱 응급 기본값 설정: 1380');
      }
    };
    
    // 자동 업데이트 시작 (5시간 간격)
    const startExchangeRateUpdates = () => {
      // 환율 업데이트 콜백 함수
      const handleExchangeRateUpdate = (newRate) => {
        dispatch({
          type: ACTIONS.UPDATE_EXCHANGE_RATE,
          payload: newRate
        });
        console.log(`💱 환율 자동 업데이트: ${newRate}`);
      };
      
      exchangeRateInterval = startAutoUpdate(handleExchangeRateUpdate);
      console.log('🤖 환율 자동 업데이트 활성화 (5시간 간격)');
    };
    
    // 즉시 기본값 설정 (API 호출 전)
    console.log('💱 즉시 기본값 설정: 1380');
    dispatch({
      type: ACTIONS.UPDATE_EXCHANGE_RATE,
      payload: 1380
    });
    
    // 초기화 실행
    initExchangeRate();
    startExchangeRateUpdates();
    
    // 정리 함수
    return () => {
      if (exchangeRateInterval) {
        stopAutoUpdate(exchangeRateInterval);
        console.log('🛑 환율 자동 업데이트 정리');
      }
    };
  }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 실행
  
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