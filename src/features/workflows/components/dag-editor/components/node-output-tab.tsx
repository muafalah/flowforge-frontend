import { Button } from "@/components/ui/button";
import { Loader2, Check, CircleDot, Play, Clock, Terminal } from "lucide-react";
import type { NodeOutputTabProps } from "../types";

export function NodeOutputTab({
  result,
  isRunning,
  onRun,
}: NodeOutputTabProps) {
  const statusBg =
    result?.status === "SUCCESS"
      ? "bg-emerald-500/10 border-emerald-500/20"
      : result?.status === "FAILED"
        ? "bg-red-500/10 border-red-500/20"
        : "bg-muted/30";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* Status Banner */}
        {isRunning ? (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex items-center justify-center size-10 rounded-full bg-amber-500/20">
              <Loader2 className="size-5 text-amber-600 animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-700">Running...</p>
              <p className="text-xs text-amber-600/70">
                Executing this node. Please wait.
              </p>
            </div>
          </div>
        ) : result ? (
          <div
            className={`flex items-center gap-3 rounded-lg border p-4 ${statusBg}`}
          >
            <div
              className={`flex items-center justify-center size-10 rounded-full ${
                result.status === "SUCCESS"
                  ? "bg-emerald-500/20"
                  : "bg-red-500/20"
              }`}
            >
              {result.status === "SUCCESS" ? (
                <Check className="size-5 text-emerald-600" />
              ) : (
                <CircleDot className="size-5 text-red-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  result.status === "SUCCESS"
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {result.status === "SUCCESS"
                  ? "Execution Successful"
                  : "Execution Failed"}
              </p>
              <p className="text-xs text-muted-foreground">
                Completed in {result.durationMs}ms
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-center size-10 rounded-full bg-muted">
              <Play className="size-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                No execution data
              </p>
              <p className="text-xs text-muted-foreground">
                Click &quot;Run Node&quot; to test this node.
              </p>
            </div>
          </div>
        )}

        {/* Execution Summary */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Execution Summary
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border p-3 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Status
              </p>
              <div className="flex items-center gap-1.5">
                {isRunning ? (
                  <>
                    <Loader2 className="size-3.5 text-amber-500 animate-spin" />
                    <span className="text-sm text-amber-600 font-medium">
                      Running
                    </span>
                  </>
                ) : result ? (
                  <>
                    <CircleDot
                      className={`size-3.5 ${result.status === "SUCCESS" ? "text-emerald-500" : "text-red-500"}`}
                    />
                    <span
                      className={`text-sm font-medium ${result.status === "SUCCESS" ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {result.status}
                    </span>
                  </>
                ) : (
                  <>
                    <CircleDot className="size-3.5 text-muted-foreground/50" />
                    <span className="text-sm text-muted-foreground">—</span>
                  </>
                )}
              </div>
            </div>
            <div className="rounded-md border p-3 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Duration
              </p>
              <div className="flex items-center gap-1.5">
                <Clock
                  className={`size-3.5 ${result ? "text-foreground/60" : "text-muted-foreground/50"}`}
                />
                <span
                  className={`text-sm ${result ? "font-medium" : "text-muted-foreground"}`}
                >
                  {result ? `${result.durationMs}ms` : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Output Data */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Output Data
          </h4>
          <div className="rounded-md border bg-slate-950 p-4 min-h-[160px] max-h-[320px] overflow-auto">
            {isRunning ? (
              <div className="flex items-center justify-center h-[120px]">
                <div className="text-center space-y-2">
                  <Loader2 className="size-6 text-slate-500 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">
                    Waiting for output...
                  </p>
                </div>
              </div>
            ) : result ? (
              <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-all">
                {JSON.stringify(result.output, null, 2)}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-[120px]">
                <div className="text-center space-y-1">
                  <Terminal className="size-6 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-500">
                    Output will appear here after execution
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Run button footer */}
      <div className="py-4 border-t flex items-center justify-end gap-2">
        <Button
          onClick={onRun}
          disabled={isRunning}
          className="gap-1.5"
          size="sm"
        >
          {isRunning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          {isRunning ? "Running..." : "Run Node"}
        </Button>
      </div>
    </div>
  );
}
