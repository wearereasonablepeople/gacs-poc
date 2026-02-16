import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import QuestionnairesPage from '@/pages/QuestionnairesPage';
import QuestionnaireDetailPage from '@/pages/QuestionnaireDetailPage';
import SubmissionsPage from '@/pages/SubmissionsPage';
import UsersPage from '@/pages/UsersPage';
import BrandingPage from '@/pages/BrandingPage';
import GdprPage from '@/pages/GdprPage';

function ProtectedRoute({ children, ownerOnly = false }: { children: React.ReactNode; ownerOnly?: boolean }) {
  const { user, loading, isOwner } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (ownerOnly && !isOwner) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/questionnaires" element={<QuestionnairesPage />} />
        <Route path="/questionnaires/:id" element={<QuestionnaireDetailPage />} />
        <Route path="/submissions" element={<SubmissionsPage />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute ownerOnly>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/branding"
          element={
            <ProtectedRoute ownerOnly>
              <BrandingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gdpr"
          element={
            <ProtectedRoute ownerOnly>
              <GdprPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
