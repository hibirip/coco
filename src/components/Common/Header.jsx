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
    { name: '코인시세', href: '/prices', key: 'prices' },
    { name: '뉴스', href: '/news', key: 'news' },
    { name: 'AI분석', href: '/analysis', key: 'analysis' },
    { name: '이벤트', href: '/events', key: 'events' },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 bg-section border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
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
                className="bg-primary hover:bg-primary/80 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Google 로그인
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
            <div className="py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.key}
                  to={item.href}
                  className={`block px-4 py-2 text-sm font-medium transition-colors hover:text-primary hover:bg-card rounded-lg ${
                    isActive(item.href) 
                      ? 'text-primary bg-card' 
                      : 'text-text'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="px-4 pt-4 border-t border-border">
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
                    className="w-full bg-primary hover:bg-primary/80 text-background px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Google 로그인
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