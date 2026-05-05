import { useState, useEffect, useRef } from "react";
import { useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { getSelectedOrganizationId } from "@/api/organization-store";
import {
  useDashboardControllerGetRecentRuns,
  getDashboardControllerGetRecentRunsQueryKey,
} from "@/api/generated/dashboard/dashboard";
import type { RecentRunsResponseDto } from "@/api/generated/models";
import type { DashboardControllerGetRecentRunsStatus } from "@/api/generated/models/dashboardControllerGetRecentRunsStatus";
import { socketService } from "@/services/socket";
import type { RecentRun, PaginationMeta } from "../types/dashboard";

interface DashboardRunUpdate {
  runId: string;
  workflowId: string;
  workflowName: string;
  status: string;
  triggerType: string;
  durationMs?: number;
  timestamp: string;
}

/** Hook for fetching recent runs with WebSocket real-time updates via Orval */
export function useRecentRuns() {
  const organizationId = getSelectedOrganizationId() ?? "";
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<DashboardControllerGetRecentRunsStatus | undefined>();
  const [page, setPage] = useState(1);
  const limit = 10;
  const unsubRef = useRef<(() => void) | null>(null);

  const { data, isLoading } = useDashboardControllerGetRecentRuns(
    organizationId,
    { 
      page, 
      limit,
      ...(statusFilter ? { status: statusFilter } : {})
    },
    {
      query: {
        enabled: !!organizationId,
        placeholderData: keepPreviousData,
      },
    },
  );

  // Cast the Orval response to our typed shape
  const response = data as unknown as RecentRunsResponseDto | undefined;
  const runs: RecentRun[] = (response?.data as unknown as RecentRun[]) ?? [];
  const meta: PaginationMeta = (response?.meta as unknown as PaginationMeta) ?? {
    total: 0,
    page: 1,
    limit: 10,
  };

  // WebSocket subscription for real-time updates
  useEffect(() => {
    const orgId = getSelectedOrganizationId();
    if (!orgId) return;

    socketService.connect();
    socketService.joinRoom(`dashboard:${orgId}`);

    const unsub = socketService.on<DashboardRunUpdate>(
      "dashboard-run-update",
      () => {
        // Invalidate the query to refetch from API on any run update
        void queryClient.invalidateQueries({
          queryKey: getDashboardControllerGetRecentRunsQueryKey(orgId),
        });
      },
    );

    unsubRef.current = () => {
      unsub();
      socketService.leaveRoom(`dashboard:${orgId}`);
    };

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [queryClient]);

  return {
    runs,
    meta,
    isLoading,
    statusFilter,
    setStatusFilter: (status: string | undefined) => {
      setStatusFilter(status as DashboardControllerGetRecentRunsStatus | undefined);
      setPage(1); // Reset to page 1 when filter changes
    },
    page,
    setPage,
    refetch: () =>
      queryClient.invalidateQueries({
        queryKey: getDashboardControllerGetRecentRunsQueryKey(organizationId),
      }),
  };
}
