import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TransferOwnershipDialog } from "../components/transfer-ownership-dialog";
import { MemoryRouter } from "react-router-dom";

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

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the API hooks
const mockTransferMutateAsync = vi.fn();
vi.mock("@/api/generated/organizations/organizations", () => ({
  useTransferOwnershipControllerTransferOwnership: () => ({
    mutateAsync: mockTransferMutateAsync,
  }),
}));

function renderTransferOwnershipDialog(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    memberId: "member-123",
    memberName: "John Doe",
    onSuccess: vi.fn(),
    ...props,
  };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TransferOwnershipDialog {...defaultProps} />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
    props: defaultProps,
  };
}

describe("TransferOwnershipDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSelectedOrganizationId.mockReturnValue("org-1");
  });

  it("should render the dialog with member info when open", () => {
    renderTransferOwnershipDialog();
    expect(screen.getByRole("heading", { name: "Transfer Ownership" })).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText(/Grant full control to the new owner/)).toBeInTheDocument();
  });

  it("should call onOpenChange with false when cancel is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderTransferOwnershipDialog();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(mockTransferMutateAsync).not.toHaveBeenCalled();
  });

  it("should submit successfully, call onSuccess, and navigate(0)", async () => {
    const user = userEvent.setup();
    mockTransferMutateAsync.mockResolvedValueOnce({ data: {} });
    
    const { toast } = await import("sonner");
    const { props } = renderTransferOwnershipDialog();

    const submitBtn = screen.getByRole("button", { name: "Confirm Transfer" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockTransferMutateAsync).toHaveBeenCalledWith({
        id: "org-1",
        data: { memberId: "member-123" },
      });
      expect(toast.success).toHaveBeenCalledWith("Ownership transferred to John Doe successfully");
      expect(props.onOpenChange).toHaveBeenCalledWith(false);
      expect(props.onSuccess).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(0);
    });
  });

  it("should show error toast if response is falsy", async () => {
    const user = userEvent.setup();
    mockTransferMutateAsync.mockResolvedValueOnce(null);
    
    const { toast } = await import("sonner");
    const { props } = renderTransferOwnershipDialog();

    const submitBtn = screen.getByRole("button", { name: "Confirm Transfer" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to transfer ownership");
      expect(props.onSuccess).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it("should catch unexpected errors and show toast", async () => {
    const user = userEvent.setup();
    mockTransferMutateAsync.mockRejectedValueOnce(new Error("Network Error"));
    
    const { toast } = await import("sonner");
    const { props } = renderTransferOwnershipDialog();

    const submitBtn = screen.getByRole("button", { name: "Confirm Transfer" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("An unexpected error occurred during ownership transfer");
      expect(props.onSuccess).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
