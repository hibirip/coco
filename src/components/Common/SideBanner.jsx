export default function SideBanner({ position = 'left' }) {
  return (
    <div className={`hidden xl:block fixed top-20 ${position === 'left' ? 'left-4' : 'right-4'} w-40 z-30`}>
      <div className="rounded-lg space-y-4">
        {/* 큰 배너 (위) */}
        <div className="aspect-[1/3] bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-sm font-bold text-gray-300 mb-2">광고 배너</p>
            <p className="text-xs text-gray-500">추후 이미지 업로드 예정</p>
          </div>
        </div>
        
        {/* 작은 배너 (아래) */}
        <div className="aspect-[1/2] bg-gradient-to-b from-blue-900/30 to-blue-950/30 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-sm font-bold text-blue-400 mb-2">프로모션</p>
            <p className="text-xs text-gray-500">특별 이벤트</p>
          </div>
        </div>
      </div>
    </div>
  );
}