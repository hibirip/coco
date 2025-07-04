import { Link } from 'react-router-dom';
import { usePrices } from '../contexts';
import { CoinTable, MainBanner } from '../components/Common';
import { formatKRW } from '../utils';

export default function HomePage() {
  // PriceContext 훅 사용
  const {
    prices,
    upbitPrices: contextUpbitPrices,
    isConnected,
    upbitIsConnected,
    exchangeRate: contextExchangeRate,
    stats
  } = usePrices();


  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* 메인 배너 섹션 */}
      <MainBanner />

      {/* 인기 코인 섹션 */}
      <div className="bg-section p-6 rounded-lg">
        {/* 섹션 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-primary text-lg">🔥</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">인기 코인</h2>
              <p className="text-sm text-textSecondary">실시간 상위 10개 코인 시세</p>
            </div>
          </div>
          <Link 
            to="/prices" 
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <span className="text-sm font-medium">전체보기</span>
            <span className="text-lg">→</span>
          </Link>
        </div>

        {/* 미니 시세판 */}
        <CoinTable 
          limit={10}
          showKimchi={true}
          showFavorites={false}
          className="mb-4"
        />
      </div>

      {/* 각 페이지 프리뷰 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PricesPage 프리뷰 */}
        <div className="bg-section p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-400 text-lg">📊</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-text">실시간 시세</h3>
              <p className="text-sm text-textSecondary">전체 코인 시세판</p>
            </div>
          </div>
          <p className="text-textSecondary mb-4">
            실시간 가격, 검색, 정렬, 필터 기능을 통해 원하는 코인을 빠르게 찾아보세요.
          </p>
          <Link 
            to="/prices" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <span className="text-sm font-medium">바로가기</span>
            <span>→</span>
          </Link>
        </div>

        {/* KimchiPage 프리뷰 */}
        <div className="bg-section p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <span className="text-red-400 text-lg">🌶️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-text">김치프리미엄</h3>
              <p className="text-sm text-textSecondary">가격 차이 분석</p>
            </div>
          </div>
          <p className="text-textSecondary mb-4">
            국내외 거래소 가격 차이를 실시간으로 분석하여 차익거래 기회를 발견하세요.
          </p>
          <Link 
            to="/kimchi" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <span className="text-sm font-medium">바로가기</span>
            <span>→</span>
          </Link>
        </div>

        {/* NewsPage 프리뷰 */}
        <div className="bg-section p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-400 text-lg">📰</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-text">암호화폐 뉴스</h3>
              <p className="text-sm text-textSecondary">최신 소식</p>
            </div>
          </div>
          <p className="text-textSecondary mb-4">
            암호화폐 시장의 최신 뉴스와 분석을 통해 시장 트렌드를 파악하세요.
          </p>
          <Link 
            to="/news" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <span className="text-sm font-medium">바로가기</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* 실시간 데이터 상태 확인 */}
      <div className="bg-section p-6 rounded-lg">
        <h2 className="text-xl font-bold text-primary mb-4">실시간 데이터 상태</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg">
            <h3 className="font-medium text-text mb-2">환율 정보</h3>
            <div className="space-y-1 text-sm">
              <p>현재 환율: <span className="text-primary font-medium">
                {contextExchangeRate ? `₩${contextExchangeRate.toLocaleString()}` : '로딩 중...'}
              </span></p>
              <p>연결 상태: <span className={`${contextExchangeRate ? 'text-success' : 'text-warning'}`}>
                {contextExchangeRate ? '정상' : '대기 중'}
              </span></p>
            </div>
          </div>
          
          <div className="bg-card p-4 rounded-lg">
            <h3 className="font-medium text-text mb-2">가격 데이터</h3>
            <div className="space-y-1 text-sm">
              <p>Bitget: <span className="text-primary">{Object.keys(prices).length}개</span></p>
              <p>업비트: <span className="text-primary">{Object.keys(contextUpbitPrices).length}개</span></p>
              <p>연결: <span className={`${isConnected ? 'text-success' : 'text-warning'}`}>
                {isConnected ? 'Bitget ✓' : 'Bitget ✗'} {upbitIsConnected ? 'Upbit ✓' : 'Upbit ✗'}
              </span></p>
            </div>
          </div>
          
          <div className="bg-card p-4 rounded-lg">
            <h3 className="font-medium text-text mb-2">김치프리미엄</h3>
            <div className="space-y-1 text-sm">
              <p>계산 가능: <span className="text-primary">{stats.kimchiPremiumCount}개</span></p>
              <p>상태: <span className={`${stats.kimchiPremiumCount > 0 ? 'text-success' : 'text-warning'}`}>
                {stats.kimchiPremiumCount > 0 ? '정상 계산' : '데이터 대기'}
              </span></p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}