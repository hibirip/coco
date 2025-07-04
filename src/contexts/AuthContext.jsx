import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { useToast } from '../hooks';

// Auth Context 생성
const AuthContext = createContext({});

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Google 로그인 함수
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isFirebaseConfigured) {
        const errorMsg = 'Firebase가 설정되지 않았습니다. 환경변수를 확인하세요.';
        setError(errorMsg);
        toast.error(errorMsg);
        return { user: null, error: { message: errorMsg } };
      }

      console.log('🔄 Firebase Google 로그인 시작...');
      toast.info('Google 로그인 창이 열립니다...', { duration: 3000 });

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log('✅ Firebase 로그인 성공:', user.email);
      toast.success(`환영합니다, ${user.displayName || user.email}님!`);

      return { user, error: null };

    } catch (error) {
      console.error('❌ Google 로그인 실패:', error);
      
      let userMessage = 'Google 로그인에 실패했습니다.';
      if (error.code === 'auth/popup-closed-by-user') {
        userMessage = '로그인이 취소되었습니다.';
      } else if (error.code === 'auth/popup-blocked') {
        userMessage = '팝업이 차단되었습니다. 팝업을 허용해주세요.';
      }
      
      setError(error.message);
      toast.error(userMessage);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 함수
  const signOut = async () => {
    try {
      setLoading(true);
      
      if (!isFirebaseConfigured) {
        setCurrentUser(null);
        toast.success('로그아웃되었습니다.');
        return { error: null };
      }

      await firebaseSignOut(auth);
      console.log('✅ Firebase 로그아웃 성공');
      toast.success('로그아웃되었습니다.');
      return { error: null };

    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      setError(error.message);
      toast.error('로그아웃에 실패했습니다.');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Firebase 인증 상태 변화 리스너
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    console.log('🔄 Firebase 인증 상태 리스너 시작');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔄 Firebase 인증 상태 변화:', user ? user.email : '로그아웃됨');
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup function
    return () => {
      console.log('🔄 Firebase 인증 리스너 정리');
      unsubscribe();
    };
  }, []);

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!currentUser,
    isFirebaseConfigured,
    // 유용한 헬퍼 함수들
    user: {
      id: currentUser?.uid,
      email: currentUser?.email,
      name: currentUser?.displayName || currentUser?.email,
      avatar: currentUser?.photoURL,
      provider: 'google'
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;