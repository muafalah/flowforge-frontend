import { useWorkflowControllerFindOne } from "@/api/generated/workflows/workflows";
import { getSelectedOrganizationId } from "@/api/organization-store";
import type { WorkflowDataDto } from "@/api/generated/models";

interface WorkflowDetailResponse {
  message: string;
  data: { workflow: WorkflowDataDto };
}

export function useWorkflowDetail(workflowId: string) {
  const organizationId = getSelectedOrganizationId() ?? "";

  const { data, isLoading, isError, error, refetch } =
    useWorkflowControllerFindOne(organizationId, workflowId, {
      query: {
        enabled: !!(organizationId && workflowId),
      },
    });

  // The actual API response is { message, data: { workflow: WorkflowDataDto } }
  const response = data as unknown as WorkflowDetailResponse | undefined;

  return {
    workflow: response?.data?.workflow ?? null,
    isLoading,
    isError,
    error,
    refetch,
    organizationId,
  };
}
