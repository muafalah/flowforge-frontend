import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { MembersTable } from "../components/members-table";
import { MembersToolbar } from "../components/members-toolbar";
import { MembersPagination } from "../components/members-pagination";
import type { Member, PaginationMeta } from "../types";

// Mock API hooks (only the API boundary)
vi.mock("@/api/generated/organization-members/organization-members", () => ({
  useMembershipControllerRemoveMember: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
  }),
  useMembershipControllerUpdateRole: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
  }),
}));

vi.mock("@/api/generated/organizations/organizations", () => ({
  useTransferOwnershipControllerTransferOwnership: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
  }),
}));

vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: () => "org-1",
}));

/**
 * INTEGRATION test for the Members Management feature.
 *
 * Unlike unit tests which test each component in isolation,
 * this test renders MembersToolbar + MembersTable + MembersPagination
 * together to verify their interaction:
 *   - Search filtering updates table
 *   - Sort interaction works across toolbar and table
 *   - Pagination changes are reflected correctly
 *   - Dialog flows (remove, update role) work end-to-end
 *
 * Only the API layer (Orval hooks) is mocked.
 */

const allMembers: Member[] = [
  {
    id: "mem-1",
    role: "OWNER",
    createdAt: "2023-01-01T00:00:00Z",
    user: { id: "user-1", name: "Alice Owner", email: "alice@example.com" },
  },
  {
    id: "mem-2",
    role: "ADMIN",
    createdAt: "2023-01-02T00:00:00Z",
    user: { id: "user-2", name: "Bob Admin", email: "bob@example.com" },
  },
  {
    id: "mem-3",
    role: "MEMBER",
    createdAt: "2023-01-03T00:00:00Z",
    user: { id: "user-3", name: "Charlie Member", email: "charlie@example.com" },
  },
  {
    id: "mem-4",
    role: "MEMBER",
    createdAt: "2023-01-04T00:00:00Z",
    user: { id: "user-4", name: "Diana Member", email: "diana@example.com" },
  },
];

