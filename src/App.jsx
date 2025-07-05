import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Layout } from './components/Common';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ToastContainer from './components/Common/Toast';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { useToast } from './hooks';

// React.lazy로 페이지 컴포넌트들을 동적 import
const HomePage = lazy(() => import('./pages/HomePage'));
const MockTradingPage = lazy(() => import('./pages/MockTradingPage'));
const PricesPage = lazy(() => import('./pages/PricesPage'));
const CoinDetailPage = lazy(() => import('./pages/CoinDetailPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  const { toasts, removeToast } = useToast();

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={
              <Suspense fallback={<LoadingSpinner />}>
                <HomePage />
              </Suspense>
            } />
            <Route path="mock-trading" element={
              <Suspense fallback={<LoadingSpinner />}>
                <MockTradingPage />
              </Suspense>
            } />
            <Route path="prices" element={
              <Suspense fallback={<LoadingSpinner />}>
                <PricesPage />
              </Suspense>
            } />
            <Route path="coin/:symbol" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CoinDetailPage />
              </Suspense>
            } />
            <Route path="news" element={
              <Suspense fallback={<LoadingSpinner />}>
                <NewsPage />
              </Suspense>
            } />
            <Route path="analysis" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AnalysisPage />
              </Suspense>
            } />
            <Route path="events" element={
              <Suspense fallback={<LoadingSpinner />}>
                <EventsPage />
              </Suspense>
            } />
            <Route path="*" element={
              <Suspense fallback={<LoadingSpinner />}>
                <NotFoundPage />
              </Suspense>
            } />
          </Route>
        </Routes>
        
        {/* Toast 알림 */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </Router>
    </ErrorBoundary>
  );
}

export default App;