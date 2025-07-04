import { useEffect, useState } from 'react';
import { supabase, isDemoMode } from '../lib/supabase';
import { 
  formatKRW, 
  formatUSD, 
  formatPercent, 
  formatMarketCap, 
  formatVolume,
  formatDate,
  calculateKimchi,
  getChangeColorClass
} from '../utils';
import { 
  getBitgetPrice, 
  getUpbitPrice, 
  getKimchiPremiumData,
  checkApiStatus 
} from '../services';
import { 
  testBitgetDirectCall, 
  testAllBitgetEndpoints, 
  showCORSDebugGuide 
} from '../services/bitget';
import { 
  getUSDKRWRate, 
  refreshExchangeRate, 
  getExchangeRateServiceStatus 
} from '../services/exchangeRate';
import { useExchangeRate, useUpbitPrices } from '../hooks';
import { 
  getAllSymbolMappings, 
  bitgetToUpbit, 
  upbitToBitget 
} from '../services/upbit';
import { 
  getLatestNews, 
  checkNewsServiceStatus, 
  getAvailableCategories 
} from '../services/news';
import { usePrices } from '../contexts';
import { useBitgetWebSocket } from '../hooks';

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [corsTestResults, setCorsTestResults] = useState(null);
  
  // 환율 훅 사용
  const {
    exchangeRate,
    loading: exchangeLoading,
    error: exchangeError,
    lastUpdated: exchangeLastUpdated,
    source: exchangeSource,
    isValid: exchangeIsValid,
    dataAgeMinutes,
    refresh: refreshExchangeRateHook,
    getCacheInfo,
    isFromCache,
    isFromAPI,
    isFromFallback
  } = useExchangeRate();

  // 업비트 가격 훅 사용
  const {
    prices: upbitPrices,
    markets: upbitMarkets,
    loading: upbitLoading,
    error: upbitError,
    lastUpdated: upbitLastUpdated,
    priceCount,
    dataAgeSeconds,
    hasData: upbitHasData,
    refresh: refreshUpbitPrices,
    getPrice: getUpbitPrice,
    getCacheInfo: getUpbitCacheInfo,
    isHealthy: upbitIsHealthy,
    isStale: upbitIsStale
  } = useUpbitPrices();

  // PriceContext 훅 사용
  const {
    prices,
    upbitPrices: contextUpbitPrices,
    isConnected,
    exchangeRate: contextExchangeRate,
    MAJOR_COINS,
    MAJOR_SYMBOLS,
    stats,
    errors,
    calculateKimchiPremium,
    getAllKimchiPremiums
  } = usePrices();

  // Bitget WebSocket 훅 사용
  const {
    isConnected: wsConnected,
    isConnecting: wsConnecting,
    isReconnecting: wsReconnecting,
    isFailed: wsFailed,
    connectionState: wsConnectionState,
    reconnectAttempts: wsReconnectAttempts,
    messageCount: wsMessageCount,
    dataReceived: wsDataReceived,
    lastPingTime: wsLastPingTime,
    symbolsToSubscribe: wsSymbols,
    connect: wsConnect,
    disconnect: wsDisconnect,
    reconnect: wsReconnect,
    readyState: wsReadyState
  } = useBitgetWebSocket({
    enabled: true // 기본적으로 WebSocket 연결 활성화
  });

  useEffect(() => {
    // 환경변수 로드 테스트
    console.log('🔧 환경변수 테스트:');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '설정됨' : '누락됨');
    console.log('isDemoMode:', isDemoMode);
    
    // PriceContext 테스트
    console.log('📊 PriceContext 초기 상태:');
    console.log('  - 주요 코인 수:', MAJOR_SYMBOLS.length);
    console.log('  - 연결 상태:', isConnected);
    console.log('  - 통계:', stats);
    console.log('  - 첫 번째 코인:', Object.values(MAJOR_COINS)[0]);
    
    // Supabase 클라이언트 테스트
    if (supabase) {
      console.log('✅ Supabase 클라이언트 정상 로드');
    } else {
      console.log('❌ Supabase 클라이언트 로드 실패');
    }

    // 포매터 함수 테스트
    console.log('🧮 포매터 함수 테스트:');
    console.log('formatKRW(1234567):', formatKRW(1234567));
    console.log('formatUSD(1234.567):', formatUSD(1234.567));
    console.log('formatPercent(12.34):', formatPercent(12.34));
    console.log('formatMarketCap(1234567890000):', formatMarketCap(1234567890000));
    console.log('calculateKimchi:', calculateKimchi(65000000, 50000, 1300));

    // API 상태 확인
    checkApiStatus().then(status => {
      setApiStatus(status);
      console.log('📡 API 상태:', status);
    });
  }, []);

  const handleTestApi = async () => {
    setLoading(true);
    try {
      console.log('🔄 실시간 API 테스트 시작...');
      
      // 비트코인 김치프리미엄 데이터 조회
      const btcData = await getKimchiPremiumData('BTC');
      setRealTimeData(btcData);
      console.log('📊 BTC 김치프리미엄 데이터:', btcData);
      
    } catch (error) {
      console.error('❌ API 테스트 실패:', error);
      alert(`API 테스트 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCORS = async () => {
    setLoading(true);
    try {
      console.log('🚫 CORS 에러 테스트 시작...');
      
      // CORS 디버깅 가이드 표시
      showCORSDebugGuide();
      
      // 모든 Bitget API 엔드포인트 테스트
      const results = await testAllBitgetEndpoints();
      setCorsTestResults(results);
      
    } catch (error) {
      console.error('❌ CORS 테스트 실패:', error);
      setCorsTestResults({
        timestamp: new Date().toISOString(),
        tests: [],
        globalError: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestExchangeRate = async () => {
    setLoading(true);
    try {
      console.log('🔄 환율 API 테스트 시작...');
      
      // 1. 서비스 상태 확인
      const serviceStatus = getExchangeRateServiceStatus();
      console.log('📊 환율 서비스 상태:', serviceStatus);
      
      // 2. 강제 새로고침 테스트
      const freshRate = await refreshExchangeRate();
      console.log('🔄 강제 새로고침 결과:', freshRate);
      
      // 3. 캐시 정보 확인
      const cacheInfo = getCacheInfo();
      console.log('💾 캐시 정보:', cacheInfo);
      
      alert(`환율 테스트 완료!\n현재 환율: ${exchangeRate}\n소스: ${exchangeSource}\n데이터 나이: ${dataAgeMinutes}분`);
      
    } catch (error) {
      console.error('❌ 환율 테스트 실패:', error);
      alert(`환율 테스트 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestUpbit = async () => {
    setLoading(true);
    try {
      console.log('🔄 업비트 API 테스트 시작...');
      
      // 1. 심볼 매핑 테스트
      const mappings = getAllSymbolMappings();
      console.log('🔗 심볼 매핑:', mappings.slice(0, 5)); // 처음 5개만 표시
      
      // 2. 변환 테스트
      const btcUpbit = bitgetToUpbit('BTCUSDT');
      const btcBitget = upbitToBitget('KRW-BTC');
      console.log('🔀 심볼 변환 테스트:', { 
        'BTCUSDT -> Upbit': btcUpbit, 
        'KRW-BTC -> Bitget': btcBitget 
      });
      
      // 3. 업비트 캐시 정보
      const upbitCacheInfo = getUpbitCacheInfo();
      console.log('💾 업비트 캐시 정보:', upbitCacheInfo);
      
      // 4. 김치프리미엄 계산 테스트
      const btcPrice = getUpbitPrice('KRW-BTC');
      if (btcPrice && exchangeRate) {
        const kimchi = calculateKimchi(btcPrice.price, 50000, exchangeRate); // 50k USD 가정
        console.log('🌶️ 김치프리미엄 테스트:', kimchi);
      }
      
      alert(`업비트 테스트 완료!\n조회된 마켓: ${priceCount}개\n데이터 나이: ${dataAgeSeconds}초\n상태: ${upbitIsHealthy ? '정상' : '오류'}`);
      
    } catch (error) {
      console.error('❌ 업비트 테스트 실패:', error);
      alert(`업비트 테스트 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNews = async () => {
    setLoading(true);
    try {
      console.log('🔄 뉴스 API 테스트 시작...');
      
      // 1. 서비스 상태 확인
      const serviceStatus = await checkNewsServiceStatus();
      console.log('📊 뉴스 서비스 상태:', serviceStatus);
      
      // 2. 카테고리 목록 조회
      const categories = getAvailableCategories();
      console.log('📂 사용 가능한 카테고리:', categories);
      
      // 3. 최신 뉴스 조회 테스트
      const latestNews = await getLatestNews({ limit: 3 });
      console.log('📰 최신 뉴스:', latestNews);
      
      alert(`뉴스 테스트 완료!\n서비스 상태: ${serviceStatus.available ? '사용가능' : '사용불가'}\n건강 상태: ${serviceStatus.healthy ? '정상' : '오류'}\n조회된 뉴스: ${latestNews.length}개\n카테고리: ${Object.keys(categories).length}개`);
      
    } catch (error) {
      console.error('❌ 뉴스 테스트 실패:', error);
      alert(`뉴스 테스트 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCMC = async () => {
    setLoading(true);
    try {
      console.log('🔄 CoinMarketCap API 테스트 시작...');
      
      // CMC API 테스트 (API 키 없이)
      const response = await fetch('http://localhost:8080/api/cmc?limit=5', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('💰 CMC API 응답:', data);
      
      if (response.status === 503) {
        alert(`CMC API 테스트 완료!\n상태: API 키 필요 (예상됨)\n에러 코드: ${data.code}\n메시지: ${data.error}`);
      } else if (response.ok) {
        alert(`CMC API 테스트 완료!\n상태: 정상\n조회된 데이터: ${data.data?.length || 0}개`);
      } else {
        alert(`CMC API 테스트 결과:\n상태 코드: ${response.status}\n메시지: ${data.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('❌ CMC 테스트 실패:', error);
      alert(`CMC 테스트 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPriceContext = async () => {
    setLoading(true);
    try {
      console.log('🔄 PriceContext 테스트 시작...');
      
      // PriceContext 상태 확인
      console.log('📊 PriceContext 상태:');
      console.log('  - 연결 상태:', isConnected);
      console.log('  - 환율:', contextExchangeRate);
      console.log('  - 가격 데이터 수:', Object.keys(prices).length);
      console.log('  - 업비트 데이터 수:', Object.keys(contextUpbitPrices).length);
      console.log('  - 주요 코인 수:', MAJOR_SYMBOLS.length);
      console.log('  - 통계:', stats);
      console.log('  - 에러 수:', errors.length);
      
      // 주요 코인 목록 확인
      console.log('🪙 주요 코인 목록:');
      Object.entries(MAJOR_COINS).forEach(([key, coin]) => {
        console.log(`  ${key}: ${coin.name} (${coin.symbol} <-> ${coin.upbitMarket})`);
      });
      
      // 김치프리미엄 계산 테스트 (데이터 없어도 정상 작동)
      const allPremiums = getAllKimchiPremiums();
      console.log('🌶️ 김치프리미엄 계산 결과:', allPremiums);
      
      alert(`PriceContext 테스트 완료!\n연결 상태: ${isConnected ? '연결됨' : '연결 안됨'}\n주요 코인: ${MAJOR_SYMBOLS.length}개\n가격 데이터: ${Object.keys(prices).length}개\n김치프리미엄: ${Object.keys(allPremiums).length}개\n에러: ${errors.length}개`);
      
    } catch (error) {
      console.error('❌ PriceContext 테스트 실패:', error);
      alert(`PriceContext 테스트 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebSocket = async () => {
    setLoading(true);
    try {
      console.log('🔄 Bitget WebSocket 테스트 시작...');
      
      // WebSocket 상태 확인
      console.log('📡 WebSocket 상태:');
      console.log('  - 연결됨:', wsConnected);
      console.log('  - 연결 중:', wsConnecting);
      console.log('  - 재연결 중:', wsReconnecting);
      console.log('  - 실패:', wsFailed);
      console.log('  - 연결 상태:', wsConnectionState);
      console.log('  - 재연결 시도:', wsReconnectAttempts);
      console.log('  - 메시지 수:', wsMessageCount);
      console.log('  - 데이터 수신:', wsDataReceived);
      console.log('  - 마지막 Ping:', wsLastPingTime ? new Date(wsLastPingTime).toLocaleTimeString() : 'None');
      console.log('  - 구독 심볼:', wsSymbols.length, '개');
      console.log('  - ReadyState:', wsReadyState);
      
      // 실시간 가격 데이터 확인
      console.log('💰 실시간 가격 데이터:');
      Object.entries(prices).forEach(([symbol, data]) => {
        console.log(`  ${symbol}: $${data.price} (${data.changePercent24h > 0 ? '+' : ''}${data.changePercent24h?.toFixed(2)}%)`);
      });
      
      alert(`WebSocket 테스트 완료!\n연결 상태: ${wsConnected ? '연결됨' : wsConnecting ? '연결 중' : wsReconnecting ? '재연결 중' : '연결 안됨'}\n메시지 수: ${wsMessageCount}개\n데이터 수신: ${wsDataReceived}개\n구독 심볼: ${wsSymbols.length}개\n가격 데이터: ${Object.keys(prices).length}개`);
      
    } catch (error) {
      console.error('❌ WebSocket 테스트 실패:', error);
      alert(`WebSocket 테스트 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 테스트 데이터
  const testData = {
    btcKrw: 65000000,
    btcUsd: 50000,
    change24h: 2.45,
    marketCap: 1234567890000,
    volume: 987654321,
    exchangeRate: 1300
  };

  const kimchiResult = calculateKimchi(testData.btcKrw, testData.btcUsd, testData.exchangeRate);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* 환경변수 상태 */}
      <div className="bg-section p-6 rounded-lg">
        <h1 className="text-2xl font-bold text-primary mb-4">환경변수 상태</h1>
        <div className="space-y-2 text-sm">
          <p>• Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ 설정됨' : '❌ 누락'}</p>
          <p>• Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 누락'}</p>
          <p>• Demo Mode: {isDemoMode ? '⚠️ 활성화' : '✅ 비활성화'}</p>
          <p>• Supabase Client: {supabase ? '✅ 정상' : '❌ 실패'}</p>
        </div>
      </div>

      {/* API 상태 확인 */}
      <div className="bg-section p-6 rounded-lg">
        <h2 className="text-xl font-bold text-primary mb-4">API 상태</h2>
        {apiStatus ? (
          <div className="space-y-2 text-sm">
            <p>• Bitget API: {apiStatus.bitget ? '✅ 정상' : '❌ 오류'}</p>
            <p>• Upbit API: {apiStatus.upbit ? '✅ 정상' : '❌ 오류'}</p>
            <p>• 환율 API: {apiStatus.exchangeRate ? '✅ 정상' : '❌ 오류'}</p>
            <p>• 확인 시간: {formatDate(new Date(apiStatus.timestamp), 'datetime')}</p>
          </div>
        ) : (
          <p className="text-textSecondary">API 상태 확인 중...</p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={handleTestApi}
            disabled={loading}
            className="bg-primary hover:bg-primary/80 disabled:bg-primary/50 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? '테스트 중...' : '실시간 API 테스트'}
          </button>
          
          <button
            onClick={handleTestCORS}
            disabled={loading}
            className="bg-danger hover:bg-danger/80 disabled:bg-danger/50 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? '테스트 중...' : 'CORS 에러 테스트'}
          </button>
          
          <button
            onClick={handleTestExchangeRate}
            disabled={loading || exchangeLoading}
            className="bg-success hover:bg-success/80 disabled:bg-success/50 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading || exchangeLoading ? '테스트 중...' : '환율 API 테스트'}
          </button>
          
          <button
            onClick={handleTestUpbit}
            disabled={loading || upbitLoading}
            className="bg-info hover:bg-info/80 disabled:bg-info/50 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading || upbitLoading ? '테스트 중...' : '업비트 API 테스트'}
          </button>
          
          <button
            onClick={handleTestNews}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-600/80 disabled:bg-purple-600/50 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? '테스트 중...' : '뉴스 API 테스트'}
          </button>
          
          <button
            onClick={handleTestCMC}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-600/80 disabled:bg-yellow-600/50 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? '테스트 중...' : 'CMC API 테스트'}
          </button>
          
          <button
            onClick={handleTestPriceContext}
            disabled={loading}
            className="bg-green-600 hover:bg-green-600/80 disabled:bg-green-600/50 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? '테스트 중...' : 'PriceContext 테스트'}
          </button>
          
          <button
            onClick={handleTestWebSocket}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-600/80 disabled:bg-blue-600/50 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? '테스트 중...' : 'WebSocket 테스트'}
          </button>
        </div>
      </div>

      {/* 실시간 데이터 */}
      {realTimeData && (
        <div className="bg-section p-6 rounded-lg">
          <h2 className="text-xl font-bold text-primary mb-4">실시간 BTC 데이터</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-text">Bitget (해외)</h3>
              <div className="space-y-2 text-sm">
                <p>• 가격: <span className="text-primary">{formatUSD(realTimeData.bitget.price)}</span></p>
                <p>• 변동률: <span className={getChangeColorClass(realTimeData.bitget.changePercent24h)}>{formatPercent(realTimeData.bitget.changePercent24h)}</span></p>
                <p>• 24시간 거래량: <span className="text-primary">{formatVolume(realTimeData.bitget.volume24h, 'USD')}</span></p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-text">Upbit (한국)</h3>
              <div className="space-y-2 text-sm">
                <p>• 가격: <span className="text-primary">{formatKRW(realTimeData.upbit.price)}</span></p>
                <p>• 변동률: <span className={getChangeColorClass(realTimeData.upbit.changePercent24h)}>{formatPercent(realTimeData.upbit.changePercent24h)}</span></p>
                <p>• 24시간 거래량: <span className="text-primary">{formatVolume(realTimeData.upbit.volume24h)}</span></p>
              </div>
            </div>

            <div className="md:col-span-2 bg-card p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-text mb-3">실시간 김치프리미엄</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-textSecondary">한국 가격</p>
                  <p className="text-text font-medium">{formatKRW(realTimeData.upbit.price)}</p>
                </div>
                <div>
                  <p className="text-textSecondary">해외 가격</p>
                  <p className="text-text font-medium">{formatUSD(realTimeData.bitget.price)}</p>
                </div>
                <div>
                  <p className="text-textSecondary">환율</p>
                  <p className="text-text font-medium">{formatKRW(realTimeData.exchangeRate)}</p>
                </div>
                <div>
                  <p className="text-textSecondary">김치프리미엄</p>
                  <p className={`font-bold ${getChangeColorClass(calculateKimchi(realTimeData.upbit.price, realTimeData.bitget.price, realTimeData.exchangeRate).premium)}`}>
                    {calculateKimchi(realTimeData.upbit.price, realTimeData.bitget.price, realTimeData.exchangeRate).formatted}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CORS 테스트 결과 */}
      {corsTestResults && (
        <div className="bg-section p-6 rounded-lg">
          <h2 className="text-xl font-bold text-primary mb-4">CORS 에러 테스트 결과</h2>
          
          {corsTestResults.globalError ? (
            <div className="bg-danger/10 border border-danger/20 p-4 rounded-lg">
              <p className="text-danger font-medium">전역 에러: {corsTestResults.globalError}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-textSecondary">
                테스트 시간: {formatDate(new Date(corsTestResults.timestamp), 'datetime')}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {corsTestResults.tests.map((test, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    test.success 
                      ? 'bg-success/10 border-success/20' 
                      : 'bg-danger/10 border-danger/20'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-text">{test.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        test.success 
                          ? 'bg-success text-background' 
                          : 'bg-danger text-background'
                      }`}>
                        {test.success ? '성공' : '실패'}
                      </span>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <p className="text-textSecondary">엔드포인트: {test.endpoint}</p>
                      {test.success ? (
                        <>
                          <p className="text-success">응답 시간: {test.responseTime}ms</p>
                          <p className="text-success">데이터 수신: {test.dataReceived}개 필드</p>
                        </>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-danger">에러: {test.error.name}</p>
                          <p className="text-danger text-xs">{test.error.message}</p>
                          {test.error.isCORS && (
                            <p className="text-danger font-medium">🚫 CORS 정책 차단</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-card p-4 rounded-lg">
                <h3 className="font-medium text-text mb-2">🔍 개발자 도구 확인 방법</h3>
                <div className="text-sm text-textSecondary space-y-1">
                  <p>1. F12로 개발자 도구 열기</p>
                  <p>2. Network 탭으로 이동</p>
                  <p>3. 빨간색 표시된 요청 클릭</p>
                  <p>4. Console 탭에서 상세 에러 메시지 확인</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 환율 서비스 상태 */}
      <div className="bg-section p-6 rounded-lg">
        <h2 className="text-xl font-bold text-primary mb-4">환율 서비스 상태</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 현재 환율 정보 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text">현재 환율</h3>
            <div className="space-y-2 text-sm">
              <p>• USD/KRW: <span className={`font-bold ${exchangeIsValid ? 'text-primary' : 'text-danger'}`}>
                {exchangeRate ? formatKRW(exchangeRate) : '로딩 중...'}
              </span></p>
              <p>• 소스: <span className={`${
                isFromAPI ? 'text-success' : 
                isFromCache ? 'text-warning' : 
                isFromFallback ? 'text-danger' : 'text-textSecondary'
              }`}>
                {exchangeSource || '알 수 없음'}
              </span></p>
              <p>• 상태: <span className={`${exchangeError ? 'text-danger' : 'text-success'}`}>
                {exchangeError ? `오류: ${exchangeError}` : '정상'}
              </span></p>
              <p>• 데이터 나이: <span className="text-textSecondary">
                {dataAgeMinutes !== null ? `${dataAgeMinutes}분 전` : '알 수 없음'}
              </span></p>
            </div>
          </div>
          
          {/* 캐시 및 설정 정보 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text">서비스 설정</h3>
            <div className="space-y-2 text-sm">
              <p>• 자동 갱신: <span className="text-success">5시간 간격</span></p>
              <p>• 기본값: <span className="text-textSecondary">₩ 1,320 (구글 기준)</span></p>
              <p>• 캐시 유지: <span className="text-textSecondary">5시간</span></p>
              <p>• 로딩 상태: <span className={`${exchangeLoading ? 'text-warning' : 'text-success'}`}>
                {exchangeLoading ? '로딩 중...' : '대기'}
              </span></p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={refreshExchangeRateHook}
            disabled={exchangeLoading}
            className="bg-warning hover:bg-warning/80 disabled:bg-warning/50 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {exchangeLoading ? '새로고침 중...' : '환율 강제 새로고침'}
          </button>
        </div>
      </div>

      {/* 업비트 서비스 상태 */}
      <div className="bg-section p-6 rounded-lg">
        <h2 className="text-xl font-bold text-primary mb-4">업비트 서비스 상태</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 현재 상태 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text">실시간 상태</h3>
            <div className="space-y-2 text-sm">
              <p>• 조회된 마켓: <span className="text-primary font-bold">{priceCount}개</span></p>
              <p>• 상태: <span className={`${upbitIsHealthy ? 'text-success' : 'text-danger'}`}>
                {upbitError ? `오류: ${upbitError}` : '정상'}
              </span></p>
              <p>• 데이터 나이: <span className={`${upbitIsStale ? 'text-warning' : 'text-success'}`}>
                {dataAgeSeconds !== null ? `${dataAgeSeconds}초 전` : '알 수 없음'}
              </span></p>
              <p>• 로딩 상태: <span className={`${upbitLoading ? 'text-warning' : 'text-success'}`}>
                {upbitLoading ? '로딩 중...' : '대기'}
              </span></p>
            </div>
          </div>
          
          {/* 설정 정보 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text">서비스 설정</h3>
            <div className="space-y-2 text-sm">
              <p>• 자동 갱신: <span className="text-success">5초 간격</span></p>
              <p>• 캐시 유지: <span className="text-textSecondary">5초</span></p>
              <p>• 지원 마켓: <span className="text-textSecondary">KRW 페어만</span></p>
              <p>• 심볼 매핑: <span className="text-textSecondary">{getAllSymbolMappings().length}개 쌍</span></p>
            </div>
          </div>
        </div>
        
        {/* 샘플 가격 데이터 */}
        {upbitHasData && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-text mb-3">샘플 가격 (처음 5개)</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(upbitPrices).slice(0, 5).map(([market, data]) => (
                <div key={market} className="bg-card p-3 rounded-lg">
                  <p className="text-xs text-textSecondary">{market}</p>
                  <p className="text-sm font-medium text-text">{formatKRW(data.price)}</p>
                  <p className={`text-xs ${getChangeColorClass(data.changePercent)}`}>
                    {formatPercent(data.changePercent)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <button
            onClick={refreshUpbitPrices}
            disabled={upbitLoading}
            className="bg-info hover:bg-info/80 disabled:bg-info/50 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {upbitLoading ? '새로고침 중...' : '업비트 가격 새로고침'}
          </button>
        </div>
      </div>

      {/* PriceContext 상태 */}
      <div className="bg-section p-6 rounded-lg">
        <h2 className="text-xl font-bold text-primary mb-4">실시간 데이터 상태</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* WebSocket 연결 상태 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text">WebSocket 연결</h3>
            <div className="space-y-2 text-sm">
              <p>• 연결 상태: <span className={`${wsConnected ? 'text-success' : wsConnecting ? 'text-warning' : wsReconnecting ? 'text-warning' : wsFailed ? 'text-danger' : 'text-textSecondary'}`}>
                {wsConnected ? '연결됨 (Mock)' : wsConnecting ? '연결 중' : wsReconnecting ? '재연결 중' : wsFailed ? '실패' : '대기 중'}
              </span></p>
              <p>• 재연결 시도: <span className="text-primary">{wsReconnectAttempts}회</span></p>
              <p>• 메시지 수: <span className="text-primary">{wsMessageCount}개</span></p>
              <p>• 데이터 수신: <span className="text-primary">{wsDataReceived}개</span></p>
            </div>
          </div>
          
          {/* PriceContext 데이터 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text">Context 데이터</h3>
            <div className="space-y-2 text-sm">
              <p>• Context 연결: <span className={`${isConnected ? 'text-success' : 'text-danger'}`}>
                {isConnected ? '연결됨' : '연결 안됨'}
              </span></p>
              <p>• 환율: <span className="text-primary">
                {contextExchangeRate ? formatKRW(contextExchangeRate) : '로딩 중...'}
              </span></p>
              <p>• 가격 데이터: <span className="text-primary">{Object.keys(prices).length}개</span></p>
              <p>• 업비트 데이터: <span className="text-primary">{Object.keys(contextUpbitPrices).length}개</span></p>
            </div>
          </div>
          
          {/* 통계 및 설정 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text">통계</h3>
            <div className="space-y-2 text-sm">
              <p>• 전체 코인: <span className="text-primary">{stats.totalCoins}개</span></p>
              <p>• 연결된 코인: <span className="text-primary">{stats.connectedCoins}개</span></p>
              <p>• 김치프리미엄: <span className="text-primary">{stats.kimchiPremiumCount}개</span></p>
              <p>• 에러 수: <span className={`${errors.length > 0 ? 'text-danger' : 'text-success'}`}>{errors.length}개</span></p>
            </div>
          </div>

          {/* 실시간 가격 데이터 */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-lg font-semibold text-text">
              실시간 가격 데이터 ({Object.keys(prices).length}/{MAJOR_SYMBOLS.length})
            </h3>
            
            {Object.keys(prices).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                {Object.entries(prices).slice(0, 10).map(([symbol, data]) => (
                  <div key={symbol} className="bg-card p-2 rounded">
                    <p className="font-medium text-text">{symbol.replace('USDT', '')}</p>
                    <p className="text-primary">${data.price?.toFixed(data.price > 1 ? 2 : 6)}</p>
                    <p className={`${data.changePercent24h > 0 ? 'text-success' : data.changePercent24h < 0 ? 'text-danger' : 'text-textSecondary'}`}>
                      {data.changePercent24h > 0 ? '+' : ''}{data.changePercent24h?.toFixed(2)}%
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card p-4 rounded-lg text-center">
                <p className="text-textSecondary">
                  {wsConnected ? '데이터 수신 대기 중...' : 'WebSocket 연결 대기 중...'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleTestPriceContext}
            disabled={loading}
            className="bg-primary hover:bg-primary/80 disabled:bg-primary/50 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? '테스트 중...' : 'Context 테스트'}
          </button>
          
          <button
            onClick={handleTestWebSocket}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-600/80 disabled:bg-blue-600/50 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? '테스트 중...' : 'WebSocket 테스트'}
          </button>
          
          {wsConnected ? (
            <button
              onClick={wsDisconnect}
              className="bg-danger hover:bg-danger/80 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              연결 해제
            </button>
          ) : (
            <button
              onClick={wsConnect}
              disabled={wsConnecting}
              className="bg-success hover:bg-success/80 disabled:bg-success/50 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {wsConnecting ? '연결 중...' : '연결'}
            </button>
          )}
          
          <button
            onClick={wsReconnect}
            disabled={wsConnecting}
            className="bg-warning hover:bg-warning/80 disabled:bg-warning/50 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {wsConnecting ? '연결 중...' : '재연결'}
          </button>
        </div>
      </div>

      {/* 포매터 함수 테스트 */}
      <div className="bg-section p-6 rounded-lg">
        <h2 className="text-xl font-bold text-primary mb-4">포매터 함수 테스트</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 가격 포맷팅 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text">가격 포맷팅</h3>
            <div className="space-y-2 text-sm">
              <p>• KRW: <span className="text-primary">{formatKRW(testData.btcKrw)}</span></p>
              <p>• USD: <span className="text-primary">{formatUSD(testData.btcUsd)}</span></p>
              <p>• 소량 USD: <span className="text-primary">{formatUSD(0.000123)}</span></p>
              <p>• 변동률: <span className={getChangeColorClass(testData.change24h)}>{formatPercent(testData.change24h)}</span></p>
            </div>
          </div>

          {/* 시장 데이터 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text">시장 데이터</h3>
            <div className="space-y-2 text-sm">
              <p>• 시가총액: <span className="text-primary">{formatMarketCap(testData.marketCap, 'USD')}</span></p>
              <p>• 거래량: <span className="text-primary">{formatVolume(testData.volume, 'USD')}</span></p>
              <p>• 현재시간: <span className="text-textSecondary">{formatDate(new Date(), 'datetime')}</span></p>
              <p>• 상대시간: <span className="text-textSecondary">{formatDate(new Date(Date.now() - 300000), 'relative')}</span></p>
            </div>
          </div>

          {/* 김치프리미엄 */}
          <div className="space-y-3 md:col-span-2">
            <h3 className="text-lg font-semibold text-text">김치프리미엄 계산</h3>
            <div className="bg-card p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-textSecondary">한국 가격</p>
                  <p className="text-text font-medium">{formatKRW(testData.btcKrw)}</p>
                </div>
                <div>
                  <p className="text-textSecondary">해외 가격</p>
                  <p className="text-text font-medium">{formatUSD(testData.btcUsd)}</p>
                </div>
                <div>
                  <p className="text-textSecondary">환율</p>
                  <p className="text-text font-medium">{formatKRW(testData.exchangeRate)}</p>
                </div>
                <div>
                  <p className="text-textSecondary">김치프리미엄</p>
                  <p className={`font-bold ${getChangeColorClass(kimchiResult.premium)}`}>
                    {kimchiResult.formatted}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}