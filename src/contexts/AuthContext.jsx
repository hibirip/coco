import { createContext, useContext, useState } from 'react';

// Auth Context 생성 (임시 비활성화)
const AuthContext = createContext({});

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component (Google 로그인 제거)
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 임시 로그인 함수 (나중에 구현)
  const signInWithGoogle = async () => {
    console.log('Google 로그인 기능이 임시로 비활성화되었습니다.');
    // TODO: 새로운 인증 방식 구현
  };

  // 로그아웃 함수
  const signOut = async () => {
    setCurrentUser(null);
    console.log('로그아웃되었습니다.');
  };

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!currentUser,
    isDemoMode: true, // 임시로 데모 모드 활성화
    // 유용한 헬퍼 함수들
    user: {
      id: currentUser?.id,
      email: currentUser?.email,
      name: currentUser?.user_metadata?.full_name || currentUser?.email,
      avatar: currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture,
      provider: currentUser?.app_metadata?.provider
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;