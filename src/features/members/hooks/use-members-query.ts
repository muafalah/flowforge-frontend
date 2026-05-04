import { useState, useCallback, useMemo } from "react";
import { useMembershipControllerFindAll } from "@/api/generated/organization-members/organization-members";
import { getSelectedOrganizationId } from "@/api/organization-store";
import type {
  MembershipControllerFindAllSortBy,
  MembershipControllerFindAllSortOrder,
} from "@/api/generated/models";
import type { MembersResponse } from "../types";

interface MembersQueryState {
  page: number;
  limit: number;
  search: string;
  sortBy: MembershipControllerFindAllSortBy;
  sortOrder: MembershipControllerFindAllSortOrder;
  roles: string[];
}

const DEFAULT_STATE: MembersQueryState = {
  page: 1,
  limit: 10,
  search: "",
  sortBy: "role",
  sortOrder: "asc",
  roles: [],
};

export function useMembersQuery() {
  const organizationId = getSelectedOrganizationId() ?? "";

  const [queryState, setQueryState] =
    useState<MembersQueryState>(DEFAULT_STATE);

  const params = useMemo(
    () => ({
      page: queryState.page,
      limit: queryState.limit,
      ...(queryState.search ? { search: queryState.search } : {}),
      ...(queryState.roles.length > 0
        ? { roles: queryState.roles as ("OWNER" | "ADMIN" | "MEMBER")[] }
        : {}),
      sortBy: queryState.sortBy,
      sortOrder: queryState.sortOrder,
    }),
    [queryState],
  );

  const { data, isLoading, isError, error, refetch } =
    useMembershipControllerFindAll(organizationId, params, {
      query: {
        enabled: !!organizationId,
      },
    });

  // Cast the response to our typed shape
  const response = data as unknown as MembersResponse | undefined;

  const setPage = useCallback((page: number) => {
    setQueryState((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setQueryState((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setQueryState((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setRoles = useCallback((roles: string[]) => {
    setQueryState((prev) => ({ ...prev, roles, page: 1 }));
  }, []);

  const setSort = useCallback(
    (
      sortBy: MembershipControllerFindAllSortBy,
      sortOrder: MembershipControllerFindAllSortOrder,
    ) => {
      setQueryState((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
    },
    [],
  );

  const toggleSort = useCallback((field: MembershipControllerFindAllSortBy) => {
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
  }, []);

  return {
    members: response?.data ?? [],
    meta: response?.meta ?? { total: 0, page: 1, limit: 10 },
    isLoading,
    isError,
    error,
    refetch,
    queryState,
    setPage,
    setLimit,
    setSearch,
    setRoles,
    setSort,
    toggleSort,
    organizationId,
  };
}
