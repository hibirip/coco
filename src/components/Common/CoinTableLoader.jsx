/**
 * CoinTableLoader - 코인 시세판 전용 로딩 화면
 * 비트겟 연결이 완료되기 전까지 보여주는 이쁜 로딩 UI
 */

export default function CoinTableLoader({ 
  className = '',
  showKimchi = true,
  showFavorites = true 
}) {
  return (
    <div className={`bg-section rounded-lg overflow-hidden ${className}`}>
      {/* 헤더 영역 */}
      <div className="bg-card p-6 border-b border-border">
        <div className="text-center space-y-4">
          {/* 메인 로딩 스피너 */}
          <div className="flex justify-center">
            <div className="relative">
              {/* 외부 링 */}
              <div className="w-16 h-16 border-4 border-border rounded-full"></div>
              {/* 회전하는 링 */}
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0"></div>
              {/* 중앙 아이콘 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 bg-primary rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* 로딩 텍스트 */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-text">실시간 시세 데이터를 불러오는 중...</h3>
            <p className="text-sm text-textSecondary">Bitget API에서 최신 코인 정보를 가져오고 있습니다</p>
          </div>
          
          {/* 진행 단계 표시 */}
          <div className="flex justify-center space-x-8 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <span className="text-textSecondary">API 연결</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <span className="text-textSecondary">데이터 수신</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-textSecondary">환율 정보</span>
            </div>
          </div>
        </div>
      </div>

      {/* 테이블 미리보기 영역 */}
      <div className="p-6">
        {/* 데스크톱 테이블 헤더 미리보기 */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-4 mb-4 p-3 bg-card/50 rounded-lg">
            {showFavorites && (
              <div className="col-span-1 text-center">
                <div className="w-4 h-4 bg-border rounded mx-auto animate-pulse"></div>
              </div>
            )}
            <div className="col-span-3">
              <div className="h-4 bg-border rounded animate-pulse"></div>
            </div>
            <div className="col-span-2">
              <div className="h-4 bg-border rounded animate-pulse"></div>
            </div>
            {showKimchi && (
              <div className="col-span-1">
                <div className="h-4 bg-border rounded animate-pulse"></div>
              </div>
            )}
            <div className="col-span-2">
              <div className="h-4 bg-border rounded animate-pulse"></div>
            </div>
            <div className="col-span-2">
              <div className="h-4 bg-border rounded animate-pulse"></div>
            </div>
            <div className="col-span-1">
              <div className="h-4 bg-border rounded animate-pulse"></div>
            </div>
          </div>

          {/* 샘플 행들 */}
          {Array.from({ length: 5 }).map((_, index) => (
            <div 
              key={index} 
              className="grid grid-cols-12 gap-4 p-3 border-b border-border/30"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {showFavorites && (
                <div className="col-span-1 flex justify-center">
                  <div className="w-4 h-4 bg-border rounded animate-pulse"></div>
                </div>
              )}
              <div className="col-span-3 flex items-center space-x-3">
                <div className="w-8 h-8 bg-border rounded-full animate-pulse"></div>
                <div className="space-y-1">
                  <div className="h-4 w-16 bg-border rounded animate-pulse"></div>
                  <div className="h-3 w-12 bg-border rounded animate-pulse"></div>
                </div>
              </div>
              <div className="col-span-2 flex justify-end space-y-1">
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-border rounded animate-pulse"></div>
                  <div className="h-3 w-16 bg-border rounded animate-pulse"></div>
                </div>
              </div>
              {showKimchi && (
                <div className="col-span-1 flex justify-center space-y-1">
                  <div className="space-y-1">
                    <div className="h-4 w-12 bg-border rounded animate-pulse"></div>
                    <div className="h-3 w-10 bg-border rounded animate-pulse"></div>
                  </div>
                </div>
              )}
              <div className="col-span-2 flex justify-center space-y-1">
                <div className="space-y-1">
                  <div className="h-4 w-14 bg-border rounded animate-pulse"></div>
                  <div className="h-3 w-12 bg-border rounded animate-pulse"></div>
                </div>
              </div>
              <div className="col-span-2 flex justify-center">
                <div className="h-8 w-20 bg-border rounded animate-pulse"></div>
              </div>
              <div className="col-span-1 flex justify-center">
                <div className="h-6 w-16 bg-border rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* 모바일 카드 미리보기 */}
        <div className="md:hidden space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div 
              key={index} 
              className="bg-card/50 p-3 rounded-lg"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="grid grid-cols-4 gap-2 items-center">
                <div className="col-span-1 space-y-2">
                  <div className="w-6 h-6 bg-border rounded-full animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="h-3 w-12 bg-border rounded animate-pulse"></div>
                    <div className="h-2 w-8 bg-border rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  <div className="h-3 w-16 bg-border rounded animate-pulse ml-auto"></div>
                </div>
                <div className="col-span-1 text-center">
                  <div className="h-3 w-12 bg-border rounded animate-pulse mx-auto"></div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <div className="w-16 h-8 bg-border rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 푸터 정보 */}
      <div className="p-4 bg-card/30 border-t border-border text-center">
        <div className="space-y-2">
          <div className="flex justify-center space-x-4 text-xs text-textSecondary">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>실시간 연결</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>암호화폐 시세</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span>김치프리미엄</span>
            </div>
          </div>
          <p className="text-xs text-textSecondary">
            잠시만 기다려주세요. 곧 실시간 시세가 표시됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 간단한 인라인 로더 (작은 공간용)
 */
export function SimpleCoinLoader({ text = "데이터 로딩 중..." }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-8 h-8 border-2 border-border rounded-full"></div>
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
        </div>
        <p className="text-sm text-textSecondary">{text}</p>
      </div>
    </div>
  );
}