# MarketOverview 컴포넌트 가이드

## Step 24 완료 상태

✅ **PricesPage 상단 시장 동향 차트 구현 완료**

### 구현된 기능

#### 1. MarketOverview 컴포넌트 (`src/components/Prices/MarketOverview.jsx`)
- **시가총액 카드**: 전체 시장 시가총액 및 24시간 변동률
- **거래량 카드**: 24시간 총 거래량 및 변동률
- **BTC 도미넌스 카드**: 비트코인 시장 점유율 및 프로그레스 바
- **공포&탐욕 지수 카드**: 시장 심리 지수 및 색상별 표시

#### 2. 컴포넌트 구성

##### 💰 **시가총액 카드**
```javascript
// 시가총액 표시
totalMarketCap: 2420000000000, // $2.42T
totalMarketCapChange: 2.34, // +2.34%

// 포맷팅 함수
const formatMarketCap = (value) => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
};
```

##### 📊 **거래량 카드**
```javascript
// 24시간 거래량
total24hVolume: 89500000000, // $89.5B
volume24hChange: -5.67, // -5.67%

// 거래량 포맷팅
const formatVolume = (value) => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
};
```

##### ₿ **BTC 도미넌스 카드**
```javascript
// BTC 시장 점유율
btcDominance: 52.3, // 52.3%
btcDominanceChange: 0.8, // +0.8%

// 프로그레스 바
<div className="w-full bg-card rounded-full h-2">
  <div 
    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
    style={{ width: `${MARKET_DATA.btcDominance}%` }}
  ></div>
</div>
```

##### 😈 **공포&탐욕 지수 카드**
```javascript
// 공포&탐욕 지수
fearGreedIndex: 72, // 72 (탐욕)
fearGreedLabel: '탐욕'

// 색상 설정
const FEAR_GREED_CONFIG = {
  ranges: [
    { min: 0, max: 24, label: '극단적 공포', color: 'bg-red-600' },
    { min: 25, max: 49, label: '공포', color: 'bg-orange-600' },
    { min: 50, max: 74, label: '탐욕', color: 'bg-yellow-600' },
    { min: 75, max: 100, label: '극단적 탐욕', color: 'bg-green-600' }
  ]
};
```

#### 3. 반응형 레이아웃

##### 📱 **모바일 (< 1024px)**
```css
/* 2x2 그리드 */
.grid-cols-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

##### 🖥️ **데스크톱 (≥ 1024px)**
```css
/* 4x1 그리드 */
.lg:grid-cols-4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
```

#### 4. 카드 디자인

##### 🎨 **시각적 요소**
```javascript
// 카드 스타일
className="bg-section p-6 rounded-lg border border-border hover:border-primary/50 transition-colors"

// 아이콘 컨테이너
<div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
  <span className="text-primary text-lg">💰</span>
</div>

// 이모지 아이콘
- 시가총액: 💰
- 거래량: 📊
- BTC 도미넌스: ₿
- 공포&탐욕: 😱😰😈🤑 (지수에 따라 변화)
```

#### 5. 실시간 데이터 연동

##### 🔌 **PriceContext 연결**
```javascript
// 실시간 데이터 가져오기
const {
  prices,
  upbitPrices,
  exchangeRate,
  stats,
  isConnected,
  upbitIsConnected
} = usePrices();

// 연결 상태 표시
<div className="flex items-center gap-2">
  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`}></div>
  <span>실시간 연결: {stats.connectedCoins}/{stats.totalCoins}개</span>
</div>
```

#### 6. 하단 정보 섹션

##### 📊 **실시간 상태 표시**
```javascript
// 연결 상태
- 실시간 연결: 활성 코인 수 / 전체 코인 수
- 김치프리미엄: 계산 중인 코인 수
- 마지막 업데이트: 현재 시간

// 범례
- 극단적 공포: 빨간색 (0-24)
- 공포: 주황색 (25-49)
- 탐욕: 노란색 (50-74)
- 극단적 탐욕: 초록색 (75-100)
```

### PricesPage 통합

