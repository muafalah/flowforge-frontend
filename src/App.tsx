import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  AuthGuard,
  GuestGuard,
  LoginPage,
  RegisterPage,
} from "@/features/auth";
import { DashboardPage } from "@/features/dashboard";
import { SettingsPage } from "@/features/settings";
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

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <DashboardLayout />
            </AuthGuard>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
