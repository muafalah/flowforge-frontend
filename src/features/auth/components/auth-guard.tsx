import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import type { ReactNode } from "react";

/**
 * AuthGuard — Protects routes that require authentication.
 *
 * - If loading (session restore in progress) → show spinner
 * - If not authenticated → redirect to /login
 * - Else → render children
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
