import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider, NewsProvider } from './contexts'
import ErrorBoundary from './components/Common/ErrorBoundary'
import { startNewsScheduler } from './services/newsScheduler'

console.log('🚀 React 앱 시작 중...');

// 뉴스 스케줄러 시작
try {
  startNewsScheduler();
  console.log('📰 뉴스 스케줄러 시작됨');
} catch (error) {
  console.error('❌ 뉴스 스케줄러 시작 실패:', error);
}

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <NewsProvider>
            <App />
          </NewsProvider>
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  )
  console.log('✅ React 앱 렌더링 완료');
} catch (error) {
  console.error('❌ React 앱 렌더링 실패:', error);
}