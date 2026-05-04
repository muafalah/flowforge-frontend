import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  GitBranch,
  Eye,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EditWorkflowDialog } from "./edit-workflow-dialog";
import { useDeleteWorkflow } from "../hooks/use-workflow-mutations";
import type { WorkflowDataDto } from "@/api/generated/models";
import type {
  WorkflowControllerFindAllSortBy,
  WorkflowControllerFindAllSortOrder,
} from "@/api/generated/models";

interface WorkflowTableProps {
  workflows: WorkflowDataDto[];
  isLoading: boolean;
  sortBy: WorkflowControllerFindAllSortBy;
  sortOrder: WorkflowControllerFindAllSortOrder;
  onToggleSort: (field: WorkflowControllerFindAllSortBy) => void;
  /** Current user's role in the organization */
  userRole?: string;
  organizationId: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function SortIcon({
  field,
  currentSort,
  currentOrder,
}: {
  field: WorkflowControllerFindAllSortBy;
  currentSort: WorkflowControllerFindAllSortBy;
  currentOrder: WorkflowControllerFindAllSortOrder;
}) {
  if (field !== currentSort) {
    return <ArrowUpDown className="size-3.5 text-muted-foreground/50" />;
  }
  return currentOrder === "asc" ? (
    <ArrowUp className="size-3.5 text-primary" />
  ) : (
    <ArrowDown className="size-3.5 text-primary" />
  );
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12" />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-24" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <TableRow>
      <TableCell colSpan={6} className="h-40">
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="rounded-full bg-muted p-3">
            <GitBranch className="size-6" />
          </div>
          <p className="text-sm font-medium">No workflows found</p>
          <p className="text-xs">Create a new workflow to get started.</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function WorkflowTable({
  workflows,
  isLoading,
  sortBy,
  sortOrder,
  onToggleSort,
  userRole,
  organizationId,
}: WorkflowTableProps) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteWorkflow();

  const [editWorkflow, setEditWorkflow] = useState<WorkflowDataDto | null>(
    null,
  );
  const [deleteWorkflow, setDeleteWorkflow] = useState<WorkflowDataDto | null>(
    null,
  );

  const handleDelete = () => {
    if (!deleteWorkflow) return;
    deleteMutation.mutate(
      {
        organizationId,
        workflowId: deleteWorkflow.id,
      },
      {
        onSuccess: () => setDeleteWorkflow(null),
      },
    );
  };

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-foreground",
                    sortBy === "name"
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                  onClick={() => onToggleSort("name")}
                  aria-label="Sort by name"
                >
                  Name
                  <SortIcon
                    field="name"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                  />
                </button>
              </TableHead>
              <TableHead>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Version
                </span>
              </TableHead>
              <TableHead>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Access
                </span>
              </TableHead>
              <TableHead>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Created By
                </span>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-foreground",
                    sortBy === "createdAt"
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                  onClick={() => onToggleSort("createdAt")}
                  aria-label="Sort by date"
                >
                  Updated
                  <SortIcon
                    field="createdAt"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                  />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingSkeleton />
            ) : workflows.length === 0 ? (
              <EmptyState />
            ) : (
              workflows.map((workflow) => {
                return (
                  <TableRow key={workflow.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-none truncate">
                          {workflow.name}
                        </p>
                        {workflow.description && (
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                            {String(workflow.description)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {workflow.activeVersion ? (
                        <span className="text-sm font-mono text-foreground">
                          v{workflow.activeVersion.version}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {workflow.access === "EDITOR" ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-700 border-blue-500/20 gap-1.5 font-medium py-0.5"
                        >
                          <Pencil className="size-3" />
                          Editor
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-slate-500/10 text-slate-700 border-slate-500/20 gap-1.5 font-medium py-0.5"
                        >
                          <Eye className="size-3" />
                          Viewer
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                            {getInitials(workflow.creator.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 hidden sm:block">
                          <p className="text-sm leading-none truncate">
                            {workflow.creator.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {workflow.creator.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(workflow.updatedAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit — role + access gated */}
                        {(userRole === "OWNER" || userRole === "ADMIN") && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  onClick={() => setEditWorkflow(workflow)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit workflow</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Delete — role + access gated */}
                        {(userRole === "OWNER" || userRole === "ADMIN") && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteWorkflow(workflow)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete workflow</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* View — always available */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                onClick={() =>
                                  navigate(`/workflows/${workflow.id}`)
                                }
                              >
                                <Eye className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View workflow</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit workflow dialog */}
      {editWorkflow && (
        <EditWorkflowDialog
          open={!!editWorkflow}
          onOpenChange={(open) => !open && setEditWorkflow(null)}
          workflow={editWorkflow}
          organizationId={organizationId}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteWorkflow}
        onOpenChange={(open) => !open && setDeleteWorkflow(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deleteWorkflow?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
