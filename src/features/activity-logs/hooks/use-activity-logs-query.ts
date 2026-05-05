import { useState, useCallback, useMemo } from "react";
import { getSelectedOrganizationId } from "@/api/organization-store";
import { useActivityLogControllerFindAll } from "@/api/generated/activity-logs/activity-logs";
import type {
  ActivityLogControllerFindAllParams,
  ActivityLogListResponseDto,
} from "@/api/generated/models";

interface ActivityLogsQueryState {
  page: number;
  limit: number;
  search: string;
  action: string;
  targetType: string;
  sortOrder: "asc" | "desc";
}

const DEFAULT_STATE: ActivityLogsQueryState = {
  page: 1,
  limit: 20,
  search: "",
  action: "",
  targetType: "",
  sortOrder: "desc",
};

export function useActivityLogsQuery() {
  const organizationId = getSelectedOrganizationId() ?? "";

  const [queryState, setQueryState] =
    useState<ActivityLogsQueryState>(DEFAULT_STATE);

  const params = useMemo<ActivityLogControllerFindAllParams>(
    () => ({
      page: queryState.page,
      limit: queryState.limit,
      ...(queryState.search ? { search: queryState.search } : {}),
      ...(queryState.action ? { action: queryState.action } : {}),
      ...(queryState.targetType ? { targetType: queryState.targetType } : {}),
      sortOrder: queryState.sortOrder as ActivityLogControllerFindAllParams["sortOrder"],
    }),
    [queryState],
  );

  const { data, isLoading, isError, error, refetch } =
    useActivityLogControllerFindAll(organizationId, params, {
      query: {
        enabled: !!organizationId,
      },
    });

  // Cast the response to our typed shape (same pattern as useMembersQuery)
  const response = data as unknown as ActivityLogListResponseDto | undefined;

  const setPage = useCallback((page: number) => {
    setQueryState((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setQueryState((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setQueryState((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setAction = useCallback((action: string) => {
    setQueryState((prev) => ({ ...prev, action, page: 1 }));
  }, []);

  const setTargetType = useCallback((targetType: string) => {
    setQueryState((prev) => ({ ...prev, targetType, page: 1 }));
  }, []);

  const toggleSortOrder = useCallback(() => {
    setQueryState((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "desc" ? "asc" : "desc",
      page: 1,
    }));
  }, []);

  return {
    logs: response?.data ?? [],
    meta: response?.meta ?? { total: 0, page: 1, limit: 20 },
    isLoading,
    isError,
    error,
    refetch,
    queryState,
    setPage,
    setLimit,
    setSearch,
    setAction,
    setTargetType,
    toggleSortOrder,
    organizationId,
  };
}
