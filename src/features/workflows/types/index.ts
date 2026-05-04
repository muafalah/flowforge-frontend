/** Execution status for individual DAG nodes during a workflow run */
export type NodeExecutionStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

/** Map of node ID → execution status, used for real-time DAG coloring */
export type NodeStatusMap = Record<string, NodeExecutionStatus>;

/** DAG node definition (matches backend schema) */
export interface DagNode {
  id: string;
  type: string;
  config?: Record<string, unknown>;
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
