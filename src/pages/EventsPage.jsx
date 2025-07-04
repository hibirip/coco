import { useState } from 'react';
import { MainBanner } from '../components/Common';

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const eventData = [
    {
      id: 1,
      thumbnail: "🎉",
      title: "신규 코인 상장 이벤트",
      description: "새로운 암호화폐가 거래소에 상장됩니다. 더 많은 거래 기회를 잡으세요...",
      fullContent: `새로운 암호화폐가 거래소에 상장됩니다!

이번에 상장되는 코인들:
• ABC 코인 - 혁신적인 DeFi 프로토콜
• XYZ 토큰 - 차세대 스마트 컨트랙트 플랫폼
• DEF 토큰 - 메타버스 생태계 구축

상장일정:
• 1단계: 예약주문 시작 (2024.01.15)
• 2단계: 정식 거래 시작 (2024.01.20)

더 많은 거래 기회를 놓치지 마세요!`,
      date: "2024.01.15"
    },
    {
      id: 2,
      thumbnail: "💰",
      title: "김치프리미엄 특별 분석",
      description: "이번 주 김치프리미엄 동향과 투자 전략을 상세히 분석해드립니다...",
      fullContent: `이번 주 김치프리미엄 특별 분석

주요 분석 포인트:
• 비트코인 김치프리미엄: +3.2%
• 이더리움 김치프리미엄: +2.8%
• 알트코인 평균 프리미엄: +4.1%

투자 전략:
1. 프리미엄이 높은 코인 매도 타이밍
2. 역프리미엄 코인 매수 기회 분석
3. 환율 변동성을 고려한 헤지 전략

전문가 의견과 함께 상세한 분석을 확인해보세요.`,
      date: "2024.01.12"
    },
    {
      id: 3,
      thumbnail: "🔔",
      title: "실시간 알림 서비스 출시",
      description: "원하는 가격에 도달하면 즉시 알려드리는 새로운 알림 서비스가 출시되었습니다...",
      fullContent: `실시간 알림 서비스가 출시되었습니다!

주요 기능:
• 가격 도달 알림
• 김치프리미엄 변동 알림  
• 거래량 급증 알림
• 뉴스 속보 알림

설정 방법:
1. 마이페이지 접속
2. 알림 설정 메뉴 선택
3. 원하는 조건 입력
4. 알림 받을 방법 선택 (이메일/SMS)

지금 바로 설정하고 투자 기회를 놓치지 마세요!`,
      date: "2024.01.10"
    },
    {
      id: 4,
      thumbnail: "📈",
      title: "1월 시장 전망 리포트",
      description: "2024년 1월 암호화폐 시장 전망과 주목해야 할 코인들을 정리했습니다...",
      fullContent: `2024년 1월 암호화폐 시장 전망

시장 전망:
• 전체 시장: 상승 전환점 예상
• 비트코인: $50,000 돌파 가능성
• 알트시즌: 2분기 본격화 예측

주목 코인:
1. 비트코인 (BTC) - 기관투자 증가
2. 이더리움 (ETH) - 업그레이드 기대감
3. 솔라나 (SOL) - 생태계 확장
4. 체인링크 (LINK) - 오라클 수요 증가

투자 전략:
• 단계적 매수 전략 추천
• 리스크 관리 중요성
• 장기 관점 유지

상세한 분석과 투자 가이드를 확인해보세요.`,
      date: "2024.01.08"
    },
    {
      id: 5,
      thumbnail: "⚡",
      title: "거래 수수료 할인 이벤트",
      description: "2월까지 모든 거래 수수료를 50% 할인해드립니다. 이 기회를 놓치지 마세요...",
      fullContent: `거래 수수료 50% 할인 이벤트!

이벤트 기간:
• 시작: 2024년 1월 1일
• 종료: 2024년 2월 29일

할인 혜택:
• 현물 거래: 수수료 50% 할인
• 선물 거래: 수수료 30% 할인
• 마진 거래: 수수료 40% 할인

참여 방법:
1. 회원가입 및 로그인
2. 자동으로 할인 적용
3. 별도 신청 불필요

추가 혜택:
• 신규 회원: 추가 10% 할인
• VIP 회원: 추가 20% 할인

지금 바로 거래를 시작하고 수수료를 절약하세요!`,
      date: "2024.01.01"
    },
    {
      id: 6,
      thumbnail: "🎯",
      title: "투자 교육 프로그램",
      description: "초보자를 위한 암호화폐 투자 교육 프로그램이 시작됩니다. 무료로 참여하세요...",
      fullContent: `암호화폐 투자 교육 프로그램

프로그램 구성:
• 1주차: 암호화폐 기초 지식
• 2주차: 차트 분석 기법
• 3주차: 리스크 관리 전략
• 4주차: 실전 투자 시뮬레이션

교육 방식:
• 온라인 라이브 강의
• 실시간 Q&A 세션
• 개인별 맞춤 피드백
• 커뮤니티 토론

참여 혜택:
• 교육 자료 무료 제공
• 전문가 1:1 상담 기회
• 수료증 발급
• 투자 시드머니 지원

신청 방법:
1. 교육 페이지 접속
2. 신청서 작성 및 제출
3. 확인 메일 수신
4. 교육 일정 안내

지금 신청하고 성공적인 투자를 시작하세요!`,
      date: "2024.01.05"
    },
    {
      id: 7,
      thumbnail: "🌟",
      title: "VIP 회원 전용 혜택",
      description: "VIP 회원을 위한 특별한 혜택들을 준비했습니다. 프리미엄 서비스를 경험해보세요...",
      fullContent: `VIP 회원 전용 특별 혜택

VIP 등급별 혜택:
• 골드: 수수료 10% 할인, 전용 고객센터
• 플래티넘: 수수료 20% 할인, 투자 리포트 제공
• 다이아몬드: 수수료 30% 할인, 1:1 전담 매니저

추가 서비스:
• 프리미엄 시장 분석 리포트
• 전문가 투자 상담 서비스
• 신규 상장 코인 사전 정보
• 특별 이벤트 우선 참여권

VIP 승급 조건:
• 골드: 월 거래량 1억원 이상
• 플래티넘: 월 거래량 5억원 이상
• 다이아몬드: 월 거래량 10억원 이상

혜택 신청:
1. 마이페이지에서 등급 확인
2. VIP 혜택 신청하기
3. 자동으로 혜택 적용

프리미엄 서비스로 더 나은 투자 경험을 만나보세요!`,
      date: "2024.01.03"
    },
    {
      id: 8,
      thumbnail: "📱",
      title: "모바일 앱 업데이트",
      description: "더욱 편리해진 모바일 앱의 새로운 기능들을 만나보세요. 지금 업데이트하세요...",
      fullContent: `모바일 앱 대폭 업데이트!

새로운 기능:
• 간편 로그인 (생체인증 지원)
• 실시간 푸시 알림 개선
• 차트 분석 도구 추가
• 원터치 주문 기능

개선사항:
• 앱 실행 속도 50% 향상
• 배터리 사용량 30% 절약
• UI/UX 전면 개선
• 안정성 대폭 향상

추가 혜택:
• 앱 전용 할인 쿠폰
• 모바일 한정 이벤트
• 간편 입출금 서비스

업데이트 방법:
1. 앱스토어/플레이스토어 접속
2. Coco 앱 검색
3. 업데이트 버튼 클릭
4. 자동 설치 완료

더 편리하고 빠른 모바일 거래를 경험해보세요!`,
      date: "2024.01.07"
    },
    {
      id: 9,
      thumbnail: "🎁",
      title: "신규 회원 가입 이벤트",
      description: "새로 가입하시는 분들께 특별한 혜택을 드립니다. 지금 가입하고 혜택을 받으세요...",
      fullContent: `신규 회원 특별 혜택!

가입 즉시 혜택:
• 회원가입 축하금 10,000원
• 첫 거래 수수료 100% 면제
• 투자 가이드북 무료 제공
• 전문가 상담 1회 무료

단계별 리워드:
• 1단계: 본인인증 완료 → 5,000원 추가
• 2단계: 첫 입금 완료 → 10,000원 추가  
• 3단계: 첫 거래 완료 → 20,000원 추가
• 4단계: 친구 초대 → 30,000원 추가

특별 혜택:
• 30일간 VIP 체험권
• 프리미엄 알림 서비스 1개월 무료
• 전용 커뮤니티 참여권

가입 방법:
1. 홈페이지 회원가입 클릭
2. 개인정보 입력 및 본인인증
3. 이메일 인증 완료
4. 자동으로 혜택 지급

지금 가입하고 최대 75,000원 혜택을 받아보세요!`,
      date: "2024.01.02"
    }
  ];

  const openModal = (event) => {
    setSelectedEvent(event);
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* 홈페이지와 동일한 배너 */}
      <MainBanner />

      {/* 3x3 이벤트 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventData.map((event) => (
          <div 
            key={event.id}
            onClick={() => openModal(event)}
            className="bg-section p-6 rounded-lg border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-105"
          >
            {/* 썸네일 */}
            <div className="text-4xl mb-4 text-center">
              {event.thumbnail}
            </div>
            
            {/* 제목 */}
            <h3 className="text-lg font-bold text-text mb-3 text-center">
              {event.title}
            </h3>
            
            {/* 내용 2줄 + 더보기 */}
            <p className="text-textSecondary text-sm leading-relaxed mb-4">
              {event.description}
            </p>
            
            {/* 날짜와 더보기 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-textSecondary">{event.date}</span>
              <span className="text-primary text-sm font-medium hover:text-primary/80 transition-colors">
                더보기 →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 팝업 모달 */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{selectedEvent.thumbnail}</span>
                  <div>
                    <h2 className="text-xl font-bold text-text">{selectedEvent.title}</h2>
                    <p className="text-sm text-textSecondary">{selectedEvent.date}</p>
                  </div>
                </div>
                <button 
                  onClick={closeModal}
                  className="text-textSecondary hover:text-text transition-colors text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* 모달 내용 */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="whitespace-pre-line text-text leading-relaxed">
                {selectedEvent.fullContent}
              </div>
            </div>
            
            {/* 모달 푸터 */}
            <div className="p-6 border-t border-border">
              <button 
                onClick={closeModal}
                className="w-full bg-primary hover:bg-primary/80 text-background py-3 rounded-lg font-medium transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}