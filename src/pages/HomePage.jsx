import { useEffect } from 'react';
import { supabase, isDemoMode } from '../lib/supabase';

export default function HomePage() {
  useEffect(() => {
    // 환경변수 로드 테스트
    console.log('🔧 환경변수 테스트:');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '설정됨' : '누락됨');
    console.log('isDemoMode:', isDemoMode);
    
    // Supabase 클라이언트 테스트
    if (supabase) {
      console.log('✅ Supabase 클라이언트 정상 로드');
    } else {
      console.log('❌ Supabase 클라이언트 로드 실패');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-section p-6 rounded-lg">
        <h1 className="text-2xl font-bold text-primary mb-4">HomePage</h1>
        <div className="space-y-2 text-sm">
          <p>환경변수 상태:</p>
          <p>• Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ 설정됨' : '❌ 누락'}</p>
          <p>• Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 누락'}</p>
          <p>• Demo Mode: {isDemoMode ? '⚠️ 활성화' : '✅ 비활성화'}</p>
          <p>• Supabase Client: {supabase ? '✅ 정상' : '❌ 실패'}</p>
        </div>
      </div>
    </div>
  );
}