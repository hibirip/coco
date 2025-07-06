import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider, PriceProvider } from './contexts'
import ErrorBoundary from './components/Common/ErrorBoundary'

console.log('🚀 React 앱 시작 중...');

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <PriceProvider>
            <App />
          </PriceProvider>
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  )
  console.log('✅ React 앱 렌더링 완료');
} catch (error) {
  console.error('❌ React 앱 렌더링 실패:', error);
}