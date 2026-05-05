import { useState, useEffect, useRef } from "react";
import { useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { getSelectedOrganizationId } from "@/api/organization-store";
import {
  useActivityLogControllerFindAll,
  getActivityLogControllerFindAllQueryKey,
} from "@/api/generated/activity-logs/activity-logs";
import type {
  ActivityLogListResponseDto,
  ActivityLogItemDto,
} from "@/api/generated/models";
import { socketService } from "@/services/socket";
import type { ActivityFeedItem, PaginationMeta } from "../types/dashboard";

/**
 * Hook for fetching dashboard activity logs with WebSocket real-time updates via Orval.
 */
export function useDashboardActivity() {
  const organizationId = getSelectedOrganizationId() ?? "";
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;
  const unsubRef = useRef<(() => void) | null>(null);

  // Use Orval-generated hook for data
  const { data, isLoading } = useActivityLogControllerFindAll(
    organizationId,
    { limit, page, sortOrder: "desc" },
    {
      query: {
        enabled: !!organizationId,
        placeholderData: keepPreviousData,
      },
    },
  );

  // Cast the Orval response
  const response = data as unknown as ActivityLogListResponseDto | undefined;
  const items: ActivityFeedItem[] = (response?.data ?? []).map(
    (log: ActivityLogItemDto) => ({
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      targetName: log.targetName,
      actorName: log.actor?.name ?? undefined,
      metadata: log.metadata,
      timestamp: log.createdAt,
    }),
  );

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
    socketService.joinRoom(`org-activity:${orgId}`);

    // Track connection state reliably — fires immediately with current
    // state then on every connect/disconnect.
    const unsubConnection = socketService.onConnectionChange(setIsConnected);

    const unsubEvent = socketService.on(
      "activity-event",
      () => {
        void queryClient.invalidateQueries({
          queryKey: getActivityLogControllerFindAllQueryKey(orgId),
        });
      },
    );

    unsubRef.current = () => {
      unsubConnection();
      unsubEvent();
      socketService.leaveRoom(`org-activity:${orgId}`);
    };

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [queryClient]);

  return { 
    items, 
    meta,
    isLoading, 
    isConnected,
    page,
    setPage,
  };
}
