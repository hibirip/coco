import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Common';
import {
  HomePage,
  PricesPage,
  CoinDetailPage,
  NewsPage,
  AnalysisPage,
  EventsPage,
  AuthCallback,
  NotFoundPage
} from './pages';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="prices" element={<PricesPage />} />
          <Route path="coin/:symbol" element={<CoinDetailPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;