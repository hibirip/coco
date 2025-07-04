# CoinTable 컴포넌트 가이드

## Step 22 완료 상태

✅ **재사용 가능한 CoinTable 컴포넌트 구현 완료**

### 구현된 기능

#### 1. CoinTable 컴포넌트 (`src/components/Common/CoinTable.jsx`)
- **재사용 가능한 설계**: props를 통한 유연한 설정
- **PriceContext 연동**: 실시간 데이터 자동 연결
- **반응형 디자인**: 모바일에서 가로 스크롤 지원
- **접근성**: 키보드 내비게이션 및 의미적 HTML

#### 2. 주요 Props
```javascript
<CoinTable 
  limit={5}              // 표시할 코인 개수 (기본값: 전체)
  showKimchi={true}      // 김치프리미엄 컬럼 표시 (기본값: true)  
  showFavorites={true}   // 즐겨찾기 기능 표시 (기본값: true)
  className="shadow-lg"  // 추가 CSS 클래스
  onCoinClick={handler}  // 커스텀 클릭 핸들러
/>
```

#### 3. 컴포넌트 기능

##### 테이블 컬럼
- **즐겨찾기**: ⭐ 별표 토글 (옵션)
- **코인**: 아이콘 + 이름 + 심볼
- **Bitget (USD)**: 해외 가격 + 24h 변동률
- **업비트 (KRW)**: 국내 가격 + 24h 변동률
- **24h 변동**: 더 큰 변동률 표시
- **김치프리미엄**: 실시간 계산 (옵션)
- **거래량**: 24시간 거래량

##### 상호작용 기능
- **코인 클릭**: 상세 페이지 이동 (`/coin/{symbol}`)
- **즐겨찾기**: 별표 클릭으로 토글
- **호버 효과**: 행과 버튼에 hover 상태
- **반응형**: 모바일에서 가로 스크롤

##### 상태 표시
- **연결 상태**: 실시간/부분연결/연결안됨
- **데이터 개수**: 표시된 코인 수
- **환율 정보**: 현재 USD/KRW 환율
- **김치프리미엄 활성화**: 실시간 계산 여부

### 사용 예시

#### 1. 기본 사용법 (전체 테이블)
```javascript
import { CoinTable } from '../components/Common';

function MyPage() {
  return (
    <div>
      <CoinTable 
        showKimchi={true}
        showFavorites={true}
      />
    </div>
  );
}
```

#### 2. 제한된 테이블 (상위 5개)
```javascript
<CoinTable 
  limit={5}
  showKimchi={false}
  showFavorites={true}
  className="mb-4"
/>
```

#### 3. 간단한 테이블 (즐겨찾기 없이)
```javascript
<CoinTable 
  limit={3}
  showKimchi={true}
  showFavorites={false}
/>
```

#### 4. 커스텀 클릭 핸들러
```javascript
<CoinTable 
  onCoinClick={(symbol) => {
    console.log('Clicked coin:', symbol);
    // 커스텀 로직
  }}
/>
```

### 스타일링

#### CSS 클래스 구조
```css
.bg-section          /* 메인 컨테이너 */
.overflow-x-auto     /* 가로 스크롤 */
.min-w-[640px]       /* 최소 너비 */
.hover:bg-card/50    /* 행 호버 효과 */
.text-primary        /* 주요 텍스트 색상 */
.text-success        /* 상승 (녹색) */
.text-danger         /* 하락 (빨강) */
```

#### 반응형 브레이크포인트
- **모바일**: 가로 스크롤 활성화
- **태블릿**: 컬럼 간격 조정
- **데스크톱**: 전체 테이블 표시

### 데이터 처리

#### 실시간 데이터 소스
- **Bitget WebSocket**: USD 가격 데이터
- **업비트 WebSocket**: KRW 가격 데이터
- **환율 API**: USD/KRW 환율
- **PriceContext**: 통합 상태 관리

#### 김치프리미엄 계산
```javascript
// 자동 계산 로직
const premium = calculateKimchiPremium(symbol);
// 결과: { premium: 2.5, bitgetKrwPrice: 65000000 }
```

#### 데이터 검증
- **유효성 검사**: 가격 데이터 존재 여부
- **정렬**: 코인 우선순위별 정렬
- **필터링**: 데이터 없는 코인 제외

### 에러 처리

#### 연결 상태별 표시
- **연결안됨**: "WebSocket 연결을 확인해주세요"
- **부분연결**: 일부 데이터만 표시
- **실시간**: 모든 데이터 실시간 업데이트

#### 데이터 없음 상태
```javascript
// 빈 테이블 표시
<td colSpan={7} className="text-center">
  <p>표시할 코인 데이터가 없습니다</p>
  <p>데이터 로딩 중...</p>
</td>
```

### 성능 최적화

#### useMemo 사용
- **테이블 데이터**: 의존성 변경시만 재계산
- **정렬 및 필터링**: 불필요한 연산 방지
- **김치프리미엄**: 실시간 계산 최적화

#### 상태 관리
- **즐겨찾기**: 로컬 상태 (Set 자료구조)
- **PriceContext**: 전역 상태 구독
- **메모이제이션**: 컴포넌트 리렌더링 최소화

### 확장성

#### 추가 가능한 기능
1. **정렬**: 컬럼 헤더 클릭으로 정렬
2. **필터링**: 즐겨찾기만 보기
3. **검색**: 코인 이름/심볼 검색
4. **차트**: 미니 차트 표시
5. **알림**: 가격 알림 설정

#### Props 확장 예시
```javascript
<CoinTable 
  sortBy="price"           // 정렬 기준
  sortOrder="desc"         // 정렬 순서
  showMiniChart={true}     // 미니 차트 표시
  showVolume={false}       // 거래량 숨기기
  enableAlerts={true}      // 알림 기능
  theme="compact"          // 컴팩트 모드
/>
```

### 테스트 상황

#### HomePage 테스트
- **전체 테이블**: 김치프리미엄 포함
- **제한 테이블**: 상위 5개, 김치프리미엄 제외
- **간단 테이블**: 상위 3개, 즐겨찾기 제외

#### PricesPage 테스트
- **메인 테이블**: 모든 기능 활성화
- **거래소 정보**: 추가 정보 섹션
- **업데이트 주기**: 실시간 상태 표시

### 트러블슈팅

#### 데이터가 표시되지 않을 때
1. **WebSocket 연결**: 개발자 도구에서 WS 탭 확인
2. **PriceContext**: Context Provider 설정 확인
3. **환율 데이터**: exchangeRate 값 확인
4. **빌드 오류**: 컴포넌트 import 경로 확인

#### 김치프리미엄이 계산되지 않을 때
1. **Bitget 데이터**: prices 객체 확인
2. **업비트 데이터**: upbitPrices 객체 확인
3. **환율**: exchangeRate 값 확인
4. **계산 함수**: calculateKimchiPremium 호출 확인

#### 스타일이 적용되지 않을 때
1. **Tailwind CSS**: 클래스명 확인
2. **CSS 변수**: 테마 변수 설정 확인
3. **반응형**: 브라우저 크기 확인
4. **빌드**: CSS 빌드 결과 확인

## 다음 단계 (Step 23)

CoinTable 컴포넌트가 완성되었으므로 이제 개별 코인 상세 페이지 구현을 진행할 수 있습니다:

1. **CoinDetailPage**: 개별 코인 상세 정보
2. **차트 컴포넌트**: 가격 차트 표시
3. **거래 정보**: 상세 거래 데이터
4. **알림 기능**: 가격 알림 설정