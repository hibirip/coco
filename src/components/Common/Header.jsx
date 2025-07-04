import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts';
import UserProfile from './UserProfile';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { loading, signInWithGoogle, isAuthenticated } = useAuth();

  const navigation = [
    { name: '암호화폐', href: '/', key: 'home' },
    { name: '모의투자', href: '/mock-trading', key: 'mock-trading' },
    { name: '코인시세', href: '/prices', key: 'prices' },
    { name: '뉴스', href: '/news', key: 'news' },
    { name: 'AI분석', href: '/analysis', key: 'analysis' },
    { name: '이벤트', href: '/events', key: 'events' },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 bg-section border-b border-border">
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* 로고 */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="Coindex Logo" 
              className="h-8 w-auto md:h-10"
              onError={(e) => {
                // 로고 로딩 실패 시 텍스트로 fallback
                e.target.style.display = 'none';
              }}
            />
            <div className="text-2xl font-bold text-white">
              COINDEX
            </div>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href) 
                    ? 'text-primary' 
                    : 'text-text'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* 데스크톱 로그인/프로필 영역 */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center space-x-2 text-textSecondary text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>로딩중...</span>
              </div>
            ) : isAuthenticated ? (
              <UserProfile />
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="bg-primary hover:bg-primary/80 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                로그인
              </button>
            )}
          </div>

          {/* 모바일 햄버거 메뉴 버튼 */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-card transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-text" />
            ) : (
              <Menu className="w-6 h-6 text-text" />
            )}
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="py-3 md:py-4 space-y-1.5 md:space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.key}
                  to={item.href}
                  className={`block px-3 md:px-4 py-2 text-sm font-medium transition-colors hover:text-primary hover:bg-card rounded-lg ${
                    isActive(item.href) 
                      ? 'text-primary bg-card' 
                      : 'text-text'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="px-3 md:px-4 pt-3 md:pt-4 border-t border-border">
                {loading ? (
                  <div className="flex items-center justify-center space-x-2 text-textSecondary text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>로딩중...</span>
                  </div>
                ) : isAuthenticated ? (
                  <div className="md:hidden">
                    <UserProfile />
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      signInWithGoogle();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-primary hover:bg-primary/80 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    로그인
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;