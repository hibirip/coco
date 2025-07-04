import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isDemoMode } from '../lib/supabase';
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
      
      if (isDemoMode) {
        console.log('🔧 Demo Mode: Google 로그인 시뮬레이션');
        toast.info('데모 모드: Google 로그인 시뮬레이션', { duration: 2000 });
        
        // Demo mode에서는 mock user 생성 (1초 지연)
        setTimeout(() => {
          const mockUser = {
            id: 'demo-user-123',
            email: 'demo@example.com',
            user_metadata: {
              full_name: 'Demo User',
              avatar_url: 'https://via.placeholder.com/40'
            }
          };
          setCurrentUser(mockUser);
          setLoading(false);
          toast.success('데모 로그인이 완료되었습니다!');
          console.log('✅ Demo 로그인 완료');
        }, 1000);
        
        return { data: { user: null }, error: null };
      }

      // 환경변수 확인
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const errorMsg = 'Supabase 환경변수가 설정되지 않았습니다. GOOGLE_AUTH_SETUP.md를 참고하세요.';
        setError(errorMsg);
        setLoading(false);
        toast.error(errorMsg, { duration: 5000 });
        return { data: null, error: { message: errorMsg } };
      }

      // 실제 Supabase Google OAuth
      console.log('🔄 Google OAuth 시작...');
      toast.info('Google 로그인 창이 열립니다...', { duration: 3000 });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('❌ Google 로그인 실패:', error.message);
        setError(error.message);
        setLoading(false);
        
        // 사용자 친화적 에러 메시지
        let userMessage = 'Google 로그인에 실패했습니다.';
        if (error.message.includes('Invalid login credentials')) {
          userMessage = 'Google OAuth 설정을 확인해주세요.';
        } else if (error.message.includes('redirect_uri_mismatch')) {
          userMessage = 'OAuth 리디렉션 URI 설정을 확인해주세요.';
        }
        
        toast.error(userMessage, { duration: 5000 });
        return { data: null, error };
      }

      console.log('✅ Google 로그인 리디렉션 시작');
      // OAuth는 리다이렉트로 처리되므로 loading 상태 유지
      return { data, error: null };

    } catch (error) {
      console.error('❌ Google 로그인 중 예외 오류:', error);
      const errorMsg = '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
      setError(errorMsg);
      setLoading(false);
      toast.error(errorMsg);
      return { data: null, error: { message: error.message } };
    }
  };

  // 로그아웃 함수
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isDemoMode) {
        console.log('🔧 Demo Mode: 로그아웃 시뮬레이션');
        setCurrentUser(null);
        toast.success('로그아웃되었습니다.');
        return { error: null };
      }

      // 실제 Supabase 로그아웃
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('로그아웃 실패:', error.message);
        setError(error.message);
        toast.error('로그아웃에 실패했습니다.');
        return { error };
      }

      setCurrentUser(null);
      console.log('✅ 로그아웃 성공');
      toast.success('로그아웃되었습니다.');
      return { error: null };

    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      const errorMsg = '로그아웃 중 오류가 발생했습니다.';
      setError(errorMsg);
      toast.error(errorMsg);
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
            if (event === 'SIGNED_IN') {
              toast.success(`환영합니다, ${session.user.user_metadata?.full_name || session.user.email}님!`);
            }
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
    error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!currentUser,
    isDemoMode,
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