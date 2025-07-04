# Firebase Google 로그인 설정 가이드

## 🔥 **Firebase 프로젝트 생성**

### 1. Firebase Console 접속
- https://console.firebase.google.com 접속
- Google 계정으로 로그인

### 2. 새 프로젝트 생성
1. **"프로젝트 추가"** 클릭
2. 프로젝트 이름: `coco-crypto-tracker` (또는 원하는 이름)
3. Google Analytics 사용 여부 선택 (선택사항)
4. **"프로젝트 만들기"** 클릭

### 3. Authentication 설정
1. 왼쪽 메뉴에서 **"Authentication"** 클릭
2. **"시작하기"** 클릭
3. **"Sign-in method"** 탭으로 이동
4. **"Google"** 클릭
5. **"사용 설정"** 토글 활성화
6. **"프로젝트 지원 이메일"** 설정 (본인 이메일)
7. **"저장"** 클릭

### 4. 웹 앱 등록
1. 프로젝트 개요로 돌아가서 **"</>"** (웹) 아이콘 클릭
2. 앱 닉네임: `coco-web-app`
3. **"앱 등록"** 클릭
4. **Firebase SDK 구성** 화면에서 config 객체 복사

## 🔑 **필요한 환경변수**

아래 Firebase 설정값들을 복사해서 보내주세요:

```javascript
const firebaseConfig = {
  apiKey: "여기 값",
  authDomain: "여기 값",
  projectId: "여기 값", 
  storageBucket: "여기 값",
  messagingSenderId: "여기 값",
  appId: "여기 값"
};
```

이 값들을 받으면 다음과 같이 설정합니다:

### 로컬 개발 (.env 파일)
```
VITE_FIREBASE_API_KEY=여기 값
VITE_FIREBASE_AUTH_DOMAIN=여기 값
VITE_FIREBASE_PROJECT_ID=여기 값
VITE_FIREBASE_STORAGE_BUCKET=여기 값
VITE_FIREBASE_MESSAGING_SENDER_ID=여기 값
VITE_FIREBASE_APP_ID=여기 값
```

### 프로덕션 (Render Dashboard)
- Environment Variables에 동일한 키-값 쌍 추가

## ✅ **구현 완료 사항**

- ✅ Firebase SDK 설치됨
- ✅ Firebase 설정 파일 생성 (`src/lib/firebase.js`)
- ✅ AuthContext Firebase 기반으로 재작성
- ✅ Google 로그인 버튼 복원 (데스크톱/모바일)
- ✅ 에러 처리 및 토스트 알림 구현

## 🚀 **다음 단계**

1. Firebase 프로젝트에서 config 값 복사
2. 환경변수 설정 (로컬 & 프로덕션)
3. 테스트 및 배포

설정이 완료되면 Google 로그인이 즉시 작동합니다!