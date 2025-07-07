/**
 * Sparkline - 미니 라인 차트 컴포넌트
 * 24시간 가격 변동을 시각화하는 작은 차트
 */

import { useMemo } from 'react';

/**
 * Sparkline 컴포넌트
 * @param {Object} props
 * @param {Array} props.data - 가격 데이터 배열 [price1, price2, ...]
 * @param {number} props.width - 차트 너비 (기본값: 100)
 * @param {number} props.height - 차트 높이 (기본값: 40)
 * @param {string} props.strokeColor - 라인 색상 (기본값: 자동 계산)
 * @param {number} props.strokeWidth - 라인 두께 (기본값: 2)
 * @param {boolean} props.showGradient - 그라디언트 배경 표시 여부 (기본값: true)
 * @param {string} props.className - 추가 CSS 클래스
 */
export default function Sparkline({
  data = [],
  width = 100,
  height = 40,
  strokeColor,
  strokeWidth = 2,
  showGradient = true,
  className = ''
}) {
  // 데이터 처리 및 경로 생성
  const { pathData, trendColor, isPositive } = useMemo(() => {
    if (!data || data.length < 2) {
      return {
        pathData: '',
        trendColor: '#6B7280',
        isPositive: false
      };
    }

    // 유효한 숫자 데이터만 필터링
    const validData = data.filter(d => typeof d === 'number' && !isNaN(d));
    
    if (validData.length < 2) {
      return {
        pathData: '',
        trendColor: '#6B7280',
        isPositive: false
      };
    }

    // 최대값, 최소값 계산
    const minPrice = Math.min(...validData);
    const maxPrice = Math.max(...validData);
    const priceRange = maxPrice - minPrice;
    
    // 범위가 0이면 수평선으로 표시
    if (priceRange === 0) {
      const y = height / 2;
      return {
        pathData: `M 0 ${y} L ${width} ${y}`,
        trendColor: '#6B7280',
        isPositive: false
      };
    }

    // 트렌드 계산 (첫 번째 vs 마지막 가격)
    const firstPrice = validData[0];
    const lastPrice = validData[validData.length - 1];
    const isPositiveTrend = lastPrice >= firstPrice;
    
    // 색상 결정
    const trendColor = strokeColor || (isPositiveTrend ? '#10B981' : '#EF4444'); // green : red

    // SVG 경로 데이터 생성
    const points = validData.map((price, index) => {
      const x = (index / (validData.length - 1)) * width;
      const y = height - ((price - minPrice) / priceRange) * height;
      return { x, y };
    });

    // 부드러운 곡선을 위한 경로 생성 (베지어 곡선 사용)
    let pathData = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      // 간단한 베지어 곡선 제어점 계산
      const cpx1 = prev.x + (curr.x - prev.x) * 0.5;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (curr.x - prev.x) * 0.5;
      const cpy2 = curr.y;
      
      pathData += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
    }

    return {
      pathData,
      trendColor,
      isPositive: isPositiveTrend
    };
  }, [data, width, height, strokeColor]);

  // 그라디언트 ID 생성 (컴포넌트 인스턴스별로 고유)
  const gradientId = useMemo(() => 
    `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`, 
    []
  );

  if (!pathData) {
    return (
      <div 
        className={`flex items-center justify-center text-textSecondary text-xs ${className}`}
        style={{ width, height }}
      >
        <span>차트 없음</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        style={{ display: 'block' }}
      >
        {/* 그라디언트 정의 */}
        {showGradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0.05" />
            </linearGradient>
          </defs>
        )}
        
        {/* 그라디언트 배경 영역 */}
        {showGradient && (
          <path
            d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
            fill={`url(#${gradientId})`}
          />
        )}
        
        {/* 메인 라인 */}
        <path
          d={pathData}
          fill="none"
          stroke={trendColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />
        
        {/* 마지막 점 강조 */}
        {data.length > 0 && (
          <circle
            cx={width}
            cy={height - ((data[data.length - 1] - Math.min(...data)) / (Math.max(...data) - Math.min(...data))) * height}
            r="2"
            fill={trendColor}
            className="opacity-80"
          />
        )}
      </svg>
      
      {/* 트렌드 표시 (선택적) */}
      <div className="absolute -top-1 -right-1">
        <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-success' : 'bg-danger'} opacity-70`}></div>
      </div>
    </div>
  );
}

/**
 * SparklineWithTrend - 트렌드 정보가 포함된 스파크라인
 * @param {Object} props
 * @param {Array} props.data - 가격 데이터 배열
 * @param {number} props.changePercent - 24시간 변동률
 * @param {string} props.symbol - 코인 심볼
 */
export function SparklineWithTrend({ data, changePercent, symbol, ...props }) {
  const isPositive = changePercent >= 0;
  
  return (
    <Sparkline
      data={data}
      strokeColor={isPositive ? '#10B981' : '#EF4444'}
      {...props}
    />
  );
}

/**
 * MockSparkline - 데이터가 없을 때 Mock 스파크라인 생성
 * @param {Object} props
 * @param {number} props.changePercent - 변동률 (색상 결정용)
 */
export function MockSparkline({ changePercent = 0, ...props }) {
  // Mock 데이터 생성 (24개 포인트, 1시간 간격)
  const mockData = useMemo(() => {
    const basePrice = 100;
    const points = [];
    let currentPrice = basePrice;
    
    for (let i = 0; i < 24; i++) {
      // 변동률에 따른 전체적인 트렌드 + 랜덤 변동
      const trendFactor = (changePercent / 100) * (i / 23); // 점진적 변화
      const randomFactor = (Math.random() - 0.5) * 0.02; // ±1% 랜덤 변동
      
      currentPrice = basePrice * (1 + trendFactor + randomFactor);
      points.push(currentPrice);
    }
    
    return points;
  }, [changePercent]);
  
  return (
    <Sparkline
      data={mockData}
      strokeColor={changePercent >= 0 ? '#10B981' : '#EF4444'}
      {...props}
    />
  );
}