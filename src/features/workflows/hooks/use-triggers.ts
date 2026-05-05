import { useCallback, useState } from "react";
import axios from "axios";
import { getSelectedOrganizationId } from "@/api/organization-store";
import { getAccessToken } from "@/api/token-store";
import type { CronJob, Webhook } from "../types/trigger";
import type { PaginationMeta } from "../types/run";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getHeaders() {
  return {
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
  };
}

function getBaseUrl(workflowId: string) {
  const orgId = getSelectedOrganizationId();
  return `${API_BASE}/v1/organizations/${orgId}/workflows/${workflowId}`;
}

// ── Cron Jobs ──

export function useCronJobs(workflowId: string) {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const fetchCronJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get<{
        data: CronJob[];
        meta: PaginationMeta;
      }>(`${getBaseUrl(workflowId)}/cron-jobs?limit=50`, {
        headers: getHeaders(),
      });
      setCronJobs(res.data.data);
      return res.data.data;
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  const createCronJob = useCallback(
    async (data: {
      name: string;
      cronExpression: string;
      timezone: string;
      description?: string;
    }) => {
      setIsMutating(true);
      try {
        const res = await axios.post<{
          data: { cronJob: CronJob };
        }>(`${getBaseUrl(workflowId)}/cron-jobs`, data, {
          headers: getHeaders(),
        });
        await fetchCronJobs();
        return res.data.data.cronJob;
      } finally {
        setIsMutating(false);
      }
    },
    [workflowId, fetchCronJobs],
  );

  const updateCronJob = useCallback(
    async (
      cronJobId: string,
      data: Partial<{
        name: string;
        cronExpression: string;
        timezone: string;
        description: string;
        isActive: boolean;
      }>,
    ) => {
      setIsMutating(true);
      try {
        await axios.patch(
          `${getBaseUrl(workflowId)}/cron-jobs/${cronJobId}`,
          data,
          { headers: getHeaders() },
        );
        await fetchCronJobs();
      } finally {
        setIsMutating(false);
      }
    },
    [workflowId, fetchCronJobs],
  );

  const deleteCronJob = useCallback(
    async (cronJobId: string) => {
      setIsMutating(true);
      try {
        await axios.delete(
          `${getBaseUrl(workflowId)}/cron-jobs/${cronJobId}`,
          { headers: getHeaders() },
        );
        await fetchCronJobs();
      } finally {
        setIsMutating(false);
      }
    },
    [workflowId, fetchCronJobs],
  );

  return {
    cronJobs,
    isLoading,
    isMutating,
    fetchCronJobs,
    createCronJob,
    updateCronJob,
    deleteCronJob,
  };
}

// ── Webhooks ──

export function useWebhooks(workflowId: string) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get<{
        data: Webhook[];
        meta: PaginationMeta;
      }>(`${getBaseUrl(workflowId)}/webhooks?limit=50`, {
        headers: getHeaders(),
      });
      setWebhooks(res.data.data);
      return res.data.data;
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  const createWebhook = useCallback(
    async (data: { name: string; description?: string }) => {
      setIsMutating(true);
      try {
        const res = await axios.post<{
          data: { webhook: Webhook };
        }>(`${getBaseUrl(workflowId)}/webhooks`, data, {
          headers: getHeaders(),
        });
        await fetchWebhooks();
        return res.data.data.webhook;
      } finally {
        setIsMutating(false);
      }
    },
    [workflowId, fetchWebhooks],
  );

  const updateWebhook = useCallback(
    async (
      webhookId: string,
      data: Partial<{
        name: string;
        description: string;
        isActive: boolean;
        regenerateSecret: boolean;
      }>,
    ) => {
      setIsMutating(true);
      try {
        await axios.patch(
          `${getBaseUrl(workflowId)}/webhooks/${webhookId}`,
          data,
          { headers: getHeaders() },
        );
        await fetchWebhooks();
      } finally {
        setIsMutating(false);
      }
    },
    [workflowId, fetchWebhooks],
  );

  const deleteWebhook = useCallback(
    async (webhookId: string) => {
      setIsMutating(true);
      try {
        await axios.delete(
          `${getBaseUrl(workflowId)}/webhooks/${webhookId}`,
          { headers: getHeaders() },
        );
        await fetchWebhooks();
      } finally {
        setIsMutating(false);
      }
    },
    [workflowId, fetchWebhooks],
  );

  return {
    webhooks,
    isLoading,
    isMutating,
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
  };
}
