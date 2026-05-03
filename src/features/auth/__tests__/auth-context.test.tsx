import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import * as tokenStore from "@/api/token-store";

// Create a mock for the plain Axios instance used in restoreSession
const mockAxiosPost = vi.fn();
vi.mock("axios", () => ({
  default: {
    create: () => ({
      post: mockAxiosPost,
    }),
  },
}));

// Mock the Orval generated API methods
vi.mock("@/api/generated/authentication/authentication", () => ({
  authControllerGetProfile: vi.fn(),
  authControllerLogin: vi.fn(),
  authControllerLogout: vi.fn(),
}));

// Mock custom-instance to avoid interceptor side effects in tests
vi.mock("@/api/custom-instance", () => ({
  AXIOS_INSTANCE: {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  customInstance: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedApi = (await import("@/api/generated/authentication/authentication")) as any;

// Import AuthProvider and AuthContext AFTER mocks are set up
const { AuthProvider } = await import("../contexts/auth-context");
const { AuthContext } = await import("../contexts/auth-context-def");

// Helper component to display auth state
function AuthStateDisplay() {
  const auth = useContext(AuthContext);
  if (!auth) return <div>No context</div>;

  return (
    <div>
      <span data-testid="is-loading">{String(auth.isLoading)}</span>
      <span data-testid="is-authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="user-name">{auth.user?.name ?? "none"}</span>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clearTokens();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should set isLoading=false and isAuthenticated=false when no refresh token exists", async () => {
    render(
      <AuthProvider>
        <AuthStateDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
    expect(screen.getByTestId("user-name").textContent).toBe("none");
  });

  it("should restore session when refresh token exists in localStorage", async () => {
    localStorage.setItem("refresh_token", "valid-refresh-token");

    // Mock plainAxios.post for direct refresh call (Axios response shape)
    mockAxiosPost.mockResolvedValueOnce({
      data: {
        data: {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
        },
      },
    });

    mockedApi.authControllerGetProfile.mockResolvedValueOnce({
      data: {
        user: { id: "1", name: "John Doe", email: "john@example.com" },
      },
    });

    render(
      <AuthProvider>
        <AuthStateDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
    expect(screen.getByTestId("user-name").textContent).toBe("John Doe");
  });

  it("should clear tokens and set unauthenticated when refresh fails", async () => {
    localStorage.setItem("refresh_token", "expired-refresh-token");

    // Mock plainAxios.post to reject (simulating backend 401)
    mockAxiosPost.mockRejectedValueOnce(new Error("Unauthorized"));

    render(
      <AuthProvider>
        <AuthStateDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
    expect(localStorage.getItem("refresh_token")).toBeNull();
  });
});
