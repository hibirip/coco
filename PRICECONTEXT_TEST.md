# PriceContext 테스트 가이드

## Step 19 완료 상태

✅ **PriceContext 구조 준비 완료**

### 1. PriceContext.jsx 생성됨
- 위치: `src/contexts/PriceContext.jsx`
- 초기 상태: `prices`, `isConnected`, `exchangeRate` 등
- 주요 10개 코인 심볼 상수 정의
- `calculateKimchi` 함수 포함

### 2. Provider 설정 완료
- `main.jsx`에 PriceProvider 추가됨
- AuthProvider 내부에 중첩 구조
- 전역 상태 접근 가능

### 3. 주요 기능

#### 상태 관리
```javascript
const {
  prices,           // Bitget 가격 데이터
  upbitPrices,      // Upbit 가격 데이터
  isConnected,      // WebSocket 연결 상태
  exchangeRate,     // USD/KRW 환율
  stats,            // 통계 정보
  errors            // 에러 목록
} = usePrices();
```

#### 주요 코인 (10개)
1. BTC (Bitcoin)
2. ETH (Ethereum)
3. XRP (XRP)
4. ADA (Cardano)
5. SOL (Solana)
6. DOT (Polkadot)
7. LINK (Chainlink)
8. MATIC (Polygon)
9. UNI (Uniswap)
10. AVAX (Avalanche)

#### 액션 함수
- `updatePrice()` - 개별 가격 업데이트
- `updateUpbitPrice()` - 업비트 가격 업데이트
- `updateExchangeRate()` - 환율 업데이트
- `calculateKimchiPremium()` - 김치프리미엄 계산
- `getAllKimchiPremiums()` - 전체 김치프리미엄 계산

## 테스트 방법

### 1. 브라우저 콘솔 확인
개발 서버 실행 후 브라우저 콘솔에서 다음 로그 확인:
```
📊 PriceContext 초기 상태:
  - 주요 코인 수: 10
  - 연결 상태: false
  - 통계: {totalCoins: 10, connectedCoins: 0, kimchiPremiumCount: 0}
  - 첫 번째 코인: {symbol: 'BTCUSDT', name: 'Bitcoin', ...}
```

### 2. 홈페이지 PriceContext 섹션
- WebSocket 연결 상태 표시
- 10개 주요 코인 목록 표시
- 통계 정보 표시
- 테스트 버튼으로 상세 정보 확인

### 3. 코드에서 사용 예시
```javascript
import { usePrices } from './contexts';

function MyComponent() {
  const { 
    MAJOR_COINS, 
    calculateKimchiPremium,
    isConnected 
  } = usePrices();
  
  return (
    <div>
      <p>연결 상태: {isConnected ? '연결됨' : '연결 안됨'}</p>
      <p>주요 코인: {Object.keys(MAJOR_COINS).length}개</p>
    </div>
  );
}
```

## 다음 단계 (Step 20)

PriceContext가 준비되었으므로 이제 WebSocket 데이터로 실제 상태를 채울 차례입니다:

1. WebSocket 연결 구현
2. 실시간 가격 데이터 수신
3. Context 상태 업데이트
4. UI에 실시간 데이터 표시

## 예상되는 동작

현재는 빈 상태이지만, WebSocket 연결 후에는:
- `isConnected`: `true`
- `prices`: 실시간 Bitget 가격 데이터
- `upbitPrices`: 실시간 Upbit 가격 데이터
- `exchangeRate`: 실제 USD/KRW 환율
- `stats.connectedCoins`: 10 (전체 코인 연결 시)
- `stats.kimchiPremiumCount`: 김치프리미엄 계산 가능한 코인 수