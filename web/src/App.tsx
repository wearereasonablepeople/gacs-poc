import { Navigate, Route, Routes } from "react-router-dom";
import ChecklistPage from "./pages/ChecklistPage";
import ThankYouPage from "./pages/ThankYouPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ChecklistPage />} />
      <Route path="/bedankt" element={<ThankYouPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
