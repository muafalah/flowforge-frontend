// ── Dashboard Stats ──

export interface HourlyRunData {
  hour: string;
  success: number;
  failed: number;
}

export interface DashboardStats {
  activeRuns: number;
  totalRuns24h: number;
  successCount24h: number;
  failedCount24h: number;
  successRate24h: number;
  avgDurationMs24h: number;
  totalWorkflows: number;
  hourlyRuns: HourlyRunData[];
}

// ── Recent Run ──

export interface RecentRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  triggerType: string;
  triggeredBy: string | null;
  triggeredUserName: string | null;
  durationMs: number | null;
  startedAt: string | null;
  createdAt: string;
}

// ── Workflow Summary ──

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string | null;
  lastRunStatus: string | null;
  lastRunDuration: number | null;
  lastRunAt: string | null;
  totalRuns24h: number;
  successCount24h: number;
  activeVersionDefinition: unknown;
}

// ── Activity Feed ──

export interface ActivityFeedItem {
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// ── Pagination ──

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}
