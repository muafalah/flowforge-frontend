import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Rocket, RotateCcw, Square } from "lucide-react";
import { WorkflowNodeResultCard } from "./workflow-node-result-card";
import type { WorkflowRunSheetProps } from "../types";

export function WorkflowRunSheet({
  open,
  onOpenChange,
  workflowRunning,
  workflowRunResult,
  onStopWorkflow,
  onRunAgain,
}: WorkflowRunSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!workflowRunning) onOpenChange(isOpen); }}>
      <SheetContent className="w-[560px] sm:w-[600px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Rocket className="size-5" />
            Workflow Run
            {workflowRunning && (
              <Badge variant="outline"
                className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-xs animate-pulse">
                <Loader2 className="size-3 animate-spin mr-1" />Running
              </Badge>
            )}
            {!workflowRunning && workflowRunResult && (
              <Badge variant="outline" className={`text-xs ${
                workflowRunResult.status === "SUCCESS"
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                  : workflowRunResult.status === "ABORTED"
                    ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                    : "bg-red-500/10 text-red-700 border-red-500/20"
              }`}>
                {workflowRunResult.status}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {workflowRunning
              ? "Executing all nodes in topological order..."
              : workflowRunResult
                ? `Completed in ${workflowRunResult.totalDurationMs}ms`
                : "Workflow execution results"}
          </SheetDescription>
        </SheetHeader>

        {/* Run Summary */}
        {workflowRunResult && (
          <div className="px-6 py-3 border-b">
            <div className="grid grid-cols-5 gap-2">
              <div className="rounded-md border py-2.5 space-y-1 text-center">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Total</p>
                <p className="text-lg font-bold">{workflowRunResult.totalNodes}</p>
              </div>
              <div className="rounded-md border py-2.5 space-y-1 text-center bg-emerald-50/50">
                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Success</p>
                <p className="text-lg font-bold text-emerald-600">{workflowRunResult.successCount}</p>
              </div>
              <div className="rounded-md border py-2.5 space-y-1 text-center bg-red-50/50">
                <p className="text-[9px] font-bold text-red-600 uppercase tracking-wide">Failed</p>
                <p className="text-lg font-bold text-red-600">{workflowRunResult.failedCount}</p>
              </div>
              <div className="rounded-md border py-2.5 space-y-1 text-center bg-amber-50/50">
                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wide">Skipped</p>
                <p className="text-lg font-bold text-amber-600">{workflowRunResult.skippedCount}</p>
              </div>
              <div className="rounded-md border py-2.5 space-y-1 text-center">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Duration</p>
                <p className="text-sm font-bold">
                  {workflowRunResult.totalDurationMs >= 1000
                    ? `${(workflowRunResult.totalDurationMs / 1000).toFixed(1)}s`
                    : `${workflowRunResult.totalDurationMs}ms`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Node Results List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {workflowRunning && !workflowRunResult && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="relative">
                <Loader2 className="size-10 text-amber-500 animate-spin" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Running workflow...</p>
              <p className="text-xs text-muted-foreground">Nodes are executing in dependency order</p>
            </div>
          )}

          {workflowRunResult?.nodeResults.map((result, idx) => (
            <WorkflowNodeResultCard key={result.nodeId} result={result} index={idx} />
          ))}
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-4 border-t">
          {workflowRunning ? (
            <Button variant="outline" className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50"
              onClick={onStopWorkflow}>
              <Square className="size-3.5 fill-current" />Stop Execution
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button className="gap-1.5" onClick={onRunAgain}>
                <RotateCcw className="size-4" />Run Again
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
