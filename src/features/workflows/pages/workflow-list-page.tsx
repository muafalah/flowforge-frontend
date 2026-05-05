import { useEffect, useRef, useState } from "react";
import { WorkflowTable } from "../components/workflow-table";
import { WorkflowsPagination } from "../components/workflows-pagination";
import { WorkflowsToolbar } from "../components/workflows-toolbar";
import { CreateWorkflowDialog } from "../components/create-workflow-dialog";
import { useWorkflowsQuery } from "../hooks/use-workflows-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getSelectedOrganizationId } from "@/api/organization-store";
import { useMembershipControllerFindByUserId } from "@/api/generated/organization-members/organization-members";
import type { MembershipResponseDto } from "@/api/generated/models";

export function WorkflowListPage() {
  const {
    workflows,
    meta,
    isLoading,
    isError,
    queryState,
    setPage,
    setLimit,
    setSearch,
    toggleSort,
  } = useWorkflowsQuery();

  const { user } = useAuth();
  const organizationId = getSelectedOrganizationId() ?? "";

  // Fetch current user's role in the organization
  const { data: membershipData } = useMembershipControllerFindByUserId(
    organizationId,
    user?.id ?? "",
    {
      query: {
        enabled: !!(organizationId && user?.id),
      },
    },
  );

  const membership = membershipData as unknown as
    | MembershipResponseDto
    | undefined;
  const userRole = membership?.data?.role;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Debounce search input
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
          <h2 className="text-2xl font-bold tracking-tight">Workflows</h2>
          <p className="text-muted-foreground">
            Manage and monitor your workflow orchestrations.
          </p>
        </div>
      </div>

      {/* Toolbar: search + sort */}
      <WorkflowsToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        setIsCreateDialogOpen={setIsCreateDialogOpen}
        userRole={userRole}
      />

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm text-destructive font-medium">
            Failed to load workflows. Please try again later.
          </p>
        </div>
      )}

      {/* Workflow table */}
      <WorkflowTable
        workflows={workflows}
        isLoading={isLoading}
        sortBy={queryState.sortBy}
        sortOrder={queryState.sortOrder}
        onToggleSort={toggleSort}
        userRole={userRole}
        organizationId={organizationId}
      />

      {/* Pagination */}
      {!isLoading && workflows.length > 0 && (
        <WorkflowsPagination
          meta={meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      )}

      {/* Create workflow dialog */}
      <CreateWorkflowDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
