import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";
import type { NodeLogsTabProps } from "../types";

export function NodeLogsTab({ logs }: NodeLogsTabProps) {
  return (
    <div className="flex-1 overflow-y-auto py-4 space-y-4">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Execution Logs
        </h4>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          {logs.length} entries
        </Badge>
      </div>

      {/* Log entries or empty state */}
      {logs.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 flex flex-col items-center justify-center py-12 space-y-2">
          <ScrollText className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No logs yet</p>
          <p className="text-xs text-muted-foreground text-center max-w-[240px]">
            Run the node from the Output tab to see execution logs here.
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="bg-slate-950 p-3 space-y-0.5 font-mono text-xs max-h-[480px] overflow-y-auto">
            {logs.map((log, i) => {
              const time = new Date(log.timestamp);
              const timeStr = time.toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
              return (
                <div key={i} className="flex items-start gap-2 py-0.5">
                  <span className="text-slate-500 shrink-0 select-none w-[60px]">
                    {timeStr}
                  </span>
                  <span className={`shrink-0 w-[50px] ${
                    log.level === "error"
                      ? "text-red-400"
                      : log.level === "warn"
                        ? "text-amber-400"
                        : "text-blue-400"
                  }`}>
                    {log.level.toUpperCase().padEnd(5)}
                  </span>
                  <span className="text-slate-300 break-all">{log.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
