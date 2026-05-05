import { useState, useCallback } from "react";
import { useAiWorkflowControllerGenerateWorkflow } from "@/api/generated/ai-workflow/ai-workflow";
import { getSelectedOrganizationId } from "@/api/organization-store";
import type { DagDefinition } from "../types";

export function useAiGenerate() {
  const [error, setError] = useState<string | null>(null);
  const mutation = useAiWorkflowControllerGenerateWorkflow();

  const generate = useCallback(
    async (prompt: string): Promise<DagDefinition | null> => {
      const organizationId = getSelectedOrganizationId();
      if (!organizationId) {
        setError("No organization selected.");
        return null;
      }

      setError(null);

      try {
        const response = await mutation.mutateAsync({
          organizationId,
          data: { prompt },
        });

        // customInstance unwraps Axios response (returns body directly).
        // At runtime: response = { message, data: { definition } }
        // But Orval types it as { data: { message, data: { definition } }, status }
        // Handle both shapes defensively.
        const body = response as unknown as Record<string, unknown>;
        const dataWrapper = (body.data ?? body) as Record<string, unknown>;
        const innerData = (dataWrapper.data ?? dataWrapper) as Record<
          string,
          unknown
        >;
        const definition = innerData.definition;

        if (!definition) {
          setError("No definition returned from AI.");
          return null;
        }

        return definition as unknown as DagDefinition;
      } catch (err: unknown) {
        const axiosError = err as {
          response?: {
            data?: {
              error?: { message?: string };
            };
          };
          message?: string;
        };
        const apiMessage =
          axiosError.response?.data?.error?.message ??
          axiosError.message ??
          "Failed to generate workflow. Please try again.";
        setError(apiMessage);
        return null;
      }
    },
    [mutation],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    generate,
    isGenerating: mutation.isPending,
    error,
    clearError,
  };
}
