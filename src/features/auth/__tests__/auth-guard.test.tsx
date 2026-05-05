import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthGuard } from "../components/auth-guard";
import { AuthContext } from "../contexts/auth-context-def";
import type { AuthContextValue } from "../contexts/auth-context-def";

const mockUser = { id: "1", name: "Test User", email: "test@example.com" };

function renderWithAuth(contextValue: AuthContextValue) {
  return render(
    <AuthContext.Provider value={contextValue}>
      <MemoryRouter>
        <AuthGuard>
          <div data-testid="protected-content">Protected</div>
        </AuthGuard>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("AuthGuard", () => {
  it("should show loading spinner when isLoading is true", () => {
    renderWithAuth({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    // Spinner should be present (the animate-spin div)
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should render children when authenticated", () => {
    renderWithAuth({
      user: mockUser,
      accessToken: "test-token",
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });

  it("should redirect to /login when not authenticated", () => {
    renderWithAuth({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });
});
