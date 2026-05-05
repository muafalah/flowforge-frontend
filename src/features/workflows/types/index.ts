/** Execution status for individual DAG nodes during a workflow run */
export type NodeExecutionStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

/** Map of node ID → execution status, used for real-time DAG coloring */
export type NodeStatusMap = Record<string, NodeExecutionStatus>;

/** Supported node types */
export type DagNodeType =
  | "http_call"
  | "script_execution"
  | "delay"
  | "conditional";

/** Config for HTTP Call nodes */
export interface HttpCallConfig {
  url?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

/** Config for Script Execution nodes */
export interface ScriptExecutionConfig {
  language?: "javascript" | "python" | "shell";
  script?: string;
  timeoutMs?: number;
}

/** Config for Delay nodes */
export interface DelayConfig {
  durationMs?: number;
}

/** Config for Conditional nodes */
export interface ConditionalConfig {
  expression?: string;
  trueLabel?: string;
  falseLabel?: string;
}

/** Union of all node configs */
export type DagNodeConfig =
  | HttpCallConfig
  | ScriptExecutionConfig
  | DelayConfig
  | ConditionalConfig
  | Record<string, unknown>;

/** DAG node definition (matches backend schema) */
export interface DagNode {
  id: string;
  name: string;
  description?: string;
  type: string;
  config?: DagNodeConfig;
}

/** DAG edge definition (matches backend schema) */
export interface DagEdge {
  from: string;
  to: string;
  condition?: string;
}

/** Complete DAG definition */
export interface DagDefinition {
  nodes: DagNode[];
  edges: DagEdge[];
}

/** WebSocket payload for a workflow run status update */
export interface WorkflowRunUpdate {
  workflowId: string;
  runId: string;
  nodeId: string;
  status: NodeExecutionStatus;
  timestamp: string;
  error?: string;
}
