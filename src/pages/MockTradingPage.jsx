import { useState, useEffect } from 'react';
import { usePrices } from '../contexts';
import { formatKRW, formatUSD, formatNumber } from '../utils';
import { TrendingUp, TrendingDown, Wallet, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import CoinLogo from '../components/Common/CoinLogo';

export default function MockTradingPage() {
  const { prices, upbitPrices, exchangeRate } = usePrices();
  
  // 초기 자본금 1000만원
  const INITIAL_BALANCE = 10000000;
  
  // 로컬스토리지에서 데이터 불러오기
  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('mockTradingData');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      balance: INITIAL_BALANCE,
      portfolio: {},
      transactions: [],
      totalInvested: 0,
      createdAt: new Date().toISOString()
    };
  };

  const [tradingData, setTradingData] = useState(loadFromLocalStorage);
  const [selectedCoin, setSelectedCoin] = useState('');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
  const [showTransactions, setShowTransactions] = useState(false);

  // 데이터 변경시 로컬스토리지에 저장
  useEffect(() => {
    localStorage.setItem('mockTradingData', JSON.stringify(tradingData));
  }, [tradingData]);

  // 현재 포트폴리오 가치 계산
  const calculatePortfolioValue = () => {
    let totalValue = 0;
    Object.entries(tradingData.portfolio).forEach(([symbol, data]) => {
      const currentPrice = upbitPrices[symbol]?.trade_price || 0;
      totalValue += data.quantity * currentPrice;
    });
    return totalValue;
  };

  const portfolioValue = calculatePortfolioValue();
  const totalAssets = tradingData.balance + portfolioValue;
  const profit = totalAssets - INITIAL_BALANCE;
  const profitRate = ((totalAssets - INITIAL_BALANCE) / INITIAL_BALANCE) * 100;

  // 거래 실행
  const executeTrade = () => {
    if (!selectedCoin || !tradeAmount || parseFloat(tradeAmount) <= 0) {
      alert('코인과 수량을 올바르게 입력해주세요.');
      return;
    }

    const amount = parseFloat(tradeAmount);
    const currentPrice = upbitPrices[selectedCoin]?.trade_price;
    
    if (!currentPrice) {
      alert('현재 가격을 불러올 수 없습니다.');
      return;
    }

    const totalCost = amount * currentPrice;

    if (tradeType === 'buy') {
      // 매수
      if (totalCost > tradingData.balance) {
        alert('잔액이 부족합니다.');
        return;
      }

      const newPortfolio = { ...tradingData.portfolio };
      if (newPortfolio[selectedCoin]) {
        // 평균 매수가 계산
        const prevTotal = newPortfolio[selectedCoin].quantity * newPortfolio[selectedCoin].avgPrice;
        const newTotal = prevTotal + totalCost;
        const newQuantity = newPortfolio[selectedCoin].quantity + amount;
        
        newPortfolio[selectedCoin] = {
          quantity: newQuantity,
          avgPrice: newTotal / newQuantity
        };
      } else {
        newPortfolio[selectedCoin] = {
          quantity: amount,
          avgPrice: currentPrice
        };
      }

      const transaction = {
        id: Date.now(),
        type: 'buy',
        symbol: selectedCoin,
        quantity: amount,
        price: currentPrice,
        total: totalCost,
        timestamp: new Date().toISOString()
      };

      setTradingData({
        ...tradingData,
        balance: tradingData.balance - totalCost,
        portfolio: newPortfolio,
        transactions: [transaction, ...tradingData.transactions],
        totalInvested: tradingData.totalInvested + totalCost
      });

    } else {
      // 매도
      if (!tradingData.portfolio[selectedCoin] || tradingData.portfolio[selectedCoin].quantity < amount) {
        alert('보유 수량이 부족합니다.');
        return;
      }

      const newPortfolio = { ...tradingData.portfolio };
      newPortfolio[selectedCoin].quantity -= amount;
      
      if (newPortfolio[selectedCoin].quantity === 0) {
        delete newPortfolio[selectedCoin];
      }

      const transaction = {
        id: Date.now(),
        type: 'sell',
        symbol: selectedCoin,
        quantity: amount,
        price: currentPrice,
        total: totalCost,
        timestamp: new Date().toISOString()
      };

      setTradingData({
        ...tradingData,
        balance: tradingData.balance + totalCost,
        portfolio: newPortfolio,
        transactions: [transaction, ...tradingData.transactions]
      });
    }

    // 입력 초기화
    setTradeAmount('');
    setSelectedCoin('');
  };

  // 초기화
  const resetAccount = () => {
    if (window.confirm('모든 거래 기록과 포트폴리오가 초기화됩니다. 계속하시겠습니까?')) {
      const newData = {
        balance: INITIAL_BALANCE,
        portfolio: {},
        transactions: [],
        totalInvested: 0,
        createdAt: new Date().toISOString()
      };
      setTradingData(newData);
      localStorage.setItem('mockTradingData', JSON.stringify(newData));
    }
  };

  return (
    <div className="container mx-auto px-3 py-4 md:px-4 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">모의투자</h1>

      {/* 계좌 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-section p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-textSecondary text-sm">총 자산</span>
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-text">{formatKRW(totalAssets)}</p>
          <p className={`text-sm mt-1 ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
            {profit >= 0 ? '+' : ''}{formatKRW(profit)} ({profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%)
          </p>
        </div>

        <div className="bg-section p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-textSecondary text-sm">현금 잔액</span>
            <ShoppingCart className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-text">{formatKRW(tradingData.balance)}</p>
          <p className="text-sm text-textSecondary mt-1">
            {((tradingData.balance / totalAssets) * 100).toFixed(1)}% 비중
          </p>
        </div>

        <div className="bg-section p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-textSecondary text-sm">투자 금액</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-bold text-text">{formatKRW(portfolioValue)}</p>
          <p className="text-sm text-textSecondary mt-1">
            {Object.keys(tradingData.portfolio).length}개 코인 보유
          </p>
        </div>

        <div className="bg-section p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-textSecondary text-sm">거래 횟수</span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-xl font-bold text-text">{tradingData.transactions.length}회</p>
          <button 
            onClick={resetAccount}
            className="text-sm text-danger hover:text-danger/80 mt-1"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 거래 패널 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 거래 입력 */}
        <div className="bg-section p-6 rounded-lg">
          <h2 className="text-lg font-bold text-text mb-4">거래하기</h2>
          
          <div className="space-y-4">
            {/* 거래 타입 선택 */}
            <div className="flex gap-2">
              <button
                onClick={() => setTradeType('buy')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  tradeType === 'buy' 
                    ? 'bg-success text-white' 
                    : 'bg-card text-textSecondary hover:bg-card/80'
                }`}
              >
                매수
              </button>
              <button
                onClick={() => setTradeType('sell')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  tradeType === 'sell' 
                    ? 'bg-danger text-white' 
                    : 'bg-card text-textSecondary hover:bg-card/80'
                }`}
              >
                매도
              </button>
            </div>

            {/* 코인 선택 */}
            <div>
              <label className="block text-sm text-textSecondary mb-2">코인 선택</label>
              <select
                value={selectedCoin}
                onChange={(e) => setSelectedCoin(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary"
              >
                <option value="">코인을 선택하세요</option>
                {Object.keys(upbitPrices).sort().map(symbol => (
                  <option key={symbol} value={symbol}>
                    {symbol} - {formatKRW(upbitPrices[symbol].trade_price)}
                  </option>
                ))}
              </select>
            </div>

            {/* 수량 입력 */}
            <div>
              <label className="block text-sm text-textSecondary mb-2">수량</label>
              <input
                type="number"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                placeholder="0"
                step="0.0001"
                min="0"
                className="w-full bg-card border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary"
              />
              {selectedCoin && tradeAmount && (
                <p className="text-sm text-textSecondary mt-2">
                  예상 {tradeType === 'buy' ? '매수' : '매도'} 금액: {formatKRW(parseFloat(tradeAmount || 0) * (upbitPrices[selectedCoin]?.trade_price || 0))}
                </p>
              )}
            </div>

            {/* 거래 버튼 */}
            <button
              onClick={executeTrade}
              disabled={!selectedCoin || !tradeAmount}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                tradeType === 'buy'
                  ? 'bg-success hover:bg-success/80 text-white disabled:bg-success/50'
                  : 'bg-danger hover:bg-danger/80 text-white disabled:bg-danger/50'
              }`}
            >
              {tradeType === 'buy' ? '매수하기' : '매도하기'}
            </button>
          </div>

          {/* 보유 현황 (매도시) */}
          {tradeType === 'sell' && selectedCoin && tradingData.portfolio[selectedCoin] && (
            <div className="mt-4 p-3 bg-card rounded-lg">
              <p className="text-sm text-textSecondary">보유 수량</p>
              <p className="text-lg font-bold text-text">
                {formatNumber(tradingData.portfolio[selectedCoin].quantity, 8)} {selectedCoin}
              </p>
              <p className="text-sm text-textSecondary">
                평균 매수가: {formatKRW(tradingData.portfolio[selectedCoin].avgPrice)}
              </p>
            </div>
          )}
        </div>

        {/* 포트폴리오 */}
        <div className="lg:col-span-2 bg-section p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text">포트폴리오</h2>
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="text-sm text-primary hover:text-primary/80"
            >
              {showTransactions ? '포트폴리오 보기' : '거래내역 보기'}
            </button>
          </div>

          {!showTransactions ? (
            <div className="overflow-x-auto">
              {Object.keys(tradingData.portfolio).length === 0 ? (
                <div className="text-center py-8 text-textSecondary">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>보유한 코인이 없습니다.</p>
                  <p className="text-sm mt-2">매수하여 포트폴리오를 구성해보세요.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-sm text-textSecondary font-medium">코인</th>
                      <th className="text-right py-3 text-sm text-textSecondary font-medium">보유수량</th>
                      <th className="text-right py-3 text-sm text-textSecondary font-medium">평균매수가</th>
                      <th className="text-right py-3 text-sm text-textSecondary font-medium">현재가</th>
                      <th className="text-right py-3 text-sm text-textSecondary font-medium">평가금액</th>
                      <th className="text-right py-3 text-sm text-textSecondary font-medium">수익률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(tradingData.portfolio).map(([symbol, data]) => {
                      const currentPrice = upbitPrices[symbol]?.trade_price || 0;
                      const currentValue = data.quantity * currentPrice;
                      const investedValue = data.quantity * data.avgPrice;
                      const profit = currentValue - investedValue;
                      const profitRate = ((currentPrice - data.avgPrice) / data.avgPrice) * 100;

                      return (
                        <tr key={symbol} className="border-b border-border/50 hover:bg-card/50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <CoinLogo symbol={symbol} className="w-6 h-6" />
                              <span className="font-medium text-text">{symbol}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 text-text">
                            {formatNumber(data.quantity, 8)}
                          </td>
                          <td className="text-right py-3 text-text">
                            {formatKRW(data.avgPrice)}
                          </td>
                          <td className="text-right py-3 text-text">
                            {formatKRW(currentPrice)}
                          </td>
                          <td className="text-right py-3 text-text">
                            {formatKRW(currentValue)}
                          </td>
                          <td className="text-right py-3">
                            <div className={`${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                              <p>{profit >= 0 ? '+' : ''}{formatKRW(profit)}</p>
                              <p className="text-sm">
                                {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
                              </p>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {tradingData.transactions.length === 0 ? (
                <div className="text-center py-8 text-textSecondary">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>거래 내역이 없습니다.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-sm text-textSecondary font-medium">시간</th>
                      <th className="text-left py-3 text-sm text-textSecondary font-medium">구분</th>
                      <th className="text-left py-3 text-sm text-textSecondary font-medium">코인</th>
                      <th className="text-right py-3 text-sm text-textSecondary font-medium">수량</th>
                      <th className="text-right py-3 text-sm text-textSecondary font-medium">가격</th>
                      <th className="text-right py-3 text-sm text-textSecondary font-medium">거래금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradingData.transactions.slice(0, 20).map((tx) => (
                      <tr key={tx.id} className="border-b border-border/50 hover:bg-card/50">
                        <td className="py-3 text-textSecondary text-sm">
                          {new Date(tx.timestamp).toLocaleString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            tx.type === 'buy' 
                              ? 'bg-success/20 text-success' 
                              : 'bg-danger/20 text-danger'
                          }`}>
                            {tx.type === 'buy' ? '매수' : '매도'}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <CoinLogo symbol={tx.symbol} className="w-5 h-5" />
                            <span className="font-medium text-text">{tx.symbol}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 text-text">
                          {formatNumber(tx.quantity, 8)}
                        </td>
                        <td className="text-right py-3 text-text">
                          {formatKRW(tx.price)}
                        </td>
                        <td className="text-right py-3 text-text font-medium">
                          {formatKRW(tx.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-6 p-4 bg-card rounded-lg border border-border">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-textSecondary">
            <p className="font-medium text-text mb-1">모의투자 안내</p>
            <ul className="space-y-1">
              <li>• 실제 돈이 아닌 가상의 자금으로 투자를 연습할 수 있습니다.</li>
              <li>• 초기 자본금 1,000만원으로 시작하며, 언제든지 초기화할 수 있습니다.</li>
              <li>• 실시간 업비트 가격을 기준으로 거래가 체결됩니다.</li>
              <li>• 모든 거래 기록은 브라우저에 저장되며, 다른 기기에서는 확인할 수 없습니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}