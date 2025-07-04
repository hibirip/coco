import { createClient } from '@supabase/supabase-js';

// 환경변수 읽기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 환경변수 디버깅 (프로덕션에서도 확인)
console.log('🔍 Supabase 환경변수 확인:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? `✅ ${supabaseUrl}` : '❌ 누락');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `✅ ${supabaseAnonKey.substring(0, 20)}...` : '❌ 누락');

// Fallback 처리 및 Demo Mode 체크
const isDemoMode = !supabaseUrl || !supabaseAnonKey;

if (isDemoMode) {
  console.warn('⚠️ Supabase 환경변수가 설정되지 않았습니다. 데모 모드로 실행됩니다.');
}

// Supabase 클라이언트 생성
let supabase = null;

if (!isDemoMode) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase 클라이언트가 성공적으로 생성되었습니다.');
  } catch (error) {
    console.error('❌ Supabase 클라이언트 생성 실패:', error);
  }
} else {
  // Demo mode에서는 mock 객체 제공
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      signUp: () => Promise.resolve({ data: null, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    }
  };
}

export { supabase, isDemoMode };
export default supabase;