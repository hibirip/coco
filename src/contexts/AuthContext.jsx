import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isDemoMode } from '../lib/supabase';

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

  // Google 로그인 함수 (뼈대)
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      if (isDemoMode) {
        console.log('🔧 Demo Mode: Google 로그인 시뮬레이션');
        // Demo mode에서는 mock user 생성
        const mockUser = {
          id: 'demo-user-123',
          email: 'demo@example.com',
          user_metadata: {
            full_name: 'Demo User',
            avatar_url: 'https://via.placeholder.com/40'
          }
        };
        setCurrentUser(mockUser);
        return { data: { user: mockUser }, error: null };
      }

      // 실제 Supabase Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google 로그인 실패:', error.message);
        return { data: null, error };
      }

      console.log('✅ Google 로그인 요청 성공');
      return { data, error: null };

    } catch (error) {
      console.error('Google 로그인 중 오류:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 함수 (뼈대)
  const signOut = async () => {
    try {
      setLoading(true);

      if (isDemoMode) {
        console.log('🔧 Demo Mode: 로그아웃 시뮬레이션');
        setCurrentUser(null);
        return { error: null };
      }

      // 실제 Supabase 로그아웃
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('로그아웃 실패:', error.message);
        return { error };
      }

      setCurrentUser(null);
      console.log('✅ 로그아웃 성공');
      return { error: null };

    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // 초기 세션 체크 및 인증 상태 변화 리스너
  useEffect(() => {
    let mounted = true;

    // 초기 세션 체크
    const checkSession = async () => {
      try {
        if (isDemoMode) {
          console.log('🔧 Demo Mode: 세션 체크 시뮬레이션');
          setLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('세션 체크 실패:', error.message);
        } else if (session?.user && mounted) {
          setCurrentUser(session.user);
          console.log('✅ 기존 세션 발견:', session.user.email);
        }
      } catch (error) {
        console.error('세션 체크 중 오류:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // 인증 상태 변화 리스너 설정
    let authListener = null;
    
    if (!isDemoMode && supabase) {
      authListener = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (mounted) {
          if (session?.user) {
            setCurrentUser(session.user);
            console.log('✅ 사용자 로그인:', session.user.email);
          } else {
            setCurrentUser(null);
            console.log('👋 사용자 로그아웃');
          }
          setLoading(false);
        }
      });
    }

    // Cleanup
    return () => {
      mounted = false;
      if (authListener) {
        authListener.data?.subscription?.unsubscribe?.();
      }
    };
  }, []);

  // Context value
  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!currentUser,
    isDemoMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;