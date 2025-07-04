import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import SideBanner from './SideBanner';

const Layout = () => {
  const location = useLocation();
  
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
      
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;