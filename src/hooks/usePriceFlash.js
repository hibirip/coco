/**
 * 가격 변화 애니메이션 훅
 * 가격이 오르면 초록색, 떨어지면 빨간색으로 깜빡임
 */

import { useState, useEffect, useRef } from 'react';

/**
 * 가격 변화 감지 및 깜빡임 애니메이션 훅
 * @param {number} currentPrice - 현재 가격
 * @param {number} duration - 깜빡임 지속 시간 (ms, 기본값: 800)
 * @returns {Object} { flashClass, isFlashing }
 */
export function usePriceFlash(currentPrice, duration = 800) {
  const [flashClass, setFlashClass] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);
  const previousPriceRef = useRef(currentPrice);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // 가격이 유효하지 않으면 애니메이션 하지 않음
    if (!currentPrice || currentPrice <= 0) {
      return;
    }

    const previousPrice = previousPriceRef.current;
    
    // 이전 가격이 있고, 현재 가격과 다르면 애니메이션 실행
    if (previousPrice && previousPrice !== currentPrice) {
      // 기존 타이머 클리어
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 가격 변화 방향에 따라 클래스 설정
      if (currentPrice > previousPrice) {
        setFlashClass('price-flash-up');
      } else if (currentPrice < previousPrice) {
        setFlashClass('price-flash-down');
      }

      setIsFlashing(true);

      // 애니메이션 종료 타이머
      timeoutRef.current = setTimeout(() => {
        setFlashClass('');
        setIsFlashing(false);
      }, duration);
    }

    // 현재 가격을 이전 가격으로 저장
    previousPriceRef.current = currentPrice;

    // 클린업
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentPrice, duration]);

  // 컴포넌트 언마운트 시 타이머 클리어
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    flashClass,
    isFlashing
  };
}

/**
 * 다중 가격 변화 감지 훅 (여러 코인의 가격을 동시에 추적)
 * @param {Object} pricesMap - 심볼별 가격 객체 { symbol: price }
 * @param {number} duration - 깜빡임 지속 시간 (ms, 기본값: 800)
 * @returns {Object} 심볼별 플래시 상태 { symbol: { flashClass, isFlashing } }
 */
export function useMultiplePriceFlash(pricesMap, duration = 800) {
  const [flashStates, setFlashStates] = useState({});
  const previousPricesRef = useRef({});
  const timeoutsRef = useRef({});

  useEffect(() => {
    const newFlashStates = { ...flashStates };

    Object.entries(pricesMap).forEach(([symbol, currentPrice]) => {
      // 가격이 유효하지 않으면 스킵
      if (!currentPrice || currentPrice <= 0) {
        return;
      }

      const previousPrice = previousPricesRef.current[symbol];
      
      // 이전 가격이 있고, 현재 가격과 다르면 애니메이션 실행
      if (previousPrice && previousPrice !== currentPrice) {
        // 기존 타이머 클리어
        if (timeoutsRef.current[symbol]) {
          clearTimeout(timeoutsRef.current[symbol]);
        }

        // 가격 변화 방향에 따라 클래스 설정
        let flashClass = '';
        if (currentPrice > previousPrice) {
          flashClass = 'price-flash-up';
        } else if (currentPrice < previousPrice) {
          flashClass = 'price-flash-down';
        }

        newFlashStates[symbol] = {
          flashClass,
          isFlashing: true
        };

        // 애니메이션 종료 타이머
        timeoutsRef.current[symbol] = setTimeout(() => {
          setFlashStates(prev => ({
            ...prev,
            [symbol]: {
              flashClass: '',
              isFlashing: false
            }
          }));
        }, duration);
      }

      // 현재 가격을 이전 가격으로 저장
      previousPricesRef.current[symbol] = currentPrice;
    });

    // 새로운 플래시 상태가 있으면 업데이트
    if (Object.keys(newFlashStates).some(symbol => 
      flashStates[symbol]?.flashClass !== newFlashStates[symbol]?.flashClass
    )) {
      setFlashStates(newFlashStates);
    }
  }, [pricesMap, duration]);

  // 컴포넌트 언마운트 시 모든 타이머 클리어
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  return flashStates;
}

export default usePriceFlash;