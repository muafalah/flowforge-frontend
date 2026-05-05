import { useAuth } from "@/features/auth";
import { useDashboardStats } from "../hooks/use-dashboard-stats";
import { useRecentRuns } from "../hooks/use-recent-runs";
import { useDashboardActivity } from "../hooks/use-dashboard-activity";
import { useWorkflowSummary } from "../hooks/use-workflow-summary";
import { StatCards } from "../components/stat-cards";
import { RecentRunsTable } from "../components/recent-runs-table";
import { ActivityFeed } from "../components/activity-feed";
import { QuickActions } from "../components/quick-actions";
import { WorkflowOverviewCards } from "../components/workflow-overview-cards";
import { getSelectedOrganizationId } from "@/api/organization-store";
import { useMembershipControllerFindByUserId } from "@/api/generated/organization-members/organization-members";
import type { MembershipResponseDto } from "@/api/generated/models";

export function DashboardPage() {
  const { user } = useAuth();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const {
    runs,
    meta,
    isLoading: runsLoading,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    refetch: refetchRuns,
  } = useRecentRuns();
  const {
    items: activityItems,
    isLoading: activityLoading,
    isConnected,
    meta: activityMeta,
    page: activityPage,
    setPage: setActivityPage,
  } = useDashboardActivity();
  const { workflows, isLoading: workflowsLoading } = useWorkflowSummary();

  const selectedOrgId = getSelectedOrganizationId();

  const { data: member } = useMembershipControllerFindByUserId(
    selectedOrgId ?? "",
    user?.id ?? "",
    {
      query: {
        enabled: !!(selectedOrgId && user?.id),
      },
    },
  );

  const membershipData = member as unknown as MembershipResponseDto | undefined;

  const userRole = membershipData?.data?.role;

  return (
    <div className="space-y-6">
      {/* Page header + Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] ?? "User"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your workflows.
          </p>
        </div>
        <QuickActions />
      </div>

      {/* Global Health Panel — Stat Cards */}
      <StatCards stats={stats} isLoading={statsLoading} />

      {/* Recent Runs + Activity Feed — side by side on desktop */}
      <div className={`grid gap-6 ${userRole !== "MEMBER" ? "lg:grid-cols-[2fr_1fr]" : ""}`}>
        <RecentRunsTable
          runs={runs}
          meta={meta}
          isLoading={runsLoading}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          page={page}
          onPageChange={setPage}
          onRefresh={refetchRuns}
        />
        {userRole !== "MEMBER" && (
          <ActivityFeed
            items={activityItems}
            isLoading={activityLoading}
            isConnected={isConnected}
            meta={activityMeta}
            page={activityPage}
            onPageChange={setActivityPage}
          />
        )}
      </div>

      {/* Workflow Overview Cards with Mini DAGs */}
      <WorkflowOverviewCards
        workflows={workflows}
        isLoading={workflowsLoading}
      />
    </div>
  );
}
