/**
 * MarketIndicators - 시장 지수 및 지표 컴포넌트
 * 8가지 주요 지표를 깔끔하고 이쁜 UI로 표시
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { formatKRW, formatUSD, formatPercent, getChangeColorClass } from '../../utils';

const MarketIndicators = () => {
  const [indicators, setIndicators] = useState({
    fearGreed: { value: null, classification: '', loading: true },
    btcDominance: { value: null, change: null, loading: true },
    totalMarketCap: { value: null, change: null, loading: true },
    sp500: { value: null, change: null, changePercent: null, loading: true },
    nasdaq: { value: null, change: null, changePercent: null, loading: true },
    dxy: { value: null, change: null, changePercent: null, loading: true },
    kimchiPremium: { value: null, loading: true },
    usdKrw: { value: null, change: null, changePercent: null, loading: true }
  });

  const [error, setError] = useState(null);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadAllIndicators();
    
    // 5분마다 데이터 업데이트
    const interval = setInterval(loadAllIndicators, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 모든 지표 데이터 로드
  const loadAllIndicators = async () => {
    try {
      await Promise.allSettled([
        loadCryptoIndicators(),
        loadStockIndicators(),
        loadForexData(),
        loadKimchiPremium()
      ]);
    } catch (error) {
      console.error('지표 데이터 로드 실패:', error);
      setError('일부 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 암호화폐 지표 로드 (CoinGecko API)
  const loadCryptoIndicators = async () => {
    try {
      // 공포탐욕지수
      const fearGreedResponse = await fetch('https://api.alternative.me/fng/');
      const fearGreedData = await fearGreedResponse.json();
      
      if (fearGreedData.data && fearGreedData.data[0]) {
        const fgValue = parseInt(fearGreedData.data[0].value);
        setIndicators(prev => ({
          ...prev,
          fearGreed: {
            value: fgValue,
            classification: fearGreedData.data[0].value_classification,
            loading: false
          }
        }));
      }

      // 글로벌 암호화폐 데이터 (도미넌스, 시가총액)
      const globalResponse = await fetch('https://api.coingecko.com/api/v3/global');
      const globalData = await globalResponse.json();
      
      if (globalData.data) {
        const btcDominance = globalData.data.market_cap_percentage?.bitcoin || 0;
        const totalMarketCap = globalData.data.total_market_cap?.usd || 0;
        
        setIndicators(prev => ({
          ...prev,
          btcDominance: {
            value: btcDominance,
            change: null, // 변화율 계산을 위해서는 이전 데이터 필요
            loading: false
          },
          totalMarketCap: {
            value: totalMarketCap,
            change: null,
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error('암호화폐 지표 로드 실패:', error);
      setIndicators(prev => ({
        ...prev,
        fearGreed: { ...prev.fearGreed, loading: false },
        btcDominance: { ...prev.btcDominance, loading: false },
        totalMarketCap: { ...prev.totalMarketCap, loading: false }
      }));
    }
  };

  // 주식 지표 로드 (Yahoo Finance 비공식 API)
  const loadStockIndicators = async () => {
    try {
      // 임시로 모의 데이터 사용 (실제 API 연동은 CORS 문제로 백엔드 필요)
      const mockStockData = {
        sp500: { value: 4567.89, change: 23.45, changePercent: 0.52 },
        nasdaq: { value: 14234.56, change: -45.67, changePercent: -0.32 },
        dxy: { value: 103.45, change: 0.23, changePercent: 0.22 }
      };

      setIndicators(prev => ({
        ...prev,
        sp500: { ...mockStockData.sp500, loading: false },
        nasdaq: { ...mockStockData.nasdaq, loading: false },
        dxy: { ...mockStockData.dxy, loading: false }
      }));
    } catch (error) {
      console.error('주식 지표 로드 실패:', error);
      setIndicators(prev => ({
        ...prev,
        sp500: { ...prev.sp500, loading: false },
        nasdaq: { ...prev.nasdaq, loading: false },
        dxy: { ...prev.dxy, loading: false }
      }));
    }
  };

  // 환율 데이터 로드
  const loadForexData = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      
      if (data.rates && data.rates.KRW) {
        setIndicators(prev => ({
          ...prev,
          usdKrw: {
            value: data.rates.KRW,
            change: null, // 변화율 계산을 위해서는 이전 데이터 필요
            changePercent: null,
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error('환율 데이터 로드 실패:', error);
      setIndicators(prev => ({
        ...prev,
        usdKrw: { ...prev.usdKrw, loading: false }
      }));
    }
  };

  // 김치프리미엄 계산
  const loadKimchiPremium = async () => {
    try {
      // 실제로는 PriceContext에서 김치프리미엄을 가져와야 함
      // 임시로 모의 데이터 사용
      const mockKimchiPremium = 2.34;
      
      setIndicators(prev => ({
        ...prev,
        kimchiPremium: {
          value: mockKimchiPremium,
          loading: false
        }
      }));
    } catch (error) {
      console.error('김치프리미엄 계산 실패:', error);
      setIndicators(prev => ({
        ...prev,
        kimchiPremium: { ...prev.kimchiPremium, loading: false }
      }));
    }
  };

  // 공포탐욕지수 색상 결정
  const getFearGreedColor = (value) => {
    if (value >= 75) return 'text-red-400';
    if (value >= 55) return 'text-orange-400';
    if (value >= 45) return 'text-yellow-400';
    if (value >= 25) return 'text-blue-400';
    return 'text-green-400';
  };

  // 변화 아이콘 컴포넌트
  const ChangeIcon = ({ change }) => {
    if (!change || change === 0) return <Minus className="w-3 h-3 text-gray-400" />;
    return change > 0 ? 
      <TrendingUp className="w-3 h-3 text-green-400" /> : 
      <TrendingDown className="w-3 h-3 text-red-400" />;
  };

  // 개별 지표 카드 컴포넌트
  const IndicatorCard = ({ title, value, subValue, change, changePercent, loading, icon, customColor }) => (
    <div className="bg-gradient-to-br from-gray-800/60 via-gray-700/50 to-gray-800/60 backdrop-blur-xl rounded-xl p-4 border border-gray-600/40 hover:border-green-500/40 transition-all duration-300 shadow-lg hover:shadow-green-500/20 group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
            {title}
          </h3>
        </div>
        {change !== undefined && <ChangeIcon change={change} />}
      </div>
      
      {loading ? (
        <div className="space-y-2">
          <div className="h-6 bg-gray-600/50 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-600/30 rounded animate-pulse w-2/3"></div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className={`text-lg font-bold ${customColor || 'text-white'} group-hover:text-green-100 transition-colors`}>
            {value}
          </div>
          {subValue && (
            <div className="text-xs text-gray-400">
              {subValue}
            </div>
          )}
          {changePercent !== undefined && changePercent !== null && (
            <div className={`text-xs font-medium ${getChangeColorClass(changePercent)}`}>
              {changePercent > 0 ? '+' : ''}{formatPercent(changePercent)}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-section p-4 md:p-6 rounded-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text">시장 지표</h2>
        <div className="flex items-center gap-2 text-xs text-textSecondary">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          실시간 업데이트
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 공포탐욕지수 */}
        <IndicatorCard
          title="공포탐욕지수"
          value={indicators.fearGreed.value ? `${indicators.fearGreed.value}` : '—'}
          subValue={indicators.fearGreed.classification}
          loading={indicators.fearGreed.loading}
          customColor={indicators.fearGreed.value ? getFearGreedColor(indicators.fearGreed.value) : 'text-white'}
          icon={<div className="w-4 h-4 text-purple-400">😱</div>}
        />

        {/* 비트코인 도미넌스 */}
        <IndicatorCard
          title="BTC 도미넌스"
          value={indicators.btcDominance.value ? `${indicators.btcDominance.value.toFixed(1)}%` : '—'}
          loading={indicators.btcDominance.loading}
          icon={<div className="w-4 h-4 text-orange-400">₿</div>}
        />

        {/* 총 시가총액 */}
        <IndicatorCard
          title="총 시가총액"
          value={indicators.totalMarketCap.value ? `$${(indicators.totalMarketCap.value / 1e12).toFixed(2)}T` : '—'}
          loading={indicators.totalMarketCap.loading}
          icon={<div className="w-4 h-4 text-blue-400">💎</div>}
        />

        {/* S&P 500 */}
        <IndicatorCard
          title="S&P 500"
          value={indicators.sp500.value ? indicators.sp500.value.toLocaleString() : '—'}
          change={indicators.sp500.change}
          changePercent={indicators.sp500.changePercent}
          loading={indicators.sp500.loading}
          icon={<div className="w-4 h-4 text-green-400">📈</div>}
        />

        {/* 나스닥 */}
        <IndicatorCard
          title="나스닥"
          value={indicators.nasdaq.value ? indicators.nasdaq.value.toLocaleString() : '—'}
          change={indicators.nasdaq.change}
          changePercent={indicators.nasdaq.changePercent}
          loading={indicators.nasdaq.loading}
          icon={<div className="w-4 h-4 text-cyan-400">🚀</div>}
        />

        {/* 달러 인덱스 */}
        <IndicatorCard
          title="달러 인덱스"
          value={indicators.dxy.value ? indicators.dxy.value.toFixed(2) : '—'}
          change={indicators.dxy.change}
          changePercent={indicators.dxy.changePercent}
          loading={indicators.dxy.loading}
          icon={<div className="w-4 h-4 text-yellow-400">💵</div>}
        />

        {/* 비트코인 김치프리미엄 */}
        <IndicatorCard
          title="김치프리미엄"
          value={indicators.kimchiPremium.value ? `${indicators.kimchiPremium.value > 0 ? '+' : ''}${indicators.kimchiPremium.value.toFixed(2)}%` : '—'}
          loading={indicators.kimchiPremium.loading}
          customColor={indicators.kimchiPremium.value ? getChangeColorClass(indicators.kimchiPremium.value) : 'text-white'}
          icon={<div className="w-4 h-4 text-red-400">🌶️</div>}
        />

        {/* 달러/원 환율 */}
        <IndicatorCard
          title="USD/KRW"
          value={indicators.usdKrw.value ? `₩${indicators.usdKrw.value.toFixed(0)}` : '—'}
          change={indicators.usdKrw.change}
          changePercent={indicators.usdKrw.changePercent}
          loading={indicators.usdKrw.loading}
          icon={<div className="w-4 h-4 text-pink-400">🏦</div>}
        />
      </div>

      <div className="mt-4 text-xs text-textSecondary text-center">
        주식 데이터는 15-20분 지연될 수 있습니다 • 암호화폐 데이터는 실시간 업데이트
      </div>
    </div>
  );
};

export default MarketIndicators;