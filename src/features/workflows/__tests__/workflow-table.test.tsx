import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkflowTable } from "../components/workflow-table";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { WorkflowDataDto } from "@/api/generated/models";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// Mock the delete mutation hook
vi.mock("../hooks/use-workflow-mutations", () => ({
  useDeleteWorkflow: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateWorkflow: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: () => "org-1",
}));

const mockWorkflows: WorkflowDataDto[] = [
  {
    id: "wf-1",
    organizationId: "org-1",
    name: "Data Pipeline",
    description: "Syncs data" as unknown as Record<string, unknown>,
    access: "EDITOR",
    activeVersion: { id: "v-1", version: 2, createdAt: "2024-01-01" },
    versionCount: 3,
    creator: { id: "u-1", name: "Alice Smith", email: "alice@test.com" },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "wf-2",
    organizationId: "org-1",
    name: "Email Notifier",
    description: undefined as unknown as Record<string, unknown>,
    access: "VIEWER",
    activeVersion: undefined,
    versionCount: 0,
    creator: { id: "u-2", name: "Bob Jones", email: "bob@test.com" },
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-10T00:00:00Z",
  },
];

function renderTable(overrides: Partial<Parameters<typeof WorkflowTable>[0]> = {}) {
  const defaultProps = {
    workflows: mockWorkflows,
    isLoading: false,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
    onToggleSort: vi.fn(),
    userRole: "OWNER",
    organizationId: "org-1",
    ...overrides,
  };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <WorkflowTable {...defaultProps} />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
    props: defaultProps,
  };
}

describe("WorkflowTable", () => {
  it("should render workflow names", () => {
    renderTable();
    expect(screen.getByText("Data Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Email Notifier")).toBeInTheDocument();
  });

  it("should render workflow descriptions", () => {
    renderTable();
    expect(screen.getByText("Syncs data")).toBeInTheDocument();
  });

  it("should render active version number", () => {
    renderTable();
    expect(screen.getByText("v2")).toBeInTheDocument();
  });

  it("should render dash for workflows without active version", () => {
    renderTable();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("should render access badges", () => {
    renderTable();
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("Viewer")).toBeInTheDocument();
  });

  it("should render creator info", () => {
    renderTable();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("should render creator initials in avatars", () => {
    renderTable();
    expect(screen.getByText("AS")).toBeInTheDocument(); // Alice Smith
    expect(screen.getByText("BJ")).toBeInTheDocument(); // Bob Jones
  });

  it("should render empty state when no workflows", () => {
    renderTable({ workflows: [] });
    expect(screen.getByText("No workflows found")).toBeInTheDocument();
  });

  it("should render loading skeleton", () => {
    renderTable({ isLoading: true });
    // When loading, workflow names should not appear
    expect(screen.queryByText("Data Pipeline")).not.toBeInTheDocument();
  });

  it("should show edit/delete actions for OWNER", () => {
    const { container } = renderTable({ userRole: "OWNER" });
    // Each workflow should have edit and delete icon buttons (ghost buttons with icons)
    // The table renders Edit (Pencil), Delete (Trash2), View (Eye) for each row
    // OWNER: 2 edit + 2 delete + 2 view = 6 ghost icon buttons per table
    const ghostIconBtns = container.querySelectorAll('[data-variant="ghost"][data-size="icon"]');
    // 2 workflows × 3 buttons each (edit, delete, view)
    expect(ghostIconBtns.length).toBe(6);
  });

  it("should show edit/delete actions for ADMIN", () => {
    const { container } = renderTable({ userRole: "ADMIN" });
    const ghostIconBtns = container.querySelectorAll('[data-variant="ghost"][data-size="icon"]');
    // ADMIN: same as OWNER, 2 × 3 = 6
    expect(ghostIconBtns.length).toBe(6);
  });

  it("should hide edit/delete actions for MEMBER", () => {
    renderTable({ userRole: "MEMBER" });
    expect(screen.queryByText("Edit workflow")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete workflow")).not.toBeInTheDocument();
  });

  it("should always show view button", () => {
    const { container } = renderTable({ userRole: "MEMBER" });
    // MEMBER: only view buttons → 2 ghost icon buttons
    const ghostIconBtns = container.querySelectorAll('[data-variant="ghost"][data-size="icon"]');
    expect(ghostIconBtns.length).toBe(2);
  });

  it("should call onToggleSort when clicking sort buttons", async () => {
    const user = userEvent.setup();
    const { props } = renderTable();

    await user.click(screen.getByLabelText("Sort by name"));
    expect(props.onToggleSort).toHaveBeenCalledWith("name");

    await user.click(screen.getByLabelText("Sort by date"));
    expect(props.onToggleSort).toHaveBeenCalledWith("createdAt");
  });
});
