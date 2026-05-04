import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkflowHeader } from "../components/workflow-header";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { WorkflowDataDto } from "@/api/generated/models";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

vi.mock("../hooks/use-workflow-mutations", () => ({
  useDeleteWorkflow: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateWorkflow: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: () => "org-1",
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

  it("should show Edit and Delete buttons for OWNER", () => {
    renderHeader("OWNER");
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("should show Edit and Delete buttons for ADMIN", () => {
    renderHeader("ADMIN");
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("should hide Edit and Delete buttons for MEMBER", () => {
    renderHeader("MEMBER");
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("should open Edit dialog on Edit click", async () => {
    const user = userEvent.setup();
    renderHeader("OWNER");

    await user.click(screen.getByRole("button", { name: /edit/i }));
    expect(await screen.findByText("Edit Workflow")).toBeInTheDocument();
  });

  it("should open Delete confirmation dialog on Delete click", async () => {
    const user = userEvent.setup();
    renderHeader("OWNER");

    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(await screen.findByText("Delete Workflow")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });

  it("should not show description when workflow has none", () => {
    const workflowNoDesc = {
      ...mockWorkflow,
      description: undefined as unknown as Record<string, unknown>,
    };
    renderHeader("OWNER", workflowNoDesc);
    expect(screen.queryByText("A workflow description")).not.toBeInTheDocument();
  });
});
