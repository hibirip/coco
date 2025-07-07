/**
 * SkeletonLoader - 로딩 중 스켈레톤 UI 컴포넌트
 * 데이터 로딩 중에 레이아웃을 미리 보여주어 사용자 경험 개선
 */

export default function SkeletonLoader({ 
  rows = 5, 
  showKimchi = true, 
  showFavorites = true,
  className = '' 
}) {
  return (
    <div className={`bg-section rounded-lg overflow-hidden ${className}`}>
      {/* 테이블 헤더 스켈레톤 */}
      <div className="bg-card p-4">
        <div className="grid grid-cols-12 gap-4">
          {showFavorites && <div className="col-span-1"></div>}
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
      </div>

      {/* 테이블 행 스켈레톤 */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* 즐겨찾기 */}
              {showFavorites && (
                <div className="col-span-1">
                  <div className="w-4 h-4 bg-border rounded animate-pulse"></div>
                </div>
              )}

              {/* 코인 정보 */}
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-border rounded-full animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-border rounded animate-pulse"></div>
                  <div className="h-3 w-12 bg-border rounded animate-pulse"></div>
                </div>
              </div>

              {/* 현재가 */}
              <div className="col-span-2 text-right space-y-1">
                <div className="h-4 w-20 bg-border rounded animate-pulse ml-auto"></div>
                <div className="h-3 w-16 bg-border rounded animate-pulse ml-auto"></div>
              </div>

              {/* 김치프리미엄 */}
              {showKimchi && (
                <div className="col-span-1 text-center space-y-1">
                  <div className="h-4 w-12 bg-border rounded animate-pulse mx-auto"></div>
                  <div className="h-3 w-10 bg-border rounded animate-pulse mx-auto"></div>
                </div>
              )}

              {/* 전일대비 */}
              <div className="col-span-2 text-center space-y-1">
                <div className="h-4 w-14 bg-border rounded animate-pulse mx-auto"></div>
                <div className="h-3 w-12 bg-border rounded animate-pulse mx-auto"></div>
              </div>

              {/* 변화량(24h) - 스파크라인 */}
              <div className="col-span-2 text-center">
                <div className="h-8 w-20 bg-border rounded animate-pulse mx-auto"></div>
              </div>

              {/* 거래액 */}
              <div className="col-span-1 text-right space-y-1">
                <div className="h-4 w-12 bg-border rounded animate-pulse ml-auto"></div>
                <div className="h-3 w-10 bg-border rounded animate-pulse ml-auto"></div>
              </div>

              {/* 상세 버튼 */}
              <div className="col-span-1 text-center">
                <div className="h-6 w-16 bg-border rounded animate-pulse mx-auto"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 푸터 스켈레톤 */}
      <div className="p-4 bg-card/50">
        <div className="flex justify-between items-center">
          <div className="h-4 w-24 bg-border rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-border rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * 모바일용 스켈레톤 컴포넌트
 */
export function MobileSkeletonLoader({ rows = 5, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="bg-gradient-to-r from-gray-800/40 via-gray-700/30 to-gray-800/40 backdrop-blur-xl rounded-xl p-3 border border-gray-700/40 shadow-lg">
          <div className="flex items-center justify-between">
            {/* 코인 정보 (로고 + 이름) */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 bg-gray-600/50 rounded-full animate-pulse"></div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="h-4 w-20 bg-gray-600/50 rounded animate-pulse"></div>
              </div>
            </div>

            {/* 가격 정보 */}
            <div className="text-right mr-2">
              <div className="h-4 w-16 bg-gray-600/50 rounded animate-pulse ml-auto"></div>
            </div>

            {/* 전일대비 */}
            <div className="text-center mr-2">
              <div className="bg-gray-800/50 rounded-lg px-2 py-1">
                <div className="h-4 w-12 bg-gray-600/50 rounded animate-pulse"></div>
              </div>
            </div>

            {/* 거래하기 버튼 */}
            <div className="w-14 h-7 bg-gray-600/50 rounded-lg animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 홈페이지용 간단한 스켈레톤
 */
export function SimpleSkeletonLoader({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3 bg-card rounded-lg">
          <div className="w-8 h-8 bg-border rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-20 bg-border rounded animate-pulse"></div>
            <div className="h-3 w-16 bg-border rounded animate-pulse"></div>
          </div>
          <div className="text-right space-y-2">
            <div className="h-4 w-16 bg-border rounded animate-pulse"></div>
            <div className="h-3 w-12 bg-border rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}