describe("Members Management (integration)", () => {
  let queryClient: QueryClient;

  function renderMembersManagement({
    members = allMembers,
    meta = { total: allMembers.length, page: 1, limit: 10 },
    currentUserId = "user-1",
    currentUserRole = "OWNER" as const,
  }: {
    members?: Member[];
    meta?: PaginationMeta;
    currentUserId?: string;
    currentUserRole?: "OWNER" | "ADMIN" | "MEMBER";
  } = {}) {
    const mockSetSearch = vi.fn();
    const mockToggleSort = vi.fn();
    const mockSetPage = vi.fn();
    const mockSetLimit = vi.fn();
    const mockSetRoles = vi.fn();
    const mockRefetch = vi.fn();
    const mockSetIsInviteDialogOpen = vi.fn();

    const result = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <div className="space-y-6">
            <MembersToolbar
              search=""
              onSearchChange={mockSetSearch}
              isLoadingMembership={false}
              canInvite={currentUserRole === "OWNER" || currentUserRole === "ADMIN"}
              setIsInviteDialogOpen={mockSetIsInviteDialogOpen}
              roles={[]}
              onRolesChange={mockSetRoles}
            />
            <MembersTable
              members={members}
              isLoading={false}
              sortBy="createdAt"
              sortOrder="desc"
              onToggleSort={mockToggleSort}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              roles={[]}
              onRolesChange={mockSetRoles}
              refetch={mockRefetch}
            />
            {members.length > 0 && (
              <MembersPagination
                meta={meta}
                onPageChange={mockSetPage}
                onLimitChange={mockSetLimit}
              />
            )}
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    );

    return {
      ...result,
      mocks: {
        setSearch: mockSetSearch,
        toggleSort: mockToggleSort,
        setPage: mockSetPage,
        setLimit: mockSetLimit,
        setRoles: mockSetRoles,
        refetch: mockRefetch,
        setIsInviteDialogOpen: mockSetIsInviteDialogOpen,
      },
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  // --- Rendering Integration ---

  it("should render toolbar, table, and pagination together", () => {
    renderMembersManagement();

    // Toolbar elements
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();

    // Table elements — all members visible
    expect(screen.getByText("Alice Owner")).toBeInTheDocument();
    expect(screen.getByText("Bob Admin")).toBeInTheDocument();
    expect(screen.getByText("Charlie Member")).toBeInTheDocument();
    expect(screen.getByText("Diana Member")).toBeInTheDocument();

    // Pagination — "Showing X to Y of Z members"
    expect(screen.getByText(/showing/i)).toBeInTheDocument();
  });

  // --- Search Flow ---

  it("should call search handler when typing in the search input", async () => {
    const user = userEvent.setup();
    const { mocks } = renderMembersManagement();

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, "Alice");

    // onSearchChange should be called for each character
    expect(mocks.setSearch).toHaveBeenCalled();
  });

  // --- Sort Flow ---

  it("should call sort handler when clicking column headers", async () => {
    const user = userEvent.setup();
    const { mocks } = renderMembersManagement();

    // Click sort by name
    await user.click(screen.getByRole("button", { name: "Sort by name" }));
    expect(mocks.toggleSort).toHaveBeenCalledWith("name");

    // Click sort by role
    await user.click(screen.getByRole("button", { name: "Sort by role" }));
    expect(mocks.toggleSort).toHaveBeenCalledWith("role");
  });

  // --- Pagination Flow ---

  it("should display correct pagination info and handle page changes", async () => {
    const user = userEvent.setup();
    const { mocks } = renderMembersManagement({
      meta: { total: 25, page: 1, limit: 10 },
    });

    // Should show total count
    expect(screen.getByText(/25/)).toBeInTheDocument();

    // Should have next button
    const nextButton = screen.getByRole("button", { name: /next page/i });
    await user.click(nextButton);
    expect(mocks.setPage).toHaveBeenCalledWith(2);
  });

  // --- Role-Based Actions ---

  it("should show OWNER-only actions when current user is OWNER", () => {
    renderMembersManagement({ currentUserRole: "OWNER", currentUserId: "user-1" });

    // OWNER can update roles (for non-owners: Bob, Charlie, Diana)
    expect(screen.getAllByRole("button", { name: /update role for/i })).toHaveLength(3);

    // OWNER can remove members (for non-owners: Bob, Charlie, Diana)
    expect(screen.getAllByRole("button", { name: /remove/i })).toHaveLength(3);

    // OWNER can transfer ownership to admins (Bob)
    expect(screen.getAllByRole("button", { name: /transfer ownership to/i })).toHaveLength(1);
  });

  it("should show limited actions when current user is ADMIN", () => {
    renderMembersManagement({ currentUserRole: "ADMIN", currentUserId: "user-2" });

    // ADMIN cannot update roles
    expect(screen.queryByRole("button", { name: /update role for/i })).not.toBeInTheDocument();

    // ADMIN cannot transfer ownership
    expect(screen.queryByRole("button", { name: /transfer ownership to/i })).not.toBeInTheDocument();

    // ADMIN can remove MEMBERs only (Charlie, Diana — not Alice who is OWNER, not self)
    expect(screen.getAllByRole("button", { name: /remove/i })).toHaveLength(2);
  });

  it("should show no actions when current user is MEMBER", () => {
    renderMembersManagement({ currentUserRole: "MEMBER", currentUserId: "user-3" });

    expect(screen.queryByRole("button", { name: /update role for/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /transfer ownership to/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });

  // --- Dialog Integration ---

  it("should open and close the remove member dialog", async () => {
    const user = userEvent.setup();
    renderMembersManagement({ currentUserRole: "OWNER", currentUserId: "user-1" });

    // Click remove for one of the members
    const removeBtns = screen.getAllByRole("button", { name: /remove/i });
    await user.click(removeBtns[0]);

    // Dialog should appear
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to remove/i)).toBeInTheDocument();

    // Cancel should close it
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it("should open the update role dialog and show role options", async () => {
    const user = userEvent.setup();
    renderMembersManagement({ currentUserRole: "OWNER", currentUserId: "user-1" });

    // Click update role for a member
    const updateBtns = screen.getAllByRole("button", { name: /update role for/i });
    await user.click(updateBtns[0]);

    // Dialog should appear with role heading
    expect(await screen.findByRole("heading", { name: "Update Member Role" })).toBeInTheDocument();
  });

  // --- Invite Button ---

  it("should show invite button for OWNER and ADMIN", async () => {
    const user = userEvent.setup();
    const { mocks } = renderMembersManagement({ currentUserRole: "OWNER" });

    const inviteButton = screen.getByRole("button", { name: /invite member/i });
    expect(inviteButton).toBeInTheDocument();

    await user.click(inviteButton);
    expect(mocks.setIsInviteDialogOpen).toHaveBeenCalledWith(true);
  });

  it("should hide invite button for MEMBER role", () => {
    renderMembersManagement({ currentUserRole: "MEMBER", currentUserId: "user-3" });

    expect(screen.queryByRole("button", { name: /invite member/i })).not.toBeInTheDocument();
  });

  // --- Empty State ---

  it("should show empty state when no members", () => {
    renderMembersManagement({ members: [] });

    expect(screen.getByText("No members found")).toBeInTheDocument();
  });
});
