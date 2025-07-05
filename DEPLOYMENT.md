# 배포 가이드

## 로컬/운영 환경 차이 해결

### 1. 환경 변수 설정

#### 개발 환경 (.env)
```bash
# API 설정 - 비워두면 Vite 프록시 사용
VITE_API_BASE_URL=

# CORS 허용 도메인
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174
```

#### 운영 환경 (.env.production)
```bash
# API 설정 - 실제 프록시 서버 URL
VITE_API_BASE_URL=https://your-api-server.com

# CORS 허용 도메인 - 운영 도메인 추가
CORS_ORIGINS=http://localhost:5173,https://your-domain.com
```

### 2. 프록시 서버 배포

Express 프록시 서버도 함께 배포해야 합니다:

```bash
# 서버 디렉토리로 이동
cd server

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집하여 CORS_ORIGINS에 운영 도메인 추가

# 서버 실행
npm start
```

### 3. 빌드 및 배포

```bash
# 클라이언트 빌드
npm run build

# dist 폴더의 내용을 웹 서버에 배포
```

### 4. 주요 변경사항

1. **API 엔드포인트 중앙화**: `src/config/api.js`에서 모든 API 설정 관리
2. **환경 변수 기반 URL**: 개발/운영 환경에 따라 자동으로 적절한 URL 사용
3. **CORS 동적 설정**: 환경 변수로 허용 도메인 관리
4. **API 호출 통일**: 모든 서비스가 동일한 방식으로 API 호출

### 5. 확인사항

배포 전 다음 사항을 확인하세요:

- [ ] `.env` 파일에 `VITE_API_BASE_URL` 설정
- [ ] 프록시 서버의 `.env`에 운영 도메인 추가
- [ ] 프록시 서버가 운영 환경에서 접근 가능한지 확인
- [ ] 방화벽에서 프록시 서버 포트(8080) 오픈

### 6. 트러블슈팅

#### API 호출 실패
- 브라우저 개발자 도구에서 네트워크 탭 확인
- `VITE_API_BASE_URL`이 올바르게 설정되었는지 확인
- 프록시 서버가 실행 중인지 확인

#### CORS 에러
- 프록시 서버의 `CORS_ORIGINS`에 현재 도메인이 포함되어 있는지 확인
- 프록시 서버 재시작 필요

#### WebSocket 연결 실패
- WebSocket은 프록시를 거치지 않고 직접 연결됨
- 방화벽에서 WebSocket 포트 확인 필요