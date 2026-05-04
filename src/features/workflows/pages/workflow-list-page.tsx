import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { WorkflowTable } from "../components/workflow-table";
import { WorkflowsPagination } from "../components/workflows-pagination";
import { CreateWorkflowDialog } from "../components/create-workflow-dialog";
import { useWorkflowsQuery } from "../hooks/use-workflows-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getSelectedOrganizationId } from "@/api/organization-store";
import { useMembershipControllerFindByUserId } from "@/api/generated/organization-members/organization-members";
import type { MembershipResponseDto } from "@/api/generated/models";
import type { WorkflowControllerFindAllStatus } from "@/api/generated/models";

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
    setStatus,
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workflows</h2>
          <p className="text-muted-foreground">
            Manage and monitor your workflow orchestrations.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="gap-1.5"
        >
          <Plus className="size-4" />
          Create Workflow
        </Button>
      </div>

      {/* Toolbar: search + filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="workflow-search"
            placeholder="Search workflows..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={queryState.status ?? "all"}
          onValueChange={(val) =>
            setStatus(
              val === "all"
                ? undefined
                : (val as WorkflowControllerFindAllStatus),
            )
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
