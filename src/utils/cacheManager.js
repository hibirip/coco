/**
 * 메모리 캐시 관리자
 * 캐시 크기 제한 및 자동 정리 기능
 */

import { logger } from './logger';

class CacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100; // 최대 캐시 항목 수
    this.maxMemory = options.maxMemory || 50 * 1024 * 1024; // 50MB
    this.defaultTTL = options.defaultTTL || 30 * 60 * 1000; // 30분
    this.cleanupInterval = options.cleanupInterval || 5 * 60 * 1000; // 5분마다 정리
    
    this.cache = new Map();
    this.accessTimes = new Map();
    this.memoryUsage = 0;
    
    // 자동 정리 시작
    this.startCleanup();
  }

  /**
   * 캐시에 데이터 저장
   * @param {string} key - 캐시 키
   * @param {any} value - 저장할 값
   * @param {number} ttl - 생존 시간 (밀리초)
   */
  set(key, value, ttl = this.defaultTTL) {
    const now = Date.now();
    const expireTime = now + ttl;
    
    // 메모리 사용량 계산 (대략적)
    const dataSize = this.estimateSize(value);
    
    // 메모리 한계 초과 시 오래된 항목 제거
    if (this.memoryUsage + dataSize > this.maxMemory) {
      this.evictOldest();
    }
    
    // 크기 한계 초과 시 오래된 항목 제거
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    // 기존 항목이 있으면 메모리 사용량에서 제거
    if (this.cache.has(key)) {
      const oldItem = this.cache.get(key);
      this.memoryUsage -= this.estimateSize(oldItem.data);
    }
    
    // 새 항목 저장
    this.cache.set(key, {
      data: value,
      expireTime,
      size: dataSize,
      createdAt: now
    });
    
    this.accessTimes.set(key, now);
    this.memoryUsage += dataSize;
    
    logger.debug(`Cache set: ${key} (${this.formatSize(dataSize)})`);
  }

  /**
   * 캐시에서 데이터 조회
   * @param {string} key - 캐시 키
   * @returns {any|null} 캐시된 데이터 또는 null
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    const item = this.cache.get(key);
    const now = Date.now();
    
    // 만료 확인
    if (now > item.expireTime) {
      this.delete(key);
      return null;
    }
    
    // 접근 시간 업데이트 (LRU)
    this.accessTimes.set(key, now);
    
    logger.debug(`Cache hit: ${key}`);
    return item.data;
  }

  /**
   * 캐시에서 데이터 삭제
   * @param {string} key - 캐시 키
   */
  delete(key) {
    if (this.cache.has(key)) {
      const item = this.cache.get(key);
      this.memoryUsage -= item.size;
      this.cache.delete(key);
      this.accessTimes.delete(key);
      
      logger.debug(`Cache deleted: ${key}`);
    }
  }

  /**
   * 캐시 전체 삭제
   */
  clear() {
    this.cache.clear();
    this.accessTimes.clear();
    this.memoryUsage = 0;
    
    logger.info('Cache cleared');
  }

  /**
   * 가장 오래된 항목 제거 (LRU)
   */
  evictOldest() {
    if (this.accessTimes.size === 0) return;
    
    // 가장 오래전에 접근된 키 찾기
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      logger.debug(`Evicting oldest cache entry: ${oldestKey}`);
      this.delete(oldestKey);
    }
  }

  /**
   * 만료된 항목들 정리
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expireTime) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
    
    if (expiredKeys.length > 0) {
      logger.info(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * 자동 정리 시작
   */
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * 자동 정리 중지
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 데이터 크기 추정
   * @param {any} data - 데이터
   * @returns {number} 추정 크기 (바이트)
   */
  estimateSize(data) {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch (error) {
      // JSON.stringify 실패 시 대략적인 크기 반환
      return 1024; // 1KB로 추정
    }
  }

  /**
   * 크기를 사람이 읽기 쉬운 형태로 변환
   * @param {number} bytes - 바이트 수
   * @returns {string} 포맷된 크기
   */
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  /**
   * 캐시 통계
   * @returns {object} 캐시 통계 정보
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [, item] of this.cache.entries()) {
      if (now > item.expireTime) {
        expiredCount++;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsage: this.formatSize(this.memoryUsage),
      maxMemory: this.formatSize(this.maxMemory),
      memoryUsagePercent: ((this.memoryUsage / this.maxMemory) * 100).toFixed(1),
      expiredCount,
      hitRate: this.hitCount / (this.hitCount + this.missCount) * 100 || 0
    };
  }

  /**
   * 캐시 건강 상태 확인
   * @returns {object} 건강 상태 정보
   */
  getHealth() {
    const stats = this.getStats();
    const memoryUsagePercent = parseFloat(stats.memoryUsagePercent);
    const sizeUsagePercent = (this.cache.size / this.maxSize) * 100;
    
    return {
      healthy: memoryUsagePercent < 80 && sizeUsagePercent < 80,
      memoryPressure: memoryUsagePercent > 70,
      sizePressure: sizeUsagePercent > 70,
      expiredItems: stats.expiredCount > this.maxSize * 0.1,
      recommendations: this.getRecommendations(memoryUsagePercent, sizeUsagePercent)
    };
  }

  /**
   * 최적화 권장사항
   * @param {number} memoryPercent - 메모리 사용률
   * @param {number} sizePercent - 크기 사용률
   * @returns {Array} 권장사항 목록
   */
  getRecommendations(memoryPercent, sizePercent) {
    const recommendations = [];
    
    if (memoryPercent > 80) {
      recommendations.push('메모리 사용량이 높습니다. 캐시 크기를 줄이거나 TTL을 단축하세요.');
    }
    
    if (sizePercent > 80) {
      recommendations.push('캐시 항목 수가 많습니다. maxSize를 늘리거나 정리 주기를 단축하세요.');
    }
    
    if (this.getStats().expiredCount > this.maxSize * 0.1) {
      recommendations.push('만료된 항목이 많습니다. 정리 주기를 단축하세요.');
    }
    
    return recommendations;
  }
}

// 전역 캐시 인스턴스들
export const globalCache = new CacheManager({
  maxSize: 200,
  maxMemory: 100 * 1024 * 1024, // 100MB
  defaultTTL: 30 * 60 * 1000, // 30분
  cleanupInterval: 5 * 60 * 1000 // 5분마다 정리
});

export const priceCache = new CacheManager({
  maxSize: 100,
  maxMemory: 20 * 1024 * 1024, // 20MB
  defaultTTL: 5 * 60 * 1000, // 5분
  cleanupInterval: 2 * 60 * 1000 // 2분마다 정리
});

export const newsCache = new CacheManager({
  maxSize: 50,
  maxMemory: 30 * 1024 * 1024, // 30MB
  defaultTTL: 2 * 60 * 60 * 1000, // 2시간
  cleanupInterval: 30 * 60 * 1000 // 30분마다 정리
});

export default CacheManager;