import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { getSelectedOrganizationId } from "@/api/organization-store";
import { getAccessToken } from "@/api/token-store";
import type {
  WorkflowRun,
  ExecutionLog,
  PaginationMeta,
} from "../types/run";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getHeaders() {
  const token = getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function getBaseUrl(workflowId: string) {
  const orgId = getSelectedOrganizationId();
  return `${API_BASE}/v1/organizations/${orgId}/workflows/${workflowId}`;
}

/** Hook for managing workflow runs */
export function useWorkflowRuns(workflowId: string) {
  const queryClient = useQueryClient();
  const [isTriggering, setIsTriggering] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  /** Trigger a manual run */
  const triggerRun = useCallback(async () => {
    setIsTriggering(true);
    try {
      const res = await axios.post<{
        message: string;
        data: { run: WorkflowRun };
      }>(`${getBaseUrl(workflowId)}/runs`, {}, { headers: getHeaders() });
      // Invalidate runs list cache
      void queryClient.invalidateQueries({
        queryKey: ["workflow-runs", workflowId],
      });
      return res.data.data.run;
    } finally {
      setIsTriggering(false);
    }
  }, [workflowId, queryClient]);

  /** Cancel a running workflow */
  const cancelRun = useCallback(
    async (runId: string) => {
      setIsCancelling(true);
      try {
        await axios.post(
          `${getBaseUrl(workflowId)}/runs/${runId}/cancel`,
          {},
          { headers: getHeaders() },
        );
        void queryClient.invalidateQueries({
          queryKey: ["workflow-runs", workflowId],
        });
      } finally {
        setIsCancelling(false);
      }
    },
    [workflowId, queryClient],
  );

  /** Fetch paginated runs */
  const fetchRuns = useCallback(
    async (params?: {
      page?: number;
      limit?: number;
      status?: string;
    }): Promise<{ data: WorkflowRun[]; meta: PaginationMeta }> => {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.status) query.set("status", params.status);
      query.set("sortOrder", "desc");

      const res = await axios.get<{
        data: WorkflowRun[];
        meta: PaginationMeta;
      }>(`${getBaseUrl(workflowId)}/runs?${query.toString()}`, {
        headers: getHeaders(),
      });
      return res.data;
    },
    [workflowId],
  );

  /** Fetch run detail with steps */
  const fetchRunDetail = useCallback(
    async (runId: string): Promise<WorkflowRun> => {
      const res = await axios.get<{
        data: { run: WorkflowRun };
      }>(`${getBaseUrl(workflowId)}/runs/${runId}`, {
        headers: getHeaders(),
      });
      return res.data.data.run;
    },
    [workflowId],
  );

  /** Fetch execution logs */
  const fetchRunLogs = useCallback(
    async (
      runId: string,
      params?: { nodeId?: string; level?: string; page?: number },
    ): Promise<{ data: ExecutionLog[]; meta: PaginationMeta }> => {
      const query = new URLSearchParams();
      if (params?.nodeId) query.set("nodeId", params.nodeId);
      if (params?.level) query.set("level", params.level);
      if (params?.page) query.set("page", String(params.page));

      const res = await axios.get<{
        data: ExecutionLog[];
        meta: PaginationMeta;
      }>(
        `${getBaseUrl(workflowId)}/runs/${runId}/logs?${query.toString()}`,
        { headers: getHeaders() },
      );
      return res.data;
    },
    [workflowId],
  );

  return {
    triggerRun,
    cancelRun,
    fetchRuns,
    fetchRunDetail,
    fetchRunLogs,
    isTriggering,
    isCancelling,
  };
}
