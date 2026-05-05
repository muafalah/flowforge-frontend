/** Types for workflow triggers (cron jobs & webhooks) */

export interface CronJob {
  id: string;
  organizationId: string;
  workflowId: string;
  name: string;
  description?: string;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Webhook {
  id: string;
  organizationId: string;
  workflowId: string;
  name: string;
  description?: string;
  secret: string;
  urlPath: string;
  webhookUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
