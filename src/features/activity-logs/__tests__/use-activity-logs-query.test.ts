import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useActivityLogsQuery } from "../hooks/use-activity-logs-query";
import { useActivityLogControllerFindAll } from "@/api/generated/activity-logs/activity-logs";

vi.mock("@/api/generated/activity-logs/activity-logs", () => ({
  useActivityLogControllerFindAll: vi.fn(),
}));

vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: () => "org-1",
}));

const mockFindAll = useActivityLogControllerFindAll as Mock;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe("useActivityLogsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty logs when no data", () => {
    mockFindAll.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useActivityLogsQuery(), {
      wrapper: createWrapper(),
    });

    expect(result.current.logs).toEqual([]);
    expect(result.current.meta).toEqual({
      total: 0,
      page: 1,
      limit: 20,
    });
    expect(result.current.isLoading).toBe(true);
  });

  it("should extract logs from response data", () => {
    const mockLogs = [
      {
        id: "log-1",
        action: "member.added",
        targetType: "member",
        targetName: "john@email.com",
        actor: { id: "u-1", name: "Admin", email: "admin@test.com" },
        createdAt: "2026-05-05T00:00:00Z",
      },
    ];

    mockFindAll.mockReturnValue({
      data: {
        message: "Activity logs retrieved successfully.",
        data: mockLogs,
        meta: { total: 1, page: 1, limit: 20 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useActivityLogsQuery(), {
      wrapper: createWrapper(),
    });

    expect(result.current.logs).toEqual(mockLogs);
    expect(result.current.meta.total).toBe(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("should pass correct params to the API hook", () => {
    mockFindAll.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderHook(() => useActivityLogsQuery(), {
      wrapper: createWrapper(),
    });

    expect(mockFindAll).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({
        page: 1,
        limit: 20,
        sortOrder: "desc",
      }),
      expect.objectContaining({
        query: { enabled: true },
      }),
    );
  });

  it("should provide setter functions", () => {
    mockFindAll.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useActivityLogsQuery(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.setPage).toBe("function");
    expect(typeof result.current.setLimit).toBe("function");
    expect(typeof result.current.setSearch).toBe("function");
    expect(typeof result.current.setAction).toBe("function");
    expect(typeof result.current.setTargetType).toBe("function");
    expect(typeof result.current.toggleSortOrder).toBe("function");
  });

  it("should update query state when setAction is called", async () => {
    mockFindAll.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useActivityLogsQuery(), {
      wrapper: createWrapper(),
    });

    result.current.setAction("version.created");

    await waitFor(() => {
      expect(result.current.queryState.action).toBe("version.created");
      expect(result.current.queryState.page).toBe(1); // should reset page
    });
  });

  it("should update query state when setTargetType is called", async () => {
    mockFindAll.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useActivityLogsQuery(), {
      wrapper: createWrapper(),
    });

    result.current.setTargetType("run");

    await waitFor(() => {
      expect(result.current.queryState.targetType).toBe("run");
    });
  });

  it("should toggle sort order", async () => {
    mockFindAll.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useActivityLogsQuery(), {
      wrapper: createWrapper(),
    });

    // Default is "desc"
    expect(result.current.queryState.sortOrder).toBe("desc");

    result.current.toggleSortOrder();

    await waitFor(() => {
      expect(result.current.queryState.sortOrder).toBe("asc");
    });
  });
});
