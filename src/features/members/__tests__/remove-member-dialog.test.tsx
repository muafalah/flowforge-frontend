import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RemoveMemberDialog } from "../components/remove-member-dialog";

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
const mockRemoveMemberMutateAsync = vi.fn();
vi.mock("@/api/generated/organization-members/organization-members", () => ({
  useMembershipControllerRemoveMember: () => ({
    mutateAsync: mockRemoveMemberMutateAsync,
  }),
}));

function renderRemoveMemberDialog(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    memberId: "member-123",
    memberName: "John Doe",
    memberEmail: "john@example.com",
    onSuccess: vi.fn(),
    ...props,
  };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <RemoveMemberDialog {...defaultProps} />
      </QueryClientProvider>,
    ),
    props: defaultProps,
  };
}

describe("RemoveMemberDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSelectedOrganizationId.mockReturnValue("org-1");
  });

  it("should render the dialog with member info when open", () => {
    renderRemoveMemberDialog();
    expect(screen.getByRole("heading", { name: "Remove Member" })).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText(/john@example\.com/)).toBeInTheDocument();
  });

  it("should call onOpenChange with false when cancel is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderRemoveMemberDialog();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(mockRemoveMemberMutateAsync).not.toHaveBeenCalled();
  });

  it("should submit successfully and call onSuccess", async () => {
    const user = userEvent.setup();
    mockRemoveMemberMutateAsync.mockResolvedValueOnce({ status: 200, data: {} });
    
    const { toast } = await import("sonner");
    const { props } = renderRemoveMemberDialog();

    const submitBtn = screen.getByRole("button", { name: "Remove Member" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockRemoveMemberMutateAsync).toHaveBeenCalledWith({
        id: "org-1",
        memberId: "member-123",
      });
      expect(toast.success).toHaveBeenCalledWith("Member John Doe removed successfully");
      expect(props.onOpenChange).toHaveBeenCalledWith(false);
      expect(props.onSuccess).toHaveBeenCalled();
    });
  });

  it("should show error toast if response status is not 200", async () => {
    const user = userEvent.setup();
    mockRemoveMemberMutateAsync.mockResolvedValueOnce({ status: 400, data: {} });
    
    const { toast } = await import("sonner");
    const { props } = renderRemoveMemberDialog();

    const submitBtn = screen.getByRole("button", { name: "Remove Member" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to remove member");
      expect(props.onSuccess).not.toHaveBeenCalled();
    });
  });

  it("should catch unexpected errors and show toast", async () => {
    const user = userEvent.setup();
    mockRemoveMemberMutateAsync.mockRejectedValueOnce(new Error("Network Error"));
    
    const { toast } = await import("sonner");
    const { props } = renderRemoveMemberDialog();

    const submitBtn = screen.getByRole("button", { name: "Remove Member" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("An unexpected error occurred while removing the member");
      expect(props.onSuccess).not.toHaveBeenCalled();
    });
  });
});
