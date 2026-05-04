import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InviteMemberDialog } from "../components/invite-member-dialog";

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
const mockAddMemberMutateAsync = vi.fn();
vi.mock("@/api/generated/organization-members/organization-members", () => ({
  useMembershipControllerAddMember: () => ({
    mutateAsync: mockAddMemberMutateAsync,
  }),
}));

function renderInviteMemberDialog(props = { open: true, onOpenChange: vi.fn() }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <InviteMemberDialog {...props} />
    </QueryClientProvider>,
  );
}

describe("InviteMemberDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSelectedOrganizationId.mockReturnValue("org-1");
  });

  it("should render the dialog when open is true", () => {
    renderInviteMemberDialog();
    expect(screen.getByText("Invite Member")).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  });

  it("should validate empty email", async () => {
    const user = userEvent.setup();
    renderInviteMemberDialog();

    const submitBtn = screen.getByRole("button", { name: "Invite" });
    await user.click(submitBtn);

    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(mockAddMemberMutateAsync).not.toHaveBeenCalled();
  });

  it("should validate invalid email format", async () => {
    const user = userEvent.setup();
    renderInviteMemberDialog();

    const input = screen.getByLabelText("Email address");
    await user.type(input, "not-an-email");
    
    const submitBtn = screen.getByRole("button", { name: "Invite" });
    const form = screen.getByLabelText("Email address").closest("form");
    if (form) {
        form.noValidate = true;
    }
    await user.click(submitBtn);

    expect(await screen.findByText("Please enter a valid email address.")).toBeInTheDocument();
    expect(mockAddMemberMutateAsync).not.toHaveBeenCalled();
  });

  it("should submit successfully with a valid email", async () => {
    const user = userEvent.setup();
    const onOpenChangeMock = vi.fn();
    mockAddMemberMutateAsync.mockResolvedValueOnce({ data: {} });
    
    const { toast } = await import("sonner");

    renderInviteMemberDialog({ open: true, onOpenChange: onOpenChangeMock });

    const input = screen.getByLabelText("Email address");
    await user.type(input, "jane@example.com");

    const submitBtn = screen.getByRole("button", { name: "Invite" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockAddMemberMutateAsync).toHaveBeenCalledWith({
        id: "org-1",
        data: { email: "jane@example.com" },
      });
      expect(toast.success).toHaveBeenCalledWith("Member invited successfully!");
      expect(onOpenChangeMock).toHaveBeenCalledWith(false);
    });
  });

  it("should show error toast on submission failure", async () => {
    const user = userEvent.setup();
    mockAddMemberMutateAsync.mockRejectedValueOnce({
      response: { data: { error: { message: "User not found" } } },
    });
    
    const { toast } = await import("sonner");

    renderInviteMemberDialog();

    const input = screen.getByLabelText("Email address");
    await user.type(input, "ghost@example.com");

    const submitBtn = screen.getByRole("button", { name: "Invite" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("User not found");
    });
  });

  it("should show error if no organization is selected", async () => {
    mockGetSelectedOrganizationId.mockReturnValue(null);
    const user = userEvent.setup();
    const { toast } = await import("sonner");

    renderInviteMemberDialog();

    const input = screen.getByLabelText("Email address");
    await user.type(input, "jane@example.com");

    const submitBtn = screen.getByRole("button", { name: "Invite" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("No organization selected.");
      expect(mockAddMemberMutateAsync).not.toHaveBeenCalled();
    });
  });
});
