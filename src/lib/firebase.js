import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase 설정 - 환경변수로 관리
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 환경변수 확인
const isFirebaseConfigured = Object.values(firebaseConfig).every(value => value !== undefined);

console.log('🔥 Firebase 설정 확인:', {
  apiKey: firebaseConfig.apiKey ? '✅ 설정됨' : '❌ 누락',
  authDomain: firebaseConfig.authDomain ? '✅ 설정됨' : '❌ 누락',
  projectId: firebaseConfig.projectId ? '✅ 설정됨' : '❌ 누락',
  isConfigured: isFirebaseConfigured
});

// Firebase 앱 초기화
let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    
    // Google Provider 설정
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    console.log('✅ Firebase 초기화 성공');
  } catch (error) {
    console.error('❌ Firebase 초기화 실패:', error);
  }
} else {
  console.warn('⚠️ Firebase 환경변수가 설정되지 않았습니다.');
}

export { auth, googleProvider, isFirebaseConfigured };
export default app;