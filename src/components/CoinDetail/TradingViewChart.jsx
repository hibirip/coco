/**
 * TradingView 차트 컴포넌트
 * 실시간 암호화폐 차트를 표시
 */

import { useEffect, useRef, memo } from 'react';

const TradingViewChart = memo(({ symbol, interval = '60', height = 500 }) => {
  const containerRef = useRef(null);
  const scriptIdRef = useRef(`tradingview_${Date.now()}`);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    
    script.onload = () => {
      if (window.TradingView && containerRef.current) {
        // 기존 위젯 제거
        containerRef.current.innerHTML = '';
        
        new window.TradingView.widget({
          // 기본 설정
          width: '100%',
          height: height,
          symbol: symbol.includes(':') ? symbol : `BINANCE:${symbol.toUpperCase()}`,
          interval: interval,
          timezone: 'Asia/Seoul',
          theme: 'dark',
          style: '1', // 캔들스틱 차트
          locale: 'kr',
          
          // 툴바 설정
          toolbar_bg: '#1a1a1a',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          save_image: true,
          
          // 차트 설정
          container_id: scriptIdRef.current,
          studies: [
            'MASimple@tv-basicstudies', // 이동평균선
            'Volume@tv-basicstudies'     // 거래량
          ],
          
          // 색상 커스터마이징
          overrides: {
            // 캔들 색상
            'mainSeriesProperties.candleStyle.upColor': '#10b981',
            'mainSeriesProperties.candleStyle.downColor': '#ef4444',
            'mainSeriesProperties.candleStyle.borderUpColor': '#10b981',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
            'mainSeriesProperties.candleStyle.wickUpColor': '#10b981',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
            
            // 배경 색상
            'paneProperties.background': '#0a0a0a',
            'paneProperties.backgroundType': 'solid',
            
            // 그리드 색상
            'paneProperties.vertGridProperties.color': '#1a1a1a',
            'paneProperties.horzGridProperties.color': '#1a1a1a',
            
            // 크로스헤어 색상
            'paneProperties.crossHairProperties.color': '#9ca3af',
            
            // 거래량 색상
            'volume.volume.color.0': '#ef4444',
            'volume.volume.color.1': '#10b981',
            
            // 이동평균선 색상
            'MASimple.plot.color': '#f59e0b',
            'MASimple.plot.linewidth': 2
          },
          
          // 추가 기능
          withdateranges: true,
          hide_volume: false,
          hideideas: true,
          studies_overrides: {
            "volume.volume.transparency": 50,
            "MASimple.length": 20
          },
          
          // 차트 타입 옵션
          disabled_features: [
            'header_widget_dom_node',
            'header_symbol_search',
            'header_resolutions',
            'header_settings',
            'header_indicators',
            'header_compare',
            'header_undo_redo',
            'header_fullscreen_button',
            'header_saveload',
            'use_localstorage_for_settings',
            'save_chart_properties_to_local_storage',
            'display_market_status'
          ],
          
          enabled_features: [
            'study_templates',
            'hide_left_toolbar_by_default'
          ]
        });
      }
    };

    script.onerror = () => {
      console.error('TradingView 스크립트 로드 실패');
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-[${height}px] bg-card rounded">
            <div class="text-center">
              <p class="text-textSecondary mb-2">차트를 불러올 수 없습니다</p>
              <p class="text-sm text-textSecondary">잠시 후 다시 시도해주세요</p>
            </div>
          </div>
        `;
      }
    };

    document.head.appendChild(script);

    // Cleanup
    return () => {
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        existingScript.remove();
      }
      
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, height]);

  return (
    <div 
      id={scriptIdRef.current} 
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ minHeight: `${height}px` }}
    >
      <div className="flex items-center justify-center h-full bg-card rounded animate-pulse">
        <p className="text-textSecondary">차트 로딩 중...</p>
      </div>
    </div>
  );
});

TradingViewChart.displayName = 'TradingViewChart';

export default TradingViewChart;