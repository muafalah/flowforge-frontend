import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrganizationForm } from "../components/organization-form";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock organization store
const mockGetSelectedOrganizationId = vi.fn();
vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: () => mockGetSelectedOrganizationId(),
}));

// Mock the API hooks
const mockUpdateMutateAsync = vi.fn();
const mockOrgData = {
  data: {
    organization: { id: "org-1", name: "Test Org" },
  },
};

vi.mock("@/api/generated/organizations/organizations", () => ({
  useOrganizationControllerFindOne: vi.fn((id) => {
    if (!id) return { data: null, isLoading: false };
    return {
      data: mockOrgData,
      isLoading: false,
    };
  }),
  useOrganizationControllerUpdate: () => ({
    mutateAsync: mockUpdateMutateAsync,
  }),
  getOrganizationControllerFindAllQueryKey: vi.fn(),
  getOrganizationControllerFindOneQueryKey: vi.fn(),
}));

function renderOrganizationForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <OrganizationForm />
    </QueryClientProvider>,
  );
}

describe("OrganizationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSelectedOrganizationId.mockReturnValue("org-1");
  });

  it("should render null if no organization is selected", () => {
    mockGetSelectedOrganizationId.mockReturnValue(null);
    const { container } = renderOrganizationForm();
    expect(container).toBeEmptyDOMElement();
  });

  it("should render the form with organization data", async () => {
    renderOrganizationForm();

    expect(screen.getByText("Organization")).toBeInTheDocument();
    
    // Wait for form to be populated
    await waitFor(() => {
      expect(screen.getByLabelText("Organization Name")).toHaveValue("Test Org");
    });
  });

  it("should validate empty organization name", async () => {
    const user = userEvent.setup();
    renderOrganizationForm();

    const input = await screen.findByLabelText("Organization Name");
    await user.clear(input);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("Organization name is required"),
    ).toBeInTheDocument();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it("should submit successfully with valid data", async () => {
    const user = userEvent.setup();
    mockUpdateMutateAsync.mockResolvedValueOnce({ data: {} });

    renderOrganizationForm();

    const input = await screen.findByLabelText("Organization Name");
    await user.clear(input);
    await user.type(input, "Updated Org Name");

    const submitBtn = screen.getByRole("button", { name: "Save changes" });
    expect(submitBtn).not.toBeDisabled();
    
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: "org-1",
        data: { name: "Updated Org Name" },
      });
    });
  });

  it("should show error toast on submission failure", async () => {
    const user = userEvent.setup();
    mockUpdateMutateAsync.mockRejectedValueOnce({
      response: { data: { error: { message: "Update failed" } } },
    });
    
    const { toast } = await import("sonner");

    renderOrganizationForm();

    const input = await screen.findByLabelText("Organization Name");
    await user.clear(input);
    await user.type(input, "Updated Org Name");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
  });
});
