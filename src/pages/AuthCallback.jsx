import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isDemoMode } from '../lib/supabase';
import { useToast } from '../hooks';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('로그인 처리 중...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (isDemoMode) {
          console.log('🔧 Demo Mode: AuthCallback 시뮬레이션');
          setMessage('데모 로그인 완료');
          setStatus('success');
          
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
          return;
        }

        console.log('🔄 OAuth 콜백 처리 시작...');
        console.log('🔍 현재 URL:', window.location.href);
        
        // URL 파라미터 확인
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        const accessToken = hashParams.get('access_token');
        const code = searchParams.get('code');
        
        let sessionData = null;
        let sessionError = null;
        
        // 토큰이나 코드가 있으면 세션 교환 시도
        if (code) {
          console.log('🔑 인증 코드 발견, 세션 교환 중...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          sessionData = data;
          sessionError = error;
        } else if (accessToken) {
          console.log('🔑 액세스 토큰 발견, 세션 설정 중...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token')
          });
          sessionData = data;
          sessionError = error;
        } else {
          // 토큰/코드가 없으면 현재 세션 확인
          console.log('⚠️ 토큰/코드 없음, 현재 세션 확인...');
          const { data, error } = await supabase.auth.getSession();
          sessionData = data;
          sessionError = error;
        }
        
        if (sessionError) {
          console.error('❌ 세션 확인 실패:', sessionError.message);
          setStatus('error');
          setMessage(`로그인 실패: ${sessionError.message}`);
          
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
          return;
        }

        if (sessionData?.session?.user) {
          console.log('✅ 로그인 성공:', sessionData.session.user.email);
          const userName = sessionData.session.user.user_metadata?.full_name || sessionData.session.user.email;
          setStatus('success');
          setMessage('로그인 성공! 홈으로 이동합니다...');
          toast.success(`환영합니다, ${userName}님!`);
          
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        } else {
          console.log('⚠️ 세션이 없음, 홈으로 리다이렉트');
          setStatus('error');
          setMessage('로그인 세션을 찾을 수 없습니다.');
          
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        }
        
      } catch (error) {
        console.error('❌ AuthCallback 오류:', error);
        setStatus('error');
        setMessage('로그인 처리 중 오류가 발생했습니다.');
        
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-success" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-danger" />;
      default:
        return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-textSecondary';
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-danger';
      default:
        return 'text-textSecondary';
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center">
      <div className="bg-section p-8 rounded-lg border border-border max-w-md w-full mx-4">
        <div className="text-center space-y-6">
          {/* 아이콘 */}
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>
          
          {/* 제목 */}
          <h1 className="text-2xl font-bold text-text">
            {status === 'loading' && '로그인 처리 중'}
            {status === 'success' && '로그인 완료'}
            {status === 'error' && '로그인 실패'}
          </h1>
          
          {/* 메시지 */}
          <p className={`text-sm ${getStatusColor()}`}>
            {message}
          </p>
          
          {/* 로딩 바 (로딩 중일 때만) */}
          {status === 'loading' && (
            <div className="w-full bg-card rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse"></div>
            </div>
          )}
          
          {/* 추가 정보 */}
          <div className="text-xs text-textSecondary">
            {status === 'loading' && '잠시만 기다려주세요...'}
            {status === 'success' && '자동으로 홈페이지로 이동합니다.'}
            {status === 'error' && '잠시 후 홈페이지로 이동합니다.'}
          </div>
        </div>
      </div>
    </div>
  );
}