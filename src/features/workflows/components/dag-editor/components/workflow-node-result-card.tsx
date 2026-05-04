import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, XCircle, ChevronDown, ChevronRight, RefreshCw,
} from "lucide-react";
import type { WorkflowNodeResultCardProps } from "../types";

export function WorkflowNodeResultCard({ result, index }: WorkflowNodeResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isSuccess = result.status === "SUCCESS";
  const isSkippedStatus = result.status === "SKIPPED";
  const isSkippedByPrev =
    (result.output as Record<string, unknown>)?.skipped === true;

  return (
    <div className={cn(
      "rounded-lg border transition-all duration-200",
      isSuccess
        ? "border-emerald-200 bg-emerald-50/30"
        : isSkippedStatus
          ? "border-amber-200 bg-amber-50/30"
          : "border-red-200 bg-red-50/30",
    )}>
      {/* Header — always visible */}
      <button
        type="button"
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 rounded-lg transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">
          {index + 1}
        </span>

        {isSuccess ? (
          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
        ) : isSkippedStatus ? (
          <ChevronRight className="size-4 text-amber-500 shrink-0" />
        ) : (
          <XCircle className="size-4 text-red-500 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{result.nodeName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-[10px] font-normal py-0 h-4">
              {result.nodeType.replace("_", " ")}
            </Badge>
            {isSkippedStatus && (
              <span className="text-[10px] text-amber-600">skipped</span>
            )}
            {isSkippedByPrev && !isSkippedStatus && (
              <span className="text-[10px] text-amber-600">skipped</span>
            )}
            {result.retryCount != null && result.retryCount > 0 && (
              <Badge variant="outline"
                className="text-[10px] font-normal py-0 h-4 bg-blue-500/10 text-blue-600 border-blue-500/20">
                <RefreshCw className="size-2.5 mr-0.5" />
                {result.retryCount} retry
              </Badge>
            )}
          </div>
        </div>

        <span className="text-xs text-muted-foreground shrink-0">{result.durationMs}ms</span>

        {expanded ? (
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t mx-3 pt-3">
          {/* Output */}
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Output</p>
            <div className="rounded-md bg-slate-950 p-3 max-h-[160px] overflow-auto">
              <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-all">
                {JSON.stringify(result.output, null, 2)}
              </pre>
            </div>
          </div>

          {/* Logs */}
          {result.logs.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Logs ({result.logs.length})
              </p>
              <div className="rounded-md bg-slate-950 p-2 max-h-[120px] overflow-auto font-mono text-[11px]">
                {result.logs.map((log, i) => {
                  const time = new Date(log.timestamp);
                  const timeStr = time.toLocaleTimeString("en-US", {
                    hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
                  });
                  return (
                    <div key={i} className="flex items-start gap-1.5 py-0.5">
                      <span className="text-slate-500 shrink-0">{timeStr}</span>
                      <span className={`shrink-0 ${
                        log.level === "error" ? "text-red-400"
                          : log.level === "warn" ? "text-amber-400" : "text-blue-400"
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-slate-300 break-all">{log.message}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
