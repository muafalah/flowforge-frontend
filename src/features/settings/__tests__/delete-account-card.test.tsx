import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DeleteAccountCard } from "../components/delete-account-card";
import { AuthContext } from "@/features/auth/contexts/auth-context-def";
import type { AuthContextValue } from "@/features/auth/contexts/auth-context-def";

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the API hook
const mockMutateAsync = vi.fn();
vi.mock("@/api/generated/users/users", () => ({
  useUserControllerRemove: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

function renderDeleteAccountCard(authOverrides: Partial<AuthContextValue> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const authValue: AuthContextValue = {
    user: {
      id: "test-id",
      name: "John Doe",
      email: "john@example.com",
    },
    accessToken: "test-token",
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    ...authOverrides,
  };

  return {
    authValue,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter>
            <DeleteAccountCard />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    ),
  };
}

describe("DeleteAccountCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the delete account card", () => {
    renderDeleteAccountCard();

    expect(screen.getByText(/danger zone/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete account/i })).toBeInTheDocument();
  });

  it("should open the alert dialog when delete button is clicked", async () => {
    const user = userEvent.setup();
    renderDeleteAccountCard();

    const deleteButton = screen.getByRole("button", { name: /delete account/i });
    await user.click(deleteButton);

    expect(screen.getByText(/are you absolutely sure\?/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("should call delete API, logout, and navigate on confirm", async () => {
    const user = userEvent.setup();
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    mockMutateAsync.mockResolvedValueOnce({}); // Mock successful API response

    renderDeleteAccountCard({ logout: mockLogout });

    // Open dialog
    await user.click(screen.getByRole("button", { name: /delete account/i }));

    // Click confirm
    const confirmButton = screen.getByRole("button", { name: /continue/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ id: "test-id" });
    });

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("should handle API failure gracefully", async () => {
    const user = userEvent.setup();
    const mockLogout = vi.fn();
    mockMutateAsync.mockRejectedValueOnce({
      response: { data: { error: { message: "Failed to delete" } } },
    }); // Mock failed API response

    renderDeleteAccountCard({ logout: mockLogout });

    // Open dialog
    await user.click(screen.getByRole("button", { name: /delete account/i }));

    // Click confirm
    const confirmButton = screen.getByRole("button", { name: /continue/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    // Should not logout or navigate on error
    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
