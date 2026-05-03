import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "../contexts/auth-context";
import { AuthContext } from "../contexts/auth-context-def";
import { useContext } from "react";
import * as tokenStore from "@/api/token-store";

// Mock the Orval generated API methods
vi.mock("@/api/generated/authentication/authentication", () => ({
  authControllerRefresh: vi.fn(),
  authControllerGetProfile: vi.fn(),
  authControllerLogin: vi.fn(),
  authControllerLogout: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedApi = (await import("@/api/generated/authentication/authentication")) as any;

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

    mockedApi.authControllerRefresh.mockResolvedValueOnce({
      data: {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
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

    mockedApi.authControllerRefresh.mockRejectedValueOnce(new Error("Unauthorized"));

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
