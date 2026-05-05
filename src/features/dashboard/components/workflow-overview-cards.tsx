import { useNavigate } from "react-router-dom";
import {
  Play,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MiniDagPreview } from "./mini-dag-preview";
import type { WorkflowSummary } from "../types/dashboard";

interface WorkflowOverviewCardsProps {
  workflows: WorkflowSummary[];
  isLoading: boolean;
}

function formatDuration(ms: number | null) {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function statusIcon(status: string | null) {
  switch (status) {
    case "SUCCESS":
      return <CheckCircle2 className="size-3.5 text-emerald-500" />;
    case "FAILED":
      return <XCircle className="size-3.5 text-red-500" />;
    case "RUNNING":
      return <Loader2 className="size-3.5 text-blue-500 animate-spin" />;
    case "PENDING":
      return <Clock className="size-3.5 text-muted-foreground" />;
    default:
      return <Clock className="size-3.5 text-muted-foreground/40" />;
  }
}

const statusColors: Record<string, string> = {
  SUCCESS: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  FAILED: "bg-red-500/10 text-red-600 border-red-500/30",
  RUNNING: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  PENDING: "bg-slate-500/10 text-slate-600 border-slate-500/30",
  CANCELLED: "bg-orange-500/10 text-orange-600 border-orange-500/30",
};

const MAX_DISPLAYED_WORKFLOWS = 6;

export function WorkflowOverviewCards({
  workflows,
  isLoading,
}: WorkflowOverviewCardsProps) {
  const navigate = useNavigate();

  // Show only the most recently updated workflows (backend already sorts by updatedAt desc)
  const displayedWorkflows = workflows.slice(0, MAX_DISPLAYED_WORKFLOWS);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: MAX_DISPLAYED_WORKFLOWS }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full mb-3" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (displayedWorkflows.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">Last Updated Workflow</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayedWorkflows.map((wf) => {
          const successRate =
            wf.totalRuns24h > 0
              ? Math.round((wf.successCount24h / wf.totalRuns24h) * 100)
              : null;

          return (
            <Card
              key={wf.id}
              className="group relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              onClick={() => navigate(`/workflows/${wf.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">
                      {wf.name}
                    </CardTitle>
                    {wf.description && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {wf.description}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="size-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                {/* Mini DAG */}
                <MiniDagPreview
                  definition={wf.activeVersionDefinition}
                  height={100}
                />

                {/* Stats row */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    {wf.lastRunStatus ? (
                      <>
                        {statusIcon(wf.lastRunStatus)}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[8px] font-medium uppercase px-1.5",
                            statusColors[wf.lastRunStatus] ?? "",
                          )}
                        >
                          {wf.lastRunStatus}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDuration(wf.lastRunDuration)}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        No runs yet
                      </span>
                    )}
                  </div>

                  {successRate !== null && (
                    <div className="flex items-center gap-1.5">
                      {/* Tiny progress ring */}
                      <div className="relative size-5">
                        <svg className="size-5 -rotate-90" viewBox="0 0 20 20">
                          <circle
                            cx="10"
                            cy="10"
                            r="8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-muted/30"
                          />
                          <circle
                            cx="10"
                            cy="10"
                            r="8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${successRate * 0.503} 50.3`}
                            className="text-emerald-500"
                          />
                        </svg>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {successRate}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick run button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/workflows/${wf.id}`);
                  }}
                >
                  <Play className="size-3" />
                  Open Workflow
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
