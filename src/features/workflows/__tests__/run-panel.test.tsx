import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RunPanel } from "../components/run-panel";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Mock hooks
const mockTriggerRun = vi.fn().mockResolvedValue({ id: "run-123" });
const mockCancelRun = vi.fn().mockResolvedValue(undefined);
const mockFetchRuns = vi.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } });
const mockFetchRunDetail = vi.fn();
const mockFetchRunLogs = vi.fn();

vi.mock("../hooks/use-workflow-runs", () => ({
  useWorkflowRuns: () => ({
    triggerRun: mockTriggerRun,
    cancelRun: mockCancelRun,
    fetchRuns: mockFetchRuns,
    fetchRunDetail: mockFetchRunDetail,
    fetchRunLogs: mockFetchRunLogs,
    isTriggering: false,
    isCancelling: false,
  }),
}));

vi.mock("../hooks/use-workflow-execution", () => ({
  useWorkflowExecution: () => ({
    nodeStatuses: {},
    isConnected: false,
    resetStatuses: vi.fn(),
    setNodeStatus: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderRunPanel(readOnly = false) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RunPanel workflowId="wf-1" readOnly={readOnly} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("RunPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the Run trigger button", () => {
    renderRunPanel();
    expect(screen.getByRole("button", { name: /run/i })).toBeInTheDocument();
  });

  it("should open the sheet when Run button is clicked", async () => {
    const user = userEvent.setup();
    renderRunPanel();
    await user.click(screen.getByRole("button", { name: /run/i }));
    expect(await screen.findByText("Workflow Runs")).toBeInTheDocument();
  });

  it("should show sheet description for non-readOnly", async () => {
    const user = userEvent.setup();
    renderRunPanel(false);
    await user.click(screen.getByRole("button", { name: /run/i }));
    expect(
      await screen.findByText("Monitor active workflows and view run history."),
    ).toBeInTheDocument();
  });

  it("should show sheet description for readOnly mode", async () => {
    const user = userEvent.setup();
    renderRunPanel(true);
    await user.click(screen.getByRole("button", { name: /run/i }));
    expect(
      await screen.findByText("Workflow Runs"),
    ).toBeInTheDocument();
  });

  it("should show empty state when no runs", async () => {
    const user = userEvent.setup();
    renderRunPanel();
    await user.click(screen.getByRole("button", { name: /run/i }));
    expect(await screen.findByText("No runs yet")).toBeInTheDocument();
  });

  it("should show run history when runs exist", async () => {
    mockFetchRuns.mockResolvedValueOnce({
      data: [
        {
          id: "run-abc12345",
          status: "SUCCESS",
          triggerType: "MANUAL",
          createdAt: "2026-01-01T00:00:00Z",
          durationMs: 1200,
        },
      ],
      meta: { total: 1, page: 1, limit: 20 },
    });

    const user = userEvent.setup();
    renderRunPanel();
    await user.click(screen.getByRole("button", { name: /run/i }));
    expect(await screen.findByText(/Run #run-abc1/)).toBeInTheDocument();
  });

  it("should display status filter dropdown", async () => {
    const user = userEvent.setup();
    renderRunPanel();
    await user.click(screen.getByRole("button", { name: /run/i }));
    expect(await screen.findByText("All Statuses")).toBeInTheDocument();
  });
});
