/**
 * EventsPreview - 홈페이지용 이벤트 미리보기 컴포넌트
 * 최신 이벤트를 카드 형태로 표시
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function EventsPreview() {
  // 이벤트 데이터 (EventsPage와 동일한 데이터 사용)
  const eventData = [
    {
      id: 1,
      thumbnail: "🎉",
      title: "신규 코인 상장 이벤트",
      description: "새로운 암호화폐가 거래소에 상장됩니다. 더 많은 거래 기회를 잡으세요...",
      date: "2024.01.15",
      status: "진행중",
      category: "상장"
    },
    {
      id: 2,
      thumbnail: "💰",
      title: "김치프리미엄 특별 분석",
      description: "이번 주 김치프리미엄 동향과 투자 전략을 상세히 분석해드립니다...",
      date: "2024.01.12",
      status: "완료",
      category: "분석"
    },
    {
      id: 3,
      thumbnail: "🔔",
      title: "실시간 알림 서비스 출시",
      description: "원하는 코인의 가격 변동을 실시간으로 알려드립니다...",
      date: "2024.01.10",
      status: "진행중",
      category: "서비스"
    }
  ];

  // 3개의 최신 이벤트만 표시
  const previewEvents = eventData.slice(0, 3);

  return (
    <div className="bg-section p-4 md:p-6 rounded-lg">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text">참여가능한 이벤트</h2>
        <Link 
          to="/events" 
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <span className="text-sm font-medium">더보기</span>
          <span className="text-lg">→</span>
        </Link>
      </div>

      {/* 이벤트 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {previewEvents.map((event) => (
          <div 
            key={event.id} 
            className="bg-card p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer group"
          >
            {/* 이벤트 썸네일 */}
            <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded mb-3 flex items-center justify-center">
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                {event.thumbnail}
              </span>
            </div>

            {/* 이벤트 내용 */}
            <div className="space-y-2">
              {/* 상태 및 카테고리 */}
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  event.status === '진행중' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {event.status}
                </span>
                <span className="text-textSecondary">
                  {event.category}
                </span>
              </div>

              {/* 제목 */}
              <h3 className="font-medium text-text text-sm overflow-hidden group-hover:text-primary transition-colors" style={{ display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}>
                {event.title}
              </h3>

              {/* 설명 */}
              <p className="text-xs text-textSecondary overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}>
                {event.description}
              </p>

              {/* 날짜 */}
              <div className="flex items-center justify-between text-xs text-textSecondary pt-2 border-t border-border">
                <span>이벤트 일시</span>
                <span className="font-medium">{event.date}</span>
              </div>
            </div>

            {/* 참여하기 버튼 */}
            <div className="mt-3 pt-3 border-t border-border">
              <Link 
                to="/events"
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <span>자세히 보기</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 데이터 없음 상태 */}
      {previewEvents.length === 0 && (
        <div className="text-center py-8">
          <p className="text-textSecondary">진행 중인 이벤트가 없습니다.</p>
        </div>
      )}
    </div>
  );
}