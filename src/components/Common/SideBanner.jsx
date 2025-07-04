export default function SideBanner({ position = 'left' }) {
  return (
    <div className={`hidden xl:block fixed top-20 ${position === 'left' ? 'left-4' : 'right-4'} w-40 z-30`}>
      <div className="bg-section border border-border rounded-lg p-4 space-y-4">
        {/* 큰 배너 (위) */}
        <div className="aspect-[1/3] bg-gradient-to-b from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-sm font-bold text-primary mb-2">광고 배너</p>
            <p className="text-xs text-textSecondary">추후 이미지 업로드 예정</p>
          </div>
        </div>
        
        {/* 작은 배너 (아래) */}
        <div className="aspect-[1/2] bg-gradient-to-b from-blue-500/20 to-blue-500/10 rounded-lg flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-sm font-bold text-blue-500 mb-2">프로모션</p>
            <p className="text-xs text-textSecondary">특별 이벤트</p>
          </div>
        </div>
      </div>
    </div>
  );
}