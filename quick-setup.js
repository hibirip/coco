#!/usr/bin/env node

/**
 * 🚀 Coco Crypto - Google 로그인 빠른 설정 스크립트
 * 
 * 이 스크립트는 Supabase와 Google OAuth 설정을 쉽게 확인하고 검증합니다.
 */

import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}🔧 ${msg}${colors.reset}`),
  step: (num, msg) => console.log(`\n${colors.magenta}${num}.${colors.reset} ${colors.bright}${msg}${colors.reset}`)
};

function checkEnvFile() {
  log.title('환경변수 파일 체크');
  
  const envFiles = ['.env.local', '.env'];
  let envFile = null;
  
  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      envFile = file;
      break;
    }
  }
  
  if (!envFile) {
    log.error('.env.local 또는 .env 파일이 없습니다.');
    log.info('다음 명령어로 파일을 생성하세요:');
    console.log(`${colors.cyan}cp .env.example .env.local${colors.reset}`);
    return false;
  }
  
  log.success(`환경변수 파일 발견: ${envFile}`);
  
  // 환경변수 내용 체크
  const envContent = fs.readFileSync(envFile, 'utf8');
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName) || envContent.includes(`${varName}=your-`)) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    log.error('다음 환경변수가 설정되지 않았습니다:');
    missingVars.forEach(varName => {
      console.log(`  • ${colors.red}${varName}${colors.reset}`);
    });
    return false;
  }
  
  log.success('필수 환경변수가 모두 설정되었습니다.');
  return true;
}

function createEnvExample() {
  log.step(1, '.env.example 파일 생성');
  
  const envExampleContent = `# Supabase 설정
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google OAuth (선택사항)
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# 앱 설정
VITE_APP_URL=http://localhost:5173
`;
  
  if (!fs.existsSync('.env.example')) {
    fs.writeFileSync('.env.example', envExampleContent);
    log.success('.env.example 파일이 생성되었습니다.');
  } else {
    log.info('.env.example 파일이 이미 존재합니다.');
  }
}

function showSetupGuide() {
  log.title('설정 가이드');
  
  console.log(`
${colors.bright}📋 Google 로그인 설정 단계:${colors.reset}

1. ${colors.cyan}Supabase 프로젝트 생성${colors.reset}
   • https://supabase.com/dashboard 에서 새 프로젝트 생성
   • Project URL과 Anon Key 복사

2. ${colors.cyan}Google OAuth 설정${colors.reset}
   • https://console.cloud.google.com/ 에서 OAuth Client ID 생성
   • Authorized redirect URIs 추가:
     - http://localhost:5173/auth/callback
     - https://your-project-id.supabase.co/auth/v1/callback

3. ${colors.cyan}Supabase Auth 설정${colors.reset}
   • Authentication > Providers > Google 활성화
   • Google Client ID/Secret 입력

4. ${colors.cyan}환경변수 설정${colors.reset}
   • .env.local 파일에 Supabase 정보 입력

${colors.bright}📖 자세한 가이드: GOOGLE_AUTH_SETUP.md${colors.reset}
`);
}

function validateSupabaseUrl(url) {
  const supabasePattern = /^https:\/\/[a-z0-9-]+\.supabase\.co$/;
  return supabasePattern.test(url);
}

function validateSupabaseKey(key) {
  // JWT 패턴 체크 (간단한 검증)
  return key && key.startsWith('eyJ') && key.includes('.') && key.length > 100;
}

function testEnvironment() {
  log.title('환경변수 검증');
  
  if (!fs.existsSync('.env.local') && !fs.existsSync('.env')) {
    log.error('환경변수 파일이 없습니다.');
    return false;
  }
  
  const envFile = fs.existsSync('.env.local') ? '.env.local' : '.env';
  const envContent = fs.readFileSync(envFile, 'utf8');
  
  // 환경변수 파싱
  const vars = {};
  envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      vars[key.trim()] = value.trim();
    }
  });
  
  // Supabase URL 검증
  if (!vars.VITE_SUPABASE_URL) {
    log.error('VITE_SUPABASE_URL이 설정되지 않았습니다.');
    return false;
  }
  
  if (!validateSupabaseUrl(vars.VITE_SUPABASE_URL)) {
    log.error('VITE_SUPABASE_URL 형식이 올바르지 않습니다.');
    log.info('올바른 형식: https://your-project-id.supabase.co');
    return false;
  }
  
  log.success('Supabase URL이 올바른 형식입니다.');
  
  // Supabase Key 검증
  if (!vars.VITE_SUPABASE_ANON_KEY) {
    log.error('VITE_SUPABASE_ANON_KEY가 설정되지 않았습니다.');
    return false;
  }
  
  if (!validateSupabaseKey(vars.VITE_SUPABASE_ANON_KEY)) {
    log.error('VITE_SUPABASE_ANON_KEY 형식이 올바르지 않습니다.');
    log.info('Supabase 콘솔에서 올바른 anon key를 복사해주세요.');
    return false;
  }
  
  log.success('Supabase Anon Key가 올바른 형식입니다.');
  
  return true;
}

function showNextSteps() {
  log.title('다음 단계');
  
  console.log(`
${colors.bright}🚀 이제 다음 단계를 진행하세요:${colors.reset}

1. ${colors.green}개발 서버 시작${colors.reset}
   ${colors.cyan}npm run dev${colors.reset}

2. ${colors.green}Google 로그인 테스트${colors.reset}
   • http://localhost:5173 접속
   • 헤더의 "Google 로그인" 버튼 클릭
   • 로그인 프로세스 확인

3. ${colors.green}배포 준비${colors.reset}
   • 프로덕션 빌드: ${colors.cyan}npm run build${colors.reset}
   • 빌드 미리보기: ${colors.cyan}npm run preview${colors.reset}

${colors.bright}🔍 문제 해결:${colors.reset}
• 상세 가이드: ${colors.cyan}GOOGLE_AUTH_SETUP.md${colors.reset}
• 체크리스트: ${colors.cyan}FINAL_CHECKLIST.md${colors.reset}
`);
}

function main() {
  console.log(`
${colors.bright}${colors.cyan}
🚀 Coco Crypto - Google 로그인 빠른 설정
=======================================
${colors.reset}
이 스크립트는 Google 로그인 기능 설정을 도와드립니다.
`);
  
  // 1. .env.example 파일 생성
  createEnvExample();
  
  // 2. 환경변수 파일 체크
  if (!checkEnvFile()) {
    log.step(2, '환경변수 파일 설정');
    log.info('.env.local 파일을 생성하고 Supabase 정보를 입력하세요.');
    log.info('자세한 가이드: GOOGLE_AUTH_SETUP.md');
    return;
  }
  
  // 3. 환경변수 검증
  log.step(2, '환경변수 검증');
  if (!testEnvironment()) {
    log.info('환경변수를 올바르게 설정한 후 다시 실행해주세요.');
    return;
  }
  
  // 4. 설정 완료
  log.step(3, '설정 완료');
  log.success('Google 로그인 설정이 완료되었습니다! 🎉');
  
  // 5. 다음 단계 안내
  showNextSteps();
}

// 스크립트 실행
main();