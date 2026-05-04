import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrganizationGuard } from "../components/organization-guard";

// Mock the organization store
vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: () => "org-1",
}));

// Mock the Orval-generated hook
const mockUseOrganizationControllerFindAll = vi.fn();
vi.mock("@/api/generated/organizations/organizations", () => ({
  useOrganizationControllerFindAll: (...args: unknown[]) =>
    mockUseOrganizationControllerFindAll(...args),
}));

function renderWithProviders(hookReturn: Record<string, unknown>) {
  mockUseOrganizationControllerFindAll.mockReturnValue(hookReturn);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OrganizationGuard>
          <div data-testid="protected-content">Protected</div>
        </OrganizationGuard>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("OrganizationGuard", () => {
  it("should show loading spinner when fetching organizations", () => {
    renderWithProviders({ data: undefined, isLoading: true });

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should render children when user has organizations", () => {
    renderWithProviders({
      data: {
        data: [{ id: "org-1", name: "Acme Corp" }],
        meta: { total: 1, page: 1, limit: 10 },
      },
      isLoading: false,
    });

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });

  it("should redirect to /create-organization when user has zero organizations", () => {
    renderWithProviders({
      data: { data: [], meta: { total: 0, page: 1, limit: 10 } },
      isLoading: false,
    });

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("should redirect when data is undefined (e.g. error state)", () => {
    renderWithProviders({
      data: undefined,
      isLoading: false,
    });

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });
});
