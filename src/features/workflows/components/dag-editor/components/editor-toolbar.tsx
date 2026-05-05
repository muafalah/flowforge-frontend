import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Plus,
  Save,
  Loader2,
  Trash2,
  History,
  Check,
  RotateCcw,
  Pencil,
  Power,
  Eye,
  Square,
  Play,
  Copy,
} from "lucide-react";
import { formatDate } from "../utils/auto-layout";
import type { EditorToolbarProps } from "../types";

export function EditorToolbar({
  readOnly,
  nodes,
  edges,
  selectedNodes,
  selectedEdges,
  isDirty,
  isPending,
  activeVersionNumber,
  versions,
  workflowRunning,
  activateMutation,
  onAddNodeOpen,
  onEditSelected,
  onDeleteSelected,
  onDuplicateSelected,
  onSave,
  onRunWorkflow,
  onStopWorkflow,
  onRestoreVersion,
  onActivateVersion,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-2 px-4 py-2.5 border-b bg-muted/30 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex items-center gap-2 shrink-0 order-2 md:order-1 w-full md:w-auto justify-center md:justify-start">
        {/* Add Node */}
        {!readOnly && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 size-8 px-0 sm:w-auto sm:px-3 shrink-0"
                  onClick={onAddNodeOpen}
                >
                  <Plus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add node</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Edit Selected (single node) */}
        {!readOnly && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 size-8 px-0 sm:w-auto sm:px-3 shrink-0"
                  onClick={onEditSelected}
                  disabled={selectedNodes.length !== 1}
                >
                  <Pencil className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit selected node</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Delete Selected */}
        {!readOnly && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 px-2 sm:px-3 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 shrink-0"
                  onClick={onDeleteSelected}
                  disabled={
                    !(selectedNodes.length > 0 || selectedEdges.length > 0)
                  }
                >
                  <Trash2 className="size-4" />
                  {selectedNodes.length + selectedEdges.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 ml-0.5"
                    >
                      {selectedNodes.length + selectedEdges.length}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete selected items</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Duplicate Selected Nodes */}
        {!readOnly && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 px-2 sm:px-3 shrink-0"
                  onClick={onDuplicateSelected}
                  disabled={selectedNodes.length === 0}
                >
                  <Copy className="size-4" />
                  {selectedNodes.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 ml-0.5"
                    >
                      {selectedNodes.length}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicate selected nodes</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* View Only badge */}
        {readOnly && (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-700 border-blue-500/20 text-xs shrink-0"
          >
            <Eye className="size-3 sm:mr-1" />
            <span className="hidden sm:inline">View Only</span>
          </Badge>
        )}

        {/* Stats */}
        <span className="text-xs text-muted-foreground ml-2 hidden md:inline-flex shrink-0">
          {nodes.length} node{nodes.length !== 1 ? "s" : ""} · {edges.length}{" "}
          edge{edges.length !== 1 ? "s" : ""}
          {activeVersionNumber != null && (
            <span className="ml-2">· v{activeVersionNumber}</span>
          )}
        </span>

        {!readOnly && isDirty && (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-xs ml-1 shrink-0 hidden md:block"
          >
            <span>Unsaved</span>
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 order-1 md:order-2 w-full md:w-auto justify-center md:justify-end">
        {/* Run Workflow button */}
        {nodes.length > 0 && (
          <>
            {workflowRunning ? (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 px-2 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 shrink-0"
                onClick={onStopWorkflow}
              >
                <Square className="size-3.5 fill-current" />
                <span>Stop</span>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 shrink-0"
                onClick={onRunWorkflow}
              >
                <Play className="size-3.5" />
                <span>Test</span>
              </Button>
            )}
          </>
        )}

        {/* Version History */}
        {versions.length > 0 && (
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 px-2 sm:px-3 shrink-0"
              >
                <History className="size-4" />
                <span>Version</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 ml-0.5"
                >
                  {versions.length}
                </Badge>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-80 sm:w-96">
              <SheetHeader className="px-4 sm:px-6 border-b">
                <SheetTitle>Version History</SheetTitle>
                <SheetDescription>
                  Manage and restore previous workflow versions
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-120px)] px-4 sm:px-6">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium">
                          v{v.version}
                        </span>
                        {v.isActive && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] px-1.5"
                          >
                            <Check className="size-2.5 mr-0.5" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {v.creator.name} · {formatDate(v.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Activate version */}
                      {!readOnly && !v.isActive && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                                onClick={() => onActivateVersion(v.id)}
                                disabled={activateMutation.isPending}
                              >
                                {activateMutation.isPending ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Power className="size-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Set as active version
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {/* Restore to editor */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-primary"
                              onClick={() => onRestoreVersion(v)}
                            >
                              <RotateCcw className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Restore to editor</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Save */}
        {!readOnly && (
          <Button
            size="sm"
            onClick={onSave}
            disabled={isPending || nodes.length === 0 || !isDirty}
            className="gap-1.5 px-2 sm:px-3 shrink-0"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            <span>Save</span>
          </Button>
        )}
      </div>
    </div>
  );
}
