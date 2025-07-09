import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import SideBanner from './SideBanner';
import { useBitgetWebSocket } from '../../hooks/useBitgetWebSocket';
import { useUpbitWebSocket } from '../../hooks/useUpbitWebSocket';
import { usePrices } from '../../contexts';
import { ALL_UPBIT_MARKETS } from '../../contexts/PriceContext';

// 환경 감지 (더 확실한 방법)
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development' || window.location.hostname === 'localhost';

const Layout = () => {
  const location = useLocation();
  const { 
    updatePrice, 
    updateUpbitPrice, 
    addError, 
    clearErrors,
    setUpbitConnectionStatus,
    setUpbitConnecting 
  } = usePrices();
  
  // Bitget WebSocket 연결 (모든 환경)
  const bitgetWS = useBitgetWebSocket({ enabled: true, updatePrice });
  
  // Upbit WebSocket 연결 (배포 환경에서만)
  const upbitWS = useUpbitWebSocket({
    enabled: !isDevelopment, // 배포 환경에서만 활성화 (프로덕션에서는 항상 true)
    markets: ALL_UPBIT_MARKETS,
    ALL_UPBIT_MARKETS,
    updateUpbitPrice,
    addError,
    clearErrors,
    setUpbitConnectionStatus,
    setUpbitConnecting
  });
  
  // WebSocket 상태 로깅
  useEffect(() => {
    if (isDevelopment) {
      console.log('📊 Layout WebSocket 상태 (개발환경):', {
        bitget: {
          connected: bitgetWS.isConnected,
          connecting: bitgetWS.isConnecting,
          reconnectAttempts: bitgetWS.reconnectAttempts
        },
        upbit: 'REST API 사용 (PriceContext에서 처리)'
      });
    } else {
      console.log('📊 Layout WebSocket 상태 (배포환경):', {
        bitget: {
          connected: bitgetWS.isConnected,
          connecting: bitgetWS.isConnecting,
          reconnectAttempts: bitgetWS.reconnectAttempts
        },
        upbit: {
          connected: upbitWS.isConnected,
          connecting: upbitWS.isConnecting || upbitWS.isReconnecting,
          reconnectAttempts: upbitWS.reconnectAttempts,
          dataReceived: upbitWS.dataReceived
        }
      });
    }
  }, [
    bitgetWS.isConnected, bitgetWS.isConnecting, bitgetWS.reconnectAttempts,
    upbitWS.isConnected, upbitWS.isConnecting, upbitWS.isReconnecting, 
    upbitWS.reconnectAttempts, upbitWS.dataReceived,
    isDevelopment
  ]);
  
  // 코인 상세 페이지인지 체크
  const isCoinDetailPage = location.pathname.startsWith('/coin/');
  
  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <Header />
      
      {/* 양쪽 세로 배너 - 코인 상세 페이지가 아닐 때만 표시 */}
      {!isCoinDetailPage && (
        <>
          <SideBanner position="left" />
          <SideBanner position="right" />
        </>
      )}
      
      <main className={`flex-1 ${!isCoinDetailPage ? 'xl:px-48' : ''}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;