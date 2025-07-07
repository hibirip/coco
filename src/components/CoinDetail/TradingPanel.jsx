/**
 * TradingPanel - 바이낸스 스타일 매매 패널
 * Spot, 매수/매도, 지정가/시장가 주문 기능
 */

import { useState } from 'react';
import { formatUSD, formatNumber } from '../../utils';

export default function TradingPanel({ symbol, currentPrice, onTrade }) {
  const [orderType, setOrderType] = useState('spot'); // spot, margin, bots
  const [side, setSide] = useState('buy'); // buy, sell
  const [priceType, setPriceType] = useState('limit'); // limit, market, oco
  const [price, setPrice] = useState(currentPrice || 0);
  const [quantity, setQuantity] = useState('');
  const [total, setTotal] = useState('');
  const [percentageButtons] = useState([25, 50, 75, 100]);

  // 가격이 변경될 때 총액 자동 계산
  const handlePriceChange = (value) => {
    setPrice(value);
    if (quantity) {
      setTotal((value * parseFloat(quantity)).toFixed(6));
    }
  };

  // 수량이 변경될 때 총액 자동 계산
  const handleQuantityChange = (value) => {
    setQuantity(value);
    if (price) {
      setTotal((price * parseFloat(value || 0)).toFixed(6));
    }
  };

  // 총액이 변경될 때 수량 자동 계산
  const handleTotalChange = (value) => {
    setTotal(value);
    if (price) {
      setQuantity((parseFloat(value || 0) / price).toFixed(6));
    }
  };

  // 퍼센트 버튼 클릭
  const handlePercentageClick = (percentage) => {
    // 실제로는 사용자의 잔고를 기반으로 계산해야 함
    const mockBalance = 1000; // Mock USDT balance
    const availableAmount = side === 'buy' ? mockBalance : mockBalance / (currentPrice || 1);
    const targetAmount = (availableAmount * percentage) / 100;
    
    if (side === 'buy') {
      const targetQuantity = targetAmount / (price || currentPrice || 1);
      handleQuantityChange(targetQuantity.toFixed(6));
    } else {
      handleQuantityChange(targetAmount.toFixed(6));
    }
  };

  // 주문 실행
  const handleSubmitOrder = () => {
    if (!price || !quantity) {
      alert('가격과 수량을 입력해주세요');
      return;
    }

    const orderData = {
      symbol,
      side,
      type: priceType,
      price: parseFloat(price),
      quantity: parseFloat(quantity),
      total: parseFloat(total)
    };

    if (onTrade) {
      onTrade(orderData);
    } else {
      alert(`${side === 'buy' ? '매수' : '매도'} 주문이 실행됩니다.\n가격: ${formatUSD(price)}\n수량: ${quantity}\n총액: ${formatUSD(total)}`);
    }
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 h-[656px] overflow-y-auto border border-gray-800/50 shadow-2xl">
      {/* 상단 탭 (Spot, Margin, Bots) */}
      <div className="flex items-center gap-1 mb-6">
        {[
          { key: 'spot', label: 'Spot' },
          { key: 'margin', label: 'Margin' },
          { key: 'bots', label: 'Bots' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setOrderType(key)}
            className={`px-4 py-2 text-sm font-medium rounded transition-all duration-200 ${
              orderType === key
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button className="w-6 h-6 bg-gray-800/50 rounded hover:bg-gray-700/50 transition-colors flex items-center justify-center">
            <span className="text-xs text-gray-400">⚙</span>
          </button>
          <button className="w-6 h-6 bg-gray-800/50 rounded hover:bg-gray-700/50 transition-colors flex items-center justify-center relative">
            <span className="text-xs text-gray-400">?</span>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          </button>
        </div>
      </div>

      {/* 매수/매도 버튼 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 ${
            side === 'buy'
              ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/25'
              : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 ${
            side === 'sell'
              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25'
              : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Sell
        </button>
      </div>

      {/* 주문 타입 (Limit, Market, OCO) */}
      <div className="flex items-center gap-1 mb-6">
        {[
          { key: 'limit', label: 'Limit' },
          { key: 'market', label: 'Market' },
          { key: 'oco', label: 'OCO' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPriceType(key)}
            className={`px-3 py-1 text-sm rounded transition-all duration-200 ${
              priceType === key
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto">
          <button className="w-5 h-5 bg-gray-800/50 rounded-full hover:bg-gray-700/50 transition-colors flex items-center justify-center">
            <span className="text-xs text-gray-400">i</span>
          </button>
        </div>
      </div>

      {/* 가격 입력 */}
      {priceType !== 'market' && (
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Price</label>
          <div className="relative">
            <input
              type="number"
              value={price}
              onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all duration-200"
              step="0.000001"
              min="0"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-sm text-gray-500">USDT</span>
              <button className="text-textSecondary hover:text-text">
                <span className="text-xs">▲</span>
              </button>
            </div>
            <button className="absolute right-12 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-xs text-white rounded transition-colors">
              BBO
            </button>
          </div>
        </div>
      )}

      {/* 수량 입력 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">Quantity</label>
        <div className="relative">
          <input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all duration-200"
            step="0.000001"
            min="0"
            placeholder="0"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="text-sm text-gray-500">
              {symbol?.replace('USDT', '') || 'BTC'}
            </span>
          </div>
        </div>

        {/* 퍼센트 버튼 */}
        <div className="flex items-center justify-between mt-3">
          {percentageButtons.map((percent) => (
            <button
              key={percent}
              onClick={() => handlePercentageClick(percent)}
              className="w-3 h-3 bg-gray-700 rounded-full hover:bg-blue-500 transition-all duration-200 relative group cursor-pointer"
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 bg-gray-800 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {percent}%
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* 총액 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">Total</label>
        <div className="relative">
          <input
            type="number"
            value={total}
            onChange={(e) => handleTotalChange(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all duration-200"
            step="0.000001"
            min="0"
            placeholder="0"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="text-sm text-gray-500">USDT</span>
          </div>
        </div>
      </div>

      {/* 사용 가능한 잔고 */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-gray-400">Available</span>
        <span className="text-sm text-gray-300">-- USDT</span>
      </div>

      {/* 주문 버튼 */}
      <div className="space-y-3">
        <button
          onClick={handleSubmitOrder}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:from-blue-500 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-blue-500/25"
        >
          Sign Up
        </button>
        <button className="w-full py-3 bg-gray-800/50 text-gray-300 rounded-lg font-medium hover:bg-gray-700/50 hover:text-white transition-all duration-200 border border-gray-700/50">
          Log in
        </button>
      </div>

      {/* 계정 섹션 */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-white mb-4">Account</h4>
        <div className="grid grid-cols-2 gap-3">
          <button className="py-3 bg-gray-800/50 text-gray-300 rounded-lg font-medium hover:bg-gray-700/50 hover:text-white transition-all duration-200 border border-gray-700/50">
            Deposit
          </button>
          <button className="py-3 bg-gray-800/50 text-gray-300 rounded-lg font-medium hover:bg-gray-700/50 hover:text-white transition-all duration-200 border border-gray-700/50">
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
}