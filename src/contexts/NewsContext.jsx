/**
 * 뉴스 컨텍스트
 * 전역 뉴스 상태 관리 및 자동 업데이트
 */

import { createContext, useContext, useState, useEffect } from 'react';
import newsScheduler, { addNewsUpdateListener, removeNewsUpdateListener, getNewsSchedulerStatus } from '../services/newsScheduler';
import { getLatestNews as getSourcedNews } from '../services/newsSourcesService';
import { logger } from '../utils/logger';

const NewsContext = createContext();

export function NewsProvider({ children }) {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [schedulerStatus, setSchedulerStatus] = useState(null);

  // 뉴스 업데이트 핸들러
  const handleNewsUpdate = (updatedNews) => {
    logger.info(`뉴스 컨텍스트: ${updatedNews.length}개 뉴스 업데이트됨`);
    setNews(updatedNews);
    setLastUpdateTime(new Date());
    setError(null);
  };

  // 수동 뉴스 새로고침
  const refreshNews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const latestNews = await getSourcedNews();
      setNews(latestNews);
      setLastUpdateTime(new Date());
      
      logger.info(`수동 뉴스 새로고침: ${latestNews.length}개 뉴스`);
    } catch (err) {
      logger.error('수동 뉴스 새로고침 실패:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 스케줄러 상태 업데이트
  const updateSchedulerStatus = () => {
    const status = getNewsSchedulerStatus();
    setSchedulerStatus(status);
  };

  // 초기화 및 스케줄러 시작
  useEffect(() => {
    let mounted = true;

    const initializeNews = async () => {
      try {
        logger.info('뉴스 컨텍스트 초기화 시작');
        
        // 뉴스 업데이트 리스너 등록
        addNewsUpdateListener(handleNewsUpdate);
        
        // 스케줄러 시작
        newsScheduler.start();
        
        // 초기 뉴스 로드
        const initialNews = await getSourcedNews();
        
        if (mounted) {
          setNews(initialNews);
          setLastUpdateTime(new Date());
          setIsLoading(false);
          updateSchedulerStatus();
        }
        
        logger.info(`뉴스 컨텍스트 초기화 완료: ${initialNews.length}개 뉴스`);
      } catch (err) {
        logger.error('뉴스 컨텍스트 초기화 실패:', err);
        if (mounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    initializeNews();

    // 스케줄러 상태 주기적 업데이트
    const statusInterval = setInterval(updateSchedulerStatus, 60000); // 1분마다

    return () => {
      mounted = false;
      removeNewsUpdateListener(handleNewsUpdate);
      clearInterval(statusInterval);
      // 스케줄러는 다른 컴포넌트에서도 사용할 수 있으므로 여기서 중지하지 않음
    };
  }, []);

  const value = {
    // 뉴스 데이터
    news,
    isLoading,
    error,
    lastUpdateTime,
    
    // 스케줄러 정보
    schedulerStatus,
    
    // 액션
    refreshNews,
    updateSchedulerStatus,
    
    // 유틸리티
    getNewsCount: () => news.length,
    getNewsByCategory: (category) => {
      if (!category || category === 'all') return news;
      return news.filter(item => 
        item.category?.toLowerCase().includes(category.toLowerCase()) ||
        item.title?.toLowerCase().includes(category.toLowerCase())
      );
    },
    getLatestNews: (count = 10) => news.slice(0, count),
    
    // 통계
    getStats: () => ({
      totalNews: news.length,
      lastUpdate: lastUpdateTime,
      sources: [...new Set(news.map(item => item.source))],
      categories: [...new Set(news.map(item => item.category))],
      isAutoUpdateActive: schedulerStatus?.isRunning || false,
      nextUpdate: schedulerStatus?.nextUpdateTime || null
    })
  };

  return (
    <NewsContext.Provider value={value}>
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
}

export default NewsContext;