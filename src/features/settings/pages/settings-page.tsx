import { OrganizationForm } from "../components/organization-form";
import { DeleteOrganizationCard } from "../components/delete-organization-card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getSelectedOrganizationId } from "@/api/organization-store";
import { useMembershipControllerFindByUserId } from "@/api/generated/organization-members/organization-members";
import type { MembershipResponseDto } from "@/api/generated/models";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export function SettingsPage() {
  const { user } = useAuth();
  const organizationId = getSelectedOrganizationId() ?? "";

  const { data, isLoading } =
    useMembershipControllerFindByUserId(organizationId, user?.id ?? "", {
      query: {
        enabled: !!(organizationId && user?.id),
      },
    });

  const membershipData = data as unknown as MembershipResponseDto | undefined;

  const currentUserRole = membershipData?.data?.role;
  const isOwner = currentUserRole === "OWNER";
  const isAdmin = currentUserRole === "ADMIN";

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (membershipData && !isOwner && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Settings</h3>
        <p className="text-muted-foreground">
          Manage your organization settings.
        </p>
      </div>
      <OrganizationForm />
      {isOwner && <DeleteOrganizationCard />}
    </div>
  );
}
