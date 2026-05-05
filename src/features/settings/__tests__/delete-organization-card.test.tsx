import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DeleteOrganizationCard } from "../components/delete-organization-card";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock organization store
const mockGetSelectedOrganizationId = vi.fn();
const mockClearSelectedOrganizationId = vi.fn();
vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: () => mockGetSelectedOrganizationId(),
  clearSelectedOrganizationId: () => mockClearSelectedOrganizationId(),
}));

// Mock the API hooks
const mockDeleteMutateAsync = vi.fn();
vi.mock("@/api/generated/organizations/organizations", () => ({
  useOrganizationControllerRemove: () => ({
    mutateAsync: mockDeleteMutateAsync,
  }),
}));

function renderDeleteOrganizationCard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DeleteOrganizationCard />
    </QueryClientProvider>,
  );
}

describe("DeleteOrganizationCard", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSelectedOrganizationId.mockReturnValue("org-1");
    
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

  it("should render null if no organization is selected", () => {
    mockGetSelectedOrganizationId.mockReturnValue(null);
    const { container } = renderDeleteOrganizationCard();
    expect(container).toBeEmptyDOMElement();
  });

  it("should open confirmation dialog when delete button is clicked", async () => {
    const user = userEvent.setup();
    renderDeleteOrganizationCard();

    const deleteButton = screen.getByRole("button", { name: "Delete Organization" });
    expect(deleteButton).toBeInTheDocument();
    
    await user.click(deleteButton);

    expect(screen.getByText("Are you absolutely sure?")).toBeInTheDocument();
    expect(
      screen.getByText(/This action cannot be undone/i)
    ).toBeInTheDocument();
  });

  it("should call delete API and redirect on confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteMutateAsync.mockResolvedValueOnce({});
    const { toast } = await import("sonner");

    renderDeleteOrganizationCard();

    // Open dialog
    await user.click(screen.getByRole("button", { name: "Delete Organization" }));

    // Click confirm
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ id: "org-1" });
      expect(toast.success).toHaveBeenCalledWith("Organization deleted successfully.");
      expect(mockClearSelectedOrganizationId).toHaveBeenCalled();
      expect(window.location.assign).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("should show error toast if deletion fails", async () => {
    const user = userEvent.setup();
    mockDeleteMutateAsync.mockRejectedValueOnce({
      response: { data: { error: { message: "Cannot delete organization" } } },
    });
    const { toast } = await import("sonner");

    renderDeleteOrganizationCard();

    // Open dialog
    await user.click(screen.getByRole("button", { name: "Delete Organization" }));

    // Click confirm
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Cannot delete organization");
      expect(window.location.assign).not.toHaveBeenCalled();
    });
  });
});
