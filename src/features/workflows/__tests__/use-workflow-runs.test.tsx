import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { useWorkflowRuns } from "../hooks/use-workflow-runs";
import type { ReactNode } from "react";

// Mock dependencies
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: () => "org-1",
}));

vi.mock("@/api/token-store", () => ({
  getAccessToken: () => "mock-token",
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useWorkflowRuns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("triggerRun", () => {
    it("should trigger a manual run and return run data", async () => {
      const mockRun = {
        id: "run-123",
        status: "PENDING",
        triggerType: "MANUAL",
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: { message: "ok", data: { run: mockRun } },
      });

      const { result } = renderHook(() => useWorkflowRuns("wf-1"), {
        wrapper: createWrapper(),
      });

      let run: unknown;
      await act(async () => {
        run = await result.current.triggerRun();
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/runs"),
        {},
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(run).toEqual(mockRun);
    });

    it("should reset isTriggering after completion", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { data: { run: { id: "run-1" } } },
      });

      const { result } = renderHook(() => useWorkflowRuns("wf-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isTriggering).toBe(false);

      await act(async () => {
        await result.current.triggerRun();
      });

      expect(result.current.isTriggering).toBe(false);
    });

    it("should reset isTriggering on error", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useWorkflowRuns("wf-1"), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.triggerRun();
        }),
      ).rejects.toThrow("Network error");

      expect(result.current.isTriggering).toBe(false);
    });
  });

  describe("cancelRun", () => {
    it("should cancel a run", async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      const { result } = renderHook(() => useWorkflowRuns("wf-1"), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.cancelRun("run-123");
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/runs/run-123/cancel"),
        {},
        expect.any(Object),
      );
    });

    it("should reset isCancelling after completion", async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      const { result } = renderHook(() => useWorkflowRuns("wf-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isCancelling).toBe(false);

      await act(async () => {
        await result.current.cancelRun("run-1");
      });

      expect(result.current.isCancelling).toBe(false);
    });
  });

  describe("fetchRuns", () => {
    it("should fetch paginated runs", async () => {
      const mockRuns = [
        { id: "run-1", status: "SUCCESS", triggerType: "MANUAL" },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockRuns, meta: { total: 1, page: 1, limit: 20 } },
      });

      const { result } = renderHook(() => useWorkflowRuns("wf-1"), {
        wrapper: createWrapper(),
      });

      let response: unknown;
      await act(async () => {
        response = await result.current.fetchRuns({
          page: 1,
          limit: 20,
        });
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/runs?"),
        expect.any(Object),
      );
      expect(response).toEqual({
        data: mockRuns,
        meta: { total: 1, page: 1, limit: 20 },
      });
    });

    it("should include status filter in query params", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [], meta: { total: 0, page: 1, limit: 20 } },
      });

      const { result } = renderHook(() => useWorkflowRuns("wf-1"), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.fetchRuns({ status: "FAILED" });
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("status=FAILED"),
        expect.any(Object),
      );
    });

    it("should always include sortOrder=desc", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [], meta: { total: 0 } },
      });

      const { result } = renderHook(() => useWorkflowRuns("wf-1"), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.fetchRuns();
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("sortOrder=desc"),
        expect.any(Object),
      );
    });
  });

  describe("fetchRunDetail", () => {
    it("should fetch a single run detail", async () => {
      const mockRun = {
        id: "run-123",
        status: "SUCCESS",
        steps: [],
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: { run: mockRun } },
      });

      const { result } = renderHook(() => useWorkflowRuns("wf-1"), {
        wrapper: createWrapper(),
      });

      let detail: unknown;
      await act(async () => {
        detail = await result.current.fetchRunDetail("run-123");
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/runs/run-123"),
        expect.any(Object),
      );
      expect(detail).toEqual(mockRun);
    });
  });

  describe("fetchRunLogs", () => {
    it("should fetch logs for a run", async () => {
      const mockLogs = [
        { logId: "log-1", message: "Step started", level: "INFO" },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockLogs, meta: { total: 1 } },
      });

      const { result } = renderHook(() => useWorkflowRuns("wf-1"), {
        wrapper: createWrapper(),
      });

      let response: unknown;
      await act(async () => {
        response = await result.current.fetchRunLogs("run-123");
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/runs/run-123/logs"),
        expect.any(Object),
      );
      expect(response).toEqual({
        data: mockLogs,
        meta: { total: 1 },
      });
    });

    it("should include optional filter params", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [], meta: { total: 0 } },
      });

      const { result } = renderHook(() => useWorkflowRuns("wf-1"), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.fetchRunLogs("run-123", {
          nodeId: "node-1",
          level: "ERROR",
          page: 2,
        });
      });

      const callUrl = mockedAxios.get.mock.calls[0][0] as string;
      expect(callUrl).toContain("nodeId=node-1");
      expect(callUrl).toContain("level=ERROR");
      expect(callUrl).toContain("page=2");
    });
  });
});
