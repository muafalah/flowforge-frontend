import { getSelectedOrganizationId } from "@/api/organization-store";
import { useDashboardControllerGetWorkflowSummary } from "@/api/generated/dashboard/dashboard";
import type { WorkflowSummaryResponseDto } from "@/api/generated/models";
import type { WorkflowSummary } from "../types/dashboard";

/** Hook for fetching workflow summaries with auto-refresh via Orval */
export function useWorkflowSummary() {
  const organizationId = getSelectedOrganizationId() ?? "";

  const { data, isLoading } = useDashboardControllerGetWorkflowSummary(
    organizationId,
    {
      query: {
        enabled: !!organizationId,
        refetchInterval: 60000, // 60s auto-refresh
      },
    },
  );

  // Cast the Orval response to our typed shape
  const response = data as unknown as WorkflowSummaryResponseDto | undefined;
  const workflows: WorkflowSummary[] =
    (response?.data as unknown as WorkflowSummary[]) ?? [];

  return { workflows, isLoading };
}
