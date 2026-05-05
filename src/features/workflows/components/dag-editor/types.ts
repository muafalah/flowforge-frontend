import type { Node } from "@xyflow/react";
import type { VersionDataDto } from "@/api/generated/models";

// ---------------------------------------------------------------------------
// DAG Editor Props
// ---------------------------------------------------------------------------

export interface DAGEditorProps {
  workflowId: string;
  /** The initial DAG definition to load (from active version) */
  initialDefinition?: import("../../types").DagDefinition | null;
  /** List of all versions for the history panel */
  versions?: VersionDataDto[];
  /** Currently active version number */
  activeVersionNumber?: number;
  /** Callback after save succeeds */
  onSaveSuccess?: () => void;
  /** If true, DAG is view-only (no add/edit/delete/save) */
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Node Data & Settings
// ---------------------------------------------------------------------------

/** Data stored in each React Flow node */
export interface DagNodeData {
  label: string;
  description?: string;
  nodeType: string;
  config?: Record<string, unknown>;
  settings?: NodeSettings;
  status?: string;
  [key: string]: unknown;
}

/** Node-level settings for production workflows */
export interface NodeSettings {
  /** How to handle errors: fail the workflow, skip this node, or retry */
  onError: "fail" | "skip" | "retry";
  /** Maximum number of retry attempts (only used when onError is "retry") */
  maxRetries: number;
  /** Backoff strategy between retries */
  backoffStrategy: "fixed" | "linear" | "exponential";
  /** Initial backoff delay in ms */
  backoffDelayMs: number;
  /** Override the default timeout for this node (0 = use default) */
  timeoutOverrideMs: number;
  /** Whether these settings are enabled (collapsed by default) */
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Execution Types
// ---------------------------------------------------------------------------

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

export interface NodeRunResult {
  status: "SUCCESS" | "FAILED";
  durationMs: number;
  startedAt: string;
  output: unknown;
  logs: LogEntry[];
}

/** Per-node result in a workflow run */
export interface WorkflowNodeResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  durationMs: number;
  output: unknown;
  logs: LogEntry[];
  retryCount?: number;
}

/** Full workflow run result */
export interface WorkflowRunResult {
  status: "SUCCESS" | "FAILED" | "ABORTED";
  totalDurationMs: number;
  startedAt: string;
  nodeResults: WorkflowNodeResult[];
  totalNodes: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
}

export interface ExecutionContext {
  variables: Record<string, unknown>;
  inputs: unknown[];
}

// ---------------------------------------------------------------------------
// Sub-component Props
// ---------------------------------------------------------------------------

export interface NodeConfigFieldsProps {
  nodeType: string;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export interface NodeSettingsFieldsProps {
  settings: NodeSettings;
  onChange: (settings: NodeSettings) => void;
}

export interface NodeOutputTabProps {
  result: NodeRunResult | null;
  isRunning: boolean;
  onRun: () => void;
}

export interface NodeLogsTabProps {
  logs: LogEntry[];
}

export interface WorkflowNodeResultCardProps {
  result: WorkflowNodeResult;
  index: number;
}

export interface AddNodeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newNodeName: string;
  setNewNodeName: (v: string) => void;
  newNodeDescription: string;
  setNewNodeDescription: (v: string) => void;
  newNodeType: string;
  setNewNodeType: (v: string) => void;
  newNodeConfig: Record<string, unknown>;
  setNewNodeConfig: (v: Record<string, unknown>) => void;
  newNodeSettings: NodeSettings;
  setNewNodeSettings: (v: NodeSettings) => void;
  onAddNode: () => void;
  addNodeRunResult: NodeRunResult | null;
  addNodeRunning: boolean;
  onRunNewNode: () => void;
  setAddNodeRunResult: (v: NodeRunResult | null) => void;
  setAddNodeRunning: (v: boolean) => void;
}

export interface EditNodeSheetProps {
  editingNode: Node | null;
  setEditingNode: (v: Node | null) => void;
  editNodeName: string;
  setEditNodeName: (v: string) => void;
  editNodeDescription: string;
  setEditNodeDescription: (v: string) => void;
  editNodeType: string;
  setEditNodeType: (v: string) => void;
  editNodeConfig: Record<string, unknown>;
  setEditNodeConfig: (v: Record<string, unknown>) => void;
  editNodeSettings: NodeSettings;
  setEditNodeSettings: (v: NodeSettings) => void;
  onEditNode: () => void;
  nodeRunResult: NodeRunResult | null;
  nodeRunning: boolean;
  onRunNode: () => void;
}

export interface EditorToolbarProps {
  readOnly: boolean;
  nodes: Node[];
  edges: import("@xyflow/react").Edge[];
  selectedNodes: string[];
  selectedEdges: string[];
  isDirty: boolean;
  isPending: boolean;
  activeVersionNumber?: number;
  versions: VersionDataDto[];
  workflowRunning: boolean;
  activateMutation: {
    isPending: boolean;
    mutate: (vars: {
      organizationId: string;
      workflowId: string;
      versionId: string;
    }) => void;
  };
  onAddNodeOpen: () => void;
  onEditSelected: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onSave: () => void;
  onRunWorkflow: () => void;
  onStopWorkflow: () => void;
  onRestoreVersion: (version: VersionDataDto) => void;
  onActivateVersion: (versionId: string) => void;
}

export interface WorkflowRunSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowRunning: boolean;
  workflowRunResult: WorkflowRunResult | null;
  onStopWorkflow: () => void;
  onRunAgain: () => void;
}
