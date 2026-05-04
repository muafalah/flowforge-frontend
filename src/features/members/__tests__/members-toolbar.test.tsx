import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MembersToolbar } from "../components/members-toolbar";

describe("MembersToolbar", () => {
  const defaultProps = {
    search: "",
    onSearchChange: vi.fn(),
    isLoadingMembership: false,
    canInvite: true,
    setIsInviteDialogOpen: vi.fn(),
    roles: [],
    onRolesChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render search input and buttons", () => {
    render(<MembersToolbar {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Search by name or email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Invite Member/i })).toBeInTheDocument();
  });

  it("should call onSearchChange when typing in search input", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<MembersToolbar {...defaultProps} onSearchChange={onSearchChange} />);
    
    const searchInput = screen.getByPlaceholderText(/Search by name or email/i);
    await user.type(searchInput, "john");

    expect(onSearchChange).toHaveBeenCalledWith("j");
    expect(onSearchChange).toHaveBeenCalledWith("o");
    expect(onSearchChange).toHaveBeenCalledWith("h");
    expect(onSearchChange).toHaveBeenCalledWith("n");
  });

  it("should show clear button when search is not empty and clear it on click", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<MembersToolbar {...defaultProps} search="john" onSearchChange={onSearchChange} />);
    
    const clearBtn = screen.getByLabelText("Clear search");
    expect(clearBtn).toBeInTheDocument();

    await user.click(clearBtn);
    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("should open filter sheet and toggle roles", async () => {
    const user = userEvent.setup();
    const onRolesChange = vi.fn();
    render(<MembersToolbar {...defaultProps} onRolesChange={onRolesChange} />);
    
    // Open sheet
    await user.click(screen.getByRole("button", { name: "Filters" }));

    // Wait for sheet to open
    expect(await screen.findByRole("heading", { name: "Filters", level: 2 })).toBeInTheDocument();

    const adminCheckbox = screen.getByLabelText("admin", { exact: false });
    await user.click(adminCheckbox);

    expect(onRolesChange).toHaveBeenCalledWith(["ADMIN"]);
  });

  it("should show selected roles count badge", () => {
    render(<MembersToolbar {...defaultProps} roles={["ADMIN", "OWNER"]} />);
    
    const filterBtn = screen.getByRole("button", { name: /Filters.*2/i });
    expect(filterBtn).toBeInTheDocument();
  });

  it("should remove role when unchecked", async () => {
    const user = userEvent.setup();
    const onRolesChange = vi.fn();
    render(<MembersToolbar {...defaultProps} roles={["ADMIN"]} onRolesChange={onRolesChange} />);
    
    await user.click(screen.getByRole("button", { name: /Filters/i }));
    
    const adminCheckbox = await screen.findByLabelText("admin", { exact: false });
    expect(adminCheckbox).toBeChecked();
    
    await user.click(adminCheckbox);
    expect(onRolesChange).toHaveBeenCalledWith([]);
  });

  it("should reset roles when reset button is clicked", async () => {
    const user = userEvent.setup();
    const onRolesChange = vi.fn();
    render(<MembersToolbar {...defaultProps} roles={["ADMIN", "MEMBER"]} onRolesChange={onRolesChange} />);
    
    await user.click(screen.getByRole("button", { name: /Filters/i }));
    
    const resetBtn = await screen.findByRole("button", { name: "Reset" });
    await user.click(resetBtn);
    
    expect(onRolesChange).toHaveBeenCalledWith([]);
  });

  it("should hide invite button when canInvite is false", () => {
    render(<MembersToolbar {...defaultProps} canInvite={false} />);
    expect(screen.queryByRole("button", { name: /Invite Member/i })).not.toBeInTheDocument();
  });

  it("should call setIsInviteDialogOpen when invite button is clicked", async () => {
    const user = userEvent.setup();
    const setIsInviteDialogOpen = vi.fn();
    render(<MembersToolbar {...defaultProps} setIsInviteDialogOpen={setIsInviteDialogOpen} />);
    
    await user.click(screen.getByRole("button", { name: /Invite Member/i }));
    expect(setIsInviteDialogOpen).toHaveBeenCalledWith(true);
  });
});
