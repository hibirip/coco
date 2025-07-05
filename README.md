# Coco - Cryptocurrency Price Tracker

김치프리미엄 계산 및 실시간 암호화폐 가격 추적 서비스

## 🚀 빠른 시작

### 개발 환경 설정

```bash
# 의존성 설치
npm install

# 프록시 서버 의존성 설치
cd server && npm install && cd ..

# 개발 서버 실행 (클라이언트 + 프록시 서버)
npm run dev:all
```

### 환경 변수 설정

1. `.env` 파일을 복사하여 로컬 설정 생성:
```bash
cp .env.example .env
```

2. 프록시 서버 환경 변수 설정:
```bash
cd server
cp .env.example .env
# server/.env 파일 편집
```

## 📁 프로젝트 구조

```
coco/
├── src/
│   ├── components/     # React 컴포넌트
│   ├── services/       # API 서비스
│   ├── config/         # 설정 파일
│   └── utils/          # 유틸리티
├── server/             # Express 프록시 서버
├── .env                # 로컬 환경 변수
├── .env.development    # 개발 환경 템플릿
└── .env.production     # 운영 환경 템플릿
```

## ⚙️ 환경별 설정

### 개발 환경

```bash
# 개발용 빌드
npm run build:dev

# 개발 서버 실행
npm run dev
```

개발 환경에서는 Vite 프록시를 통해 API 호출이 이루어집니다.

### 운영 환경

1. **환경 변수 설정**:
```bash
# .env.production.local 파일 생성
VITE_API_BASE_URL=https://your-api-server.com
CORS_ORIGINS=https://your-domain.com
```

2. **빌드 및 배포**:
```bash
# 운영용 빌드
npm run build:prod

# 또는 배포 스크립트 사용
npm run deploy
```

3. **프록시 서버 배포**:
```bash
cd server
# 운영 환경 변수 설정
cp .env.example .env
# server/.env 편집 후
npm start
```

## 🔧 주요 기능

- **실시간 가격 추적**: Bitget, Upbit API 연동
- **김치프리미엄 계산**: USD/KRW 환율 기반 프리미엄 계산
- **WebSocket 지원**: 실시간 가격 업데이트
- **뉴스 피드**: 암호화폐 관련 뉴스 제공
- **차트 시각화**: Recharts 기반 가격 차트

## 🛠️ 기술 스택

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Express.js (프록시 서버)
- **APIs**: Bitget, Upbit, Exchange Rate API
- **WebSocket**: 실시간 데이터 연결
- **Database**: Supabase, Firebase

## 📋 사용 가능한 스크립트

```bash
# 개발
npm run dev              # 클라이언트 개발 서버
npm run dev:all          # 클라이언트 + 프록시 서버
npm run dev:clean        # 포트 정리 후 개발 서버 실행

# 빌드
npm run build            # 기본 빌드
npm run build:dev        # 개발용 빌드
npm run build:prod       # 운영용 빌드

# 배포
npm run deploy           # 운영 빌드 + 배포 안내
npm run deploy:test      # 개발 빌드 + 미리보기

# 서버
npm run server:dev       # 프록시 서버 개발 모드
npm run server:start     # 프록시 서버 운영 모드

# 기타
npm run lint             # ESLint 검사
npm run preview          # 빌드 결과 미리보기
```

## 🌐 API 엔드포인트

### 로컬 개발 (Vite 프록시)
- Bitget: `/api/bitget/*`
- Upbit: `/api/upbit/*`
- 환율: `/api/exchange-rate`
- 뉴스: `/api/news/*`

### 운영 환경
- 모든 API: `${VITE_API_BASE_URL}/api/*`

## 🔐 환경 변수

### 클라이언트 (.env)
```bash
# API 설정
VITE_API_BASE_URL=        # 운영: https://your-api-server.com
CORS_ORIGINS=             # localhost 또는 운영 도메인

# 서비스 연동
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_FIREBASE_API_KEY=
# ... 기타 Firebase 설정
```

### 프록시 서버 (server/.env)
```bash
PORT=8080
CORS_ORIGINS=http://localhost:5173,https://your-domain.com
CMC_API_KEY=              # CoinMarketCap API 키
COINNESS_API_KEY=         # 뉴스 API 키 (선택)
EXCHANGE_RATE_API_KEY=    # 환율 API 키 (선택)
```

## 🚨 문제 해결

### API 호출 실패
1. 프록시 서버가 실행 중인지 확인
2. `VITE_API_BASE_URL` 설정 확인
3. CORS 설정 확인

### WebSocket 연결 실패
1. 방화벽 설정 확인
2. WebSocket URL 확인
3. 네트워크 연결 상태 확인

### 빌드 오류
1. 환경 변수 설정 확인
2. 의존성 재설치: `rm -rf node_modules && npm install`
3. 캐시 정리: `npm run dev:clean`

## 📚 추가 문서

- [배포 가이드](./DEPLOYMENT.md) - 상세한 배포 방법
- [API 문서](./docs/api.md) - API 엔드포인트 상세 설명
- [개발 가이드](./docs/development.md) - 개발 환경 설정

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 발생하면 [Issues](https://github.com/your-username/coco/issues)에 보고해 주세요.