/**
 * CoinDetailPage - 개별 코인 상세 페이지
 * 차트, 호가, 체결내역 등 상세 정보 제공
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePrices } from '../contexts';
import { CandleChart, OrderBook } from '../components/CoinDetail';
import { 
  formatKRW, 
  formatUSD, 
  formatPercent, 
  getChangeColorClass,
  getCoinLogoUrl 
} from '../utils';

const TAB_OPTIONS = [
  { id: 'chart', label: '차트', desc: '캔들스틱 차트' },
  { id: 'orderbook', label: '호가', desc: '매수/매도 호가' },
  { id: 'trades', label: '체결', desc: '최근 체결내역' },
  { id: 'info', label: '정보', desc: '코인 상세 정보' }
];

export default function CoinDetailPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chart');
  
  // 환율 검증
  const { 
    prices, 
    upbitPrices, 
    exchangeRate, 
    ALL_COINS, 
    calculateKimchiPremium,
    isConnected,
    upbitIsConnected
  } = usePrices();

  // 환율 로딩 중 상태
  if (!exchangeRate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-section p-8 rounded-lg text-center">
          <p className="text-textSecondary">환율 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 심볼 정규화 (대문자 + USDT 추가)
  const normalizedSymbol = symbol?.toUpperCase().includes('USDT') 
    ? symbol.toUpperCase() 
    : `${symbol?.toUpperCase()}USDT`;

  // 코인 정보 찾기
  const coinInfo = Object.values(ALL_COINS).find(
    coin => coin.symbol === normalizedSymbol
  );

  // 코인이 존재하지 않는 경우
  if (!coinInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-section p-8 rounded-lg text-center">
          <h1 className="text-2xl font-bold text-danger mb-4">코인을 찾을 수 없습니다</h1>
          <p className="text-textSecondary mb-6">
            요청하신 코인 '{symbol}'은(는) 지원되지 않습니다.
          </p>
          <button
            onClick={() => navigate('/prices')}
            className="px-6 py-3 bg-primary text-background rounded-lg hover:bg-primary/80 transition-colors"
          >
            시세 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 가격 데이터
  const bitgetPrice = prices[normalizedSymbol];
  const upbitPrice = upbitPrices[coinInfo.upbitMarket];
  const kimchiPremium = calculateKimchiPremium(normalizedSymbol);

  // 24시간 변동률 계산
  const change24h = Math.max(
    bitgetPrice?.changePercent24h || 0,
    upbitPrice?.change_percent || 0
  );

  // Bitget 거래 URL
  const bitgetTradeUrl = `https://www.bitget.com/spot/${normalizedSymbol.replace('USDT', '_USDT')}`;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => navigate('/prices')}
        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
      >
        <span>←</span>
        <span>시세 목록으로</span>
      </button>

      {/* 코인 헤더 */}
      <div className="bg-section p-6 rounded-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* 코인 기본 정보 */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 relative overflow-hidden rounded-full">
              <img 
                src={getCoinLogoUrl(normalizedSymbol)}
                alt={`${coinInfo.name} logo`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div class="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                      <span class="text-primary text-xl font-bold">
                        ${normalizedSymbol.replace('USDT', '').slice(0, 3)}
                      </span>
                    </div>
                  `;
                }}
              />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-text">{coinInfo.name}</h1>
              <p className="text-textSecondary text-lg">
                {normalizedSymbol.replace('USDT', '')}
              </p>
            </div>
          </div>

          {/* 가격 정보 */}
          <div className="flex flex-col lg:items-end gap-2">
            {/* 현재가 (업비트 우선, 없으면 Bitget) */}
            <div className="text-right">
              {upbitPrice?.trade_price ? (
                <div>
                  <p className="text-3xl font-bold text-text">
                    {formatKRW(upbitPrice.trade_price)}
                  </p>
                  <p className="text-sm text-textSecondary">업비트 (KRW)</p>
                </div>
              ) : bitgetPrice?.price ? (
                <div>
                  <p className="text-3xl font-bold text-text">
                    {formatUSD(bitgetPrice.price)}
                  </p>
                  <p className="text-sm text-textSecondary">Bitget (USD)</p>
                </div>
              ) : (
                <div>
                  <p className="text-xl text-textSecondary">데이터 로딩 중...</p>
                </div>
              )}
            </div>

            {/* 24시간 변동 */}
            <div className={`text-right ${getChangeColorClass(change24h)}`}>
              <p className="text-xl font-semibold">
                {change24h > 0 ? '+' : ''}{formatPercent(change24h)}
              </p>
              <p className="text-sm">24시간 변동</p>
            </div>
          </div>
        </div>

        {/* 추가 정보 카드들 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {/* 김치프리미엄 */}
          <div className="bg-card p-4 rounded-lg text-center">
            <p className="text-sm text-textSecondary mb-1">김치프리미엄</p>
            {kimchiPremium ? (
              <div>
                <p className={`text-lg font-bold ${getChangeColorClass(kimchiPremium.premium)}`}>
                  {kimchiPremium.premium > 0 ? '+' : ''}{formatPercent(kimchiPremium.premium)}
                </p>
                <p className="text-xs text-textSecondary">
                  {(() => {
                    if (bitgetPrice?.price && exchangeRate) {
                      const premiumWon = (bitgetPrice.price * exchangeRate) * (kimchiPremium.premium / 100);
                      return formatKRW(Math.abs(premiumWon));
                    }
                    return '-';
                  })()}
                </p>
              </div>
            ) : (
              <p className="text-lg text-textSecondary">-</p>
            )}
          </div>

          {/* Bitget 가격 */}
          <div className="bg-card p-4 rounded-lg text-center">
            <p className="text-sm text-textSecondary mb-1">Bitget (USD)</p>
            {bitgetPrice?.price ? (
              <div>
                <p className="text-lg font-bold text-text">
                  {formatUSD(bitgetPrice.price)}
                </p>
                <p className="text-xs text-textSecondary">
                  ≈ {formatKRW(bitgetPrice.price * exchangeRate)}
                </p>
              </div>
            ) : (
              <p className="text-lg text-textSecondary">-</p>
            )}
          </div>

          {/* 업비트 가격 */}
          <div className="bg-card p-4 rounded-lg text-center">
            <p className="text-sm text-textSecondary mb-1">업비트 (KRW)</p>
            {upbitPrice?.trade_price ? (
              <div>
                <p className="text-lg font-bold text-text">
                  {formatKRW(upbitPrice.trade_price)}
                </p>
                <p className="text-xs text-textSecondary">
                  ≈ {formatUSD(upbitPrice.trade_price / exchangeRate)}
                </p>
              </div>
            ) : (
              <p className="text-lg text-textSecondary">-</p>
            )}
          </div>

          {/* 24시간 거래량 */}
          <div className="bg-card p-4 rounded-lg text-center">
            <p className="text-sm text-textSecondary mb-1">거래량 (24h)</p>
            {(() => {
              const upbitVol = upbitPrice?.acc_trade_volume_24h || 0;
              const bitgetVolKRW = bitgetPrice?.volume24h ? 
                (bitgetPrice.volume24h * bitgetPrice.price * exchangeRate) : 0;
              const primaryVol = upbitVol || bitgetVolKRW;
              
              if (primaryVol > 0) {
                return (
                  <div>
                    <p className="text-lg font-bold text-text">
                      {(primaryVol / 100000000).toFixed(1)}억 원
                    </p>
                    <p className="text-xs text-textSecondary">
                      {upbitVol > 0 ? '업비트' : 'Bitget'}
                    </p>
                  </div>
                );
              }
              return <p className="text-lg text-textSecondary">-</p>;
            })()}
          </div>
        </div>
      </div>

      {/* 거래 버튼 섹션 */}
      <div className="bg-section p-6 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
          <div className="flex gap-4">
            <button
              onClick={() => window.open(bitgetTradeUrl, '_blank')}
              className="px-8 py-3 bg-success text-white rounded-lg hover:bg-success/80 transition-colors font-semibold"
            >
              BUY (매수)
            </button>
            <button
              onClick={() => window.open(bitgetTradeUrl, '_blank')}
              className="px-8 py-3 bg-danger text-white rounded-lg hover:bg-danger/80 transition-colors font-semibold"
            >
              SELL (매도)
            </button>
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm text-textSecondary">
              Bitget에서 거래하기
            </p>
            <p className="text-xs text-textSecondary">
              클릭시 Bitget 거래소로 이동합니다
            </p>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-section rounded-lg overflow-hidden">
        <div className="border-b border-border">
          <div className="flex">
            {TAB_OPTIONS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-center transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-background border-b-2 border-primary'
                    : 'text-textSecondary hover:text-text hover:bg-card/50'
                }`}
                title={tab.desc}
              >
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="p-6 min-h-[400px]">
          {activeTab === 'chart' && (
            <CandleChart symbol={normalizedSymbol} />
          )}
          
          {activeTab === 'orderbook' && (
            <OrderBook symbol={normalizedSymbol} />
          )}
          
          {activeTab === 'trades' && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-text mb-4">체결내역</h3>
              <p className="text-textSecondary mb-4">
                최근 체결내역을 확인할 수 있습니다
              </p>
              <div className="text-sm text-textSecondary">
                Bitget API를 통한 실시간 체결 데이터 제공 예정
              </div>
            </div>
          )}
          
          {activeTab === 'info' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text">코인 정보</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-text">기본 정보</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-textSecondary">코인명:</span>
                      <span className="text-text">{coinInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">심볼:</span>
                      <span className="text-text">{normalizedSymbol.replace('USDT', '')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">업비트 마켓:</span>
                      <span className="text-text">{coinInfo.upbitMarket}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">우선순위:</span>
                      <span className="text-text">#{coinInfo.priority}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-text">연결 상태</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-textSecondary">Bitget:</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`}></div>
                        <span className="text-text">{isConnected ? '연결됨' : '연결끊김'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-textSecondary">업비트:</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${upbitIsConnected ? 'bg-success' : 'bg-danger'}`}></div>
                        <span className="text-text">{upbitIsConnected ? '연결됨' : '연결끊김'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">환율:</span>
                      <span className="text-text">{formatKRW(exchangeRate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}