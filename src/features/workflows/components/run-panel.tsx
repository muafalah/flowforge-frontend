import { useState, useEffect, useCallback } from "react";
import {
  StopCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronRight,
  RotateCcw,
  Terminal,
  History,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useWorkflowRuns } from "../hooks/use-workflow-runs";
import { useWorkflowExecution } from "../hooks/use-workflow-execution";
import type { WorkflowRun, WorkflowRunStep, ExecutionLog } from "../types/run";

interface RunPanelProps {
  workflowId: string;
  readOnly?: boolean;
}

// ── Status helpers ──

function statusIcon(status: string, className?: string) {
  switch (status) {
    case "PENDING":
      return (
        <Clock className={cn("size-4 text-muted-foreground", className)} />
      );
    case "RUNNING":
      return (
        <Loader2
          className={cn("size-4 text-blue-500 animate-spin", className)}
        />
      );
    case "SUCCESS":
      return (
        <CheckCircle2 className={cn("size-4 text-emerald-500", className)} />
      );
    case "FAILED":
      return <XCircle className={cn("size-4 text-red-500", className)} />;
    case "CANCELLED":
      return <StopCircle className={cn("size-4 text-orange-500", className)} />;
    case "SKIPPED":
      return (
        <AlertTriangle className={cn("size-4 text-yellow-500", className)} />
      );
    default:
      return (
        <Clock className={cn("size-4 text-muted-foreground", className)} />
      );
  }
}

function statusBadge(status: string) {
  const variants: Record<string, string> = {
    PENDING: "bg-slate-500/10 text-slate-500 border-slate-500/30",
    RUNNING: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    SUCCESS: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    FAILED: "bg-red-500/10 text-red-500 border-red-500/30",
    CANCELLED: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    SKIPPED: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  };

  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium uppercase", variants[status])}
    >
      {status}
    </Badge>
  );
}

