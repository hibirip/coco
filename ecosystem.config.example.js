/**
 * PM2 Ecosystem Configuration
 * 프록시 서버 자동 재시작 및 프로세스 관리
 * 
 * 사용법:
 * 1. 이 파일을 ecosystem.config.js로 복사
 * 2. 환경에 맞게 설정 수정
 * 3. pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      // 프록시 서버 설정
      name: 'coco-proxy-server',
      script: './server/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      
      // 환경 변수
      env: {
        NODE_ENV: 'development',
        PORT: 8080
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      
      // 자동 재시작 설정
      watch: false, // 운영 환경에서는 false 권장
      ignore_watch: [
        'node_modules',
        'logs',
        '*.log'
      ],
      
      // 로그 설정
      log_file: './server/logs/combined.log',
      out_file: './server/logs/out.log',
      error_file: './server/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 메모리/CPU 제한
      max_memory_restart: '500M',
      
      // 재시작 설정
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // 헬스체크
      health_check_interval: 30000,
      health_check_grace_period: 10000
    }
  ],

  deploy: {
    // 운영 환경 배포 설정
    production: {
      user: 'ubuntu',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/coco.git',
      path: '/var/www/coco',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && cd server && npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    
    // 스테이징 환경 배포 설정
    staging: {
      user: 'ubuntu',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/coco.git',
      path: '/var/www/coco-staging',
      'post-deploy': 'npm install && cd server && npm install && pm2 reload ecosystem.config.js --env staging'
    }
  }
};