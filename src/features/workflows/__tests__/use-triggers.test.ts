import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import axios from "axios";
import { useCronJobs, useWebhooks } from "../hooks/use-triggers";

// Mock dependencies
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: () => "org-1",
}));

vi.mock("@/api/token-store", () => ({
  getAccessToken: () => "mock-token",
}));

// --- useCronJobs ---

describe("useCronJobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch cron jobs", async () => {
    const mockCronJobs = [
      {
        id: "cj-1",
        name: "Daily Job",
        cronExpression: "0 0 * * *",
        timezone: "UTC",
        isActive: true,
      },
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: { data: mockCronJobs, meta: { total: 1 } },
    });

    const { result } = renderHook(() => useCronJobs("wf-1"));

    let fetchResult: unknown;
    await act(async () => {
      fetchResult = await result.current.fetchCronJobs();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("/cron-jobs"),
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(fetchResult).toEqual(mockCronJobs);
    expect(result.current.cronJobs).toEqual(mockCronJobs);
    expect(result.current.isLoading).toBe(false);
  });

  it("should create a cron job and refetch", async () => {
    const newCronJob = { id: "cj-2", name: "Hourly" };

    mockedAxios.post.mockResolvedValueOnce({
      data: { data: { cronJob: newCronJob } },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: [newCronJob], meta: { total: 1 } },
    });

    const { result } = renderHook(() => useCronJobs("wf-1"));

    let created: unknown;
    await act(async () => {
      created = await result.current.createCronJob({
        name: "Hourly",
        cronExpression: "0 * * * *",
        timezone: "UTC",
      });
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/cron-jobs"),
      expect.objectContaining({ name: "Hourly" }),
      expect.any(Object),
    );
    expect(created).toEqual(newCronJob);
  });

  it("should update a cron job and refetch", async () => {
    mockedAxios.patch.mockResolvedValueOnce({ data: {} });
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: [], meta: { total: 0 } },
    });

    const { result } = renderHook(() => useCronJobs("wf-1"));

    await act(async () => {
      await result.current.updateCronJob("cj-1", { name: "Updated" });
    });

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining("/cron-jobs/cj-1"),
      expect.objectContaining({ name: "Updated" }),
      expect.any(Object),
    );
  });

  it("should delete a cron job and refetch", async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: {} });
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: [], meta: { total: 0 } },
    });

    const { result } = renderHook(() => useCronJobs("wf-1"));

    await act(async () => {
      await result.current.deleteCronJob("cj-1");
    });

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      expect.stringContaining("/cron-jobs/cj-1"),
      expect.any(Object),
    );
  });

  it("should reset loading state on error", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useCronJobs("wf-1"));

    await expect(
      act(async () => {
        await result.current.fetchCronJobs();
      }),
    ).rejects.toThrow("Network error");

    expect(result.current.isLoading).toBe(false);
  });
});

// --- useWebhooks ---

describe("useWebhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch webhooks", async () => {
    const mockWebhooks = [
      {
        id: "wh-1",
        name: "GitHub",
        urlPath: "gh-hook",
        secret: "sec",
        isActive: true,
        webhookUrl: "http://localhost/v1/webhooks/gh-hook",
      },
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: { data: mockWebhooks, meta: { total: 1 } },
    });

    const { result } = renderHook(() => useWebhooks("wf-1"));

    await act(async () => {
      await result.current.fetchWebhooks();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("/webhooks"),
      expect.any(Object),
    );
    expect(result.current.webhooks).toEqual(mockWebhooks);
  });

  it("should create a webhook and refetch", async () => {
    const newWebhook = { id: "wh-2", name: "Slack" };

    mockedAxios.post.mockResolvedValueOnce({
      data: { data: { webhook: newWebhook } },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: [newWebhook], meta: { total: 1 } },
    });

    const { result } = renderHook(() => useWebhooks("wf-1"));

    let created: unknown;
    await act(async () => {
      created = await result.current.createWebhook({ name: "Slack" });
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/webhooks"),
      expect.objectContaining({ name: "Slack" }),
      expect.any(Object),
    );
    expect(created).toEqual(newWebhook);
  });

  it("should update a webhook and refetch", async () => {
    mockedAxios.patch.mockResolvedValueOnce({ data: {} });
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: [], meta: { total: 0 } },
    });

    const { result } = renderHook(() => useWebhooks("wf-1"));

    await act(async () => {
      await result.current.updateWebhook("wh-1", {
        name: "Updated",
        regenerateSecret: true,
      });
    });

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining("/webhooks/wh-1"),
      expect.objectContaining({ regenerateSecret: true }),
      expect.any(Object),
    );
  });

  it("should delete a webhook and refetch", async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: {} });
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: [], meta: { total: 0 } },
    });

    const { result } = renderHook(() => useWebhooks("wf-1"));

    await act(async () => {
      await result.current.deleteWebhook("wh-1");
    });

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      expect.stringContaining("/webhooks/wh-1"),
      expect.any(Object),
    );
  });

  it("should reset isMutating to false after completion", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { data: { webhook: { id: "wh-new" } } },
    });
    mockedAxios.get.mockResolvedValue({
      data: { data: [], meta: { total: 0 } },
    });

    const { result } = renderHook(() => useWebhooks("wf-1"));

    expect(result.current.isMutating).toBe(false);

    await act(async () => {
      await result.current.createWebhook({ name: "Test" });
    });

    expect(result.current.isMutating).toBe(false);
  });
});
