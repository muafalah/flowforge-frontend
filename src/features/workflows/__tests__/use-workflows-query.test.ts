import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWorkflowsQuery } from "../hooks/use-workflows-query";
import { useWorkflowControllerFindAll } from "@/api/generated/workflows/workflows";
import { getSelectedOrganizationId } from "@/api/organization-store";

vi.mock("@/api/generated/workflows/workflows", () => ({
  useWorkflowControllerFindAll: vi.fn(),
}));

vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: vi.fn(),
}));

const mockFindAll = useWorkflowControllerFindAll as Mock;
const mockGetSelectedOrganizationId = getSelectedOrganizationId as Mock;

describe("useWorkflowsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSelectedOrganizationId.mockReturnValue("org-1");
    mockFindAll.mockReturnValue({
      data: {
        data: [{ id: "wf-1", name: "Test" }],
        meta: { total: 1, page: 1, limit: 10 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useWorkflowsQuery());

    expect(result.current.queryState).toEqual({
      page: 1,
      limit: 10,
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    expect(result.current.organizationId).toBe("org-1");
    expect(result.current.workflows).toHaveLength(1);
    expect(result.current.meta.total).toBe(1);
  });

  it("should pass correct params to useWorkflowControllerFindAll", () => {
    renderHook(() => useWorkflowsQuery());

    expect(mockFindAll).toHaveBeenCalledWith(
      "org-1",
      {
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
      expect.any(Object),
    );
  });

  it("should update page", () => {
    const { result } = renderHook(() => useWorkflowsQuery());

    act(() => {
      result.current.setPage(3);
    });

    expect(result.current.queryState.page).toBe(3);
  });

  it("should update limit and reset page", () => {
    const { result } = renderHook(() => useWorkflowsQuery());

    act(() => {
      result.current.setPage(3);
    });

    act(() => {
      result.current.setLimit(25);
    });

    expect(result.current.queryState.limit).toBe(25);
    expect(result.current.queryState.page).toBe(1);
  });

  it("should update search and reset page", () => {
    const { result } = renderHook(() => useWorkflowsQuery());

    act(() => {
      result.current.setPage(2);
    });

    act(() => {
      result.current.setSearch("pipeline");
    });

    expect(result.current.queryState.search).toBe("pipeline");
    expect(result.current.queryState.page).toBe(1);
  });

  it("should update status and reset page", () => {
    const { result } = renderHook(() => useWorkflowsQuery());

    act(() => {
      result.current.setPage(2);
    });

    act(() => {
      result.current.setStatus("ACTIVE");
    });

    expect(result.current.queryState.status).toBe("ACTIVE");
    expect(result.current.queryState.page).toBe(1);
  });

  it("should clear status", () => {
    const { result } = renderHook(() => useWorkflowsQuery());

    act(() => {
      result.current.setStatus("ACTIVE");
    });

    act(() => {
      result.current.setStatus(undefined);
    });

    expect(result.current.queryState.status).toBeUndefined();
  });

  it("should toggle sort field correctly", () => {
    const { result } = renderHook(() => useWorkflowsQuery());

    // Default is createdAt desc
    act(() => {
      result.current.toggleSort("name");
    });

    expect(result.current.queryState.sortBy).toBe("name");
    expect(result.current.queryState.sortOrder).toBe("asc");

    // Toggle same field → flip order
    act(() => {
      result.current.toggleSort("name");
    });

    expect(result.current.queryState.sortBy).toBe("name");
    expect(result.current.queryState.sortOrder).toBe("desc");

    // Toggle same field again → flip back
    act(() => {
      result.current.toggleSort("name");
    });

    expect(result.current.queryState.sortOrder).toBe("asc");

    // Toggle different field → reset to asc
    act(() => {
      result.current.toggleSort("status");
    });

    expect(result.current.queryState.sortBy).toBe("status");
    expect(result.current.queryState.sortOrder).toBe("asc");
  });

  it("should set sort directly and reset page", () => {
    const { result } = renderHook(() => useWorkflowsQuery());

    act(() => {
      result.current.setPage(3);
      result.current.setSort("name", "desc");
    });

    expect(result.current.queryState.sortBy).toBe("name");
    expect(result.current.queryState.sortOrder).toBe("desc");
    expect(result.current.queryState.page).toBe(1);
  });

  it("should return empty defaults when no data", () => {
    mockFindAll.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useWorkflowsQuery());

    expect(result.current.workflows).toEqual([]);
    expect(result.current.meta).toEqual({ total: 0, page: 1, limit: 10 });
    expect(result.current.isLoading).toBe(true);
  });

  it("should not include search in params when empty", () => {
    renderHook(() => useWorkflowsQuery());

    const callArgs = mockFindAll.mock.calls[0] as [string, Record<string, unknown>];
    expect(callArgs[1]).not.toHaveProperty("search");
  });

  it("should include search in params when set", () => {
    const { result } = renderHook(() => useWorkflowsQuery());

    act(() => {
      result.current.setSearch("test");
    });

    // After state update, next render will call with search
    const lastCall = mockFindAll.mock.calls[mockFindAll.mock.calls.length - 1] as [
      string,
      Record<string, unknown>,
    ];
    expect(lastCall[1]).toHaveProperty("search", "test");
  });
});
