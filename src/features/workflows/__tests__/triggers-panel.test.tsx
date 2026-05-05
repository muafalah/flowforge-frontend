import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TriggersPanel } from "../components/triggers-panel";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Mock hooks
const mockFetchCronJobs = vi.fn().mockResolvedValue([]);
const mockCreateCronJob = vi.fn().mockResolvedValue({ id: "cj-1" });
const mockFetchWebhooks = vi.fn().mockResolvedValue([]);
const mockCreateWebhook = vi.fn().mockResolvedValue({ id: "wh-1", webhookUrl: "http://localhost:3000/v1/webhooks/test", secret: "abc" });

vi.mock("../hooks/use-triggers", () => ({
  useCronJobs: () => ({
    cronJobs: [],
    isLoading: false,
    isMutating: false,
    fetchCronJobs: mockFetchCronJobs,
    createCronJob: mockCreateCronJob,
    updateCronJob: vi.fn(),
    deleteCronJob: vi.fn(),
  }),
  useWebhooks: () => ({
    webhooks: [],
    isLoading: false,
    isMutating: false,
    fetchWebhooks: mockFetchWebhooks,
    createWebhook: mockCreateWebhook,
    updateWebhook: vi.fn(),
    deleteWebhook: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderPanel(readOnly = false) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TriggersPanel workflowId="wf-1" readOnly={readOnly} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TriggersPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the Triggers button", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: /triggers/i })).toBeInTheDocument();
  });

  it("should open the sheet when Triggers button is clicked", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: /triggers/i }));
    // Sheet title renders as heading
    expect(await screen.findByRole("heading", { name: /triggers/i })).toBeInTheDocument();
  });

  it("should show Cron and Webhooks tabs", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: /triggers/i }));
    expect(await screen.findByRole("tab", { name: /cron/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /webhooks/i })).toBeInTheDocument();
  });

  it("should show Add Cron Job button for non-readOnly", async () => {
    const user = userEvent.setup();
    renderPanel(false);
    await user.click(screen.getByRole("button", { name: /triggers/i }));
    expect(await screen.findByText("Add Cron Job")).toBeInTheDocument();
  });

  it("should NOT show Add buttons for readOnly mode", async () => {
    const user = userEvent.setup();
    renderPanel(true);
    await user.click(screen.getByRole("button", { name: /triggers/i }));
    await screen.findByRole("heading", { name: /triggers/i });
    expect(screen.queryByText("Add Cron Job")).not.toBeInTheDocument();
  });

  it("should show empty state for cron jobs", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: /triggers/i }));
    expect(await screen.findByText("No cron jobs")).toBeInTheDocument();
  });

  it("should open Create Cron dialog when Add button clicked", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: /triggers/i }));
    await user.click(await screen.findByText("Add Cron Job"));
    expect(await screen.findByText("Create Cron Job")).toBeInTheDocument();
    expect(screen.getByText("Cron Expression")).toBeInTheDocument();
  });

  it("should switch to webhooks tab and show empty state", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: /triggers/i }));
    const webhookTab = await screen.findByRole("tab", { name: /webhooks/i });
    await user.click(webhookTab);
    expect(await screen.findByText("No webhooks")).toBeInTheDocument();
  });
});