#### 1. 컴포넌트 위치
```javascript
// PricesPage.jsx 내 배치
<div className="container mx-auto px-4 py-8 space-y-6">
  {/* 페이지 헤더 */}
  
  {/* 시장 동향 차트 */}
  <MarketOverview className="mb-6" />
  
  {/* 코인별 동향 요약 */}
  {/* 검색 및 필터 컨트롤 */}
  {/* 메인 코인 테이블 */}
</div>
```

#### 2. 스타일링 통합
```javascript
// 일관된 디자인 언어
- 배경: bg-section
- 테두리: border-border
- 호버: hover:border-primary/50
- 텍스트: text-primary, text-textSecondary
- 여백: p-6, gap-4
```

### 더미 데이터 설정

#### 1. 시장 지표 더미 데이터
```javascript
const MARKET_DATA = {
  totalMarketCap: 2420000000000, // $2.42T
  totalMarketCapChange: 2.34, // +2.34%
  total24hVolume: 89500000000, // $89.5B
  volume24hChange: -5.67, // -5.67%
  btcDominance: 52.3, // 52.3%
  btcDominanceChange: 0.8, // +0.8%
  fearGreedIndex: 72, // 72 (탐욕)
  fearGreedLabel: '탐욕'
};
```

#### 2. 실제 API 연동 준비
```javascript
// 향후 실제 API로 대체 예정
// - CoinGecko API: 시가총액, 거래량
// - Alternative.me API: 공포&탐욕 지수
// - CoinMarketCap API: BTC 도미넌스
```

### 성능 최적화

#### 1. useMemo 최적화
```javascript
// 공포&탐욕 설정 캐싱
const fearGreedConfig = useMemo(() => {
  return FEAR_GREED_CONFIG.ranges.find(
    range => MARKET_DATA.fearGreedIndex >= range.min && 
             MARKET_DATA.fearGreedIndex <= range.max
  );
}, []);
```

#### 2. useCallback 최적화
```javascript
// 포맷팅 함수 캐싱
const formatMarketCap = useCallback((value) => {
  // 포맷팅 로직
}, []);

const formatVolume = useCallback((value) => {
  // 포맷팅 로직
}, []);
```

### 접근성 (Accessibility)

#### 1. 색상 접근성
```javascript
// 색상 대비 준수
- 텍스트: 충분한 대비율 유지
- 상태: 색상 + 아이콘 조합 사용
- 호버: 명확한 상태 변화
```

#### 2. 스크린 리더 지원
```javascript
// 의미있는 레이블
<h3 className="text-sm font-medium text-textSecondary">시가총액</h3>
<p className="text-xs text-textSecondary">Total Market Cap</p>

// 상태 정보
title={option.desc} // 툴팁 정보 제공
```

### 빌드 검증

#### ✅ **빌드 성공**
```bash
npm run build
# ✓ 1769 modules transformed.
# ✓ built in 1.10s
# dist/index.html 생성 완료
```

#### 📊 **번들 크기**
```bash
dist/assets/index-ChOrP2Jy.css   18.10 kB │ gzip:   4.12 kB
dist/assets/index-BYUIofGP.js   404.92 kB │ gzip: 118.55 kB
```

### 확장 가능성

#### 1. 실제 차트 추가
- Chart.js 또는 Recharts 라이브러리
- 시간별 가격 변화 차트
- 김치프리미엄 트렌드 차트

#### 2. 추가 시장 지표
- 알트코인 시즌 지수
- 24시간 신규 상장 코인
- 시장 변동성 지수

#### 3. 실시간 업데이트
- WebSocket을 통한 실시간 시장 데이터
- 1분 간격 자동 업데이트
- 사용자 설정 가능한 업데이트 주기

## 다음 단계 (Step 25)

MarketOverview 컴포넌트가 완성되었으므로 다음 단계로 진행할 수 있습니다:

1. **실제 API 연동**: 더미 데이터를 실제 API로 대체
2. **차트 시각화**: 시장 동향 차트 추가
3. **알림 시스템**: 급격한 시장 변화 알림
4. **개인화**: 사용자 맞춤 시장 지표 설정