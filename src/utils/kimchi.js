/**
 * 김치프리미엄 계산 유틸리티
 * 비트겟 기준으로 운영하되, 업비트 데이터가 있을 때만 김프 계산
 */

import { calculateKimchi } from './formatters';
import { bitgetToUpbit } from '../services/upbit';

/**
 * 코인별 김치프리미엄 계산
 * @param {string} bitgetSymbol - Bitget 심볼 (예: 'BTCUSDT')
 * @param {number} bitgetPrice - Bitget USD 가격
 * @param {object} upbitPrices - 업비트 가격 객체
 * @param {number} exchangeRate - USD/KRW 환율
 * @returns {object} 김치프리미엄 결과
 */
export function calculateKimchiPremium(bitgetSymbol, bitgetPrice, upbitPrices, exchangeRate) {
  // 업비트 마켓 코드로 변환
  const upbitMarket = bitgetToUpbit(bitgetSymbol);
  
  if (!upbitMarket) {
    return {
      available: false,
      reason: 'mapping_not_found',
      message: '업비트 매핑이 없습니다'
    };
  }
  
  // 업비트 가격 데이터 확인
  const upbitData = upbitPrices[upbitMarket];
  
  if (!upbitData || upbitData === null) {
    return {
      available: false,
      reason: 'upbit_not_listed',
      message: '업비트에 상장되지 않음',
      upbitMarket
    };
  }
  
  if (!upbitData.price || !bitgetPrice || !exchangeRate) {
    return {
      available: false,
      reason: 'price_data_missing',
      message: '가격 데이터 누락',
      upbitMarket
    };
  }
  
  // 김치프리미엄 계산
  const kimchiResult = calculateKimchi(upbitData.price, bitgetPrice, exchangeRate);
  
  return {
    available: true,
    bitgetSymbol,
    upbitMarket,
    bitgetPrice,
    upbitPrice: upbitData.price,
    exchangeRate,
    kimchi: kimchiResult,
    upbitData,
    calculatedAt: Date.now()
  };
}

/**
 * 여러 코인의 김치프리미엄 일괄 계산
 * @param {Array<object>} bitgetCoins - 비트겟 코인 배열 [{symbol, price}, ...]
 * @param {object} upbitPrices - 업비트 가격 객체
 * @param {number} exchangeRate - USD/KRW 환율
 * @returns {Array<object>} 김치프리미엄 결과 배열
 */
export function calculateMultipleKimchiPremiums(bitgetCoins, upbitPrices, exchangeRate) {
  if (!Array.isArray(bitgetCoins)) {
    throw new Error('bitgetCoins는 배열이어야 합니다');
  }
  
  return bitgetCoins.map(coin => {
    try {
      return calculateKimchiPremium(coin.symbol, coin.price, upbitPrices, exchangeRate);
    } catch (error) {
      return {
        available: false,
        reason: 'calculation_error',
        message: error.message,
        bitgetSymbol: coin.symbol
      };
    }
  });
}

/**
 * 김치프리미엄 결과 필터링
 * @param {Array<object>} kimchiResults - 김치프리미엄 결과 배열
 * @param {object} options - 필터 옵션
 * @returns {object} 필터링된 결과
 */
export function filterKimchiResults(kimchiResults, options = {}) {
  const {
    availableOnly = false,
    minPremium = null,
    maxPremium = null,
    sortBy = 'premium' // 'premium' | 'symbol' | 'upbitPrice'
  } = options;
  
  let filtered = [...kimchiResults];
  
  // 이용 가능한 것만 필터링
  if (availableOnly) {
    filtered = filtered.filter(result => result.available);
  }
  
  // 프리미엄 범위 필터링
  if (minPremium !== null) {
    filtered = filtered.filter(result => 
      result.available && result.kimchi.premium >= minPremium
    );
  }
  
  if (maxPremium !== null) {
    filtered = filtered.filter(result => 
      result.available && result.kimchi.premium <= maxPremium
    );
  }
  
  // 정렬
  if (sortBy === 'premium') {
    filtered.sort((a, b) => {
      if (!a.available && !b.available) return 0;
      if (!a.available) return 1;
      if (!b.available) return -1;
      return b.kimchi.premium - a.kimchi.premium; // 내림차순
    });
  } else if (sortBy === 'symbol') {
    filtered.sort((a, b) => (a.bitgetSymbol || '').localeCompare(b.bitgetSymbol || ''));
  } else if (sortBy === 'upbitPrice') {
    filtered.sort((a, b) => {
      if (!a.available && !b.available) return 0;
      if (!a.available) return 1;
      if (!b.available) return -1;
      return b.upbitPrice - a.upbitPrice; // 내림차순
    });
  }
  
  return {
    all: filtered,
    available: filtered.filter(r => r.available),
    unavailable: filtered.filter(r => !r.available),
    count: {
      total: filtered.length,
      available: filtered.filter(r => r.available).length,
      unavailable: filtered.filter(r => !r.available).length
    },
    stats: calculateKimchiStats(filtered.filter(r => r.available))
  };
}

/**
 * 김치프리미엄 통계 계산
 * @param {Array<object>} availableResults - 이용 가능한 김치프리미엄 결과들
 * @returns {object} 통계 정보
 */
export function calculateKimchiStats(availableResults) {
  if (!availableResults.length) {
    return {
      count: 0,
      averagePremium: 0,
      maxPremium: 0,
      minPremium: 0,
      positiveCount: 0,
      negativeCount: 0
    };
  }
  
  const premiums = availableResults.map(r => r.kimchi.premium);
  const positiveCount = premiums.filter(p => p > 0).length;
  const negativeCount = premiums.filter(p => p < 0).length;
  
  return {
    count: availableResults.length,
    averagePremium: premiums.reduce((sum, p) => sum + p, 0) / premiums.length,
    maxPremium: Math.max(...premiums),
    minPremium: Math.min(...premiums),
    positiveCount,
    negativeCount,
    neutralCount: premiums.length - positiveCount - negativeCount
  };
}

/**
 * 김치프리미엄 결과를 UI용 데이터로 변환
 * @param {object} kimchiResult - 김치프리미엄 결과
 * @returns {object} UI용 데이터
 */
export function formatKimchiForUI(kimchiResult) {
  if (!kimchiResult.available) {
    return {
      symbol: kimchiResult.bitgetSymbol || 'Unknown',
      available: false,
      reason: kimchiResult.reason,
      message: kimchiResult.message,
      displayText: kimchiResult.message
    };
  }
  
  return {
    symbol: kimchiResult.bitgetSymbol,
    upbitMarket: kimchiResult.upbitMarket,
    available: true,
    bitgetPrice: kimchiResult.bitgetPrice,
    upbitPrice: kimchiResult.upbitPrice,
    exchangeRate: kimchiResult.exchangeRate,
    premium: kimchiResult.kimchi.premium,
    premiumFormatted: kimchiResult.kimchi.formatted,
    isPositive: kimchiResult.kimchi.isPositive,
    colorClass: kimchiResult.kimchi.isPositive ? 'text-success' : 'text-danger',
    displayText: kimchiResult.kimchi.formatted
  };
}

// 기본 export
export default {
  calculateKimchiPremium,
  calculateMultipleKimchiPremiums,
  filterKimchiResults,
  calculateKimchiStats,
  formatKimchiForUI
};