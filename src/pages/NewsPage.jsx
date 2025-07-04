/**
 * NewsPage - 암호화폐 뉴스 페이지
 * 헤드라인 뉴스, 뉴스 그리드, Twitter 피드 제공
 */

import { useState, useEffect } from 'react';
import { getLatestNews, getHeadlineNews, getTwitterFeeds } from '../services/news';

export default function NewsPage() {
  const [headlineNews, setHeadlineNews] = useState(null);
  const [newsList, setNewsList] = useState([]);
  const [twitterFeeds, setTwitterFeeds] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 데이터 로딩
  useEffect(() => {
    loadNewsData();
  }, []);

  const loadNewsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 병렬로 데이터 로딩
      const [headline, news, tweets] = await Promise.all([
        getHeadlineNews(),
        getLatestNews({ limit: 8 }),
        getTwitterFeeds()
      ]);

      setHeadlineNews(headline);
      setNewsList(news);
      setTwitterFeeds(tweets);

    } catch (err) {
      console.error('뉴스 데이터 로딩 오류:', err);
      setError('뉴스를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 북마크 토글
  const toggleBookmark = (newsId) => {
    setBookmarks(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(newsId)) {
        newBookmarks.delete(newsId);
      } else {
        newBookmarks.add(newsId);
      }
      return newBookmarks;
    });
  };

  // 공유 기능
  const shareNews = async (news) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: news.title,
          text: news.summary,
          url: news.url
        });
      } else {
        // 폴백: 클립보드에 복사
        await navigator.clipboard.writeText(news.url);
        alert('링크가 클립보드에 복사되었습니다!');
      }
    } catch (error) {
      console.error('공유 실패:', error);
    }
  };

  // 시간 포맷
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    return time.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-section p-8 rounded-lg text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-textSecondary">뉴스를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-section p-8 rounded-lg text-center">
          <p className="text-danger mb-4">{error}</p>
          <button
            onClick={loadNewsData}
            className="px-4 py-2 bg-primary text-background rounded hover:bg-primary/80 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* 페이지 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text mb-2">암호화폐 뉴스</h1>
        <p className="text-textSecondary">최신 블록체인 및 암호화폐 소식을 한눈에</p>
      </div>

      {/* 헤드라인 뉴스 (빅 뉴스) */}
      {headlineNews && (
        <section className="bg-section rounded-lg overflow-hidden shadow-lg">
          <div className="md:flex">
            {/* 이미지 */}
            <div className="md:w-1/2">
              <img
                src={headlineNews.imageUrl}
                alt={headlineNews.title}
                className="w-full h-64 md:h-full object-cover"
              />
            </div>
            
            {/* 콘텐츠 */}
            <div className="md:w-1/2 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-danger text-background px-2 py-1 rounded text-xs font-medium">
                  헤드라인
                </span>
                <span className="text-textSecondary text-sm">
                  {formatTimeAgo(headlineNews.publishedAt)}
                </span>
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold text-text mb-3 line-clamp-2">
                {headlineNews.title}
              </h2>
              
              <p className="text-textSecondary mb-4 line-clamp-3">
                {headlineNews.summary}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-textSecondary">
                    {headlineNews.author}
                  </span>
                  <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs">
                    {headlineNews.category}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBookmark(headlineNews.id)}
                    className={`p-2 rounded hover:bg-card transition-colors ${
                      bookmarks.has(headlineNews.id) ? 'text-warning' : 'text-textSecondary'
                    }`}
                  >
                    {bookmarks.has(headlineNews.id) ? '★' : '☆'}
                  </button>
                  <button
                    onClick={() => shareNews(headlineNews)}
                    className="p-2 rounded hover:bg-card transition-colors text-textSecondary hover:text-text"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 메인 콘텐츠 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 뉴스 그리드 (좌측 2/3) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text">최신 뉴스</h2>
            <button
              onClick={loadNewsData}
              className="text-primary hover:text-primary/80 text-sm transition-colors"
            >
              새로고침
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {newsList.map((news) => (
              <article
                key={news.id}
                className="bg-section rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={news.imageUrl}
                  alt={news.title}
                  className="w-full h-48 object-cover"
                />
                
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs">
                      {news.category}
                    </span>
                    <span className="text-textSecondary text-xs">
                      {formatTimeAgo(news.publishedAt)}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-text mb-2 line-clamp-2">
                    {news.title}
                  </h3>
                  
                  <p className="text-textSecondary text-sm mb-3 line-clamp-2">
                    {news.summary}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-textSecondary">
                      {news.author} · {news.readTime}분 읽기
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleBookmark(news.id)}
                        className={`p-1 rounded hover:bg-card transition-colors ${
                          bookmarks.has(news.id) ? 'text-warning' : 'text-textSecondary'
                        }`}
                      >
                        {bookmarks.has(news.id) ? '★' : '☆'}
                      </button>
                      <button
                        onClick={() => shareNews(news)}
                        className="p-1 rounded hover:bg-card transition-colors text-textSecondary hover:text-text"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Twitter 피드 (우측 1/3) */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-text mb-6">인플루언서 피드</h2>
          
          <div className="space-y-4">
            {twitterFeeds.map((tweet) => (
              <div
                key={tweet.id}
                className="bg-section rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={tweet.user.avatar}
                    alt={tweet.user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="font-medium text-text text-sm">
                        {tweet.user.name}
                      </span>
                      {tweet.user.verified && (
                        <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      )}
                      <span className="text-textSecondary text-xs">
                        @{tweet.user.username}
                      </span>
                    </div>
                    
                    <p className="text-text text-sm mb-2">
                      {tweet.content}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-textSecondary">
                      <span>{formatTimeAgo(tweet.timestamp)}</span>
                      <span>{tweet.likes.toLocaleString()} 좋아요</span>
                      <span>{tweet.retweets.toLocaleString()} 리트윗</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-6">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 text-sm transition-colors"
            >
              더 많은 피드 보기 →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}