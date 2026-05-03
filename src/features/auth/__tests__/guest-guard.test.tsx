import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { GuestGuard } from "../components/guest-guard";
import { AuthContext } from "../contexts/auth-context-def";
import type { AuthContextValue } from "../contexts/auth-context-def";

const mockUser = { id: "1", name: "Test User", email: "test@example.com" };

function renderWithAuth(contextValue: AuthContextValue) {
  return render(
    <AuthContext.Provider value={contextValue}>
      <MemoryRouter>
        <GuestGuard>
          <div data-testid="guest-content">Login Form</div>
        </GuestGuard>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("GuestGuard", () => {
  it("should show loading spinner when isLoading is true", () => {
    renderWithAuth({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    expect(screen.queryByTestId("guest-content")).not.toBeInTheDocument();
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should render children when not authenticated", () => {
    renderWithAuth({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    expect(screen.getByTestId("guest-content")).toBeInTheDocument();
  });

  it("should redirect to /dashboard when authenticated", () => {
    renderWithAuth({
      user: mockUser,
      accessToken: "test-token",
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    expect(screen.queryByTestId("guest-content")).not.toBeInTheDocument();
  });
});
