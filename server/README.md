# Coco Proxy Server

암호화폐 가격 추적 앱을 위한 Express 프록시 서버입니다.
CORS 문제를 해결하고 외부 API를 안전하게 호출합니다.

## 🚀 Render.com 배포 가이드

### 1. GitHub 저장소 연결
1. [Render.com](https://render.com) 로그인
2. "New Web Service" 클릭
3. GitHub 저장소 선택
4. "서브디렉토리 선택" → `server` 폴더

### 2. 배포 설정
- **Name**: `coco-proxy-server`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free`

### 3. 환경변수 설정
다음 환경변수를 Render 대시보드에서 설정:

```
NODE_ENV=production
PORT=10000
CORS_ORIGINS=https://your-frontend-domain.com,http://localhost:5173
```

### 4. 배포 URL 확인
배포 완료 후 URL 확인 (예: `https://coco-proxy-server.onrender.com`)

## 🔧 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 프로덕션 모드
npm start
```

## 📡 API 엔드포인트

- `GET /api/bitget/*` - Bitget API 프록시
- `GET /api/upbit/*` - Upbit API 프록시  
- `GET /api/exchange-rate/*` - 환율 API 프록시
- `GET /api/news/*` - 뉴스 API 프록시

## 🌐 CORS 설정

환경변수 `CORS_ORIGINS`에 허용할 도메인을 콤마로 구분하여 설정:

```
CORS_ORIGINS=https://my-app.netlify.app,https://my-app.vercel.app
```