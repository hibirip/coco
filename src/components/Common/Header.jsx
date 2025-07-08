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
    { name: '코인마켓', href: '/prices', key: 'prices' },
    { name: '모의투자', href: '/mock-trading', key: 'mock-trading' },
    { name: '뉴스', href: '/news', key: 'news' },
    { name: '이벤트', href: '/events', key: 'events' },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 relative overflow-hidden">
      {/* 배경 그라데이션과 블러 효과 */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5"></div>
      
      {/* 장식 요소들 */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
      
      {/* 하단 테두리 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
      
      <div className="relative container mx-auto px-3 md:px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* 로고 */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img 
              src="/logo.png" 
              alt="Coindex Logo" 
              className="h-8 w-auto md:h-10 group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                // 로고 로딩 실패 시 텍스트로 fallback
                e.target.style.display = 'none';
              }}
            />
            <div className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300">
              COINDEX
            </div>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 group ${
                  isActive(item.href) 
                    ? 'text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <span className="relative z-10">{item.name}</span>
                
                {/* Active state background */}
                {isActive(item.href) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow-lg shadow-blue-500/25"></div>
                )}
                
                {/* Hover state background - smooth scale and glow effect */}
                {!isActive(item.href) && (
                  <div className="absolute inset-0 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-700/0 to-gray-700/0 group-hover:from-gray-700/50 group-hover:to-gray-600/50 transition-all duration-300"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0"></div>
                    </div>
                  </div>
                )}
                
                {/* Click ripple effect container */}
                <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 transform scale-0 group-active:scale-100 bg-white/10 transition-transform duration-500 origin-center rounded-lg"></div>
                </div>
              </Link>
            ))}
          </nav>

          {/* 데스크톱 로그인/프로필 영역 */}
          <div className="hidden md:flex items-center space-x-3">
            {loading ? (
              <div className="flex items-center space-x-2 text-textSecondary text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>로딩중...</span>
              </div>
            ) : isAuthenticated ? (
              <>
                <button className="bg-gradient-to-r from-gray-800/60 via-gray-700/50 to-gray-800/60 backdrop-blur-xl text-white px-4 py-2 rounded-xl border border-gray-600/40 hover:border-green-500/40 transition-all duration-300 shadow-lg hover:shadow-green-500/20 text-sm font-medium flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-green-400 group-hover:text-green-300 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                  내 정보
                </button>
                <UserProfile />
              </>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="bg-gradient-to-r from-gray-800/60 via-gray-700/50 to-gray-800/60 backdrop-blur-xl text-white px-5 py-2.5 rounded-xl border border-gray-600/40 hover:border-green-500/40 transition-all duration-300 shadow-lg hover:shadow-green-500/20 text-sm font-medium flex items-center gap-3 group hover:scale-[1.02] transform"
              >
                <div className="relative">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform duration-300">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <span className="group-hover:text-green-100 transition-colors duration-300">Google로 로그인</span>
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
          <div className="md:hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-800/90 to-gray-900/90 backdrop-blur-lg"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
            <div className="relative py-3 md:py-4 space-y-1.5 md:space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.key}
                  to={item.href}
                  className={`relative block px-4 py-3 text-sm font-medium transition-all duration-300 rounded-lg group ${
                    isActive(item.href) 
                      ? 'text-white' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="relative z-10">{item.name}</span>
                  
                  {/* Active state background */}
                  {isActive(item.href) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow-lg shadow-blue-500/25"></div>
                  )}
                  
                  {/* Hover state background */}
                  {!isActive(item.href) && (
                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-700/0 to-gray-700/0 hover:from-gray-700/50 hover:to-gray-600/50 transition-all duration-300"></div>
                    </div>
                  )}
                  
                  {/* Click ripple effect */}
                  <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 transform scale-0 active:scale-100 bg-white/10 transition-transform duration-500 origin-center rounded-lg"></div>
                  </div>
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
                    className="w-full bg-gradient-to-r from-gray-800/60 via-gray-700/50 to-gray-800/60 backdrop-blur-xl text-white px-4 py-3 rounded-xl border border-gray-600/40 hover:border-green-500/40 transition-all duration-300 shadow-lg hover:shadow-green-500/20 text-sm font-medium flex items-center justify-center gap-3 group"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform duration-300">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="group-hover:text-green-100 transition-colors duration-300">Google로 로그인</span>
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