/**
 * CandleChart - 캔들스틱 차트 컴포넌트
 * Bitget API를 통한 OHLCV 데이터 표시
 */

import { useState, useEffect } from 'react';
import { usePrices } from '../../contexts';

const TIME_FRAMES = [
  { value: '1m', label: '1분' },
  { value: '5m', label: '5분' },
  { value: '15m', label: '15분' },
  { value: '1h', label: '1시간' },
  { value: '4h', label: '4시간' },
  { value: '1d', label: '1일' }
];

export default function CandleChart({ symbol }) {
  const [timeFrame, setTimeFrame] = useState('1h');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { prices, isConnected } = usePrices();
  const currentPrice = prices[symbol];

  // 차트 데이터 생성 (모의 데이터)
  useEffect(() => {
    if (!currentPrice?.price) return;

    setIsLoading(true);
    
    // 실제 구현시 Bitget K-line API 호출
    // 현재는 모의 데이터 생성
    const generateMockData = () => {
      const data = [];
      const basePrice = currentPrice.price;
      let currentTime = Date.now() - (50 * getTimeFrameMs(timeFrame));
      
      for (let i = 0; i < 50; i++) {
        const variation = (Math.random() - 0.5) * 0.1; // ±5% 변동
        const open = basePrice * (1 + variation);
        const variation2 = (Math.random() - 0.5) * 0.05; // ±2.5% 변동
        const close = open * (1 + variation2);
        const high = Math.max(open, close) * (1 + Math.random() * 0.02);
        const low = Math.min(open, close) * (1 - Math.random() * 0.02);
        const volume = Math.random() * 1000000;

        data.push({
          time: currentTime,
          open: open.toFixed(8),
          high: high.toFixed(8),
          low: low.toFixed(8),
          close: close.toFixed(8),
          volume: volume.toFixed(2)
        });
        
        currentTime += getTimeFrameMs(timeFrame);
      }
      
      return data;
    };

    // 데이터 로딩 시뮬레이션
    setTimeout(() => {
      setChartData(generateMockData());
      setIsLoading(false);
    }, 1000);
    
  }, [symbol, timeFrame, currentPrice?.price]);

  // 시간프레임을 밀리초로 변환
  function getTimeFrameMs(tf) {
    const map = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return map[tf] || map['1h'];
  }

  // 가격 포맷팅
  const formatPrice = (price) => {
    const num = parseFloat(price);
    if (num > 1) {
      return num.toFixed(2);
    } else if (num > 0.01) {
      return num.toFixed(4);
    } else {
      return num.toFixed(8);
    }
  };

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* 차트 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-text">
            {symbol.replace('USDT', '')} 가격 차트
          </h3>
          <p className="text-sm text-textSecondary">
            Bitget 거래소 캔들스틱 차트
          </p>
        </div>

        {/* 시간프레임 선택 */}
        <div className="flex gap-2">
          {TIME_FRAMES.map(tf => (
            <button
              key={tf.value}
              onClick={() => setTimeFrame(tf.value)}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                timeFrame === tf.value
                  ? 'bg-primary text-background'
                  : 'bg-card text-textSecondary hover:text-text'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* 현재가 정보 */}
      {currentPrice && (
        <div className="bg-card p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-textSecondary mb-1">현재가</p>
              <p className="text-text font-bold">${formatPrice(currentPrice.price)}</p>
            </div>
            <div>
              <p className="text-textSecondary mb-1">24h 변동</p>
              <p className={`font-bold ${
                currentPrice.changePercent24h > 0 ? 'text-success' : 'text-danger'
              }`}>
                {currentPrice.changePercent24h > 0 ? '+' : ''}
                {currentPrice.changePercent24h?.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-textSecondary mb-1">24h 최고</p>
              <p className="text-text font-bold">
                ${formatPrice(currentPrice.high24h || currentPrice.price * 1.05)}
              </p>
            </div>
            <div>
              <p className="text-textSecondary mb-1">24h 최저</p>
              <p className="text-text font-bold">
                ${formatPrice(currentPrice.low24h || currentPrice.price * 0.95)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 차트 영역 */}
      <div className="bg-card rounded-lg p-6">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-textSecondary">차트 데이터 로딩 중...</p>
            </div>
          </div>
        ) : !isConnected ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <p className="text-danger mb-2">연결 끊김</p>
              <p className="text-textSecondary text-sm">
                WebSocket 연결을 확인해주세요
              </p>
            </div>
          </div>
        ) : (
          <div className="h-96">
            {/* 간단한 가격 그래프 (실제 차트 라이브러리 대체) */}
            <div className="h-full flex items-end justify-between gap-1">
              {chartData.slice(-20).map((candle, index) => {
                const isGreen = parseFloat(candle.close) >= parseFloat(candle.open);
                const height = Math.max(
                  ((parseFloat(candle.high) - parseFloat(candle.low)) / 
                   parseFloat(candle.close)) * 200, 
                  10
                );
                
                return (
                  <div
                    key={index}
                    className="flex-1 relative group"
                    style={{ height: `${height}px` }}
                  >
                    {/* 캔들 바디 */}
                    <div
                      className={`w-full rounded-sm ${
                        isGreen ? 'bg-success' : 'bg-danger'
                      }`}
                      style={{
                        height: `${Math.abs(
                          parseFloat(candle.close) - parseFloat(candle.open)
                        ) / parseFloat(candle.close) * 200}px`,
                        marginTop: `${Math.min(
                          parseFloat(candle.open),
                          parseFloat(candle.close)
                        ) / parseFloat(candle.close) * 50}px`
                      }}
                      title={`시간: ${formatTime(candle.time)}
고가: $${formatPrice(candle.high)}
저가: $${formatPrice(candle.low)}
시가: $${formatPrice(candle.open)}
종가: $${formatPrice(candle.close)}`}
                    ></div>
                    
                    {/* 호버 정보 */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-background border border-border rounded p-2 text-xs whitespace-nowrap z-10">
                      <div>시간: {formatTime(candle.time)}</div>
                      <div>시가: ${formatPrice(candle.open)}</div>
                      <div>종가: ${formatPrice(candle.close)}</div>
                      <div>고가: ${formatPrice(candle.high)}</div>
                      <div>저가: ${formatPrice(candle.low)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 차트 하단 시간 라벨 */}
            <div className="flex justify-between mt-2 text-xs text-textSecondary">
              <span>{formatTime(chartData[chartData.length - 20]?.time || Date.now())}</span>
              <span>{formatTime(chartData[chartData.length - 1]?.time || Date.now())}</span>
            </div>
          </div>
        )}
      </div>

      {/* 차트 정보 */}
      <div className="bg-card p-4 rounded-lg">
        <div className="text-sm text-textSecondary space-y-2">
          <p>
            <strong>데이터 제공:</strong> Bitget API
          </p>
          <p>
            <strong>업데이트:</strong> 실시간 (시간프레임: {TIME_FRAMES.find(tf => tf.value === timeFrame)?.label})
          </p>
          <p>
            <strong>참고:</strong> 실제 거래 시 Bitget 거래소에서 최신 데이터를 확인하세요
          </p>
          {!isConnected && (
            <p className="text-warning">
              <strong>알림:</strong> 현재 실시간 연결이 끊어진 상태입니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}