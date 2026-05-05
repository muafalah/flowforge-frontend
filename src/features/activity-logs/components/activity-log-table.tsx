import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownUp } from "lucide-react";
import { ActivityBadge } from "./activity-badge";
import type { ActivityLogItemDto } from "@/api/generated/models";

interface ActivityLogTableProps {
  logs: ActivityLogItemDto[];
  isLoading: boolean;
  sortOrder: "asc" | "desc";
  onToggleSortOrder: () => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

function formatTargetType(type: string): string {
  if (!type) return "-";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function getDescription(log: ActivityLogItemDto): string {
  const actorName = log.actor.name;
  const targetName = log.targetName ?? "an item";
  const metadata = log.metadata;

  switch (log.action) {
    case "member.added":
      return `${actorName} added ${targetName} as ${(metadata?.role as string)?.toLowerCase() ?? "member"}`;
    case "member.removed":
      return `${actorName} removed a member`;
    case "member.role_updated":
      return `${actorName} changed role from ${(metadata?.oldRole as string)?.toLowerCase() ?? "?"} to ${(metadata?.newRole as string)?.toLowerCase() ?? "?"}`;
    case "ownership.transferred":
      return `${actorName} transferred ownership`;
    case "organization.updated":
      return `${actorName} updated organization${metadata?.newName ? ` to "${metadata.newName}"` : ""}`;
    case "organization.deleted":
      return `${actorName} deleted organization "${targetName}"`;
    case "workflow.created":
      return `${actorName} created workflow "${targetName}"`;
    case "workflow.updated":
      return `${actorName} updated workflow "${targetName}"`;
    case "workflow.deleted":
      return `${actorName} deleted workflow "${targetName}"`;
    case "version.created":
      return `${actorName} created ${targetName} for workflow "${(metadata?.workflowName as string) ?? "unknown"}"`;
    case "version.activated":
      return `${actorName} activated ${targetName}`;
    case "run.triggered":
      return `${actorName} triggered a run for "${targetName}"`;
    case "run.completed":
      return `Run for "${targetName}" completed successfully`;
    case "run.failed":
      return `Run for "${targetName}" failed`;
    case "run.cancelled":
      return `${actorName} cancelled a run`;
    default:
      return `${actorName} performed ${log.action}`;
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-6 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-64" />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function ActivityLogTable({
  logs,
  isLoading,
  sortOrder,
  onToggleSortOrder,
}: ActivityLogTableProps) {
  if (!isLoading && logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground text-sm">
          No activity logs found. Activity will appear here as members perform
          actions.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[160px]">Action</TableHead>
            <TableHead className="w-[120px]">Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[220px]">Actor</TableHead>
            <TableHead className="w-[140px]">
              <button
                type="button"
                onClick={onToggleSortOrder}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Date
                <ArrowDownUp className="h-3.5 w-3.5" />
                <span className="sr-only">
                  Sort {sortOrder === "desc" ? "ascending" : "descending"}
                </span>
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <ActivityBadge action={log.action} />
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatTargetType(log.targetType)}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getDescription(log)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(log.actor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {log.actor.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {log.actor.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm text-muted-foreground cursor-default">
                          {formatRelativeTime(log.createdAt)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{formatFullDate(log.createdAt)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
