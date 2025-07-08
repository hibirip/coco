/**
 * MarketIndicators - 시장 지수 및 지표 컴포넌트
 * 8가지 주요 지표를 깔끔하고 이쁜 UI로 표시
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { formatKRW, formatUSD, formatPercent, getChangeColorClass } from '../../utils';
import FearGreedGauge from './FearGreedGauge';
import { getFearGreedIndex, getCryptoGlobalData, getStockIndicators } from '../../services/marketIndicators';
import { usePrices } from '../../contexts';

const MarketIndicators = () => {
  const { prices, upbitPrices, exchangeRate, calculateKimchiPremium } = usePrices();
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
      const stockData = await getStockIndicators();

      setIndicators(prev => ({
        ...prev,
        sp500: { 
          value: stockData.sp500.price, 
          change: stockData.sp500.change, 
          changePercent: stockData.sp500.changePercent, 
          loading: false 
        },
        nasdaq: { 
          value: stockData.nasdaq.price, 
          change: stockData.nasdaq.change, 
          changePercent: stockData.nasdaq.changePercent, 
          loading: false 
        },
        dxy: { 
          value: stockData.dxy.price, 
          change: stockData.dxy.change, 
          changePercent: stockData.dxy.changePercent, 
          loading: false 
        }
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
      // BTC 김치프리미엄 계산
      const btcKimchiPremium = calculateKimchiPremium('BTCUSDT');
      
      setIndicators(prev => ({
        ...prev,
        kimchiPremium: {
          value: btcKimchiPremium?.premium || null,
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
    <div className="group relative overflow-hidden h-32">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative bg-gradient-to-br from-gray-800/80 via-gray-700/60 to-gray-800/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-600/50 hover:border-blue-400/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 group-hover:scale-[1.02] transform h-full">
        <div className="flex flex-col justify-between h-full">
          {/* 헤더 영역 */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide group-hover:text-gray-300 transition-colors">
              {title}
            </h3>
            {change !== undefined && (
              <div className="group-hover:scale-110 transition-transform duration-300">
                <ChangeIcon change={change} />
              </div>
            )}
          </div>
          
          {/* 메인 값 영역 */}
          <div className="flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="space-y-2">
                <div className="h-7 bg-gradient-to-r from-gray-600/50 via-gray-500/50 to-gray-600/50 rounded-lg animate-pulse"></div>
                <div className="h-3 bg-gradient-to-r from-gray-600/30 via-gray-500/30 to-gray-600/30 rounded animate-pulse w-16"></div>
              </div>
            ) : (
              <div className="text-center">
                <div className={`text-xl font-bold ${customColor || 'text-white'} group-hover:text-blue-100 transition-colors group-hover:scale-105 transform duration-300 leading-tight`}>
                  {value}
                </div>
                {subValue && (
                  <div className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors duration-300">
                    {subValue}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 변화율 영역 */}
          {changePercent !== undefined && changePercent !== null && !loading && (
            <div className="flex justify-center">
              <div className={`text-xs font-semibold ${getChangeColorClass(changePercent)} px-2 py-1 rounded-md bg-black/30 group-hover:bg-black/40 transition-all duration-300`}>
                {formatPercent(changePercent)}
              </div>
            </div>
          )}
        </div>
        
        {/* 장식 요소 */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      </div>
    </div>
  );

  return (
    <div className="relative bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 mb-8 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-500 shadow-2xl hover:shadow-blue-500/10">
      {/* 배경 장식 */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-purple-500/10 to-transparent rounded-full blur-xl"></div>
      
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">시장 지표</h2>
            <p className="text-sm text-gray-400">글로벌 마켓 현황</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800/50 px-3 py-2 rounded-full border border-gray-600/30">
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

      {/* 모바일: 3x2 그리드, 데스크톱: 기존 레이아웃 */}
      <div className="md:hidden">
        {/* 모바일 레이아웃 - 6개 지표 3x2 */}
        <div className="grid grid-cols-3 gap-2">
          {/* 공포탐욕지수 - 모바일에서는 일반 카드 크기 */}
          <IndicatorCard
            title="공포탐욕지수"
            value={indicators.fearGreed.value ? `${indicators.fearGreed.value}` : '—'}
            loading={indicators.fearGreed.loading}
            customColor={indicators.fearGreed.value ? getFearGreedColor(indicators.fearGreed.value) : 'text-white'}
          />

          {/* 총 시가총액 */}
          <IndicatorCard
            title="총 시가총액"
            value={indicators.totalMarketCap.value ? `$${(indicators.totalMarketCap.value / 1e12).toFixed(2)}T` : '—'}
            loading={indicators.totalMarketCap.loading}
          />

          {/* S&P 500 */}
          <IndicatorCard
            title="S&P 500"
            value={indicators.sp500.value ? indicators.sp500.value.toLocaleString() : '—'}
            change={indicators.sp500.change}
            changePercent={indicators.sp500.changePercent}
            loading={indicators.sp500.loading}
          />

          {/* 달러 인덱스 */}
          <IndicatorCard
            title="달러 인덱스"
            value={indicators.dxy.value ? indicators.dxy.value.toFixed(2) : '—'}
            change={indicators.dxy.change}
            changePercent={indicators.dxy.changePercent}
            loading={indicators.dxy.loading}
          />

          {/* 김치프리미엄 */}
          <IndicatorCard
            title="김치프리미엄"
            value={indicators.kimchiPremium.value ? `${indicators.kimchiPremium.value > 0 ? '+' : ''}${indicators.kimchiPremium.value.toFixed(2)}%` : '—'}
            loading={indicators.kimchiPremium.loading}
            customColor={indicators.kimchiPremium.value ? getChangeColorClass(indicators.kimchiPremium.value) : 'text-white'}
          />

          {/* USD/KRW */}
          <IndicatorCard
            title="USD/KRW"
            value={indicators.usdKrw.value ? `₩${indicators.usdKrw.value.toFixed(0)}` : '—'}
            change={indicators.usdKrw.change}
            changePercent={indicators.usdKrw.changePercent}
            loading={indicators.usdKrw.loading}
          />
        </div>
      </div>

      {/* 데스크톱 레이아웃 - 왼쪽 공포탐욕지수 + 가운데 2x2 그리드 + 오른쪽 김프TOP */}
      <div className="relative hidden md:grid md:grid-cols-4 gap-6">
        {/* 공포탐욕지수 - 왼쪽 큰 카드 */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-gray-800/80 via-gray-700/60 to-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-600/50 hover:border-orange-400/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-orange-500/20 group-hover:scale-[1.02] transform h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                공포탐욕지수
              </h3>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <FearGreedGauge
                value={indicators.fearGreed.value}
                loading={indicators.fearGreed.loading}
              />
            </div>
            {/* 장식 요소 */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>

        {/* 가운데 2x2 그리드 */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {/* 총 시가총액 */}
          <IndicatorCard
            title="총 시가총액"
            value={indicators.totalMarketCap.value ? `$${(indicators.totalMarketCap.value / 1e12).toFixed(2)}T` : '—'}
            loading={indicators.totalMarketCap.loading}
            icon={<div className="w-4 h-4 text-blue-400"></div>}
          />

          {/* S&P 500 */}
          <IndicatorCard
            title="S&P 500"
            value={indicators.sp500.value ? indicators.sp500.value.toLocaleString() : '—'}
            change={indicators.sp500.change}
            changePercent={indicators.sp500.changePercent}
            loading={indicators.sp500.loading}
            icon={<div className="w-4 h-4 text-green-400"></div>}
          />

          {/* 달러 인덱스 */}
          <IndicatorCard
            title="달러 인덱스"
            value={indicators.dxy.value ? indicators.dxy.value.toFixed(2) : '—'}
            change={indicators.dxy.change}
            changePercent={indicators.dxy.changePercent}
            loading={indicators.dxy.loading}
            icon={<div className="w-4 h-4 text-yellow-400"></div>}
          />

          {/* 달러/원 환율 */}
          <IndicatorCard
            title="USD/KRW"
            value={indicators.usdKrw.value ? `₩${indicators.usdKrw.value.toFixed(0)}` : '—'}
            change={indicators.usdKrw.change}
            changePercent={indicators.usdKrw.changePercent}
            loading={indicators.usdKrw.loading}
            icon={<div className="w-4 h-4 text-pink-400"></div>}
          />
        </div>

        {/* 김프TOP - 오른쪽 큰 카드 */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-gray-800/80 via-gray-700/60 to-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-600/50 hover:border-green-400/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 group-hover:scale-[1.02] transform h-full">
            <div className="flex flex-col justify-between h-full">
              {/* 헤더 */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide group-hover:text-gray-300 transition-colors">
                  김프 TOP
                </h3>
              </div>
              
              {/* 메인 컨텐츠 */}
              <div className="flex-1 flex flex-col justify-center">
                {indicators.kimchiPremium.loading ? (
                  <div className="space-y-3 text-center">
                    <div className="h-8 bg-gradient-to-r from-gray-600/50 via-gray-500/50 to-gray-600/50 rounded-lg animate-pulse mx-auto w-20"></div>
                    <div className="h-10 bg-gradient-to-r from-gray-600/50 via-gray-500/50 to-gray-600/50 rounded-lg animate-pulse mx-auto w-32"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-600/30 via-gray-500/30 to-gray-600/30 rounded animate-pulse mx-auto w-24"></div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                      BTC
                    </div>
                    <div className={`text-3xl font-bold ${indicators.kimchiPremium.value ? getChangeColorClass(indicators.kimchiPremium.value) : 'text-white'} group-hover:scale-105 transform transition-all duration-300 leading-none`}>
                      {indicators.kimchiPremium.value ? `${indicators.kimchiPremium.value > 0 ? '+' : ''}${indicators.kimchiPremium.value.toFixed(2)}%` : '—'}
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-300">
                      김치프리미엄 상위 코인
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* 장식 요소 */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </div>
        </div>
      </div>

      <div className="relative mt-8 text-xs text-gray-400 text-center bg-gray-800/30 px-4 py-3 rounded-xl border border-gray-600/20">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          주식 데이터는 15-20분 지연될 수 있습니다 • 암호화폐 데이터는 실시간 업데이트
        </div>
      </div>
    </div>
  );
};

export default MarketIndicators;