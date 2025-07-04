import { useState, useEffect } from 'react';

/**
 * 디바운스 훅 - 값이 변경된 후 지정된 시간이 지나면 업데이트
 * @param {any} value - 디바운스할 값
 * @param {number} delay - 지연 시간 (ms)
 * @returns {any} 디바운스된 값
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 디바운스된 콜백 훅
 * @param {Function} callback - 실행할 함수
 * @param {number} delay - 지연 시간 (ms)
 * @param {Array} deps - 의존성 배열
 * @returns {Function} 디바운스된 함수
 */
export function useDebouncedCallback(callback, delay, deps = []) {
  const [debounceTimer, setDebounceTimer] = useState(null);

  const debouncedCallback = (...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(newTimer);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return debouncedCallback;
}