import { useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  XCircle,
  StopCircle,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecentRun, PaginationMeta } from "../types/dashboard";

interface RecentRunsTableProps {
  runs: RecentRun[];
  meta: PaginationMeta;
  isLoading: boolean;
  statusFilter?: string;
  onStatusFilterChange: (status: string | undefined) => void;
  page: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

function statusIcon(status: string) {
  switch (status) {
    case "PENDING":
      return <Clock className="size-4 text-muted-foreground" />;
    case "RUNNING":
      return <Loader2 className="size-4 text-blue-500 animate-spin" />;
    case "SUCCESS":
      return <CheckCircle2 className="size-4 text-emerald-500" />;
    case "FAILED":
      return <XCircle className="size-4 text-red-500" />;
    case "CANCELLED":
      return <StopCircle className="size-4 text-orange-500" />;
    default:
      return <Clock className="size-4 text-muted-foreground" />;
  }
}

const statusVariants: Record<string, string> = {
  PENDING: "bg-slate-500/10 text-slate-500 border-slate-500/30",
  RUNNING: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  SUCCESS: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  FAILED: "bg-red-500/10 text-red-500 border-red-500/30",
  CANCELLED: "bg-orange-500/10 text-orange-500 border-orange-500/30",
};

function formatDuration(ms?: number | null) {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatTime(dateStr?: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function RecentRunsTable({
  runs,
  meta,
  isLoading,
  statusFilter,
  onStatusFilterChange,
  page,
  onPageChange,
  onRefresh,
}: RecentRunsTableProps) {
  const navigate = useNavigate();
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <Card className="gap-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Recent Runs</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter ?? "ALL"}
              onValueChange={(v) =>
                onStatusFilterChange(v === "ALL" ? undefined : v)
              }
            >
              <SelectTrigger className="h-7 text-xs w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
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
              onClick={onRefresh}
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="size-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No runs found</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-4 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground border-b">
              <span className="w-5" />
              <span>Workflow</span>
              <span>Trigger</span>
              <span>Duration</span>
              <span>Started</span>
              <span className="w-20">Status</span>
            </div>

            {/* Table rows */}
            <div className="divide-y">
              {runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => navigate(`/workflows/${run.workflowId}`)}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 text-sm w-full text-left hover:bg-accent/50 transition-colors items-center"
                >
                  <span className="w-5">{statusIcon(run.status)}</span>
                  <span className="font-medium truncate text-xs">
                    {run.workflowName}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[9px] font-mono px-1.5"
                  >
                    {run.triggerType}
                  </Badge>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatDuration(run.durationMs)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatTime(run.startedAt ?? run.createdAt)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-medium uppercase w-20 justify-center",
                      statusVariants[run.status],
                    )}
                  >
                    {run.status}
                  </Badge>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2 border-t">
                <span className="text-xs text-muted-foreground">
                  {meta.total} total runs
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
