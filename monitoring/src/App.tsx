import { Routes, Route } from 'react-router-dom';
import { AuthProvider, RequireAuth } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TenantsPage } from '@/pages/TenantsPage';
import { CreateTenantPage } from '@/pages/CreateTenantPage';
import { TenantDetailPage } from '@/pages/TenantDetailPage';
import { GdprPage } from '@/pages/GdprPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="tenants/new" element={<CreateTenantPage />} />
          <Route path="tenants/:id" element={<TenantDetailPage />} />
          <Route path="gdpr" element={<GdprPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
