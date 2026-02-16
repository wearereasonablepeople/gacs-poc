import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { QuestionnairePage } from './pages/QuestionnairePage';
import { VerifyPage } from './pages/VerifyPage';
import { ThankYouPage } from './pages/ThankYouPage';
import { DownloadPage } from './pages/DownloadPage';
import { GdprErasurePage } from './pages/GdprErasurePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/thank-you" element={<ThankYouPage />} />
      <Route path="/download" element={<DownloadPage />} />
      <Route path="/gdpr/erasure" element={<GdprErasurePage />} />
      <Route path="/:tenantSlug/:questionnaireSlug" element={<QuestionnairePage />} />
    </Routes>
  );
}
