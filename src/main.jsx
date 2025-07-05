import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider, PriceProvider } from './contexts'

console.log('🚀 React 앱 시작 중...');

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <AuthProvider>
        <PriceProvider>
          <App />
        </PriceProvider>
      </AuthProvider>
    </React.StrictMode>,
  )
  console.log('✅ React 앱 렌더링 완료');
} catch (error) {
  console.error('❌ React 앱 렌더링 실패:', error);
}