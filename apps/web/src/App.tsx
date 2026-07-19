import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { LoginPage } from '@/features/auth/pages/login-page';
import { RegisterPage } from '@/features/auth/pages/register-page';
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page';
import { ClassroomDetailPage } from '@/features/classrooms/pages/classroom-detail-page';
import { ClassroomsListPage } from '@/features/classrooms/pages/classrooms-list-page';
import { ProblemDetailPage } from '@/features/problems/pages/problem-detail-page';
import { ProblemsListPage } from '@/features/problems/pages/problems-list-page';
import { AssignmentsListPage } from '@/features/assignments/pages/assignments-list-page';
import { CodeEditorPage } from '@/features/editor/pages/code-editor-page';
import { AiGeneratePage } from '@/features/ai/pages/ai-generate-page';
import { BillingPage } from '@/features/billing/pages/billing-page';
import { ProfilePage } from '@/features/profile/pages/profile-page';
import { SettingsPage } from '@/features/settings/pages/settings-page';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="classrooms" element={<ClassroomsListPage />} />
          <Route path="classrooms/:id" element={<ClassroomDetailPage />} />
          <Route path="problems" element={<ProblemsListPage />} />
          <Route path="problems/:id" element={<ProblemDetailPage />} />
          <Route path="assignments" element={<AssignmentsListPage />} />
          <Route path="ai" element={<AiGeneratePage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Full-bleed editor: its own top bar, no sidebar/padding from AppShell */}
        <Route path="/solve/:apId" element={<CodeEditorPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;
