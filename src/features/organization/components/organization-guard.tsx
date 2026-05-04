import { Navigate } from "react-router-dom";
import { useOrganizationControllerFindAll } from "@/api/generated/organizations/organizations";
import { getSelectedOrganizationId } from "@/api/organization-store";
import type { ReactNode } from "react";

/**
 * OrganizationGuard — Ensures the authenticated user belongs to at least one organization
 * and has selected one to work with.
 *
 * - If loading (fetching orgs) → show spinner
 * - If user has zero organizations → redirect to /create-organization
 * - If user has organizations but none selected → redirect to /select-organization
 * - If user has organizations and one is selected → render children
 *
 * This guard must be placed INSIDE AuthGuard (user must be authenticated first).
 */
export function OrganizationGuard({ children }: { children: ReactNode }) {
  const { data, isLoading } = useOrganizationControllerFindAll();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // The API response shape: { data: Organization[], meta: { ... } }
  // After going through the Axios custom instance, data is the parsed response body.
  const organizations = (data as unknown as { data: unknown[] })?.data ?? [];

  if (organizations.length === 0) {
    return <Navigate to="/create-organization" replace />;
  }

  // User has organizations but hasn't selected one yet
  const selectedOrgId = getSelectedOrganizationId();
  if (!selectedOrgId) {
    return <Navigate to="/select-organization" replace />;
  }

  return <>{children}</>;
}
