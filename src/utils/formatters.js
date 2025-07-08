/**
 * 가격, 퍼센트 등을 포맷팅하는 유틸리티 함수들
 */

/**
 * 원화 포맷팅 (₩ 1,234,567)
 * @param {number} value - 포맷팅할 숫자
 * @param {boolean} showSymbol - 통화 기호 표시 여부 (기본: true)
 * @returns {string} 포맷팅된 원화 문자열
 */
export const formatKRW = (value, showSymbol = true) => {
  if (value === null || value === undefined || isNaN(value)) {
    return showSymbol ? '₩ 0' : '0';
  }

  const formatted = Math.round(value).toLocaleString('ko-KR');
  return showSymbol ? `₩ ${formatted}` : formatted;
};

/**
 * 달러 포맷팅 ($ 1,234.56)
 * @param {number} value - 포맷팅할 숫자
 * @param {number} decimals - 소수점 자릿수 (기본: 2)
 * @param {boolean} showSymbol - 통화 기호 표시 여부 (기본: true)
 * @returns {string} 포맷팅된 달러 문자열
 */
export const formatUSD = (value, decimals = 2, showSymbol = true) => {
  if (value === null || value === undefined || isNaN(value)) {
    return showSymbol ? '$0.00' : '0.00';
  }

  // 값에 따라 소수점 자릿수 동적 조정
  let adjustedDecimals = decimals;
  if (value >= 1000) {
    adjustedDecimals = 2;
  } else if (value >= 1) {
    adjustedDecimals = 4;
  } else if (value >= 0.01) {
    adjustedDecimals = 6;
  } else {
    adjustedDecimals = 8;
  }

  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: adjustedDecimals
  });

  return showSymbol ? `$${formatted}` : formatted;
};

/**
 * 퍼센트 포맷팅 (+/-12.34%)
 * @param {number} value - 포맷팅할 숫자 (예: 12.34)
 * @param {number} decimals - 소수점 자릿수 (기본: 2)
 * @returns {string} 포맷팅된 퍼센트 문자열
 */
export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }

  const sign = value > 0 ? '+' : '';
  const formatted = value.toFixed(decimals);
  return `${sign}${formatted}%`;
};

/**
 * 시가총액 포맷팅 (조/억/백만 단위)
 * @param {number} value - 포맷팅할 숫자
 * @param {string} currency - 통화 (기본: 'KRW')
 * @returns {string} 포맷팅된 시가총액 문자열
 */
