/**
 * 뉴스 자동 업데이트 스케줄러
 * 2시간마다 뉴스를 자동으로 업데이트
 */

import { getLatestNews, clearNewsCache, getNewsCacheStats } from './newsSourcesService';
import { logger } from '../utils/logger';

class NewsScheduler {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.lastUpdateTime = null;
    this.updateInterval = 2 * 60 * 60 * 1000; // 2시간 (밀리초)
    this.listeners = new Set();
  }

  /**
   * 뉴스 업데이트 리스너 등록
   * @param {Function} listener - 업데이트 콜백 함수
   */
  addUpdateListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * 뉴스 업데이트 리스너 제거
   * @param {Function} listener - 제거할 콜백 함수
   */
  removeUpdateListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * 모든 리스너에게 업데이트 알림
   * @param {Array} news - 업데이트된 뉴스 배열
   */
  notifyListeners(news) {
    this.listeners.forEach(listener => {
      try {
        listener(news);
      } catch (error) {
        logger.error('뉴스 업데이트 리스너 오류:', error);
      }
    });
  }

  /**
   * 뉴스 업데이트 실행
   */
  async updateNews() {
    try {
      logger.info('뉴스 자동 업데이트 시작');
      
      // 기존 캐시 초기화
      clearNewsCache();
      
      // 최신 뉴스 조회
      const latestNews = await getLatestNews();
      
      // 업데이트 시간 기록
      this.lastUpdateTime = new Date();
      
      // 리스너들에게 알림
      this.notifyListeners(latestNews);
      
      logger.info(`뉴스 자동 업데이트 완료: ${latestNews.length}개 기사`);
      
      return latestNews;
    } catch (error) {
      logger.error('뉴스 자동 업데이트 실패:', error);
      return [];
    }
  }

  /**
   * 스케줄러 시작
   */
  start() {
    if (this.isRunning) {
      logger.warn('뉴스 스케줄러가 이미 실행 중입니다');
      return;
    }

    logger.info('뉴스 스케줄러 시작 (2시간 간격)');
    
    // 즉시 첫 번째 업데이트 실행
    this.updateNews();
    
    // 2시간마다 업데이트 실행
    this.intervalId = setInterval(() => {
      this.updateNews();
    }, this.updateInterval);
    
    this.isRunning = true;
  }

  /**
   * 스케줄러 중지
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('뉴스 스케줄러가 실행 중이 아닙니다');
      return;
    }

    logger.info('뉴스 스케줄러 중지');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
  }

  /**
   * 수동 업데이트 트리거
   * @returns {Promise<Array>} 업데이트된 뉴스 배열
   */
  async triggerUpdate() {
    logger.info('수동 뉴스 업데이트 트리거');
    return await this.updateNews();
  }

  /**
   * 스케줄러 상태 조회
   * @returns {Object} 스케줄러 상태 정보
   */
  getStatus() {
    const cacheStats = getNewsCacheStats();
    const nextUpdateTime = this.lastUpdateTime 
      ? new Date(this.lastUpdateTime.getTime() + this.updateInterval)
      : null;

    return {
      isRunning: this.isRunning,
      lastUpdateTime: this.lastUpdateTime,
      nextUpdateTime,
      updateInterval: this.updateInterval,
      listenersCount: this.listeners.size,
      cache: cacheStats
    };
  }

  /**
   * 다음 업데이트까지 남은 시간 (밀리초)
   * @returns {number} 남은 시간 (밀리초)
   */
  getTimeUntilNextUpdate() {
    if (!this.lastUpdateTime) {
      return 0;
    }
    
    const nextUpdate = this.lastUpdateTime.getTime() + this.updateInterval;
    const remaining = nextUpdate - Date.now();
    
    return Math.max(0, remaining);
  }

  /**
   * 다음 업데이트까지 남은 시간 (사람이 읽기 쉬운 형태)
   * @returns {string} 남은 시간 문자열
   */
  getTimeUntilNextUpdateFormatted() {
    const remaining = this.getTimeUntilNextUpdate();
    
    if (remaining === 0) {
      return '업데이트 대기 중';
    }
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 후`;
    } else {
      return `${minutes}분 후`;
    }
  }
}

// 싱글톤 인스턴스 생성
const newsScheduler = new NewsScheduler();

// 자동 시작 (개발 환경에서만)
if (import.meta.env.DEV) {
  // 개발 환경에서는 더 짧은 간격으로 테스트
  newsScheduler.updateInterval = 5 * 60 * 1000; // 5분
  logger.info('개발 환경: 뉴스 업데이트 간격을 5분으로 설정');
}

export default newsScheduler;

// 편의 함수들
export const startNewsScheduler = () => newsScheduler.start();
export const stopNewsScheduler = () => newsScheduler.stop();
export const triggerNewsUpdate = () => newsScheduler.triggerUpdate();
export const getNewsSchedulerStatus = () => newsScheduler.getStatus();
export const addNewsUpdateListener = (listener) => newsScheduler.addUpdateListener(listener);
export const removeNewsUpdateListener = (listener) => newsScheduler.removeUpdateListener(listener);