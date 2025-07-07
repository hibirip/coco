/**
 * CoinDetailPageV2 - 바이낸스 스타일 코인 상세 페이지
 * TradingView 차트, 호가창, 거래내역 등 상세 정보 제공
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePrices } from '../contexts';
import { TradingViewChart, TradingPanel } from '../components/CoinDetail';
import { fetchOrderBook } from '../services/orderBookService';
import { 
  formatKRW, 
  formatUSD, 
  formatPercent,
  formatNumber,
  getChangeColorClass 
} from '../utils';

export default function CoinDetailPageV2() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { 
    prices, 
    upbitPrices, 
    exchangeRate,
    ALL_COINS,
    getBitgetWebSocketManager,
    calculateKimchiPremium
  } = usePrices();

  // 심볼 정규화
  const normalizedSymbol = symbol?.toUpperCase().includes('USDT') 
    ? symbol.toUpperCase() 
    : `${symbol?.toUpperCase()}USDT`;

  // 코인 정보
  const coinInfo = Object.values(ALL_COINS).find(
    coin => coin.symbol === normalizedSymbol
  );

  const bitgetPrice = prices[normalizedSymbol];
  const upbitPrice = upbitPrices[coinInfo?.upbitMarket];
  const kimchiPremium = calculateKimchiPremium(normalizedSymbol);

  // 시간 프레임 상태
  const [timeframe, setTimeframe] = useState('60'); // TradingView interval format
  const [orderBookData, setOrderBookData] = useState({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState([]);

  // 시간 프레임 매핑
  const timeframeMap = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
    '1w': 'W'
  };

  // 실시간 호가 데이터 가져오기
  useEffect(() => {
    if (!normalizedSymbol) return;

    // 호가 데이터 조회 함수
    const loadOrderBook = async () => {
      try {
        const data = await fetchOrderBook(normalizedSymbol);
        setOrderBookData(data);
      } catch (error) {
        console.error('호가 데이터 조회 실패:', error);
      }
    };

    // Mock 체결 데이터
    const generateTrades = () => {
      const trades = [];
      const currentPrice = bitgetPrice?.price || 100;
      
      for (let i = 0; i < 20; i++) {
        trades.push({
          time: new Date(Date.now() - i * 1000 * Math.random() * 60).toLocaleTimeString(),
          price: currentPrice * (1 + (Math.random() - 0.5) * 0.002),
          amount: Math.random() * 5,
          side: Math.random() > 0.5 ? 'buy' : 'sell'
        });
      }
      
      setRecentTrades(trades);
    };

    // 초기 로드
    loadOrderBook();
    generateTrades();

    // 주기적 업데이트 (2초마다)
    const interval = setInterval(() => {
      loadOrderBook();
      generateTrades();
    }, 2000);

    return () => clearInterval(interval);
  }, [normalizedSymbol, bitgetPrice]);

  if (!coinInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-section p-8 rounded-lg text-center">
          <h1 className="text-2xl font-bold text-danger mb-4">코인을 찾을 수 없습니다</h1>
          <button
            onClick={() => navigate('/prices')}
            className="px-6 py-3 bg-primary text-background rounded-lg"
          >
            시세 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const change24h = bitgetPrice?.changePercent24h || upbitPrice?.change_percent || 0;
  const volume24h = bitgetPrice?.volume24h || 0;
  const high24h = bitgetPrice?.high24h || upbitPrice?.high_price || 0;
  const low24h = bitgetPrice?.low24h || upbitPrice?.low_price || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black">
      {/* 상단 헤더 */}
      <div className="bg-gradient-to-r from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl border-b border-gray-700/30 shadow-2xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* 왼쪽: 코인 정보 */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/prices')}
                className="text-gray-400 hover:text-primary transition-all duration-300 flex items-center gap-2 group"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {normalizedSymbol.replace('USDT', '')}/USDT
                </span>
                <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50">{coinInfo.name}</span>
              </div>
            </div>

            {/* 오른쪽: 가격 정보 */}
            <div className="flex items-center gap-8">
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  {bitgetPrice?.price ? formatUSD(bitgetPrice.price) : '-'}
                </div>
                <div className="text-sm text-gray-400">
                  ≈ {bitgetPrice?.price && exchangeRate ? formatKRW(bitgetPrice.price * exchangeRate) : '-'}
                </div>
              </div>
              
              <div className={`text-right ${change24h >= 0 ? 'text-primary' : 'text-danger'}`}>
                <div className="text-xl font-semibold">
                  {formatPercent(change24h)}
                </div>
                <div className="text-sm">24h 변동</div>
              </div>
            </div>
          </div>

          {/* 24시간 통계 */}
          <div className="flex items-center gap-6 mt-4 text-sm border-t border-gray-700/30 pt-4 bg-gradient-to-r from-transparent via-gray-800/10 to-transparent">
            <div className="flex gap-2 items-center px-4 py-2 rounded-xl bg-gray-800/30 hover:bg-gray-700/30 transition-all duration-300 border border-gray-700/20">
              <span className="text-gray-400">24h High:</span>
              <span className="text-white font-semibold">{high24h ? formatUSD(high24h) : '-'}</span>
            </div>
            <div className="flex gap-2 items-center px-4 py-2 rounded-xl bg-gray-800/30 hover:bg-gray-700/30 transition-all duration-300 border border-gray-700/20">
              <span className="text-gray-400">24h Low:</span>
              <span className="text-white font-semibold">{low24h ? formatUSD(low24h) : '-'}</span>
            </div>
            <div className="flex gap-2 items-center px-4 py-2 rounded-xl bg-gray-800/30 hover:bg-gray-700/30 transition-all duration-300 border border-gray-700/20">
              <span className="text-gray-400">24h Volume:</span>
              <span className="text-white font-semibold">{volume24h ? `$${formatNumber(volume24h * (bitgetPrice?.price || 0))}` : '-'}</span>
            </div>
            <div className="flex gap-2 items-center px-4 py-2 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/30 hover:from-gray-700/50 hover:to-gray-600/30 transition-all duration-300 border border-gray-600/30 ml-auto">
              <span className="text-gray-400">Kimchi Premium:</span>
              <span className={`font-semibold ${kimchiPremium?.premium > 0 ? 'text-primary' : 'text-danger'}`}>
                {kimchiPremium ? formatPercent(kimchiPremium.premium) : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* 왼쪽: 차트 영역 */}
          <div className="xl:col-span-6">
            <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/70 backdrop-blur-xl rounded-xl p-6 border border-gray-700/40 shadow-2xl hover:shadow-3xl transition-all duration-300">
              {/* 시간 프레임 선택 */}
              <div className="flex items-center gap-2 mb-6">
                {Object.entries(timeframeMap).map(([label, value]) => (
                  <button
                    key={label}
                    onClick={() => setTimeframe(value)}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-300 ${
                      timeframe === value 
                        ? 'bg-gradient-to-r from-green-500 to-green-400 text-black shadow-lg shadow-green-500/30 scale-105' 
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/60 hover:text-white border border-gray-700/30 hover:border-gray-600/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* TradingView 차트 */}
              <div className="rounded-lg overflow-hidden border border-gray-700/30 shadow-xl">
                <TradingViewChart 
                  symbol={normalizedSymbol}
                  interval={timeframe}
                  height={600}
                />
              </div>
            </div>
          </div>

          {/* 중앙: 호가창 */}
          <div className="xl:col-span-3">
            <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/85 to-gray-900/75 backdrop-blur-xl rounded-xl p-6 h-[656px] overflow-hidden border border-gray-700/40 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-400 rounded-full shadow-lg shadow-green-500/50"></div>
                Order Book
              </h3>
              
              {/* 매도 호가 */}
              <div className="space-y-1 mb-4">
                <div className="grid grid-cols-3 text-xs text-gray-400 mb-3 pb-2 border-b border-gray-800/50">
                  <span className="font-medium">Price (USDT)</span>
                  <span className="text-right font-medium">Amount</span>
                  <span className="text-right font-medium">Total</span>
                </div>
                
                {orderBookData.asks.slice(0, 10).reverse().map((ask, i) => (
                  <div 
                    key={i} 
                    className="grid grid-cols-3 text-sm hover:bg-red-500/10 px-2 py-1 relative transition-all duration-200 rounded-md"
                  >
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-red-500/15 to-transparent rounded-md" 
                      style={{ width: `${(ask.total / orderBookData.asks[9]?.total) * 100}%` }}
                    />
                    <span className="text-red-400 relative z-10 font-medium">{formatUSD(ask.price)}</span>
                    <span className="text-right relative z-10 text-gray-300">{ask.amount.toFixed(4)}</span>
                    <span className="text-right text-gray-400 relative z-10">{ask.total.toFixed(4)}</span>
                  </div>
                ))}
              </div>

              {/* 현재가 구분선 */}
              <div className="border-y border-gray-700/50 py-3 my-4 bg-gradient-to-r from-gray-800/30 via-gray-700/40 to-gray-800/30 rounded-lg">
                <div className="text-center">
                  <span className={`text-xl font-bold ${getChangeColorClass(change24h)} drop-shadow-lg`}>
                    {bitgetPrice?.price ? formatUSD(bitgetPrice.price) : '-'}
                  </span>
                  <div className="text-sm text-gray-400 mt-1">
                    ≈ {bitgetPrice?.price && exchangeRate ? formatKRW(bitgetPrice.price * exchangeRate) : '-'}
                  </div>
                </div>
              </div>

              {/* 매수 호가 */}
              <div className="space-y-1">
                {orderBookData.bids.slice(0, 10).map((bid, i) => (
                  <div 
                    key={i} 
                    className="grid grid-cols-3 text-sm hover:bg-green-500/10 px-2 py-1 relative transition-all duration-200 rounded-md"
                  >
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-green-500/15 to-transparent rounded-md" 
                      style={{ width: `${(bid.total / orderBookData.bids[9]?.total) * 100}%` }}
                    />
                    <span className="text-green-400 relative z-10 font-medium">{formatUSD(bid.price)}</span>
                    <span className="text-right relative z-10 text-gray-300">{bid.amount.toFixed(4)}</span>
                    <span className="text-right text-gray-400 relative z-10">{bid.total.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 매매 패널 */}
          <div className="xl:col-span-3">
            <TradingPanel 
              symbol={normalizedSymbol}
              currentPrice={bitgetPrice?.price}
              onTrade={(orderData) => {
                console.log('주문 데이터:', orderData);
                alert(`${orderData.side === 'buy' ? '매수' : '매도'} 주문이 제출되었습니다.`);
              }}
            />
          </div>
        </div>

        {/* 하단: 거래 내역 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
              <span>Recent Trades</span>
              <span className="text-xs text-gray-500">Live</span>
            </h3>
            
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-xs text-gray-500 mb-2 pb-1 border-b border-gray-800/50">
                <span>Time</span>
                <span className="text-center">Price (USDT)</span>
                <span className="text-right">Amount</span>
              </div>
              
              {recentTrades.slice(0, 10).map((trade, i) => (
                <div key={i} className="grid grid-cols-3 text-sm hover:bg-gray-800/30 px-1 py-0.5 transition-colors">
                  <span className="text-gray-500">{trade.time}</span>
                  <span className={`text-center font-medium ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                    {formatUSD(trade.price)}
                  </span>
                  <span className="text-right text-gray-400">{trade.amount.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 추가 정보 패널 */}
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">24h Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 px-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                <span className="text-gray-400">24h Change</span>
                <span className={`font-medium ${change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(change24h)}
                </span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-gray-800/30 transition-colors">
                <span className="text-gray-400">24h High</span>
                <span className="text-gray-300 font-medium">{high24h ? formatUSD(high24h) : '-'}</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-gray-800/30 transition-colors">
                <span className="text-gray-400">24h Low</span>
                <span className="text-gray-300 font-medium">{low24h ? formatUSD(low24h) : '-'}</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-gray-800/30 transition-colors">
                <span className="text-gray-400">24h Volume</span>
                <span className="text-gray-300 font-medium">{volume24h ? formatNumber(volume24h) : '-'}</span>
              </div>
              {kimchiPremium && (
                <div className="flex justify-between py-3 px-4 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/40 hover:from-gray-700/60 hover:to-gray-600/50 transition-all duration-300 border border-gray-600/40 shadow-lg">
                  <span className="text-gray-300 font-medium">Kimchi Premium</span>
                  <span className={`font-bold ${kimchiPremium.premium >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercent(kimchiPremium.premium)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}