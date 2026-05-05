import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WorkflowOverviewCards } from "../components/workflow-overview-cards";
import type { WorkflowSummary } from "../types/dashboard";

// Mock ReactFlow — it doesn't render in jsdom
vi.mock("@xyflow/react", () => ({
  ReactFlow: () => <div data-testid="react-flow" />,
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("../components/mini-dag-preview", () => ({
  MiniDagPreview: () => <div data-testid="mini-dag" />,
}));

const mockWorkflows: WorkflowSummary[] = [
  {
    id: "wf-1",
    name: "Daily ETL Pipeline",
    description: "Syncs data daily",
    lastRunStatus: "SUCCESS",
    lastRunDuration: 3200,
    lastRunAt: "2026-05-05T10:30:00.000Z",
    totalRuns24h: 15,
    successCount24h: 14,
    activeVersionDefinition: { nodes: [], edges: [] },
  },
  {
    id: "wf-2",
    name: "User Sync",
    description: null,
    lastRunStatus: "FAILED",
    lastRunDuration: 1800,
    lastRunAt: "2026-05-05T10:28:00.000Z",
    totalRuns24h: 10,
    successCount24h: 8,
    activeVersionDefinition: null,
  },
  {
    id: "wf-3",
    name: "Report Gen",
    description: "Generates reports",
    lastRunStatus: null,
    lastRunDuration: null,
    lastRunAt: null,
    totalRuns24h: 0,
    successCount24h: 0,
    activeVersionDefinition: null,
  },
];

function renderCards(
  overrides?: Partial<React.ComponentProps<typeof WorkflowOverviewCards>>,
) {
  return render(
    <MemoryRouter>
      <WorkflowOverviewCards
        workflows={mockWorkflows}
        isLoading={false}
        {...overrides}
      />
    </MemoryRouter>,
  );
}

describe("WorkflowOverviewCards", () => {
  it("renders workflow names", () => {
    renderCards();
    expect(screen.getByText("Daily ETL Pipeline")).toBeInTheDocument();
    expect(screen.getByText("User Sync")).toBeInTheDocument();
    expect(screen.getByText("Report Gen")).toBeInTheDocument();
  });

  it("renders workflow descriptions when present", () => {
    renderCards();
    expect(screen.getByText("Syncs data daily")).toBeInTheDocument();
    expect(screen.getByText("Generates reports")).toBeInTheDocument();
  });

  it("renders status badges for workflows with runs", () => {
    renderCards();
    expect(screen.getByText("SUCCESS")).toBeInTheDocument();
    expect(screen.getByText("FAILED")).toBeInTheDocument();
  });

  it("shows 'No runs yet' for workflows without runs", () => {
    renderCards();
    expect(screen.getByText("No runs yet")).toBeInTheDocument();
  });

  it("renders duration formatted correctly", () => {
    renderCards();
    expect(screen.getByText("3.2s")).toBeInTheDocument();
    expect(screen.getByText("1.8s")).toBeInTheDocument();
  });

  it("shows success rate percentage", () => {
    renderCards();
    // wf-1: 14/15 = 93%
    expect(screen.getByText("93%")).toBeInTheDocument();
    // wf-2: 8/10 = 80%
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("limits display to MAX_DISPLAYED_WORKFLOWS (6)", () => {
    const manyWorkflows: WorkflowSummary[] = Array.from(
      { length: 10 },
      (_, i) => ({
        id: `wf-${i}`,
        name: `Workflow ${i}`,
        description: null,
        lastRunStatus: null,
        lastRunDuration: null,
        lastRunAt: null,
        totalRuns24h: 0,
        successCount24h: 0,
        activeVersionDefinition: null,
      }),
    );

    renderCards({ workflows: manyWorkflows });

    // Only first 6 should appear
    expect(screen.getByText("Workflow 0")).toBeInTheDocument();
    expect(screen.getByText("Workflow 5")).toBeInTheDocument();
    expect(screen.queryByText("Workflow 6")).not.toBeInTheDocument();
    expect(screen.queryByText("Workflow 9")).not.toBeInTheDocument();
  });

  it("shows loading skeletons when isLoading is true", () => {
    renderCards({ isLoading: true });
    // Should render 6 skeleton cards
    const cards = document.querySelectorAll("[data-slot='card']");
    expect(cards.length).toBe(6);
    // Should not show any workflow names
    expect(screen.queryByText("Daily ETL Pipeline")).not.toBeInTheDocument();
  });

  it("renders nothing when no workflows and not loading", () => {
    const { container } = renderCards({ workflows: [] });
    // Component returns null when no workflows
    expect(container.firstChild?.childNodes.length).toBeFalsy();
  });

  it("renders section title", () => {
    renderCards();
    expect(screen.getByText("Last Updated Workflow")).toBeInTheDocument();
  });

  it("renders mini dag previews", () => {
    renderCards();
    const dagPreviews = screen.getAllByTestId("mini-dag");
    expect(dagPreviews.length).toBe(3);
  });

  it("renders Open Workflow buttons", () => {
    renderCards();
    const buttons = screen.getAllByText("Open Workflow");
    expect(buttons.length).toBe(3);
  });
});
