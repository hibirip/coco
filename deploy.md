# 배포 가이드

## 1. Render 배포

### 사전 준비
1. GitHub 리포지토리 생성 및 코드 푸시
2. Render 계정 생성 (https://render.com)

### 배포 설정
1. **Static Site 선택**
   - Build Command: `npm run build`
   - Publish Directory: `dist`

2. **환경변수 설정**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   NODE_ENV=production
   ```

## 2. Vercel 배포

### 사전 준비
1. Vercel CLI 설치: `npm i -g vercel`
2. Vercel 계정 연동

### 배포 명령어
```bash
# 프로젝트 빌드
npm run build

# Vercel 배포
vercel --prod
```

### 환경변수 설정
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## 3. Netlify 배포

### 사전 준비
1. Netlify CLI 설치: `npm i -g netlify-cli`
2. Netlify 계정 연동

### 배포 명령어
```bash
# 프로젝트 빌드
npm run build

# Netlify 배포
netlify deploy --prod --dir=dist
```

## 4. 성능 최적화 체크리스트

### ✅ 완료된 최적화
- [x] React.lazy 코드 스플리팅
- [x] useMemo, useCallback 적용
- [x] 이미지 lazy loading
- [x] 디바운싱/쓰로틀링
- [x] 로딩 스피너
- [x] 에러 바운더리
- [x] Toast 알림

### 🔍 Lighthouse 점수 목표
- **Performance**: 80+ 
- **Accessibility**: 90+
- **Best Practices**: 85+
- **SEO**: 80+

## 5. 배포 후 확인 사항

1. **기능 테스트**
   - [ ] 홈페이지 로딩
   - [ ] 시세 페이지 정상 작동
   - [ ] 뉴스 페이지 정상 작동
   - [ ] 이벤트 페이지 정상 작동
   - [ ] 코인 상세 페이지 정상 작동

2. **모바일 반응형**
   - [ ] 홈페이지 모바일 뷰
   - [ ] 시세 테이블 모바일 최적화
   - [ ] 네비게이션 햄버거 메뉴
   - [ ] 터치 인터랙션

3. **다크 테마**
   - [ ] 모든 페이지 일관성
   - [ ] 컬러 시스템 정상 작동
   - [ ] 가독성 확인

4. **API & WebSocket**
   - [ ] 실시간 가격 업데이트
   - [ ] 김치프리미엄 계산
   - [ ] 뉴스 데이터 로딩
   - [ ] 에러 핸들링

## 6. 트러블슈팅

### 일반적인 문제들
1. **환경변수 문제**: `.env` 파일이 빌드에 포함되지 않는 경우
2. **CORS 문제**: API 서버 설정 확인
3. **라우팅 문제**: SPA 라우팅 설정 (`_redirects` 파일)
4. **성능 문제**: 번들 크기 최적화

### 해결 방법
```bash
# 번들 분석
npm run build
npx vite-bundle-analyzer dist

# 성능 테스트
npm install -g lighthouse
lighthouse http://localhost:3000 --output html --output-path report.html
```