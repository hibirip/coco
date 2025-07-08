import { Link } from 'react-router-dom';
import { usePrices } from '../contexts';
import { CoinTable, MainBanner, MarketIndicators } from '../components/Common';
import { NewsPreview, EventsPreview } from '../components/Home';
import { formatKRW } from '../utils';
import { TrendingUp, Activity, BookOpen, DollarSign, BarChart3, Zap } from 'lucide-react';

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

  // 서비스 카드 데이터
  const serviceCards = [
    {
      id: 'mock-trading',
      icon: <TrendingUp className="w-6 h-6" />,
      title: '모의투자',
      subtitle: '가상 투자 연습',
      description: '1,000만원 가상 자금으로 실전 같은 투자 경험을 쌓아보세요.',
      path: '/mock-trading',
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-500/20 to-teal-500/20',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400'
    },
    {
      id: 'prices',
      icon: <Activity className="w-6 h-6" />,
      title: '실시간 시세',
      subtitle: '전체 코인 시세판',
      description: '실시간 가격, 검색, 정렬, 필터 기능을 통해 원하는 코인을 빠르게 찾아보세요.',
      path: '/prices',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/20 to-cyan-500/20',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400'
    },
    {
      id: 'news',
      icon: <BookOpen className="w-6 h-6" />,
      title: '암호화폐 뉴스',
      subtitle: '최신 소식',
      description: '암호화폐 시장의 최신 뉴스와 분석을 통해 시장 트렌드를 파악하세요.',
      path: '/news',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/20 to-pink-500/20',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400'
    }
  ];

  const ServiceCard = ({ card }) => (
    <div className="group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className={`relative bg-gradient-to-br ${card.bgGradient} backdrop-blur-xl rounded-2xl p-6 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-${card.gradient.split(' ')[1].replace('to-', '')}/20 group-hover:scale-[1.02] transform`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <span className={`${card.iconColor} group-hover:text-white transition-colors duration-300`}>
              {card.icon}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-white transition-colors duration-300">
              {card.title}
            </h3>
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
              {card.subtitle}
            </p>
          </div>
        </div>
        <p className="text-gray-300 mb-6 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
          {card.description}
        </p>
        <Link 
          to={card.path} 
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${card.gradient} text-white font-medium hover:shadow-lg hover:shadow-${card.gradient.split(' ')[1].replace('to-', '')}/30 transition-all duration-300 group-hover:scale-105 transform`}
        >
          <span>바로가기</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-3 py-4 space-y-8 md:px-4 md:py-8 md:space-y-12">
      {/* 메인 배너 섹션 */}
      <div className="animate-fade-in-up">
        <MainBanner />
      </div>

      {/* 시장 지표 섹션 */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <MarketIndicators />
      </div>

      {/* 인기 코인 섹션 - 헤더 없이 */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <CoinTable 
          limit={10}
          showKimchi={true}
          showFavorites={false}
          showHeader={false}
          className="mb-4"
          showFooterLink={true}
        />
      </div>

      {/* 서비스 카드 섹션 - 완전히 새로운 디자인 */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">주요 서비스</h2>
          <p className="text-gray-400">코인덱스의 다양한 서비스를 만나보세요</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {serviceCards.map((card, index) => (
            <div key={card.id} className="animate-fade-in-up" style={{ animationDelay: `${0.4 + index * 0.1}s` }}>
              <ServiceCard card={card} />
            </div>
          ))}
        </div>
      </div>

      {/* 뉴스 미리보기 섹션 */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
        <NewsPreview />
      </div>

      {/* 이벤트 미리보기 섹션 */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
        <EventsPreview />
      </div>

      {/* 실시간 데이터 상태 확인 - 개선된 디자인 */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">실시간 데이터 상태</h2>
              <p className="text-sm text-gray-400">시스템 연결 상태를 확인하세요</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="font-medium text-white">가격 데이터</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Bitget:</span>
                  <span className="text-blue-400 font-medium">{Object.keys(prices).length}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">업비트:</span>
                  <span className="text-blue-400 font-medium">{Object.keys(contextUpbitPrices).length}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">연결:</span>
                  <span className={`font-medium ${isConnected && upbitIsConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isConnected ? 'Bitget ✓' : 'Bitget ✗'} {upbitIsConnected ? 'Upbit ✓' : 'Upbit ✗'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="font-medium text-white">김치프리미엄</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">계산 가능:</span>
                  <span className="text-purple-400 font-medium">{stats.kimchiPremiumCount}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">상태:</span>
                  <span className={`font-medium ${stats.kimchiPremiumCount > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {stats.kimchiPremiumCount > 0 ? '정상 계산' : '데이터 대기'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}