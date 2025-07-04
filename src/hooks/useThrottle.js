import { useRef, useCallback } from 'react';

/**
 * 쓰로틀링 훅 - 지정된 시간 간격으로 함수 실행 제한
 * @param {Function} callback - 실행할 함수
 * @param {number} delay - 간격 시간 (ms)
 * @returns {Function} 쓰로틀된 함수
 */
export function useThrottle(callback, delay) {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
}

/**
 * 쓰로틀된 값 훅
 * @param {any} value - 쓰로틀할 값
 * @param {number} delay - 간격 시간 (ms)
 * @returns {any} 쓰로틀된 값
 */
export function useThrottledValue(value, delay) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= delay) {
      setThrottledValue(value);
      lastUpdated.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastUpdated.current = Date.now();
      }, delay - timeSinceLastUpdate);

      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
}