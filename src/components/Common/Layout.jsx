import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import SideBanner from './SideBanner';
import { useBitgetWebSocket } from '../../hooks/useBitgetWebSocket';

const Layout = () => {
  const location = useLocation();
  
  // WebSocket 연결 시작 - 업비트는 REST API만 사용
  const bitgetWS = useBitgetWebSocket({ enabled: true });
  
  // WebSocket 상태 로깅 (개발 모드에서만)
  useEffect(() => {
    console.log('📊 Layout WebSocket 상태:', {
      bitget: {
        connected: bitgetWS.isConnected,
        connecting: bitgetWS.isConnecting,
        reconnectAttempts: bitgetWS.reconnectAttempts
      },
      upbit: 'REST API only (10초 간격 업데이트)'
    });
  }, [
    bitgetWS.isConnected, bitgetWS.isConnecting, bitgetWS.reconnectAttempts
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