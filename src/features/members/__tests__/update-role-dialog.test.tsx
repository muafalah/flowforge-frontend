import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UpdateRoleDialog } from "../components/update-role-dialog";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock organization store
const mockGetSelectedOrganizationId = vi.fn();
vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: () => mockGetSelectedOrganizationId(),
}));

// Mock the API hooks
const mockUpdateRoleMutateAsync = vi.fn();
vi.mock("@/api/generated/organization-members/organization-members", () => ({
  useMembershipControllerUpdateRole: () => ({
    mutateAsync: mockUpdateRoleMutateAsync,
  }),
}));

function renderUpdateRoleDialog(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    memberId: "member-123",
    memberName: "John Doe",
    currentRole: "MEMBER" as const,
    onSuccess: vi.fn(),
    ...props,
  };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <UpdateRoleDialog {...defaultProps} />
      </QueryClientProvider>,
    ),
    props: defaultProps,
  };
}

describe("UpdateRoleDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSelectedOrganizationId.mockReturnValue("org-1");
  });

  it("should render the dialog with member info when open", () => {
    renderUpdateRoleDialog();
    expect(screen.getByRole("heading", { name: "Update Member Role" })).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should disable save button if role is unchanged", () => {
    renderUpdateRoleDialog({ currentRole: "MEMBER" });
    const saveBtn = screen.getByRole("button", { name: "Save Changes" });
    expect(saveBtn).toBeDisabled();
  });

  it("should enable save button when role is changed", async () => {
    const user = userEvent.setup();
    renderUpdateRoleDialog({ currentRole: "MEMBER" });

    const saveBtn = screen.getByRole("button", { name: "Save Changes" });
    expect(saveBtn).toBeDisabled();

    // Click on Admin role
    await user.click(screen.getByText("Admin"));
    expect(saveBtn).toBeEnabled();
  });

  it("should call onOpenChange with false when cancel is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderUpdateRoleDialog();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(mockUpdateRoleMutateAsync).not.toHaveBeenCalled();
  });

  it("should submit successfully and call onSuccess when role is changed", async () => {
    const user = userEvent.setup();
    mockUpdateRoleMutateAsync.mockResolvedValueOnce({ data: {} });
    
    const { toast } = await import("sonner");
    const { props } = renderUpdateRoleDialog({ currentRole: "MEMBER" });

    // Change role to Admin
    await user.click(screen.getByText("Admin"));
    
    const saveBtn = screen.getByRole("button", { name: "Save Changes" });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateRoleMutateAsync).toHaveBeenCalledWith({
        id: "org-1",
        memberId: "member-123",
        data: { role: "ADMIN" },
      });
      expect(toast.success).toHaveBeenCalledWith("Role for John Doe updated to ADMIN");
      expect(props.onOpenChange).toHaveBeenCalledWith(false);
      expect(props.onSuccess).toHaveBeenCalled();
    });
  });

  it("should show error toast if update fails", async () => {
    const user = userEvent.setup();
    mockUpdateRoleMutateAsync.mockResolvedValueOnce(null); // Simulate falsy response
    
    const { toast } = await import("sonner");
    const { props } = renderUpdateRoleDialog({ currentRole: "ADMIN" });

    // Change role to Member
    await user.click(screen.getByText("Member"));
    
    const saveBtn = screen.getByRole("button", { name: "Save Changes" });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update member role");
      expect(props.onSuccess).not.toHaveBeenCalled();
    });
  });

  it("should catch unexpected errors and show toast", async () => {
    const user = userEvent.setup();
    mockUpdateRoleMutateAsync.mockRejectedValueOnce(new Error("Network Error"));
    
    const { toast } = await import("sonner");
    const { props } = renderUpdateRoleDialog({ currentRole: "MEMBER" });

    // Change role to Admin
    await user.click(screen.getByText("Admin"));
    
    const saveBtn = screen.getByRole("button", { name: "Save Changes" });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("An unexpected error occurred while updating the role");
      expect(props.onSuccess).not.toHaveBeenCalled();
    });
  });
});
