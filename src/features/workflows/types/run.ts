/** Types for workflow runs (frontend) */

export interface WorkflowRun {
  id: string;
  organizationId: string;
  workflowId: string;
  workflowVersionId: string;
  versionNumber?: number;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";
  triggerType: "MANUAL" | "CRON" | "WEBHOOK";
  triggeredBy?: string;
  triggeredUser?: { id: string; name: string; email: string };
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  createdAt: string;
  steps?: WorkflowRunStep[];
}

export interface WorkflowRunStep {
  id: string;
  nodeId: string;
  name: string;
  description?: string;
  type: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";
  input?: unknown;
  output?: unknown;
  error?: string;
  retryCount: number;
  executionOrder?: number;
  durationMs?: number;
  startedAt?: string;
  finishedAt?: string;
}

export interface ExecutionLog {
  logId: string;
  runId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}
