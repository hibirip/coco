import { Link } from 'react-router-dom';

export default function MainBanner() {
  return (
    <div className="bg-gradient-to-r from-primary/20 to-blue-500/20 p-3 md:p-8 rounded-xl border border-primary/30">
      <div className="text-center space-y-2 md:space-y-4">
        <h1 className="text-2xl md:text-4xl font-bold text-primary">Coco</h1>
        <p className="text-base md:text-xl text-text">실시간 암호화폐 시세 & 김치프리미엄</p>
        <p className="text-sm md:text-base text-textSecondary">
          Bitget과 업비트의 실시간 가격 비교로 최적의 거래 타이밍을 찾아보세요
        </p>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-4 justify-center items-center mt-3 md:mt-6">
          <Link 
            to="/prices" 
            className="bg-primary hover:bg-primary/80 text-background px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base"
          >
            실시간 시세 보기
          </Link>
          <Link 
            to="/kimchi" 
            className="bg-transparent hover:bg-primary/10 text-primary border border-primary px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base"
          >
            김치프리미엄 분석
          </Link>
        </div>
      </div>
    </div>
  );
}