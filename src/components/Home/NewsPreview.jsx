/**
 * NewsPreview - 홈페이지용 뉴스 미리보기 컴포넌트
 * 최신 암호화폐 뉴스를 카드 형태로 표시
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLatestNews } from '../../services/news';

export default function NewsPreview() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNewsData();
  }, []);

  const loadNewsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 4개의 최신 뉴스만 가져오기
      const news = await getLatestNews({ limit: 4 });
      setNewsList(news);
    } catch (err) {
      console.error('뉴스 데이터 로딩 오류:', err);
      setError('뉴스를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 로딩 중 스켈레톤 UI
  if (loading) {
    return (
      <div className="bg-section p-4 md:p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text">실시간 암호화폐 뉴스</h2>
          <div className="w-16 h-4 bg-border rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-card p-4 rounded-lg border border-border animate-pulse">
              <div className="w-full h-32 bg-border rounded mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-border rounded w-full"></div>
                <div className="h-4 bg-border rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 오류 상태
  if (error) {
    return (
      <div className="bg-section p-4 md:p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text">실시간 암호화폐 뉴스</h2>
          <Link 
            to="/news" 
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <span className="text-sm font-medium">더보기</span>
            <span className="text-lg">→</span>
          </Link>
        </div>
        <div className="text-center py-8">
          <p className="text-textSecondary mb-4">{error}</p>
          <button 
            onClick={loadNewsData}
            className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/80 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-section p-4 md:p-6 rounded-lg">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text">실시간 암호화폐 뉴스</h2>
        <Link 
          to="/news" 
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <span className="text-sm font-medium">더보기</span>
          <span className="text-lg">→</span>
        </Link>
      </div>

      {/* 뉴스 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {newsList.map((news) => (
          <div 
            key={news.id} 
            className="bg-card p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => window.open(news.url, '_blank')}
          >
            {/* 뉴스 이미지 */}
            <div className="w-full h-32 bg-border rounded mb-3 flex items-center justify-center overflow-hidden relative">
              {news.imageUrl ? (
                <img 
                  src={news.imageUrl} 
                  alt={news.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center" style={{ display: news.imageUrl ? 'none' : 'flex' }}>
                <span className="text-2xl">📰</span>
              </div>
              
              {/* 사진 검색 표시 */}
              {news.photoSearched && (
                <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                  📷
                </div>
              )}
            </div>

            {/* 뉴스 내용 */}
            <div className="space-y-2">
              <h3 className="font-medium text-text text-sm overflow-hidden group-hover:text-primary transition-colors" style={{ display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}>
                {news.title}
              </h3>
              <p className="text-xs text-textSecondary overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}>
                {news.description || news.content}
              </p>
              <div className="flex items-center justify-between text-xs text-textSecondary">
                <span className="font-medium">{news.source}</span>
                <span>{news.publishedAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 데이터 없음 상태 */}
      {newsList.length === 0 && !loading && !error && (
        <div className="text-center py-8">
          <p className="text-textSecondary">표시할 뉴스가 없습니다.</p>
        </div>
      )}
    </div>
  );
}