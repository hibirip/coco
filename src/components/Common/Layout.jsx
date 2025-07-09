import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import SideBanner from './SideBanner';
import { useBitgetWebSocket } from '../../hooks/useBitgetWebSocket';
import { usePrices } from '../../contexts';

// 환경 감지 (더 확실한 방법)
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development' || window.location.hostname === 'localhost';

const Layout = () => {
  const location = useLocation();
  const { updatePrice, addError, clearErrors } = usePrices();
  
  // Bitget WebSocket 연결 (모든 환경)
  const bitgetWS = useBitgetWebSocket({ enabled: true, updatePrice });
  
  // WebSocket 상태 로깅
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost';
    console.log('📊 Layout WebSocket 상태:', {
      environment: isLocal ? 'development' : 'production',
      hostname: window.location.hostname,
      bitget: {
        connected: bitgetWS.isConnected,
        connecting: bitgetWS.isConnecting,
        reconnectAttempts: bitgetWS.reconnectAttempts
      }
    });
  }, [
    bitgetWS.isConnected, bitgetWS.isConnecting, bitgetWS.reconnectAttempts,
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