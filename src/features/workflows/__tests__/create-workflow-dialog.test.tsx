import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateWorkflowDialog } from "../components/create-workflow-dialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockMutate = vi.fn();

vi.mock("../hooks/use-workflow-mutations", () => ({
  useCreateWorkflow: () => ({
    mutate: mockMutate,
    isPending: false,
    organizationId: "org-1",
  }),
}));

vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: () => "org-1",
}));

function renderDialog(open = true, onOpenChange = vi.fn()) {
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CreateWorkflowDialog open={open} onOpenChange={onOpenChange} />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
    onOpenChange,
  };
}

describe("CreateWorkflowDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render dialog when open", () => {
    renderDialog(true);
    expect(
      screen.getByRole("heading", { name: "Create Workflow" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Create a new workflow for your organization/),
    ).toBeInTheDocument();
  });

  it("should not render dialog when closed", () => {
    renderDialog(false);
    expect(screen.queryByText("Create Workflow")).not.toBeInTheDocument();
  });

  it("should render form fields", () => {
    renderDialog();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., Data Sync Pipeline")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Describe what this workflow does..."),
    ).toBeInTheDocument();
    expect(screen.getByText("Access")).toBeInTheDocument();
  });

  it("should render Cancel and Create buttons", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Workflow" }),
    ).toBeInTheDocument();
  });

  it("should show validation error for short name", async () => {
    const user = userEvent.setup();
    renderDialog();

    const nameInput = screen.getByPlaceholderText("e.g., Data Sync Pipeline");
    await user.type(nameInput, "AB");
    await user.click(screen.getByRole("button", { name: "Create Workflow" }));

    expect(
      await screen.findByText(/at least 3 characters/),
    ).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("should call mutate with correct data on valid submit", async () => {
    const user = userEvent.setup();
    renderDialog();

    const nameInput = screen.getByPlaceholderText("e.g., Data Sync Pipeline");
    await user.type(nameInput, "My New Workflow");

    const descInput = screen.getByPlaceholderText(
      "Describe what this workflow does...",
    );
    await user.type(descInput, "A test workflow");

    await user.click(screen.getByRole("button", { name: "Create Workflow" }));

    expect(mockMutate).toHaveBeenCalledWith(
      {
        organizationId: "org-1",
        data: {
          name: "My New Workflow",
          description: "A test workflow",
          access: "EDITOR",
        },
      },
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
