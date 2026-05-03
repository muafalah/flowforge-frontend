import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import type { ReactNode } from "react";

/**
 * GuestGuard — Prevents authenticated users from accessing public pages.
 *
 * - If loading → show spinner
 * - If authenticated → redirect to /dashboard
 * - Else → render children (login/register forms)
 */
export function GuestGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
