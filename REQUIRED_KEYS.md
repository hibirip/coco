# 필수 환경변수 및 키 설정

## 🔑 필요한 키와 설정

### 1. **Supabase 설정** (데이터베이스 및 인증)
```env
VITE_SUPABASE_URL=https://sjbfqdaqxjtgshmzamvs.supabase.co
VITE_SUPABASE_ANON_KEY=[새로운 anon key 필요]
```

**참고**: JWT secret이 재생성되어 기존 키가 무효화되었습니다. 
새로운 anon key가 필요합니다.

### 2. **환경변수 설정 위치**

#### 로컬 개발 (.env 파일)
```
VITE_SUPABASE_URL=https://sjbfqdaqxjtgshmzamvs.supabase.co
VITE_SUPABASE_ANON_KEY=[새로운 키]
```

#### 프로덕션 (Render Dashboard)
- Environment Variables 섹션에서 동일한 키 설정
- NODE_ENV=production
- VITE_APP_URL=https://coindex.onrender.com

### 3. **현재 사용 중인 서비스**

1. **Supabase** - 백엔드 서비스
   - 데이터베이스 (향후 사용 예정)
   - 인증 (현재 비활성화)
   - 실시간 기능 (향후 사용 예정)

2. **외부 API**
   - Bitget WebSocket - 실시간 코인 가격
   - Upbit WebSocket - 한국 거래소 가격
   - CryptoCompare API - 뉴스 데이터
   - ExchangeRate API - 환율 정보

### 4. **인증 기능 재구현 시 필요사항**

Google OAuth를 다시 설정하려면:
1. 새로운 Supabase 프로젝트 생성 또는 JWT secret 확인
2. Google Cloud Console에서 OAuth 2.0 클라이언트 설정
3. Supabase Dashboard에서 Google provider 활성화

### 5. **현재 상태**
- ✅ Google 로그인 코드 완전 제거
- ✅ AuthCallback 페이지 삭제
- ✅ 로그인 버튼 제거
- ✅ 앱은 정상 작동 (인증 기능 없이)

### 6. **다음 단계**
1. 새로운 Supabase anon key 받기
2. 환경변수 업데이트 (로컬 & 프로덕션)
3. 필요시 새로운 인증 방식 구현