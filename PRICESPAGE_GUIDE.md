# PricesPage 메인 시세판 가이드

## Step 23 완료 상태

✅ **메인 시세판 PricesPage 구현 완료**

### 구현된 기능

#### 1. 메인 시세판 페이지 (`src/pages/PricesPage.jsx`)
- **전체 코인 리스트**: 실시간 가격 데이터 표시
- **검색 기능**: 디바운싱 적용 (300ms 지연)
- **정렬 기능**: 8가지 정렬 옵션
- **필터 기능**: 6가지 필터 옵션
- **시장 동향**: 실시간 통계 표시

#### 2. 페이지 구성

##### 🏷️ **헤더 섹션**
- 페이지 제목 및 설명
- 실시간 연결 상태 표시 (Bitget, 업비트)
- 현재 환율 정보

##### 📊 **시장 동향 요약**
```javascript
// 4가지 통계 카드
- 상승: 24시간 상승 코인 개수
- 하락: 24시간 하락 코인 개수  
- 김프 양수: 김치프리미엄 > 0% 코인 개수
- 전체: 현재 표시된 코인 개수
```

##### 🔍 **검색 및 필터 컨트롤**
```javascript
// 검색 입력
- 실시간 검색 (디바운싱 300ms)
- 코인명, 심볼 검색 지원
- 예: "Bitcoin", "BTC", "비트"

// 정렬 옵션 (8가지)
- 기본순: 코인 우선순위
- 가격 높은순/낮은순: Bitget USD 기준
- 상승률순/하락률순: 24시간 변동률
- 거래량순: 24시간 거래량
- 김프 높은순/낮은순: 김치프리미엄

// 필터 옵션 (6가지)
- 전체: 모든 코인
- 즐겨찾기: 즐겨찾기한 코인만 (향후 구현)
- 상승: 24시간 상승 코인
- 하락: 24시간 하락 코인
- 김프 양수: 김치프리미엄 > 0%
- 김프 음수: 김치프리미엄 < 0%
```

##### 📋 **메인 코인 테이블**
- **CoinTable 컴포넌트 재사용**
- **커스텀 데이터 전달**: 필터링/정렬된 데이터
- **실시간 업데이트**: WebSocket 데이터 반영

#### 3. 주요 기능 상세

##### 🔍 **실시간 검색 (디바운싱)**
```javascript
// 디바운싱 구현
useEffect(() => {
  const timeoutId = setTimeout(() => {
    setDebouncedSearch(searchQuery);
  }, 300);
  
  return () => clearTimeout(timeoutId);
}, [searchQuery]);

// 검색 대상
- 코인명: "Bitcoin" → BTC 매칭
- 심볼: "BTC", "BTCUSDT" → BTC 매칭  
- 부분 검색: "bit" → Bitcoin 매칭
```

##### 📊 **정렬 기능**
```javascript
// 정렬 로직 예시
switch (sortBy) {
  case 'price_desc':
    coins.sort((a, b) => (b.bitgetPrice?.price || 0) - (a.bitgetPrice?.price || 0));
    break;
  case 'change_desc':
    coins.sort((a, b) => {
      const aChange = Math.max(a.bitgetPrice?.changePercent24h || 0, a.upbitPrice?.change_percent || 0);
      const bChange = Math.max(b.bitgetPrice?.changePercent24h || 0, b.upbitPrice?.change_percent || 0);
      return bChange - aChange;
    });
    break;
  case 'kimchi_desc':
    coins.sort((a, b) => (b.kimchiPremium?.premium || 0) - (a.kimchiPremium?.premium || 0));
    break;
}
```

##### 🎯 **필터 기능**
```javascript
// 필터 로직 예시
switch (filterBy) {
  case 'rising':
    coins = coins.filter(item => {
      const change = Math.max(
        item.bitgetPrice?.changePercent24h || 0,
        item.upbitPrice?.change_percent || 0
      );
      return change > 0;
    });
    break;
  case 'kimchi_positive':
    coins = coins.filter(item => item.kimchiPremium?.premium > 0);
    break;
}
```

#### 4. CoinTable 컴포넌트 확장

##### 📄 **새로운 Props 추가**
```javascript
// customData prop 추가
<CoinTable 
  showKimchi={true}
  showFavorites={true}
  customData={filteredAndSortedCoins} // 필터링된 데이터 전달
/>
```

