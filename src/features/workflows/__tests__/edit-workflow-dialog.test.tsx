import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditWorkflowDialog } from "../components/edit-workflow-dialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { WorkflowDataDto } from "@/api/generated/models";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockMutate = vi.fn();

vi.mock("../hooks/use-workflow-mutations", () => ({
  useUpdateWorkflow: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: () => "org-1",
}));

const mockWorkflow: WorkflowDataDto = {
  id: "wf-1",
  organizationId: "org-1",
  name: "Original Workflow",
  description: "Original description" as unknown as Record<string, unknown>,
  status: "DRAFT",
  access: "EDITOR",
  activeVersion: undefined,
  versionCount: 0,
  creator: { id: "u-1", name: "Test", email: "test@test.com" },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

function renderDialog(
  open = true,
  onOpenChange = vi.fn(),
  workflow = mockWorkflow,
) {
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EditWorkflowDialog
            open={open}
            onOpenChange={onOpenChange}
            workflow={workflow}
            organizationId="org-1"
          />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
    onOpenChange,
  };
}

describe("EditWorkflowDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render dialog when open", () => {
    renderDialog(true);
    expect(screen.getByText("Edit Workflow")).toBeInTheDocument();
    expect(
      screen.getByText(/Update the workflow details/),
    ).toBeInTheDocument();
  });

  it("should not render dialog when closed", () => {
    renderDialog(false);
    expect(screen.queryByText("Edit Workflow")).not.toBeInTheDocument();
  });

  it("should pre-fill form with workflow data", () => {
    renderDialog();
    const nameInput = screen.getByDisplayValue("Original Workflow");
    expect(nameInput).toBeInTheDocument();

    const descInput = screen.getByDisplayValue("Original description");
    expect(descInput).toBeInTheDocument();
  });

  it("should disable Save Changes button when form is not dirty", () => {
    renderDialog();
    const saveBtn = screen.getByRole("button", { name: "Save Changes" });
    expect(saveBtn).toBeDisabled();
  });

  it("should enable Save Changes button when form is dirty", async () => {
    const user = userEvent.setup();
    renderDialog();

    const nameInput = screen.getByDisplayValue("Original Workflow");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Workflow");

    const saveBtn = screen.getByRole("button", { name: "Save Changes" });
    expect(saveBtn).not.toBeDisabled();
  });

  it("should show validation error for short name", async () => {
    const user = userEvent.setup();
    renderDialog();

    const nameInput = screen.getByDisplayValue("Original Workflow");
    await user.clear(nameInput);
    await user.type(nameInput, "AB");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText(/at least 3 characters/),
    ).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("should call mutate with updated data on valid submit", async () => {
    const user = userEvent.setup();
    renderDialog();

    const nameInput = screen.getByDisplayValue("Original Workflow");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        workflowId: "wf-1",
        data: expect.objectContaining({
          name: "Updated Name",
        }) as unknown,
      }),
      expect.any(Object),
    );
  });

  it("should call onOpenChange(false) when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog(true, onOpenChange);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
