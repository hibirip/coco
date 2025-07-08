/**
 * API 상태 모니터링 시스템
 * 실시간 API 상태 추적 및 장애 감지
 */

import { logger } from './logger';

class ApiMonitor {
  constructor() {
    this.apiStatus = new Map();
    this.errorCounts = new Map();
    this.lastSuccessTime = new Map();
    this.isMonitoring = false;
    
    // 모니터링 설정
    this.config = {
      healthCheckInterval: 30000, // 30초마다 헬스체크
      errorThreshold: 5, // 5회 연속 실패시 알림
      timeoutThreshold: 10000, // 10초 이상 응답없으면 타임아웃
      retryDelay: 5000 // 실패시 5초 후 재시도
    };
  }

  /**
   * API 모니터링 시작
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    logger.info('🔍 API 모니터링 시작');
    
    // 주기적 헬스체크
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * API 모니터링 중지
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    logger.info('⏹️ API 모니터링 중지');
  }

  /**
   * API 호출 성공 기록
   */
  recordSuccess(apiName, responseTime) {
    this.apiStatus.set(apiName, 'healthy');
    this.errorCounts.set(apiName, 0);
    this.lastSuccessTime.set(apiName, Date.now());
    
    logger.debug(`✅ ${apiName} API 성공 (${responseTime}ms)`);
  }

  /**
   * API 호출 실패 기록
   */
  recordFailure(apiName, error) {
    const currentErrors = this.errorCounts.get(apiName) || 0;
    const newErrorCount = currentErrors + 1;
    
    this.errorCounts.set(apiName, newErrorCount);
    this.apiStatus.set(apiName, 'unhealthy');
    
    logger.error(`❌ ${apiName} API 실패 (${newErrorCount}회):`, error.message);
    
    // 임계값 초과시 알림
    if (newErrorCount >= this.config.errorThreshold) {
      this.triggerAlert(apiName, `${newErrorCount}회 연속 실패`);
    }
  }

  /**
   * API 타임아웃 기록
   */
  recordTimeout(apiName) {
    this.apiStatus.set(apiName, 'timeout');
    logger.warn(`⏱️ ${apiName} API 타임아웃`);
    this.triggerAlert(apiName, '응답 타임아웃');
  }

  /**
   * 헬스체크 수행
   */
  async performHealthCheck() {
    const apis = ['bitget', 'upbit', 'exchange-rate'];
    
    for (const api of apis) {
      try {
        await this.pingApi(api);
      } catch (error) {
        this.recordFailure(api, error);
      }
    }
  }

  /**
   * 개별 API 핑 테스트
   */
  async pingApi(apiName) {
    const startTime = Date.now();
    let endpoint;
    
    switch (apiName) {
      case 'bitget':
        endpoint = '/api/bitget/api/v2/spot/market/tickers?symbol=BTCUSDT';
        break;
      case 'upbit':
        endpoint = '/api/upbit/v1/ticker?markets=KRW-BTC';
        break;
      case 'exchange-rate':
        endpoint = '/api/exchange-rate';
        break;
      default:
        throw new Error(`Unknown API: ${apiName}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      this.recordTimeout(apiName);
    }, this.config.timeoutThreshold);

    try {
      const response = await fetch(endpoint, {
        method: 'HEAD', // 헤더만 확인 (빠른 응답)
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        this.recordSuccess(apiName, responseTime);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        this.recordTimeout(apiName);
      } else {
        this.recordFailure(apiName, error);
      }
    }
  }

  /**
   * 장애 알림 발생
   */
  triggerAlert(apiName, reason) {
    const alertMessage = `🚨 ${apiName.toUpperCase()} API 장애: ${reason}`;
    
    // 콘솔 알림
    console.error(alertMessage);
    
    // 개발환경에서는 브라우저 알림도 표시
    if (import.meta.env.DEV && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('API 장애 발생', {
          body: alertMessage,
          icon: '/favicon.ico'
        });
      }
    }
    
    // 커스텀 이벤트 발생 (UI에서 감지 가능)
    window.dispatchEvent(new CustomEvent('apiAlert', {
      detail: { apiName, reason, timestamp: Date.now() }
    }));
  }

  /**
   * 현재 API 상태 반환
   */
  getApiStatus() {
    const status = {};
    
    for (const [apiName] of this.apiStatus) {
      status[apiName] = {
        status: this.apiStatus.get(apiName) || 'unknown',
        errorCount: this.errorCounts.get(apiName) || 0,
        lastSuccess: this.lastSuccessTime.get(apiName) || null,
        isHealthy: this.apiStatus.get(apiName) === 'healthy'
      };
    }
    
    return status;
  }

  /**
   * API 통계 반환
   */
  getStatistics() {
    const stats = this.getApiStatus();
    const totalApis = Object.keys(stats).length;
    const healthyApis = Object.values(stats).filter(api => api.isHealthy).length;
    
    return {
      total: totalApis,
      healthy: healthyApis,
      unhealthy: totalApis - healthyApis,
      uptime: totalApis > 0 ? (healthyApis / totalApis * 100).toFixed(1) : 0,
      details: stats
    };
  }
}

// 싱글톤 인스턴스 생성
export const apiMonitor = new ApiMonitor();

// 개발환경에서 자동 모니터링 시작
if (import.meta.env.DEV) {
  // 페이지 로드 후 모니터링 시작
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => apiMonitor.startMonitoring(), 2000);
    });
  } else {
    setTimeout(() => apiMonitor.startMonitoring(), 2000);
  }
}

export default apiMonitor;