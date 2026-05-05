import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateOrganizationPage } from "../pages/create-organization-page";
import { AuthContext } from "@/features/auth";
import type { AuthContextValue } from "@/features/auth";

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

// Mock Orval-generated create mutation hook
const mockMutateAsync = vi.fn();
vi.mock("@/api/generated/organizations/organizations", () => ({
  useOrganizationControllerCreate: () => ({
    mutateAsync: mockMutateAsync,
  }),
  useOrganizationControllerFindAll: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

function renderPage(authOverrides: Partial<AuthContextValue> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const authValue: AuthContextValue = {
    user: { id: "1", name: "Test User", email: "test@example.com" },
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
          <MemoryRouter initialEntries={["/create-organization"]}>
            <CreateOrganizationPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    ),
  };
}

describe("CreateOrganizationPage", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.location.assign
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // @ts-expect-error - overriding window.location for testing
    window.location = { ...originalLocation, assign: vi.fn() };
  });

  afterAll(() => {
    // @ts-expect-error - restoring window.location
    window.location = originalLocation;
  });

  it("should render the create organization form", () => {
    renderPage();

    expect(screen.getByText(/create your organization/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create organization/i })
    ).toBeInTheDocument();
  });

  it("should show the user's email in the header", () => {
    renderPage();

    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("should show personalized welcome message with user name", () => {
    renderPage();

    expect(screen.getByText(/welcome, test user/i)).toBeInTheDocument();
  });

  it("should show validation error for name shorter than 3 chars", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/organization name/i), "AB");
    await user.click(
      screen.getByRole("button", { name: /create organization/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it("should call create mutation on valid form submission", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ data: { id: "org-1" } });
    renderPage();

    await user.type(screen.getByLabelText(/organization name/i), "Acme Corp");
    await user.click(
      screen.getByRole("button", { name: /create organization/i })
    );

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        data: { name: "Acme Corp" },
      });
    });
  });

  it("should navigate to /dashboard on successful creation", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ data: { id: "org-1" } });
    renderPage();

    await user.type(screen.getByLabelText(/organization name/i), "Acme Corp");
    await user.click(
      screen.getByRole("button", { name: /create organization/i })
    );

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("should call logout when logout button is clicked", async () => {
    const user = userEvent.setup();
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    renderPage({ logout: mockLogout });

    // Use the header logout button by its ID (there are two logout triggers on the page)
    const logoutButton = document.getElementById("logout-button")!;
    await user.click(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it("should have a logout link at the bottom", () => {
    renderPage();

    const logoutLink = screen.getByText(
      /don't want to create an organization/i
    );
    expect(logoutLink).toBeInTheDocument();
  });
});
