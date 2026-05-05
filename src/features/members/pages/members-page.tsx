import { useEffect, useRef, useState } from "react";
import { MembersToolbar } from "../components/members-toolbar";
import { MembersTable } from "../components/members-table";
import { MembersPagination } from "../components/members-pagination";
import { InviteMemberDialog } from "../components/invite-member-dialog";
import { useMembersQuery } from "../hooks/use-members-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useMembershipControllerFindByUserId } from "@/api/generated/organization-members/organization-members";
import type { MembershipResponseDto } from "@/api/generated/models";

export function MembersPage() {
  const {
    members,
    meta,
    isLoading,
    isError,
    queryState,
    setPage,
    setLimit,
    setSearch,
    setRoles,
    toggleSort,
    organizationId,
    refetch,
  } = useMembersQuery();

  const { user } = useAuth();
  const { data, isLoading: isLoadingMembership } =
    useMembershipControllerFindByUserId(organizationId, user?.id ?? "", {
      query: {
        enabled: !!(organizationId && user?.id),
      },
    });
  const membershipData = data as unknown as MembershipResponseDto | undefined;

  const currentUserRole = membershipData?.data?.role;
  const canInvite = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // Debounce search input so we don't fire API calls on every keystroke
  const [searchInput, setSearchInput] = useState(queryState.search);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setSearch(searchInput);
    }, 400);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchInput, setSearch]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Members</h3>
          <p className="text-muted-foreground">
            Manage your organization members and their roles.
          </p>
        </div>
      </div>

      {/* Toolbar: search + sort */}
      <MembersToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        isLoadingMembership={isLoadingMembership}
        canInvite={canInvite}
        setIsInviteDialogOpen={setIsInviteDialogOpen}
        roles={queryState.roles}
        onRolesChange={setRoles}
      />

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm text-destructive font-medium">
            Failed to load members. Please try again later.
          </p>
        </div>
      )}

      {/* Table */}
      <MembersTable
        members={members}
        isLoading={isLoading}
        sortBy={queryState.sortBy}
        sortOrder={queryState.sortOrder}
        onToggleSort={toggleSort}
        currentUserId={user?.id}
        currentUserRole={currentUserRole}
        refetch={refetch}
      />

      {/* Pagination */}
      {!isLoading && members.length > 0 && (
        <MembersPagination
          meta={meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      )}

      {/* Invite Member Dialog */}
      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
      />
    </div>
  );
}
