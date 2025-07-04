# 🔐 Google 로그인 실제 구현 가이드

## 1. Supabase 프로젝트 설정

### 1.1 Supabase 프로젝트 생성
1. [Supabase 콘솔](https://supabase.com/dashboard) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `coco-crypto`
   - **Database Password**: 강력한 비밀번호 설정
   - **Region**: `Southeast Asia (Singapore)` (한국과 가장 가까운 지역)
4. "Create new project" 클릭

### 1.2 프로젝트 URL 및 API 키 확인
```bash
# Supabase 콘솔 > Settings > API 에서 확인
Project URL: https://your-project-id.supabase.co
Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 2. Google OAuth 설정

### 2.1 Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **APIs & Services > Credentials** 이동
4. **"+ CREATE CREDENTIALS" > OAuth client ID** 선택
5. Application type: **Web application** 선택
6. Name: `Coco Crypto App`

### 2.2 리디렉션 URI 설정
**Authorized redirect URIs**에 다음 URL들 추가:
```
# 개발환경
http://localhost:5173/auth/callback

# Supabase 콜백 (필수)
https://your-project-id.supabase.co/auth/v1/callback

# 배포환경 (배포 후 추가)
https://your-domain.com/auth/callback
```

### 2.3 Client ID 및 Client Secret 저장
```
Client ID: 123456789-abcdefghijklmnop.apps.googleusercontent.com
Client Secret: GOCSPX-abcdefghijklmnopqrstuvwxyz
```

## 3. Supabase Auth 설정

### 3.1 Authentication 설정
1. Supabase 콘솔 > **Authentication** 메뉴
2. **Settings > Auth** 탭 이동
3. **Site URL** 설정:
   ```
   # 개발환경
   http://localhost:5173
   
   # 배포환경 (배포 후 변경)
   https://your-domain.com
   ```

### 3.2 Google Provider 활성화
1. **Providers** 탭 이동
2. **Google** 클릭하여 활성화
3. Google OAuth 정보 입력:
   ```
   Client ID: [Google에서 발급받은 Client ID]
   Client Secret: [Google에서 발급받은 Client Secret]
   ```
4. **Save** 클릭

### 3.3 Redirect URLs 설정
**Redirect URLs** 섹션에 추가:
```
http://localhost:5173/**
https://your-domain.com/**
```

## 4. 환경변수 설정

### 4.1 .env.local 파일 생성
```bash
# Supabase 설정
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth (클라이언트에서 직접 사용하지 않지만 참고용)
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com

# 앱 설정
VITE_APP_URL=http://localhost:5173
```

### 4.2 배포 환경 환경변수
배포 플랫폼(Render/Vercel/Netlify)에서 다음 환경변수 설정:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://your-domain.com
```

## 5. 테스트 방법

### 5.1 로컬 테스트
1. 환경변수 설정 완료 후 개발 서버 재시작
2. 브라우저에서 `http://localhost:5173` 접속
3. 헤더의 "Google 로그인" 버튼 클릭
4. Google 로그인 팝업 확인
5. 로그인 후 프로필 표시 확인

### 5.2 네트워크 탭에서 확인할 것들
- Supabase Auth API 호출 성공
- Google OAuth 리디렉션 정상 작동
- 세션 토큰 저장 확인

## 6. 문제 해결

### 6.1 일반적인 오류들

**Error: Invalid login credentials**
- Supabase URL/Key 확인
- Google OAuth 설정 재확인

**Error: Cross-origin request blocked**
- Supabase Redirect URLs 설정 확인
- Google OAuth Authorized redirect URIs 확인

**Error: Invalid redirect URL**
- Site URL과 Redirect URLs 일치 확인
- 프로토콜(http/https) 정확성 확인

### 6.2 디버깅 팁
```javascript
// 브라우저 콘솔에서 Supabase 연결 테스트
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');

// Auth 상태 확인
supabase.auth.getUser().then(console.log);
```

## 7. 보안 고려사항

### 7.1 환경변수 보안
- `.env.local` 파일을 `.gitignore`에 추가
- 프로덕션 키와 개발 키 분리
- Supabase RLS(Row Level Security) 활성화

### 7.2 도메인 제한
- Google OAuth에 정확한 도메인만 등록
- Supabase Site URL을 실제 도메인으로 제한
- 와일드카드 사용 시 주의

## 8. 배포 후 추가 설정

### 8.1 도메인 확정 후
1. Google OAuth Authorized redirect URIs 업데이트
2. Supabase Site URL 업데이트  
3. 환경변수 `VITE_APP_URL` 업데이트

### 8.2 SSL 인증서 확인
- HTTPS 필수 (Google OAuth 요구사항)
- 배포 플랫폼에서 자동 SSL 설정 확인

---

이 가이드를 따라 설정하면 실제 Google 로그인이 정상 작동합니다! 🚀