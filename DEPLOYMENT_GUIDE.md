# 🚀 Coco 암호화폐 추적 앱 배포 가이드

이 가이드는 CORS 문제를 완전히 해결하기 위한 **서버사이드 프록시 배포** 방법을 설명합니다.

## 📋 배포 아키텍처

```
프론트엔드 (Netlify/Vercel) ←→ 백엔드 프록시 서버 (Render.com) ←→ 외부 API들
```

## 🔧 1단계: 백엔드 서버 배포 (Render.com)

### 1.1 Render.com 계정 생성
1. [Render.com](https://render.com) 방문
2. GitHub 계정으로 로그인
3. 무료 플랜 선택

### 1.2 웹 서비스 생성
1. "New +" → "Web Service" 클릭
2. GitHub 저장소 연결
3. **저장소**: `your-username/coco`
4. **Branch**: `main`
5. **Root Directory**: `server` (중요!)

### 1.3 배포 설정
```
Name: coco-proxy-server
Environment: Node
Build Command: npm install
Start Command: npm start
```

### 1.4 환경변수 설정
Render 대시보드에서 다음 환경변수 추가:

```
NODE_ENV=production
PORT=10000
CORS_ORIGINS=https://your-frontend-domain.com,http://localhost:5173
```

### 1.5 배포 완료 확인
- 배포 완료 후 URL 확인 (예: `https://coco-proxy-server.onrender.com`)
- 상태가 "Live"인지 확인

## 🌐 2단계: 프론트엔드 설정 업데이트

### 2.1 환경변수 설정
배포 플랫폼 (Netlify/Vercel)에서 환경변수 추가:

```
VITE_BACKEND_URL=https://coco-proxy-server.onrender.com
```

### 2.2 로컬 환경변수 파일 (선택사항)
`.env.production` 파일 생성:
```
VITE_BACKEND_URL=https://coco-proxy-server.onrender.com
```

## 📡 3단계: API 연결 테스트

### 3.1 백엔드 서버 테스트
브라우저에서 다음 URL 접속 테스트:

```
https://coco-proxy-server.onrender.com/api/upbit/v1/ticker?markets=KRW-BTC
```

정상 응답이 오면 백엔드 배포 성공!

### 3.2 프론트엔드 연결 테스트
배포된 프론트엔드에서:
1. 개발자 도구 콘솔 확인
2. Network 탭에서 API 요청 확인
3. CORS 오류 없이 데이터 수신 확인

## 🔄 4단계: 배포 자동화 (선택사항)

### 4.1 GitHub Actions (권장)
`.github/workflows/deploy.yml` 파일 생성으로 자동 배포 설정 가능

### 4.2 Webhook 설정
Render와 Netlify/Vercel에서 GitHub 푸시 시 자동 배포 활성화

## 🛠️ 문제 해결

### CORS 오류가 계속 발생하는 경우
1. 백엔드 서버가 정상 실행 중인지 확인
2. 프론트엔드의 `VITE_BACKEND_URL` 환경변수 확인
3. 백엔드의 `CORS_ORIGINS` 설정 확인

### 배포가 실패하는 경우
1. `server/package.json` 파일 확인
2. `server/render.yaml` 설정 확인
3. Render 로그에서 오류 메시지 확인

## 💰 비용 정보

- **Render.com**: 무료 플랜 (월 750시간)
- **Netlify/Vercel**: 무료 플랜
- **총 비용**: $0

## 🎉 완료!

이제 로컬환경과 배포환경에서 **동일한 방식**으로 API가 작동합니다.
CORS 문제가 완전히 해결되었습니다!