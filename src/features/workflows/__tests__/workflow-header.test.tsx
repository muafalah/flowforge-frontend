import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkflowHeader } from "../components/workflow-header";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { WorkflowDataDto } from "@/api/generated/models";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockTriggerRun = vi.fn().mockResolvedValue({ id: "run-12345678" });

vi.mock("../hooks/use-workflow-runs", () => ({
  useWorkflowRuns: () => ({
    triggerRun: mockTriggerRun,
    isTriggering: false,
    cancelRun: vi.fn(),
    fetchRuns: vi.fn(),
    fetchRunDetail: vi.fn(),
    fetchRunLogs: vi.fn(),
    isCancelling: false,
  }),
}));

vi.mock("../hooks/use-workflow-mutations", () => ({
  useUpdateWorkflow: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../hooks/use-triggers", () => ({
  useCronJobs: () => ({
    cronJobs: [],
    isLoading: false,
    isMutating: false,
    fetchCronJobs: vi.fn(),
    createCronJob: vi.fn(),
    updateCronJob: vi.fn(),
    deleteCronJob: vi.fn(),
  }),
  useWebhooks: () => ({
    webhooks: [],
    isLoading: false,
    isMutating: false,
    fetchWebhooks: vi.fn(),
    createWebhook: vi.fn(),
    updateWebhook: vi.fn(),
    deleteWebhook: vi.fn(),
  }),
}));

vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: () => "org-1",
}));

vi.mock("@/api/token-store", () => ({
  getAccessToken: () => "mock-token",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockWorkflow: WorkflowDataDto = {
  id: "wf-1",
  organizationId: "org-1",
  name: "Test Workflow",
  description: "A workflow description" as unknown as Record<string, unknown>,
  access: "EDITOR",
  activeVersion: { id: "v-1", version: 1, createdAt: "2024-01-01" },
  versionCount: 1,
  creator: { id: "u-1", name: "Test User", email: "test@test.com" },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

function renderHeader(
  userRole: "OWNER" | "ADMIN" | "MEMBER" = "OWNER",
  workflow = mockWorkflow,
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <WorkflowHeader
          workflow={workflow}
          organizationId="org-1"
          userRole={userRole}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("WorkflowHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render workflow name", () => {
    renderHeader();
    expect(screen.getByText("Test Workflow")).toBeInTheDocument();
  });

  it("should render workflow description", () => {
    renderHeader();
    expect(screen.getByText("A workflow description")).toBeInTheDocument();
  });

  it("should render back button", () => {
    renderHeader();
    expect(screen.getByText("Back to Workflows")).toBeInTheDocument();
  });

  it("should show Run button for OWNER", () => {
    renderHeader("OWNER");
    // The header renders a "Run" button (Rocket icon + Run text)
    const runButtons = screen.getAllByRole("button").filter(
      (btn) => btn.textContent?.trim() === "Run",
    );
    expect(runButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should show Run button for ADMIN", () => {
    renderHeader("ADMIN");
    const runButtons = screen.getAllByRole("button").filter(
      (btn) => btn.textContent?.trim() === "Run",
    );
    expect(runButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should hide action buttons for MEMBER", () => {
    renderHeader("MEMBER");
    // No Run button for MEMBER
    const runButtons = screen.queryAllByRole("button").filter(
      (btn) => btn.textContent?.trim() === "Run",
    );
    expect(runButtons).toHaveLength(0);
  });

  it("should call triggerRun when Run button is clicked", async () => {
    const user = userEvent.setup();
    renderHeader("OWNER");

    // Find the exact "Run" button (not "Run History")
    const runButton = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.trim() === "Run",
    )!;
    await user.click(runButton);
    expect(mockTriggerRun).toHaveBeenCalledTimes(1);
  });

  it("should show success toast after successful trigger", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    renderHeader("OWNER");

    const runButton = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.trim() === "Run",
    )!;
    await user.click(runButton);

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("run-1234"),
    );
  });

  it("should render RunPanel component", () => {
    renderHeader("OWNER");
    // RunPanel renders a "Run History" button
    expect(screen.getByText("Run History")).toBeInTheDocument();
  });

  it("should render TriggersPanel component", () => {
    renderHeader("OWNER");
    expect(
      screen.getByRole("button", { name: /triggers/i }),
    ).toBeInTheDocument();
  });

  it("should not show description when workflow has none", () => {
    const workflowNoDesc = {
      ...mockWorkflow,
      description: undefined as unknown as Record<string, unknown>,
    };
    renderHeader("OWNER", workflowNoDesc);
    expect(
      screen.queryByText("A workflow description"),
    ).not.toBeInTheDocument();
  });
});
