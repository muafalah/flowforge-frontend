import {
  Play,
  CheckCircle2,
  XCircle,
  StopCircle,
  Settings,
  Zap,
  GitBranch,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityFeedItem, PaginationMeta } from "../types/dashboard";

interface ActivityFeedProps {
  items: ActivityFeedItem[];
  meta: PaginationMeta;
  isLoading: boolean;
  isConnected: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

function getActivityIcon(action: string) {
  if (action.includes("triggered")) return Play;
  if (action.includes("completed")) return CheckCircle2;
  if (action.includes("failed")) return XCircle;
  if (action.includes("cancelled")) return StopCircle;
  if (action.includes("workflow")) return GitBranch;
  if (action.includes("version")) return Settings;
  if (action.includes("member")) return UserCircle;
  return Zap;
}

function getActivityColor(action: string) {
  if (action.includes("triggered")) return "text-blue-500 bg-blue-500/10";
  if (action.includes("completed")) return "text-emerald-500 bg-emerald-500/10";
  if (action.includes("failed")) return "text-red-500 bg-red-500/10";
  if (action.includes("cancelled")) return "text-orange-500 bg-orange-500/10";
  return "text-violet-500 bg-violet-500/10";
}

function formatRelativeTime(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatActivityMessage(item: ActivityFeedItem): string {
  const name = item.targetName ?? item.targetId?.slice(0, 8) ?? "";
  const actor = item.actorName ?? "System";
  const action = item.action;

  if (action === "run.triggered") return `${actor} triggered ${name}`;
  if (action === "run.completed") return `${name} completed successfully`;
  if (action === "run.failed") return `${name} failed`;
  if (action === "run.cancelled") return `${actor} cancelled ${name}`;
  if (action === "workflow.created") return `${actor} created workflow ${name}`;
  if (action === "workflow.updated") return `${actor} updated ${name}`;
  if (action === "workflow.deleted") return `${actor} deleted ${name}`;
  if (action === "version.created") return `New version for ${name}`;
  if (action === "version.activated") return `Activated version for ${name}`;
  if (action === "member.added") return `${actor} added ${name}`;
  if (action === "member.removed") return `${actor} removed ${name}`;

  // Fallback: humanize the action
  return `${actor} — ${action.replace(/\./g, " ")}`;
}

export function ActivityFeed({
  items,
  meta,
  isLoading,
  isConnected,
  page,
  onPageChange,
}: ActivityFeedProps) {
  const totalPages = Math.ceil(meta.total / meta.limit);
  return (
    <Card className="gap-2">
      <CardHeader className="py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Live Activity</CardTitle>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full",
                isConnected ? "bg-emerald-500" : "bg-red-500",
              )}
            />
            <span className="text-[10px] text-muted-foreground">
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Zap className="size-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Activity will appear here in real-time
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[420px]">
            <div className="px-4 pb-4 space-y-1">
              {items.map((item, idx) => {
                const Icon = getActivityIcon(item.action);
                const colorClass = getActivityColor(item.action);

                return (
                  <div
                    key={`${item.timestamp}-${idx}`}
                    className="flex items-start gap-3 py-2 px-1 rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className={cn(
                        "rounded-full p-1.5 shrink-0 mt-0.5",
                        colorClass,
                      )}
                    >
                      <Icon className="size-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug">
                        {formatActivityMessage(item)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Pagination */}
        {!isLoading && items.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t mt-auto">
            <span className="text-xs text-muted-foreground">
              {meta.total} events
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
      </CardContent>
    </Card>
  );
}
