import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useCreateWorkflow,
  useUpdateWorkflow,
  useDeleteWorkflow,
  useActivateVersion,
  useCreateVersion,
} from "../hooks/use-workflow-mutations";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

// --- Mocks ---

const mockMutationReturn = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: undefined,
  reset: vi.fn(),
};

vi.mock("@/api/generated/workflows/workflows", () => ({
  useWorkflowControllerCreate: vi.fn(() => mockMutationReturn),
  useWorkflowControllerUpdate: vi.fn(() => mockMutationReturn),
  useWorkflowControllerRemove: vi.fn(() => mockMutationReturn),
  getWorkflowControllerFindAllQueryKey: vi.fn(
    (orgId: string) => ["workflows", orgId],
  ),
  getWorkflowControllerFindOneQueryKey: vi.fn(
    (orgId: string, wfId: string) => ["workflow", orgId, wfId],
  ),
}));

vi.mock("@/api/generated/workflow-versions/workflow-versions", () => ({
  useWorkflowVersionControllerActivateVersion: vi.fn(
    () => mockMutationReturn,
  ),
  useWorkflowVersionControllerCreateVersion: vi.fn(
    () => mockMutationReturn,
  ),
  getWorkflowVersionControllerFindAllVersionsQueryKey: vi.fn(
    (orgId: string, wfId: string) => ["versions", orgId, wfId],
  ),
}));

vi.mock("@/api/organization-store", () => ({
  getSelectedOrganizationId: vi.fn(() => "org-1"),
}));

// Wrapper with React Query + Router
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe("useCreateWorkflow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return mutation with organizationId", () => {
    const { result } = renderHook(() => useCreateWorkflow(), {
      wrapper: createWrapper(),
    });

    expect(result.current.organizationId).toBe("org-1");
    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});

describe("useUpdateWorkflow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return mutation", () => {
    const { result } = renderHook(() => useUpdateWorkflow("wf-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});

describe("useDeleteWorkflow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return mutation", () => {
    const { result } = renderHook(() => useDeleteWorkflow(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});

describe("useActivateVersion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return mutation", () => {
    const { result } = renderHook(() => useActivateVersion("wf-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});

describe("useCreateVersion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return mutation with organizationId", () => {
    const { result } = renderHook(() => useCreateVersion("wf-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.organizationId).toBe("org-1");
    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });
});