export const formatMarketCap = (value, currency = 'KRW') => {
  if (value === null || value === undefined || isNaN(value)) {
    return currency === 'KRW' ? '₩ 0' : '$0';
  }

  const symbol = currency === 'KRW' ? '₩ ' : '$';

  if (currency === 'KRW') {
    // 한국 단위 (조, 억, 백만)
    if (value >= 1000000000000) { // 1조 이상
      return `${symbol}${(value / 1000000000000).toFixed(1)}조`;
    } else if (value >= 100000000) { // 1억 이상
      return `${symbol}${(value / 100000000).toFixed(1)}억`;
    } else if (value >= 1000000) { // 100만 이상
      return `${symbol}${(value / 1000000).toFixed(1)}백만`;
    } else {
      return formatKRW(value);
    }
  } else {
    // 영어 단위 (T, B, M)
    if (value >= 1000000000000) { // 1조 이상
      return `${symbol}${(value / 1000000000000).toFixed(1)}T`;
    } else if (value >= 1000000000) { // 10억 이상
      return `${symbol}${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) { // 100만 이상
      return `${symbol}${(value / 1000000).toFixed(1)}M`;
    } else {
      return formatUSD(value, 0);
    }
  }
};

/**
 * 거래량 포맷팅 (B/M 단위)
 * @param {number} value - 포맷팅할 숫자
 * @param {string} currency - 통화 (기본: 'USD')
 * @returns {string} 포맷팅된 거래량 문자열
 */
export const formatVolume = (value, currency = 'USD') => {
  if (value === null || value === undefined || isNaN(value)) {
    return currency === 'KRW' ? '₩ 0' : '$0';
  }

  const symbol = currency === 'KRW' ? '₩ ' : '$';

  if (currency === 'KRW') {
    // 한국 단위
    if (value >= 1000000000000) { // 1조 이상
      return `${symbol}${(value / 1000000000000).toFixed(1)}조`;
    } else if (value >= 100000000) { // 1억 이상
      return `${symbol}${(value / 100000000).toFixed(1)}억`;
    } else if (value >= 1000000) { // 100만 이상
      return `${symbol}${(value / 1000000).toFixed(1)}백만`;
    } else {
      return formatKRW(value);
    }
  } else {
    // 영어 단위
    if (value >= 1000000000) { // 10억 이상
      return `${symbol}${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) { // 100만 이상
      return `${symbol}${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) { // 1천 이상
      return `${symbol}${(value / 1000).toFixed(1)}K`;
    } else {
      return formatUSD(value, 0);
    }
  }
};

/**
 * 날짜 포맷팅
 * @param {Date|string|number} date - 포맷팅할 날짜
 * @param {string} format - 포맷 유형 ('datetime', 'date', 'time', 'relative')
 * @returns {string} 포맷팅된 날짜 문자열
 */
export const formatDate = (date, format = 'datetime') => {
  if (!date) return '';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  const now = new Date();
  const diffMs = now - dateObj;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  switch (format) {
    case 'relative':
      if (diffMins < 1) return '방금 전';
      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      if (diffDays < 7) return `${diffDays}일 전`;
      return dateObj.toLocaleDateString('ko-KR');

    case 'date':
      return dateObj.toLocaleDateString('ko-KR');

    case 'time':
      return dateObj.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

    case 'datetime':
    default:
      return dateObj.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
  }
};

/**
 * 김치프리미엄 계산
 * @param {number} krwPrice - 한국 가격 (원)
 * @param {number} usdPrice - 해외 가격 (달러)
 * @param {number} exchangeRate - 환율 (기본: 1300)
 * @returns {object} { premium: number, isPositive: boolean, formatted: string }
 */
export const calculateKimchi = (krwPrice, usdPrice, exchangeRate = 1380) => {
  if (!krwPrice || !usdPrice || !exchangeRate) {
    return {
      premium: 0,
      isPositive: false,
      formatted: '0.00%'
    };
  }

  // 데이터 유효성 검증
  if (krwPrice <= 0 || usdPrice <= 0 || exchangeRate <= 0) {
    return {
      premium: 0,
      isPositive: false,
      formatted: '0.00%'
    };
  }

  // 해외 가격을 원화로 환산
  const usdToKrw = usdPrice * exchangeRate;
  
  // 김치프리미엄 계산 ((한국가격 - 해외가격) / 해외가격 * 100)
  const premium = ((krwPrice - usdToKrw) / usdToKrw) * 100;
  const isPositive = premium > 0;
  
  // 비정상적인 프리미엄 범위 검증 (-20% ~ 20%)
  if (Math.abs(premium) > 20) {
    console.warn(`Abnormal kimchi premium detected: ${premium.toFixed(2)}%`, {
      krwPrice,
      usdPrice,
      exchangeRate,
      usdToKrw
    });
  }
  
  return {
    premium: premium,
    isPositive: isPositive,
    formatted: formatPercent(premium)
  };
};

/**
 * 숫자 포맷팅 (천 단위 콤마)
 * @param {number} value - 포맷팅할 숫자
 * @param {number} decimals - 소수점 자릿수 (기본: 0)
 * @returns {string} 포맷팅된 숫자 문자열
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
};

/**
 * 색상 클래스 반환 (가격 변동에 따른)
 * @param {number} value - 변동값
 * @returns {string} Tailwind CSS 색상 클래스
 */
export const getChangeColorClass = (value) => {
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-danger';
  return 'text-textSecondary';
};

/**
 * 모든 포매터 함수들을 한번에 export
 */
export default {
  formatKRW,
  formatUSD,
  formatPercent,
  formatMarketCap,
  formatVolume,
  formatDate,
  formatNumber,
  calculateKimchi,
  getChangeColorClass
};