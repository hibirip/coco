/**
 * PriceContext - 실시간 가격 데이터 전역 상태 관리
 * WebSocket 데이터를 담을 전역 Context
 */

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { calculateKimchi } from '../utils/formatters';

// 주요 10개 코인 심볼 상수 정의
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

// 심볼 배열 추출
export const MAJOR_SYMBOLS = Object.values(MAJOR_COINS).map(coin => coin.symbol);
export const UPBIT_MARKETS = Object.values(MAJOR_COINS).map(coin => coin.upbitMarket);

// 초기 상태 정의
const initialState = {
  // 가격 데이터
  prices: {},
  upbitPrices: {},
  
  // 연결 상태
  isConnected: false,
  isConnecting: false,
  
  // 환율 정보
  exchangeRate: null,
  
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
  
  // 개별 가격 업데이트 (Upbit)
  const updateUpbitPrice = useCallback((market, priceData) => {
    dispatch({
      type: ACTIONS.UPDATE_UPBIT_PRICE,
      payload: {
        market,
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
      return null;
    }
    
    const coin = Object.values(MAJOR_COINS).find(coin => coin.symbol === symbol);
    if (!coin) {
      return null;
    }
    
    const bitgetPrice = state.prices[symbol];
    const upbitPrice = state.upbitPrices[coin.upbitMarket];
    
    if (!bitgetPrice?.price || !upbitPrice?.price) {
      return null;
    }
    
    try {
      return calculateKimchi(upbitPrice.price, bitgetPrice.price, state.exchangeRate);
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
    UPBIT_MARKETS
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