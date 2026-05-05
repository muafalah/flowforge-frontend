import { getSelectedOrganizationId } from "@/api/organization-store";
import { useDashboardControllerGetStats } from "@/api/generated/dashboard/dashboard";
import type {
  DashboardStatsResponseDto,
} from "@/api/generated/models";
import type { DashboardStats } from "../types/dashboard";

/** Hook for fetching dashboard stats with auto-refresh via Orval */
export function useDashboardStats() {
  const organizationId = getSelectedOrganizationId() ?? "";

  const { data, isLoading, isError } = useDashboardControllerGetStats(
    organizationId,
    {
      query: {
        enabled: !!organizationId,
        refetchInterval: 30000, // 30s auto-refresh
      },
    },
  );

  // Cast the Orval response to our typed shape
  const response = data as unknown as DashboardStatsResponseDto | undefined;
  const stats: DashboardStats | null = response?.data ?? null;

  return { stats, isLoading, isError };
}
