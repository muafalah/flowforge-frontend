import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMembersQuery } from "../hooks/use-members-query";
import { useMembershipControllerFindAll } from "@/api/generated/organization-members/organization-members";
import { getSelectedOrganizationId } from "@/api/organization-store";

vi.mock("@/api/generated/organization-members/organization-members", () => ({
  useMembershipControllerFindAll: vi.fn(),
}));

vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: vi.fn(),
}));

const mockFindAll = useMembershipControllerFindAll as Mock;
const mockGetSelectedOrganizationId = getSelectedOrganizationId as Mock;

describe("useMembersQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSelectedOrganizationId.mockReturnValue("org-1");
    mockFindAll.mockReturnValue({
      data: {
        data: [{ id: "mem-1" }],
        meta: { total: 1, page: 1, limit: 10 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useMembersQuery());

    expect(result.current.queryState).toEqual({
      page: 1,
      limit: 10,
      search: "",
      sortBy: "role",
      sortOrder: "asc",
      roles: [],
    });
    expect(result.current.organizationId).toBe("org-1");
    expect(result.current.members).toHaveLength(1);
    expect(result.current.meta.total).toBe(1);
  });

  it("should pass correct params to useMembershipControllerFindAll", () => {
    renderHook(() => useMembersQuery());

    expect(mockFindAll).toHaveBeenCalledWith(
      "org-1",
      {
        page: 1,
        limit: 10,
        sortBy: "role",
        sortOrder: "asc",
      },
      expect.any(Object),
    );
  });

  it("should update page", () => {
    const { result } = renderHook(() => useMembersQuery());

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.queryState.page).toBe(2);
  });

  it("should update limit and reset page", () => {
    const { result } = renderHook(() => useMembersQuery());

    act(() => {
      result.current.setPage(2);
    });

    act(() => {
      result.current.setLimit(25);
    });

    expect(result.current.queryState.limit).toBe(25);
    expect(result.current.queryState.page).toBe(1);
  });

  it("should update search and reset page", () => {
    const { result } = renderHook(() => useMembersQuery());

    act(() => {
      result.current.setPage(2);
    });

    act(() => {
      result.current.setSearch("john");
    });

    expect(result.current.queryState.search).toBe("john");
    expect(result.current.queryState.page).toBe(1);
  });

  it("should update roles and reset page", () => {
    const { result } = renderHook(() => useMembersQuery());

    act(() => {
      result.current.setPage(2);
    });

    act(() => {
      result.current.setRoles(["ADMIN", "OWNER"]);
    });

    expect(result.current.queryState.roles).toEqual(["ADMIN", "OWNER"]);
    expect(result.current.queryState.page).toBe(1);
  });

  it("should toggle sort field correctly", () => {
    const { result } = renderHook(() => useMembersQuery());

    // Default is role: asc
    act(() => {
      result.current.toggleSort("name");
    });

    expect(result.current.queryState.sortBy).toBe("name");
    expect(result.current.queryState.sortOrder).toBe("asc");

    act(() => {
      result.current.toggleSort("name");
    });

    expect(result.current.queryState.sortBy).toBe("name");
    expect(result.current.queryState.sortOrder).toBe("desc");

    act(() => {
      result.current.toggleSort("name");
    });

    expect(result.current.queryState.sortBy).toBe("name");
    expect(result.current.queryState.sortOrder).toBe("asc");
    
    act(() => {
      result.current.toggleSort("createdAt");
    });

    expect(result.current.queryState.sortBy).toBe("createdAt");
    expect(result.current.queryState.sortOrder).toBe("asc");
  });

  it("should update sort directly and reset page", () => {
    const { result } = renderHook(() => useMembersQuery());

    act(() => {
      result.current.setPage(2);
      result.current.setSort("createdAt", "desc");
    });

    expect(result.current.queryState.sortBy).toBe("createdAt");
    expect(result.current.queryState.sortOrder).toBe("desc");
    expect(result.current.queryState.page).toBe(1);
  });
});