##### ⚙️ **데이터 처리 로직**
```javascript
// CoinTable 내부 로직
const tableData = useMemo(() => {
  // customData가 제공된 경우 해당 데이터 사용
  if (customData && Array.isArray(customData)) {
    return limit ? customData.slice(0, limit) : customData;
  }
  
  // 기본 데이터 로직 (기존과 동일)
  // ...
}, [customData, prices, upbitPrices, ...]);
```

### 사용 예시

#### 1. 기본 사용 (전체 코인)
```javascript
// PricesPage 접속 시 기본 상태
- 검색: 빈 상태
- 정렬: 기본순 (우선순위)
- 필터: 전체
- 결과: 10개 코인 모두 표시
```

#### 2. 검색 사용 예시
```javascript
// "비트" 검색
- 입력: "비트"
- 결과: Bitcoin (BTC) 매칭
- 표시: 검색 결과 1개

// "상승" 필터 + "가격 높은순" 정렬
- 필터: 24시간 상승 코인만
- 정렬: 가격 높은순으로 정렬
- 결과: 상승한 코인 중 가격 높은 순서
```

#### 3. 고급 사용 예시
```javascript
// 김치프리미엄 분석
- 필터: "김프 양수" 선택
- 정렬: "김프 높은순" 선택
- 결과: 김치프리미엄이 높은 코인 순서로 표시

// 거래량 분석
- 필터: "전체"
- 정렬: "거래량순"
- 결과: 거래가 활발한 코인 순서로 표시
```

### 성능 최적화

#### 1. 메모이제이션
```javascript
// 필터링/정렬 데이터 캐싱
const filteredAndSortedCoins = useMemo(() => {
  // 복잡한 필터링/정렬 로직
}, [prices, upbitPrices, debouncedSearch, sortBy, filterBy]);

// 통계 계산 캐싱
const pageStats = useMemo(() => {
  // 상승/하락/김프 개수 계산
}, [filteredAndSortedCoins]);
```

#### 2. 디바운싱
```javascript
// 검색 성능 최적화
- 입력 즉시: UI 상태 업데이트
- 300ms 지연: 실제 검색 실행
- 결과: 불필요한 재계산 방지
```

#### 3. 조건부 렌더링
```javascript
// 필터 UI 최적화
{showFilters && (
  <div className="filter-section">
    {/* 필터 옵션들 */}
  </div>
)}
```

### 반응형 디자인

#### 📱 **모바일 (< 768px)**
- 검색/정렬/필터: 세로 배치
- 시장 동향: 2x2 그리드
- 테이블: 가로 스크롤

#### 💻 **태블릿 (768px - 1024px)**
- 검색/정렬: 가로 배치
- 필터: 별도 행
- 시장 동향: 4x1 그리드

#### 🖥️ **데스크톱 (> 1024px)**
- 모든 컨트롤: 한 행에 배치
- 필터: 확장형 토글
- 최적화된 레이아웃

### 에러 처리

#### 1. 검색 결과 없음
```javascript
{filteredAndSortedCoins.length === 0 && (
  <div className="no-results">
    <p>검색 결과가 없습니다</p>
    <button onClick={resetFilters}>필터 초기화</button>
  </div>
)}
```

#### 2. 데이터 로딩 상태
```javascript
// 연결 상태별 표시
- 연결안됨: "WebSocket 연결을 확인해주세요"
- 부분연결: 일부 데이터만 표시
- 실시간: 모든 데이터 실시간 업데이트
```

#### 3. 필터 초기화
```javascript
const resetFilters = () => {
  setSearchQuery('');
  setDebouncedSearch('');
  setFilterBy('all');
  setSortBy('priority');
};
```

### 확장 가능성

#### 1. 추가 필터 옵션
- 시가총액 구간별 필터
- 거래량 구간별 필터
- 변동률 구간별 필터

#### 2. 고급 정렬
- 다중 정렬 (1차: 김프, 2차: 거래량)
- 사용자 정의 정렬
- 정렬 방향 개별 설정

#### 3. 개인화 기능
- 필터/정렬 설정 저장
- 즐겨찾기 목록 관리
- 사용자 맞춤 대시보드

## 다음 단계 (Step 24)

PricesPage가 완성되었으므로 이제 시장 동향 차트 구현을 진행할 수 있습니다:

1. **차트 라이브러리**: Chart.js 또는 Recharts 통합
2. **가격 차트**: 실시간 가격 변동 차트
3. **김치프리미엄 차트**: 시간별 김프 변화
4. **시장 지표**: 전체 시장 동향 시각화