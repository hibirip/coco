import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts';

const UserProfile = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { currentUser, signOut, isDemoMode } = useAuth();

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ESC 키로 드롭다운 닫기
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isDropdownOpen]);

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await signOut();
  };

  const getUserDisplayName = () => {
    if (currentUser?.user_metadata?.full_name) {
      return currentUser.user_metadata.full_name;
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return 'User';
  };

  const getUserEmail = () => {
    return currentUser?.email || 'user@example.com';
  };

  const getUserAvatar = () => {
    return currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 프로필 버튼 */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 bg-section hover:bg-card text-text px-3 py-2 rounded-lg text-sm transition-colors border border-border"
      >
        {/* 아바타 */}
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
          {getUserAvatar() ? (
            <img 
              src={getUserAvatar()} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-primary" />
          )}
        </div>
        
        {/* 사용자 정보 */}
        <div className="hidden md:flex flex-col items-start">
          <span className="text-text font-medium">
            {getUserDisplayName()}
            {isDemoMode && <span className="text-xs text-textSecondary ml-1">(Demo)</span>}
          </span>
        </div>
        
        {/* 드롭다운 아이콘 */}
        <ChevronDown 
          className={`w-4 h-4 text-textSecondary transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-section border border-border rounded-lg shadow-lg z-50">
          {/* 사용자 정보 헤더 */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {getUserAvatar() ? (
                  <img 
                    src={getUserAvatar()} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">
                  {getUserDisplayName()}
                  {isDemoMode && <span className="text-xs text-textSecondary ml-1">(Demo)</span>}
                </p>
                <p className="text-xs text-textSecondary truncate">
                  {getUserEmail()}
                </p>
              </div>
            </div>
          </div>

          {/* 메뉴 아이템들 */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                // TODO: 설정 페이지로 이동
                console.log('설정 페이지로 이동');
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-text hover:bg-card transition-colors"
            >
              <Settings className="w-4 h-4 text-textSecondary" />
              <span>설정</span>
            </button>
            
            <div className="border-t border-border my-1"></div>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-danger hover:bg-card transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;