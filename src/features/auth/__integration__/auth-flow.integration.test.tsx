import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "../pages/login-page";
import { AuthContext } from "../contexts/auth-context-def";
import type { AuthContextValue } from "../contexts/auth-context-def";
import { toast } from "sonner";

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

/**
 * INTEGRATION test for the Auth Login Flow.
 *
 * Unlike unit tests which mock the login function and test each component
 * in isolation, this integration test verifies the full flow:
 *   LoginPage → form validation → AuthContext.login → toast → navigation
 *
 * The only mocks are:
 *   - AuthContext.login (API boundary — vi.mock of Orval hooks)
 *   - useNavigate (router boundary)
 *   - toast (notification boundary)
 *
 * Everything else is real: form validation, state management, component rendering.
 */
describe("Auth Login Flow (integration)", () => {
  let queryClient: QueryClient;
  let mockLogin: ReturnType<typeof vi.fn>;
  let mockLogout: ReturnType<typeof vi.fn>;

  function renderLoginFlow(overrides: Partial<AuthContextValue> = {}) {
    const authValue: AuthContextValue = {
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: mockLogout,
      updateUser: vi.fn(),
      ...overrides,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter initialEntries={["/login"]}>
            <LoginPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockLogin = vi.fn().mockResolvedValue(undefined);
    mockLogout = vi.fn().mockResolvedValue(undefined);
  });

  it("should complete the full login flow: fill form → submit → login → toast → navigate", async () => {
    const user = userEvent.setup();
    renderLoginFlow();

    // 1. Fill in the form
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    // 2. Submit
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // 3. Verify login was called with correct credentials
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    });

    // 4. Verify success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Login successful!");
    });

    // 5. Verify navigation to dashboard
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });

  it("should show error toast when login fails", async () => {
    const user = userEvent.setup();

    // Simulate API error
    const axiosError = {
      response: {
        data: {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        },
      },
    };
    mockLogin.mockRejectedValue(axiosError);

    renderLoginFlow();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // Should show error toast with API message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid email or password.");
    });

    // Should NOT navigate
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should prevent submission and show validation errors for empty fields", async () => {
    const user = userEvent.setup();
    renderLoginFlow();

    // Submit without filling anything
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();

    // Login should NOT be called
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("should prevent submission with invalid email format", async () => {
    const user = userEvent.setup();
    renderLoginFlow();

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // Should NOT call login with invalid email
    await waitFor(() => {
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  it("should disable submit button while submitting", async () => {
    const user = userEvent.setup();

    // Make login hang to test loading state
    let resolveLogin!: () => void;
    mockLogin.mockImplementation(
      () => new Promise<void>((resolve) => { resolveLogin = resolve; })
    );

    renderLoginFlow();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    // Button should show loading text
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /signing in/i })
      ).toBeDisabled();
    });

    // Resolve the login
    resolveLogin();

    // Button should return to normal
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).not.toBeDisabled();
    });
  });

  it("should have a working link to the register page", () => {
    renderLoginFlow();

    const registerLink = screen.getByRole("link", { name: /sign up/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/register");
  });
});
