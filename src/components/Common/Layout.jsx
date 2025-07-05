import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import SideBanner from './SideBanner';
import { useBitgetWebSocket } from '../../hooks/useBitgetWebSocket';
import { useUpbitWebSocket } from '../../hooks/useUpbitWebSocket';

const Layout = () => {
  const location = useLocation();
  
  // WebSocket 연결 시작 - 배포환경에서도 WebSocket 활성화 (비트겟으로 복구)
  const bitgetWS = useBitgetWebSocket({ enabled: true });
  const upbitWS = useUpbitWebSocket({ enabled: true });
  
  // WebSocket 상태 로깅 (개발 모드에서만)
  useEffect(() => {
    console.log('📊 Layout WebSocket 상태:', {
      bitget: {
        connected: bitgetWS.isConnected,
        connecting: bitgetWS.isConnecting,
        reconnectAttempts: bitgetWS.reconnectAttempts
      },
      upbit: {
        connected: upbitWS.isConnected,
        connecting: upbitWS.isConnecting,
        dataReceived: upbitWS.dataReceived,
        readyState: upbitWS.readyState
      }
    });
  }, [
    bitgetWS.isConnected, bitgetWS.isConnecting, bitgetWS.reconnectAttempts,
    upbitWS.isConnected, upbitWS.isConnecting, upbitWS.dataReceived
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