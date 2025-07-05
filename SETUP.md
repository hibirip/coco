# 설정 가이드

## 운영 환경 배포 체크리스트

### 1. 환경 변수 설정

#### 클라이언트 환경 변수
```bash
# .env.production.local 파일 생성
cp .env.production .env.production.local

# 다음 값들을 실제 운영 값으로 수정:
VITE_API_BASE_URL=https://your-api-server.com
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
# ... 기타 Firebase 설정
```

#### 프록시 서버 환경 변수
```bash
cd server
cp .env.example .env

# 다음 값들을 설정:
PORT=8080
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
CMC_API_KEY=your_coinmarketcap_api_key
COINNESS_API_KEY=your_coinness_api_key (선택사항)
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key (선택사항)
```

### 2. PM2 설정 (프로덕션 권장)

```bash
# PM2 전역 설치
npm install -g pm2

# PM2 설정 파일 복사
cp ecosystem.config.example.js ecosystem.config.js

# ecosystem.config.js 파일에서 다음 수정:
# - host: 실제 서버 주소
# - repo: 실제 git 저장소 URL
# - path: 서버 배포 경로
```

### 3. 빌드 및 배포

#### 개발 환경 테스트
```bash
# 개발 빌드로 테스트
npm run build:dev
npm run preview

# 또는
npm run deploy:test
```

#### 운영 환경 배포
```bash
# 운영 빌드
npm run build:prod

# PM2로 프록시 서버 시작
cd server
npm run pm2:start

# 또는 일반 실행
npm start
```

### 4. 서버 설정

#### Nginx 설정 예시
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 클라이언트 정적 파일
    location / {
        root /var/www/coco/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API 프록시
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 방화벽 설정
```bash
# 필요한 포트 오픈
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp  # 프록시 서버 포트
```

### 5. SSL 인증서 설정 (HTTPS)

```bash
# Let's Encrypt 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 자동 갱신 설정
sudo crontab -e
# 다음 라인 추가:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. 모니터링 설정

#### PM2 모니터링
```bash
# PM2 상태 확인
pm2 status

# 로그 확인
pm2 logs coco-proxy-server

# 실시간 모니터링
pm2 monit

# 자동 시작 설정
pm2 startup
pm2 save
```

#### 시스템 모니터링
```bash
# 디스크 사용량 확인
df -h

# 메모리 사용량 확인
free -h

# 프로세스 확인
ps aux | grep node
```

### 7. 문제 해결

#### API 호출 실패
1. 프록시 서버 상태 확인: `pm2 status`
2. 로그 확인: `pm2 logs coco-proxy-server`
3. 환경 변수 확인: `.env` 파일 내용 검토
4. 방화벽 설정 확인: `ufw status`

#### CORS 에러
1. `CORS_ORIGINS`에 현재 도메인 포함 여부 확인
2. 프록시 서버 재시작: `pm2 restart coco-proxy-server`
3. 브라우저 캐시 클리어

#### 성능 문제
1. PM2 메모리 사용량 확인: `pm2 monit`
2. 서버 리소스 확인: `htop`
3. 네트워크 대역폭 확인

### 8. 백업 및 복구

#### 설정 파일 백업
```bash
# 중요 설정 파일들 백업
tar -czf config-backup.tar.gz \
  .env.production.local \
  server/.env \
  ecosystem.config.js \
  nginx.conf
```

#### 데이터베이스 백업 (Supabase)
- Supabase 대시보드에서 정기 백업 설정
- 중요 테이블 수동 백업 스크립트 작성

### 9. 업데이트 절차

```bash
# 1. 코드 업데이트
git pull origin main

# 2. 의존성 업데이트
npm install
cd server && npm install && cd ..

# 3. 빌드
npm run build:prod

# 4. 프록시 서버 재시작
cd server
pm2 restart coco-proxy-server

# 5. 정상 작동 확인
curl https://your-domain.com/api/health
```

### 10. 성능 최적화

#### 클라이언트 최적화
- 이미지 압축 및 WebP 형식 사용
- 코드 분할 (Code Splitting) 활용
- CDN 사용 고려

#### 서버 최적화
- API 응답 캐싱 시간 조정
- 불필요한 요청 로그 비활성화
- 압축 미들웨어 활용

#### 데이터베이스 최적화
- 쿼리 최적화
- 인덱스 적절히 설정
- 연결 풀 설정 최적화

이 가이드를 따라 설정하면 안정적인 운영 환경을 구축할 수 있습니다.