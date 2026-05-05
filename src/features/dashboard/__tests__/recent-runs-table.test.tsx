import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RecentRunsTable } from "../components/recent-runs-table";
import type { RecentRun, PaginationMeta } from "../types/dashboard";

const mockRuns: RecentRun[] = [
  {
    id: "run-1",
    workflowId: "wf-1",
    workflowName: "Daily ETL Pipeline",
    status: "SUCCESS",
    triggerType: "MANUAL",
    triggeredBy: "user-1",
    triggeredUserName: "John Doe",
    durationMs: 3200,
    startedAt: "2026-05-05T10:30:00.000Z",
    createdAt: "2026-05-05T10:30:00.000Z",
  },
  {
    id: "run-2",
    workflowId: "wf-2",
    workflowName: "User Sync",
    status: "FAILED",
    triggerType: "WEBHOOK",
    triggeredBy: null,
    triggeredUserName: null,
    durationMs: 1800,
    startedAt: "2026-05-05T10:28:00.000Z",
    createdAt: "2026-05-05T10:28:00.000Z",
  },
];

const mockMeta: PaginationMeta = { total: 2, page: 1, limit: 10 };

function renderTable(
  overrides?: Partial<React.ComponentProps<typeof RecentRunsTable>>,
) {
  return render(
    <MemoryRouter>
      <RecentRunsTable
        runs={mockRuns}
        meta={mockMeta}
        isLoading={false}
        onStatusFilterChange={vi.fn()}
        page={1}
        onPageChange={vi.fn()}
        onRefresh={vi.fn()}
        {...overrides}
      />
    </MemoryRouter>,
  );
}

describe("RecentRunsTable", () => {
  it("renders workflow names", () => {
    renderTable();
    expect(screen.getByText("Daily ETL Pipeline")).toBeInTheDocument();
    expect(screen.getByText("User Sync")).toBeInTheDocument();
  });

  it("renders status badges", () => {
    renderTable();
    expect(screen.getByText("SUCCESS")).toBeInTheDocument();
    expect(screen.getByText("FAILED")).toBeInTheDocument();
  });

  it("renders trigger type badges", () => {
    renderTable();
    expect(screen.getByText("MANUAL")).toBeInTheDocument();
    expect(screen.getByText("WEBHOOK")).toBeInTheDocument();
  });

  it("renders duration formatted", () => {
    renderTable();
    expect(screen.getByText("3.2s")).toBeInTheDocument();
    expect(screen.getByText("1.8s")).toBeInTheDocument();
  });

  it("shows empty state when no runs", () => {
    renderTable({ runs: [], meta: { total: 0, page: 1, limit: 10 } });
    expect(screen.getByText("No runs found")).toBeInTheDocument();
  });

  it("shows loading skeletons", () => {
    renderTable({ isLoading: true });
    // Should not show table rows when loading
    expect(screen.queryByText("Daily ETL Pipeline")).not.toBeInTheDocument();
  });

  it("renders the title", () => {
    renderTable();
    expect(screen.getByText("Recent Runs")).toBeInTheDocument();
  });
});
