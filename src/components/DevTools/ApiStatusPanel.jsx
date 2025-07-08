/**
 * API 상태 모니터링 패널 (개발환경 전용)
 * 실시간 API 상태, 응답시간, 에러 추적
 */

import { useState, useEffect } from 'react';
import { apiMonitor } from '../../utils/apiMonitor';
import { getExchangeRateServiceStatus, refreshExchangeRate } from '../../services/exchangeRate';

const ApiStatusPanel = () => {
  const [apiStats, setApiStats] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [exchangeRateInfo, setExchangeRateInfo] = useState(null);

  // API 상태 업데이트
  useEffect(() => {
    const updateStats = () => {
      setApiStats(apiMonitor.getStatistics());
      setExchangeRateInfo(getExchangeRateServiceStatus());
    };

    // 초기 상태 로드
    updateStats();

    // 주기적 업데이트
    const interval = setInterval(updateStats, 2000);

    // API 알림 이벤트 리스너
    const handleApiAlert = (event) => {
      const alert = {
        id: Date.now(),
        ...event.detail,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setAlerts(prev => [alert, ...prev.slice(0, 4)]); // 최근 5개만 유지
      
      // 5초 후 자동 제거
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== alert.id));
      }, 5000);
    };

    window.addEventListener('apiAlert', handleApiAlert);

    return () => {
      clearInterval(interval);
      window.removeEventListener('apiAlert', handleApiAlert);
    };
  }, []);

  // 개발환경에서만 표시
  if (import.meta.env.PROD) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'unhealthy': return 'text-red-500';
      case 'timeout': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'unhealthy': return '❌';
      case 'timeout': return '⏱️';
      default: return '⚪';
    }
  };

  return (
    <>
      {/* 토글 버튼 */}
      <div 
        className="fixed bottom-4 right-4 z-[9999] bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition-colors"
        onClick={() => setIsVisible(!isVisible)}
        title="API 모니터링 패널"
      >
        🔍
      </div>

      {/* API 상태 패널 */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-[9999] bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800">API 모니터링</h3>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* 전체 상태 요약 */}
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">전체 상태</div>
            <div className="text-lg font-bold">
              가동률: {apiStats.uptime || 0}% 
              <span className="text-sm font-normal ml-2">
                ({apiStats.healthy || 0}/{apiStats.total || 0} 정상)
              </span>
            </div>
          </div>

          {/* 개별 API 상태 */}
          <div className="space-y-2">
            {apiStats.details && Object.entries(apiStats.details).map(([apiName, status]) => (
              <div key={apiName} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <span>{getStatusIcon(status.status)}</span>
                  <span className="font-medium capitalize">{apiName}</span>
                </div>
                <div className="text-right text-xs">
                  <div className={`font-medium ${getStatusColor(status.status)}`}>
                    {status.status}
                  </div>
                  {status.errorCount > 0 && (
                    <div className="text-red-500">오류: {status.errorCount}회</div>
                  )}
                  {status.lastSuccess && (
                    <div className="text-gray-500">
                      최근: {new Date(status.lastSuccess).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 알림 목록 */}
          {alerts.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">최근 알림</div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {alerts.map(alert => (
                  <div key={alert.id} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                    <div className="font-medium text-red-700">{alert.apiName.toUpperCase()}</div>
                    <div className="text-red-600">{alert.reason}</div>
                    <div className="text-gray-500">{alert.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 환율 정보 섹션 */}
          {exchangeRateInfo && (
            <div className="mt-4 p-3 bg-green-50 rounded border-l-4 border-green-400">
              <div className="text-sm font-medium text-green-800 mb-2">🔍 구글 검색 기반 환율</div>
              <div className="text-lg font-bold text-green-900">
                ${exchangeRateInfo.cache.rate || exchangeRateInfo.config.defaultRate}원
              </div>
              <div className="text-xs text-green-700 mt-1">
                {exchangeRateInfo.cache.hasCachedData ? (
                  <div>
                    캐시: {exchangeRateInfo.cache.ageMinutes}분 전 
                    ({exchangeRateInfo.cache.remainingMinutes}분 후 만료)
                  </div>
                ) : (
                  <div>캐시 없음 - 기본값 사용 중</div>
                )}
              </div>
              <div className="text-xs text-green-600 mt-1">
                4시간마다 자동 업데이트 | 기준: 구글 "1달러 한국 환율"
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => {
                apiMonitor.performHealthCheck();
                setApiStats(apiMonitor.getStatistics());
              }}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              헬스체크
            </button>
            <button
              onClick={async () => {
                try {
                  const newRate = await refreshExchangeRate();
                  console.log('환율 새로고침:', newRate);
                  setExchangeRateInfo(getExchangeRateServiceStatus());
                } catch (error) {
                  console.error('환율 새로고침 실패:', error);
                }
              }}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
              환율 새로고침
            </button>
            <button
              onClick={() => {
                console.log('API Statistics:', apiMonitor.getStatistics());
                console.log('Exchange Rate Info:', exchangeRateInfo);
              }}
              className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
            >
              콘솔 출력
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ApiStatusPanel;