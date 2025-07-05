import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import SideBanner from './SideBanner';
import { useBinanceWebSocket } from '../../hooks/useBinanceWebSocket';
import { useUpbitWebSocket } from '../../hooks/useUpbitWebSocket';

const Layout = () => {
  const location = useLocation();
  
  // WebSocket 연결 시작 - 배포환경에서는 WebSocket 비활성화
  const binanceWS = useBinanceWebSocket({ enabled: import.meta.env.DEV });
  const upbitWS = useUpbitWebSocket({ enabled: import.meta.env.DEV });
  
  // WebSocket 상태 로깅 (개발 모드에서만)
  useEffect(() => {
    console.log('📊 Layout WebSocket 상태:', {
      binance: {
        connected: binanceWS.isConnected,
        connecting: binanceWS.isConnecting,
        reconnectAttempts: binanceWS.reconnectAttempts
      },
      upbit: {
        connected: upbitWS.isConnected,
        connecting: upbitWS.isConnecting,
        dataReceived: upbitWS.dataReceived,
        readyState: upbitWS.readyState
      }
    });
  }, [
    binanceWS.isConnected, binanceWS.isConnecting, binanceWS.reconnectAttempts,
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