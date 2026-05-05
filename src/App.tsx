import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  AuthGuard,
  GuestGuard,
  LoginPage,
  RegisterPage,
} from "@/features/auth";
import {
  OrganizationGuard,
  CreateOrganizationPage,
  SelectOrganizationPage,
} from "@/features/organization";
import { DashboardPage } from "@/features/dashboard";
import { SettingsPage, ProfilePage } from "@/features/settings";
import { MembersPage } from "@/features/members";
import {
  WorkflowListPage,
  WorkflowDetailPage,
} from "@/features/workflows";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — redirect to dashboard if already logged in */}
        <Route
          path="/login"
          element={
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          }
        />
        <Route
          path="/register"
          element={
            <GuestGuard>
              <RegisterPage />
            </GuestGuard>
          }
        />

        {/* Organization setup — authenticated but no org required */}
        <Route
          path="/create-organization"
          element={
            <AuthGuard>
              <CreateOrganizationPage />
            </AuthGuard>
          }
        />
        <Route
          path="/select-organization"
          element={
            <AuthGuard>
              <SelectOrganizationPage />
            </AuthGuard>
          }
        />

        {/* Protected routes — require auth + organization */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <OrganizationGuard>
                <DashboardLayout />
              </OrganizationGuard>
            </AuthGuard>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="workflows" element={<WorkflowListPage />} />
          <Route path="workflows/:workflowId" element={<WorkflowDetailPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
