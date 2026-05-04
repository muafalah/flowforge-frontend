import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { NodeExecutionStatus } from "../types";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
  Zap,
  Globe,
  Code,
  ArrowLeftRight,
  FileText,
} from "lucide-react";

interface DagNodeData {
  label: string;
  nodeType: string;
  status?: NodeExecutionStatus;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

const statusStyles: Record<
  NodeExecutionStatus,
  { bg: string; border: string; text: string; icon: string }
> = {
  PENDING: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-500",
    icon: "text-slate-400",
  },
  RUNNING: {
    bg: "bg-amber-50",
    border: "border-amber-300 shadow-amber-100",
    text: "text-amber-700",
    icon: "text-amber-500",
  },
  SUCCESS: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-700",
    icon: "text-emerald-500",
  },
  FAILED: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
    icon: "text-red-500",
  },
};

function StatusIcon({ status }: { status?: NodeExecutionStatus }) {
  switch (status) {
    case "RUNNING":
      return <Loader2 className="size-3.5 animate-spin text-amber-500" />;
    case "SUCCESS":
      return <CheckCircle2 className="size-3.5 text-emerald-500" />;
    case "FAILED":
      return <XCircle className="size-3.5 text-red-500" />;
    default:
      return <Circle className="size-3.5 text-slate-400" />;
  }
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  http: Globe,
  script: Code,
  transform: ArrowLeftRight,
  trigger: Zap,
  default: FileText,
};

function TypeIcon({ type, className }: { type: string; className?: string }) {
  const Icon = typeIcons[type] ?? typeIcons.default;
  return <Icon className={className} />;
}

function DagNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as DagNodeData;
  const status = nodeData.status ?? "PENDING";
  const styles = statusStyles[status];

  return (
    <div
      className={cn(
        "relative rounded-lg border-1 px-4 py-3 min-w-[140px] max-w-[200px] shadow-sm transition-all duration-200",
        styles.bg,
        styles.border,
        status === "RUNNING" && "shadow-md animate-pulse",
        selected && "!border-primary ring-2 ring-primary/30",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-400 !border-white !w-2.5 !h-2.5"
      />

      <div className="flex items-center gap-2">
        <TypeIcon
          type={nodeData.nodeType}
          className={cn("size-4 shrink-0", styles.icon)}
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-xs font-semibold truncate",
              selected ? "text-primary" : styles.text,
            )}
          >
            {nodeData.label}
          </p>
          <p className="text-[10px] text-muted-foreground truncate capitalize">
            {nodeData.nodeType}
          </p>
        </div>
        <StatusIcon status={status} />
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-400 !border-white !w-2.5 !h-2.5"
      />
    </div>
  );
}

export const DagNode = memo(DagNodeComponent);
