import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MembersTable } from "../components/members-table";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// Mock hooks
vi.mock("@/api/generated/organization-members/organization-members", () => ({
  useMembershipControllerRemoveMember: () => ({ mutateAsync: vi.fn() }),
  useMembershipControllerUpdateRole: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/api/generated/organizations/organizations", () => ({
  useTransferOwnershipControllerTransferOwnership: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: () => "org-1",
}));

const mockMembers = [
  {
    id: "mem-1",
    organizationId: "org-1",
    userId: "user-1",
    role: "OWNER" as const,
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
    user: { id: "user-1", name: "Alice Owner", email: "alice@example.com" },
  },
  {
    id: "mem-2",
    organizationId: "org-1",
    userId: "user-2",
    role: "ADMIN" as const,
    createdAt: "2023-01-02T00:00:00Z",
    updatedAt: "2023-01-02T00:00:00Z",
    user: { id: "user-2", name: "Bob Admin", email: "bob@example.com" },
  },
  {
    id: "mem-3",
    organizationId: "org-1",
    userId: "user-3",
    role: "MEMBER" as const,
    createdAt: "2023-01-03T00:00:00Z",
    updatedAt: "2023-01-03T00:00:00Z",
    user: { id: "user-3", name: "Charlie Member", email: "charlie@example.com" },
  },
];

function renderTable(props = {}) {
  const defaultProps = {
    members: mockMembers,
    isLoading: false,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
    onToggleSort: vi.fn(),
    currentUserId: "user-1",
    currentUserRole: "OWNER" as const,
    roles: [],
    onRolesChange: vi.fn(),
    refetch: vi.fn(),
    ...props,
  };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MembersTable {...defaultProps} />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
    props: defaultProps,
  };
}

describe("MembersTable", () => {
  it("should render members list", () => {
    renderTable();
    expect(screen.getByText("Alice Owner")).toBeInTheDocument();
    expect(screen.getByText("Bob Admin")).toBeInTheDocument();
    expect(screen.getByText("Charlie Member")).toBeInTheDocument();
    expect(screen.getByText("(You)")).toBeInTheDocument();
  });

  it("should render empty state when no members", () => {
    renderTable({ members: [] });
    expect(screen.getByText("No members found")).toBeInTheDocument();
  });

  it("should render loading state", () => {
    // Cannot easily test Skeleton presence without roles or testids, but we can verify text is absent
    renderTable({ members: mockMembers, isLoading: true });
    expect(screen.queryByText("Alice Owner")).not.toBeInTheDocument();
  });

  it("should show correct actions for OWNER", () => {
    renderTable({ currentUserRole: "OWNER", currentUserId: "user-1" });
    
    // Alice (Owner) should not have actions on herself
    // Bob (Admin) should have Update Role, Transfer Ownership, Remove
    // Charlie (Member) should have Update Role, Remove

    // How many Update Role buttons? Bob and Charlie
    expect(screen.getAllByRole("button", { name: /update role for/i })).toHaveLength(2);
    // How many Remove buttons? Bob and Charlie
    expect(screen.getAllByRole("button", { name: /remove/i })).toHaveLength(2);
    // How many Transfer buttons? Only Bob (Admin)
    expect(screen.getAllByRole("button", { name: /transfer ownership to/i })).toHaveLength(1);
  });

  it("should show correct actions for ADMIN", () => {
    renderTable({ currentUserRole: "ADMIN", currentUserId: "user-2" });
    
    // Bob (Admin) should not have actions on himself
    // Alice (Owner) should have NO actions
    // Charlie (Member) should have Remove only

    expect(screen.queryByRole("button", { name: /update role for/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /transfer ownership to/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /remove/i })).toHaveLength(1); // Charlie
  });

  it("should show correct actions for MEMBER", () => {
    renderTable({ currentUserRole: "MEMBER", currentUserId: "user-3" });
    
    expect(screen.queryByRole("button", { name: /update role for/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /transfer ownership to/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });

  it("should call onToggleSort when clicking column headers", async () => {
    const user = userEvent.setup();
    const { props } = renderTable();
    
    await user.click(screen.getByRole("button", { name: "Sort by name" }));
    expect(props.onToggleSort).toHaveBeenCalledWith("name");

    await user.click(screen.getByRole("button", { name: "Sort by role" }));
    expect(props.onToggleSort).toHaveBeenCalledWith("role");
  });

  it("should open dialogs when clicking action buttons", async () => {
    const user = userEvent.setup();
    renderTable({ currentUserRole: "OWNER", currentUserId: "user-1" });
    
    // Remove Charlie
    const removeBtns = screen.getAllByRole("button", { name: /remove/i });
    await user.click(removeBtns[1]); // Charlie is the second remove button
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to remove/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" })); // Close dialog

    // Update Role for Charlie
    const updateBtns = screen.getAllByRole("button", { name: /update role for/i });
    await user.click(updateBtns[1]); 
    expect(await screen.findByRole("heading", { name: "Update Member Role" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" })); // Close dialog

    // Transfer Ownership to Bob
    const transferBtns = screen.getAllByRole("button", { name: /transfer ownership to/i });
    await user.click(transferBtns[0]); 
    expect(await screen.findByRole("heading", { name: "Transfer Ownership" })).toBeInTheDocument();
  });
});
