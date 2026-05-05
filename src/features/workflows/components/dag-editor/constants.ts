import {
  Globe,
  Code,
  Timer,
  GitFork,
  Database,
} from "lucide-react";
import { DagNode } from "../dag-node";
import type { NodeSettings } from "./types";

// ---------------------------------------------------------------------------
// React Flow node type registration
// ---------------------------------------------------------------------------

export const nodeTypes = {
  dagNode: DagNode,
};

// ---------------------------------------------------------------------------
// Node type options for the Add/Edit Node sheets
// ---------------------------------------------------------------------------

export const NODE_TYPE_OPTIONS = [
  {
    value: "http_call",
    label: "HTTP Call",
    icon: Globe,
    description: "Make an HTTP request to an external API",
  },
  {
    value: "script_execution",
    label: "Script Execution",
    icon: Code,
    description: "Run a custom script",
  },
  {
    value: "delay",
    label: "Delay",
    icon: Timer,
    description: "Wait for a specified duration",
  },
  {
    value: "conditional",
    label: "Conditional",
    icon: GitFork,
    description: "Branch based on a condition",
  },
  {
    value: "set_variable",
    label: "Set Variable",
    icon: Database,
    description: "Save data to a variable",
  },
] as const;

// ---------------------------------------------------------------------------
// Default config values for each node type
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIGS: Record<string, Record<string, unknown>> = {
  http_call: {
    url: "",
    method: "GET",
    headers: "{}",
    body: "",
    timeoutMs: 30000,
  },
  script_execution: { language: "javascript", script: "", timeoutMs: 60000 },
  delay: { durationMs: 1000 },
  conditional: { expression: "", trueLabel: "Yes", falseLabel: "No" },
  set_variable: { variableName: "VariableName", expression: "input.data" },
};

// ---------------------------------------------------------------------------
// Default node settings (retry, error handling, timeout)
// ---------------------------------------------------------------------------

export const DEFAULT_NODE_SETTINGS: NodeSettings = {
  onError: "fail",
  maxRetries: 3,
  backoffStrategy: "fixed",
  backoffDelayMs: 1000,
  timeoutOverrideMs: 0,
  enabled: false,
};

// ---------------------------------------------------------------------------
// Edge & layout constants
// ---------------------------------------------------------------------------

export const DEFAULT_EDGE_STYLE = {
  stroke: "#94a3b8",
  strokeWidth: 2,
};

export const HORIZONTAL_SPACING = 200;
export const VERTICAL_SPACING = 120;
export const BRANCH_OFFSET = 160;
