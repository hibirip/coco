# 환경변수 설정 가이드

## 개요
Coco 프로젝트는 여러 외부 API와 연동하기 위해 환경변수를 사용합니다. 이 문서는 각 API 키 발급 방법과 설정 방법을 안내합니다.

## 필수 환경변수

### 1. Supabase 설정 (프론트엔드)
```bash
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**설정 방법:**
1. [Supabase](https://supabase.com/) 계정 생성
2. 새 프로젝트 생성
3. Settings > API에서 URL과 anon key 복사

### 2. CoinMarketCap API (서버 - 필수)
```bash
CMC_API_KEY=your_cmc_api_key_here
```

**설정 방법:**
1. [CoinMarketCap API](https://coinmarketcap.com/api/) 접속
2. 계정 생성 및 이메일 인증
3. API Keys 메뉴에서 새 키 생성
4. Basic Plan 선택 (무료 - 월 10,000회 호출)

**미설정 시:** 503 에러 반환

## 선택적 환경변수

### 3. CoinNess 뉴스 API (서버 - 선택사항)
```bash
COINNESS_API_KEY=your_coinness_api_key_here
```

**설정 방법:**
1. [CoinNess API](https://coinness.com/api) 접속
2. 계정 생성 및 API 키 발급

**미설정 시:** 빈 배열 반환 (정상 동작)

### 4. 환율 API (서버 - 선택사항)
```bash
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key_here
```

**설정 방법:**
1. [Exchange Rate API](https://exchangerate-api.com/) 접속
2. 계정 생성 (무료 - 월 1,500회 호출)
3. API 키 발급

**미설정 시:** 고정 환율(1,300원) 사용

### 5. 서버 포트 (서버 - 선택사항)
```bash
PORT=8080
```

**기본값:** 8080
**개발환경:** 프론트엔드는 5173/5174, 서버는 8080

## 환경변수 파일 생성

### 프로젝트 루트 (.env)
```bash
# 루트 디렉토리에서
cp .env.example .env

# .env 파일 편집하여 실제 값 입력
nano .env  # 또는 원하는 에디터 사용
```

### 서버 디렉토리 (server/.env)
```bash
# 서버 디렉토리에서
cd server
cp .env.example .env

# server/.env 파일 편집하여 실제 값 입력
nano .env  # 또는 원하는 에디터 사용
```

## API 키 예시 형식

```bash
# 실제 예시 (가상의 키)
CMC_API_KEY=a1b2c3d4-e5f6-7890-abcd-ef1234567890
COINNESS_API_KEY=sk_live_1234567890abcdef
EXCHANGE_RATE_API_KEY=1234567890abcdef
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 환경변수 우선순위

1. **서버 환경변수:** `server/.env`
2. **프로젝트 환경변수:** `.env` (루트)
3. **시스템 환경변수:** `export CMC_API_KEY=...`

## 보안 가이드

### ✅ 권장사항
- `.env` 파일은 `.gitignore`에 포함됨
- `.env.example` 파일만 Git에 커밋
- API 키는 팀원과 안전하게 공유
- 정기적으로 API 키 교체

### ❌ 금지사항
- 실제 API 키를 코드에 하드코딩
- API 키를 Git에 커밋
- API 키를 공개 저장소에 업로드
- API 키를 채팅/이메일로 평문 전송

## 트러블슈팅

### CMC API 503 에러
```bash
# 환경변수 확인
echo $CMC_API_KEY

# 서버 재시작
npm run server
```

**해결방법:**
- `CMC_API_KEY` 환경변수가 설정되었는지 확인
- 서버를 재시작하여 환경변수 다시 로드

### 뉴스 데이터가 빈 배열
```bash
# 뉴스 API 테스트
curl http://localhost:8080/api/news?limit=5
```

**해결방법:**
- `COINNESS_API_KEY` 설정 (선택사항)
- 미설정 시 빈 배열 반환은 정상 동작

### 환율이 1,300원 고정값
```bash
# 환율 API 테스트
curl http://localhost:8080/api/exchange-rate
```

**해결방법:**
- `EXCHANGE_RATE_API_KEY` 설정 (선택사항)
- 미설정 시 고정값 사용은 정상 동작

### 환경변수가 적용되지 않음
```bash
# 개발 서버 재시작
npm run dev

# 프록시 서버 재시작
npm run server
```

**해결방법:**
- 환경변수 변경 후 서버 재시작 필요
- 터미널에서 `source .env` 실행

## 개발 모드

### 데모 모드 활성화
```bash
VITE_DEMO_MODE=true
```

데모 모드에서는 Supabase 없이도 기본 기능 테스트 가능

### API 없이 개발
- CoinMarketCap API: 503 에러 반환 (정상)
- 뉴스 API: 빈 배열 반환 (정상)
- 환율 API: 고정값 사용 (정상)

## 프로덕션 배포

### 환경변수 체크리스트
- [ ] `CMC_API_KEY` 설정됨 (필수)
- [ ] `VITE_SUPABASE_URL` 설정됨
- [ ] `VITE_SUPABASE_ANON_KEY` 설정됨
- [ ] `COINNESS_API_KEY` 설정됨 (선택사항)
- [ ] `EXCHANGE_RATE_API_KEY` 설정됨 (선택사항)
- [ ] 모든 API 키가 유효함
- [ ] API 할당량 확인됨

### 배포 전 테스트
```bash
# 모든 API 엔드포인트 테스트
curl http://localhost:8080/health
curl http://localhost:8080/api/cmc?limit=10
curl http://localhost:8080/api/news?limit=5
curl http://localhost:8080/api/exchange-rate
```

## 지원 및 문의

환경변수 설정에 문제가 있거나 추가 도움이 필요한 경우:

1. 이 문서의 트러블슈팅 섹션 확인
2. `.env.example` 파일 참조
3. API 제공업체의 공식 문서 확인
4. 개발팀에 문의