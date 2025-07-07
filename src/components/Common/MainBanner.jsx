import { Link } from 'react-router-dom';

export default function MainBanner() {
  return (
    <div 
      className="relative p-4 md:p-6 rounded-2xl border border-gray-700/40 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden"
      style={{
        backgroundImage: 'url(/hero-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-800/60 to-gray-900/65"></div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-400/10"></div>
      <div className="absolute top-0 left-0 w-20 h-20 bg-green-500/15 rounded-full blur-xl"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-green-400/15 rounded-full blur-xl"></div>
      
      <div className="text-center space-y-4 md:space-y-6 relative z-10">
        {/* 코인덱스 로고 */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2 opacity-80">
            <img 
              src="/logo.png" 
              alt="Coindex Logo" 
              className="h-6 w-auto md:h-8"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="text-lg md:text-xl font-bold text-white/90">
              COINDEX
            </div>
          </div>
        </div>
        
        <h1 className="text-xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-white via-green-200 to-green-400 bg-clip-text text-transparent drop-shadow-2xl leading-tight">
          "전문가들은 지금도 성공중입니다"
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center mt-6 md:mt-8">
          <Link 
            to="/prices" 
            className="group bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 text-black px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold transition-all duration-300 text-sm md:text-base shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-400/40 hover:scale-105 transform"
          >
            <span className="flex items-center gap-2">
              실시간 시세 보기
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
          <Link 
            to="/news" 
            className="group bg-transparent hover:bg-gradient-to-r hover:from-green-500/20 hover:to-green-400/20 text-green-400 border-2 border-green-500/50 hover:border-green-400 px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold transition-all duration-300 text-sm md:text-base hover:scale-105 transform backdrop-blur-sm"
          >
            <span className="flex items-center gap-2">
              무료시황받기
              <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}