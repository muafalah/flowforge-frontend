import { useState, useCallback, useMemo } from "react";
import { useWorkflowControllerFindAll } from "@/api/generated/workflows/workflows";
import { getSelectedOrganizationId } from "@/api/organization-store";
import type {
  WorkflowControllerFindAllSortBy,
  WorkflowControllerFindAllSortOrder,
  WorkflowControllerFindAllStatus,
  WorkflowListResponseDto,
} from "@/api/generated/models";

interface WorkflowsQueryState {
  page: number;
  limit: number;
  search: string;
  status?: WorkflowControllerFindAllStatus;
  sortBy: WorkflowControllerFindAllSortBy;
  sortOrder: WorkflowControllerFindAllSortOrder;
}

const DEFAULT_STATE: WorkflowsQueryState = {
  page: 1,
  limit: 10,
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

export function useWorkflowsQuery() {
  const organizationId = getSelectedOrganizationId() ?? "";

  const [queryState, setQueryState] =
    useState<WorkflowsQueryState>(DEFAULT_STATE);

  const params = useMemo(
    () => ({
      page: queryState.page,
      limit: queryState.limit,
      ...(queryState.search ? { search: queryState.search } : {}),
      ...(queryState.status ? { status: queryState.status } : {}),
      sortBy: queryState.sortBy,
      sortOrder: queryState.sortOrder,
    }),
    [queryState],
  );

  const { data, isLoading, isError, error, refetch } =
    useWorkflowControllerFindAll(organizationId, params, {
      query: {
        enabled: !!organizationId,
      },
    });

  // Cast the response to the typed shape
  const response = data as unknown as WorkflowListResponseDto | undefined;

  const setPage = useCallback((page: number) => {
    setQueryState((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setQueryState((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setQueryState((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setStatus = useCallback(
    (status?: WorkflowControllerFindAllStatus) => {
      setQueryState((prev) => ({ ...prev, status, page: 1 }));
    },
    [],
  );

  const setSort = useCallback(
    (
      sortBy: WorkflowControllerFindAllSortBy,
      sortOrder: WorkflowControllerFindAllSortOrder,
    ) => {
      setQueryState((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
    },
    [],
  );

  const toggleSort = useCallback(
    (field: WorkflowControllerFindAllSortBy) => {
      setQueryState((prev) => {
        if (prev.sortBy === field) {
          return {
            ...prev,
            sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
            page: 1,
          };
        }
        return { ...prev, sortBy: field, sortOrder: "asc", page: 1 };
      });
    },
    [],
  );

  return {
    workflows: response?.data ?? [],
    meta: response?.meta ?? { total: 0, page: 1, limit: 10 },
    isLoading,
    isError,
    error,
    refetch,
    queryState,
    setPage,
    setLimit,
    setSearch,
    setStatus,
    setSort,
    toggleSort,
    organizationId,
  };
}
