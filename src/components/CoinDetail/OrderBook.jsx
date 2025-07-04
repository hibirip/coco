/**
 * OrderBook - 호가창 컴포넌트
 * 매수/매도 호가 정보 표시
 */

import { useState, useEffect } from 'react';
import { usePrices } from '../../contexts';
import { formatUSD } from '../../utils';

export default function OrderBook({ symbol }) {
  const [orderBookData, setOrderBookData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { prices, isConnected } = usePrices();
  const currentPrice = prices[symbol];

  // 호가 데이터 생성 (모의 데이터)
  useEffect(() => {
    if (!currentPrice?.price) return;

    setIsLoading(true);
    
    // 실제 구현시 Bitget Order Book API 호출
    // 현재는 모의 데이터 생성
    const generateMockOrderBook = () => {
      const basePrice = currentPrice.price;
      const asks = []; // 매도 호가 (빨간색)
      const bids = []; // 매수 호가 (초록색)
      
      // 매도 호가 생성 (현재가 위)
      for (let i = 1; i <= 10; i++) {
        const price = basePrice * (1 + (i * 0.001)); // 0.1%씩 증가
        const amount = Math.random() * 100 + 10; // 10-110 사이
        asks.push({
          price: price,
          amount: amount,
          total: price * amount
        });
      }
      
      // 매수 호가 생성 (현재가 아래)
      for (let i = 1; i <= 10; i++) {
        const price = basePrice * (1 - (i * 0.001)); // 0.1%씩 감소
        const amount = Math.random() * 100 + 10; // 10-110 사이
        bids.push({
          price: price,
          amount: amount,
          total: price * amount
        });
      }
      
      return {
        asks: asks.reverse(), // 높은 가격부터 표시
        bids: bids, // 높은 가격부터 표시
        timestamp: Date.now()
      };
    };

    // 데이터 로딩 시뮬레이션
    setTimeout(() => {
      setOrderBookData(generateMockOrderBook());
      setIsLoading(false);
    }, 500);
    
    // 실시간 업데이트 시뮬레이션 (5초마다)
    const interval = setInterval(() => {
      if (isConnected) {
        setOrderBookData(generateMockOrderBook());
      }
    }, 5000);

    return () => clearInterval(interval);
    
  }, [symbol, currentPrice?.price, isConnected]);

  // 가격 포맷팅
  const formatPrice = (price) => {
    if (price > 1) {
      return price.toFixed(2);
    } else if (price > 0.01) {
      return price.toFixed(4);
    } else {
      return price.toFixed(8);
    }
  };

  // 수량 포맷팅
  const formatAmount = (amount) => {
    if (amount > 1000) {
      return (amount / 1000).toFixed(1) + 'K';
    }
    return amount.toFixed(2);
  };

  // 스프레드 계산
  const spread = orderBookData ? 
    ((orderBookData.asks[0]?.price - orderBookData.bids[0]?.price) / 
     orderBookData.bids[0]?.price * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 호가창 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-text">
            {symbol.replace('USDT', '')} 호가창
          </h3>
          <p className="text-sm text-textSecondary">
            실시간 매수/매도 호가 정보
          </p>
        </div>

        {/* 스프레드 정보 */}
        {orderBookData && (
          <div className="text-right">
            <p className="text-sm text-textSecondary mb-1">스프레드</p>
            <p className="text-lg font-bold text-primary">
              {spread.toFixed(4)}%
            </p>
          </div>
        )}
      </div>

      {/* 현재가 정보 */}
      {currentPrice && (
        <div className="bg-card p-4 rounded-lg text-center">
          <p className="text-sm text-textSecondary mb-1">현재가</p>
          <p className="text-2xl font-bold text-text">
            ${formatPrice(currentPrice.price)}
          </p>
          <p className={`text-sm ${
            currentPrice.changePercent24h > 0 ? 'text-success' : 'text-danger'
          }`}>
            {currentPrice.changePercent24h > 0 ? '+' : ''}
            {currentPrice.changePercent24h?.toFixed(2)}% (24h)
          </p>
        </div>
      )}

      {/* 호가 테이블 */}
      <div className="bg-card rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-textSecondary">호가 데이터 로딩 중...</p>
          </div>
        ) : !isConnected ? (
          <div className="p-8 text-center">
            <p className="text-danger mb-2">연결 끊김</p>
            <p className="text-textSecondary text-sm">
              WebSocket 연결을 확인해주세요
            </p>
          </div>
        ) : !orderBookData ? (
          <div className="p-8 text-center">
            <p className="text-textSecondary">호가 데이터가 없습니다</p>
          </div>
        ) : (
          <div>
            {/* 테이블 헤더 */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-background border-b border-border text-sm font-medium text-textSecondary">
              <div className="text-left">가격 (USD)</div>
              <div className="text-center">수량</div>
              <div className="text-right">총액 (USD)</div>
            </div>

            {/* 매도 호가 (빨간색) */}
            <div className="space-y-1 p-4 border-b border-border">
              <div className="text-sm font-medium text-danger mb-2">
                매도 호가 (Ask)
              </div>
              {orderBookData.asks.slice(0, 10).map((ask, index) => (
                <div
                  key={`ask-${index}`}
                  className="grid grid-cols-3 gap-4 text-sm hover:bg-danger/5 transition-colors p-1 rounded"
                >
                  <div className="text-left text-danger font-medium">
                    ${formatPrice(ask.price)}
                  </div>
                  <div className="text-center text-text">
                    {formatAmount(ask.amount)}
                  </div>
                  <div className="text-right text-textSecondary">
                    ${formatAmount(ask.total)}
                  </div>
                </div>
              ))}
            </div>

            {/* 현재가 구분선 */}
            <div className="p-4 bg-primary/5 border-y border-border text-center">
              <div className="text-sm text-textSecondary mb-1">현재가</div>
              <div className="text-lg font-bold text-primary">
                ${currentPrice ? formatPrice(currentPrice.price) : '---'}
              </div>
            </div>

            {/* 매수 호가 (초록색) */}
            <div className="space-y-1 p-4">
              <div className="text-sm font-medium text-success mb-2">
                매수 호가 (Bid)
              </div>
              {orderBookData.bids.slice(0, 10).map((bid, index) => (
                <div
                  key={`bid-${index}`}
                  className="grid grid-cols-3 gap-4 text-sm hover:bg-success/5 transition-colors p-1 rounded"
                >
                  <div className="text-left text-success font-medium">
                    ${formatPrice(bid.price)}
                  </div>
                  <div className="text-center text-text">
                    {formatAmount(bid.amount)}
                  </div>
                  <div className="text-right text-textSecondary">
                    ${formatAmount(bid.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 호가창 정보 */}
      <div className="bg-card p-4 rounded-lg">
        <div className="text-sm text-textSecondary space-y-2">
          <p>
            <strong>데이터 제공:</strong> Bitget API
          </p>
          <p>
            <strong>업데이트:</strong> 실시간 (5초마다 갱신)
          </p>
          <p>
            <strong>스프레드:</strong> 매도 최저가와 매수 최고가의 차이
          </p>
          {orderBookData && (
            <p>
              <strong>마지막 업데이트:</strong> {new Date(orderBookData.timestamp).toLocaleTimeString('ko-KR')}
            </p>
          )}
          {!isConnected && (
            <p className="text-warning">
              <strong>알림:</strong> 현재 실시간 연결이 끊어진 상태입니다
            </p>
          )}
        </div>
      </div>

      {/* 거래 팁 */}
      <div className="bg-card p-4 rounded-lg">
        <h4 className="text-lg font-medium text-text mb-3">호가창 이용 팁</h4>
        <div className="text-sm text-textSecondary space-y-2">
          <p>• <span className="text-danger">빨간색 (Ask)</span>: 매도 주문 - 이 가격에 살 수 있습니다</p>
          <p>• <span className="text-success">초록색 (Bid)</span>: 매수 주문 - 이 가격에 팔 수 있습니다</p>
          <p>• 스프레드가 좁을수록 유동성이 높은 상태입니다</p>
          <p>• 실제 거래 시 Bitget에서 최신 호가를 확인하세요</p>
        </div>
      </div>
    </div>
  );
}