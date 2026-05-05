import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useWorkflowControllerCreate,
  useWorkflowControllerUpdate,
  useWorkflowControllerRemove,
  getWorkflowControllerFindAllQueryKey,
  getWorkflowControllerFindOneQueryKey,
} from "@/api/generated/workflows/workflows";
import {
  useWorkflowVersionControllerActivateVersion,
  useWorkflowVersionControllerCreateVersion,
  getWorkflowVersionControllerFindAllVersionsQueryKey,
} from "@/api/generated/workflow-versions/workflow-versions";
import { getSelectedOrganizationId } from "@/api/organization-store";

export function useCreateWorkflow() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const organizationId = getSelectedOrganizationId() ?? "";

  const mutation = useWorkflowControllerCreate({
    mutation: {
      onSuccess: (response) => {
        const data = response as unknown as {
          message: string;
          data: { workflow: { id: string } };
        };
        toast.success("Workflow created successfully");
        // Invalidate list cache
        void queryClient.invalidateQueries({
          queryKey: getWorkflowControllerFindAllQueryKey(organizationId),
        });
        // Navigate to the new workflow detail page
        navigate(`/workflows/${data.data.workflow.id}`);
      },
      onError: () => {
        toast.error("Failed to create workflow. Please try again.");
      },
    },
  });

  return {
    ...mutation,
    organizationId,
  };
}

export function useUpdateWorkflow(workflowId: string) {
  const queryClient = useQueryClient();
  const organizationId = getSelectedOrganizationId() ?? "";

  return useWorkflowControllerUpdate({
    mutation: {
      onSuccess: () => {
        toast.success("Workflow updated successfully");
        void queryClient.invalidateQueries({
          queryKey: getWorkflowControllerFindOneQueryKey(
            organizationId,
            workflowId,
          ),
        });
        void queryClient.invalidateQueries({
          queryKey: getWorkflowControllerFindAllQueryKey(organizationId),
        });
      },
      onError: () => {
        toast.error("Failed to update workflow. Please try again.");
      },
    },
  });
}

export function useDeleteWorkflow() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const organizationId = getSelectedOrganizationId() ?? "";

  return useWorkflowControllerRemove({
    mutation: {
      onSuccess: () => {
        toast.success("Workflow deleted successfully");
        void queryClient.invalidateQueries({
          queryKey: getWorkflowControllerFindAllQueryKey(organizationId),
        });
        navigate("/workflows");
      },
      onError: () => {
        toast.error("Failed to delete workflow. Please try again.");
      },
    },
  });
}

export function useActivateVersion(workflowId: string) {
  const queryClient = useQueryClient();
  const organizationId = getSelectedOrganizationId() ?? "";

  return useWorkflowVersionControllerActivateVersion({
    mutation: {
      onSuccess: () => {
        toast.success("Version activated successfully");
        // Invalidate both version list and workflow detail
        void queryClient.invalidateQueries({
          queryKey:
            getWorkflowVersionControllerFindAllVersionsQueryKey(
              organizationId,
              workflowId,
            ),
        });
        void queryClient.invalidateQueries({
          queryKey: getWorkflowControllerFindOneQueryKey(
            organizationId,
            workflowId,
          ),
        });
        void queryClient.invalidateQueries({
          queryKey: getWorkflowControllerFindAllQueryKey(organizationId),
        });
      },
      onError: () => {
        toast.error("Failed to activate version. Please try again.");
      },
    },
  });
}

export function useCreateVersion(workflowId: string) {
  const queryClient = useQueryClient();
  const organizationId = getSelectedOrganizationId() ?? "";

  const mutation = useWorkflowVersionControllerCreateVersion({
    mutation: {
      onSuccess: () => {
        toast.success("Version created successfully");
        // Invalidate version list
        void queryClient.invalidateQueries({
          queryKey:
            getWorkflowVersionControllerFindAllVersionsQueryKey(
              organizationId,
              workflowId,
            ),
        });
        // Invalidate workflow detail (version count changes)
        void queryClient.invalidateQueries({
          queryKey: getWorkflowControllerFindOneQueryKey(
            organizationId,
            workflowId,
          ),
        });
        // Invalidate workflow list
        void queryClient.invalidateQueries({
          queryKey: getWorkflowControllerFindAllQueryKey(organizationId),
        });
      },
      onError: () => {
        toast.error("Failed to create version. Please try again.");
      },
    },
  });

  return {
    ...mutation,
    organizationId,
  };
}