function formatDuration(ms?: number) {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatTime(dateStr?: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Sub-components ──

function RunHistoryList({
  runs,
  selectedRunId,
  onSelect,
}: {
  runs: WorkflowRun[];
  selectedRunId?: string;
  onSelect: (run: WorkflowRun) => void;
}) {
  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <History className="size-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No runs yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Trigger a run to see the history
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {runs.map((run) => (
        <button
          key={run.id}
          onClick={() => onSelect(run)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm",
            selectedRunId === run.id
              ? "bg-primary/10 border border-primary/20"
              : "hover:bg-accent/50",
          )}
        >
          {statusIcon(run.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate text-xs">
                Run #{run.id.slice(0, 8)}
              </span>
              {statusBadge(run.status)}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
              <span className="capitalize">
                {run.triggerType.toLowerCase()}
              </span>
              <span>·</span>
              <span>{formatTime(run.createdAt)}</span>
              {run.durationMs && (
                <>
                  <span>·</span>
                  <span>{formatDuration(run.durationMs)}</span>
                </>
              )}
            </div>
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground/40 shrink-0" />
        </button>
      ))}
    </div>
  );
}

function StepTimeline({ steps }: { steps: WorkflowRunStep[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="relative pl-6 space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />

      {steps.map((step) => (
        <div key={step.id} className="relative">
          {/* Dot */}
          <div
            className={cn(
              "absolute left-[-13px] top-3 size-3 rounded-full border-2 z-10",
              step.status === "SUCCESS" && "bg-emerald-500 border-emerald-500",
              step.status === "FAILED" && "bg-red-500 border-red-500",
              step.status === "RUNNING" &&
                "bg-blue-500 border-blue-500 animate-pulse",
              step.status === "SKIPPED" && "bg-yellow-500 border-yellow-500",
              step.status === "PENDING" &&
                "bg-muted border-muted-foreground/30",
            )}
          />

          <button
            onClick={() =>
              setExpandedId(expandedId === step.id ? null : step.id)
            }
            className="w-full text-left px-3 py-2 rounded-md hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {statusIcon(step.status, "size-3.5")}
                <span className="text-sm font-medium">{step.name}</span>
                <Badge variant="secondary" className="text-[9px] font-mono">
                  {step.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {step.retryCount > 0 && (
                  <span className="flex items-center gap-0.5">
                    <RotateCcw className="size-3" />
                    {step.retryCount}
                  </span>
                )}
                <span>{formatDuration(step.durationMs)}</span>
              </div>
            </div>
          </button>

          {/* Expanded output */}
          {expandedId === step.id && (
            <div className="ml-3 mb-2 rounded-lg bg-muted/50 border p-3 text-xs">
              {step.error && (
                <div className="text-red-500 font-mono mb-2">
                  Error: {step.error}
                </div>
              )}
              {!!step.output && (
                <pre className="overflow-auto max-h-40 font-mono text-[11px] whitespace-pre-wrap text-muted-foreground">
                  {JSON.stringify(step.output, null, 2)}
                </pre>
              )}
              {!step.error && !step.output && (
                <span className="text-muted-foreground">No output</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LogViewer({
  logs,
  onFilterChange,
}: {
  logs: ExecutionLog[];
  onFilterChange: (level?: string) => void;
}) {
  return (
    <div className="space-y-2">
      {/* Filter */}
      <div className="flex items-center gap-2 px-1">
        <Filter className="size-3.5 text-muted-foreground" />
        <Select
          onValueChange={(v) => onFilterChange(v === "ALL" ? undefined : v)}
          defaultValue="ALL"
        >
          <SelectTrigger className="h-7 text-xs w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Levels</SelectItem>
            <SelectItem value="INFO">Info</SelectItem>
            <SelectItem value="WARN">Warn</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Log entries */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Terminal className="size-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No logs available</p>
        </div>
      ) : (
        <div className="rounded-lg bg-slate-950 border p-2 font-mono text-[11px]">
          {logs.map((log) => (
            <div
              key={log.logId}
              className={cn(
                "flex gap-2 px-2 py-0.5 leading-5",
                log.level === "ERROR" && "text-red-400",
                log.level === "WARN" && "text-yellow-400",
                log.level === "INFO" && "text-blue-300",
              )}
            >
              <span className="text-slate-500 shrink-0">
                {formatTime(log.timestamp)}
              </span>
              <span
                className={cn(
                  "shrink-0 w-12",
                  log.level === "ERROR" && "text-red-500",
                  log.level === "WARN" && "text-yellow-500",
                  log.level === "INFO" && "text-blue-500",
                )}
              >
                [{log.level}]
              </span>
              <span className="text-white shrink-0">{log.nodeName}</span>
              <span className="break-all">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──

export function RunPanel({ workflowId }: RunPanelProps) {
  const { cancelRun, fetchRuns, fetchRunDetail, fetchRunLogs, isCancelling } =
    useWorkflowRuns(workflowId);

  useWorkflowExecution(workflowId);

  const [isOpen, setIsOpen] = useState(false);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [activeTab, setActiveTab] = useState("history");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Load runs when panel opens
  const loadRuns = useCallback(async () => {
    setIsLoadingRuns(true);
    try {
      const result = await fetchRuns({ limit: 20, status: statusFilter });
      setRuns(result.data);
    } catch {
      // silent
    } finally {
      setIsLoadingRuns(false);
    }
  }, [fetchRuns, statusFilter]);

  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        void loadRuns();
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, loadRuns]);

  // Load run detail
  const handleSelectRun = useCallback(
    async (run: WorkflowRun) => {
      setSelectedRun(run);
      setActiveTab("steps");
      setIsLoadingDetail(true);
      try {
        const detail = await fetchRunDetail(run.id);
        setSelectedRun(detail);
        const logResult = await fetchRunLogs(run.id);
        setLogs(logResult.data);
      } catch {
        // silent
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [fetchRunDetail, fetchRunLogs],
  );

  // Cancel run
  const handleCancel = useCallback(async () => {
    if (!selectedRun) return;
    try {
      await cancelRun(selectedRun.id);
      toast.success("Run cancellation requested.");
      await loadRuns();
      if (selectedRun) {
        const detail = await fetchRunDetail(selectedRun.id);
        setSelectedRun(detail);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to cancel run.";
      toast.error(msg);
    }
  }, [selectedRun, cancelRun, loadRuns, fetchRunDetail]);

  // Filter logs
  const handleLogFilter = useCallback(
    async (level?: string) => {
      if (!selectedRun) return;
      try {
        const result = await fetchRunLogs(selectedRun.id, { level });
        setLogs(result.data);
      } catch {
        // silent
      }
    },
    [selectedRun, fetchRunLogs],
  );

  // Auto-refresh active runs
  useEffect(() => {
    if (!isOpen) return;
    const activeRun = runs.find(
      (r) => r.status === "RUNNING" || r.status === "PENDING",
    );
    if (!activeRun) return;

    const interval = setInterval(async () => {
      await loadRuns();
      if (selectedRun && selectedRun.id === activeRun.id) {
        const detail = await fetchRunDetail(activeRun.id);
        setSelectedRun(detail);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, runs, selectedRun, loadRuns, fetchRunDetail]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <History className="size-3.5" />
          Run History
        </Button>
      </SheetTrigger>

      <SheetContent className="w-80 sm:w-96">
        {/* Header */}
        <SheetHeader className="px-4 sm:px-6 border-b">
          <SheetTitle>Workflow Runs</SheetTitle>
          <SheetDescription>
            Monitor active workflows and view run history.
          </SheetDescription>
        </SheetHeader>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="px-4 sm:px-6">
            {selectedRun ? (
              <>
                {/* Back button + Run info */}
                <div className="mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 mb-4"
                    onClick={() => {
                      setSelectedRun(null);
                      setActiveTab("history");
                    }}
                  >
                    <ArrowLeft className="size-4" />
                    Back to Workflows
                  </Button>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {statusIcon(selectedRun.status, "size-5")}
                        <h3 className="font-semibold text-sm">
                          Run #{selectedRun.id.slice(0, 8)}
                        </h3>
                        {statusBadge(selectedRun.status)}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="capitalize">
                          {selectedRun.triggerType.toLowerCase()}
                        </span>
                        <span>·</span>
                        <span>{formatTime(selectedRun.createdAt)}</span>
                        {selectedRun.durationMs && (
                          <>
                            <span>·</span>
                            <span>
                              {formatDuration(selectedRun.durationMs)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {(selectedRun.status === "RUNNING" ||
                      selectedRun.status === "PENDING") && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="h-7 text-xs gap-1"
                      >
                        {isCancelling ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <StopCircle className="size-3" />
                        )}
                        Cancel
                      </Button>
                    )}
                  </div>
                  {selectedRun.errorMessage && (
                    <div className="mt-2 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
                      {selectedRun.errorMessage}
                    </div>
                  )}
                </div>

                {/* Tabs: Steps / Logs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full h-8">
                    <TabsTrigger value="steps" className="text-xs flex-1 h-7">
                      Steps ({selectedRun.steps?.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="text-xs flex-1 h-7">
                      Logs ({logs.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="steps" className="mt-3">
                    {isLoadingDetail ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : selectedRun.steps && selectedRun.steps.length > 0 ? (
                      <StepTimeline steps={selectedRun.steps} />
                    ) : (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        No steps recorded
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="logs" className="mt-3">
                    <LogViewer logs={logs} onFilterChange={handleLogFilter} />
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <>
                {/* Status filter */}
                <div className="flex items-center gap-2 mb-3">
                  <Select
                    value={statusFilter ?? "ALL"}
                    onValueChange={(v) => {
                      setStatusFilter(v === "ALL" ? undefined : v);
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="SUCCESS">Success</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="RUNNING">Running</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => void loadRuns()}
                  >
                    <RotateCcw
                      className={cn(
                        "size-3.5",
                        isLoadingRuns && "animate-spin",
                      )}
                    />
                  </Button>
                </div>

                {/* Run list */}
                {isLoadingRuns && runs.length === 0 ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <RunHistoryList
                    runs={runs}
                    selectedRunId={undefined}
                    onSelect={handleSelectRun}
                  />
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
