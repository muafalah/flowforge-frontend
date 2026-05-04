import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Plus, Save, Loader2, Trash2, History, Check, RotateCcw, Pencil, Power,
  Eye, Rocket, Square,
} from "lucide-react";
import { formatDate } from "../utils/auto-layout";
import type { EditorToolbarProps } from "../types";

export function EditorToolbar({
  readOnly, nodes, edges, selectedNodes, selectedEdges,
  isDirty, isPending, activeVersionNumber, versions,
  workflowRunning, activateMutation,
  onAddNodeOpen, onEditSelected, onDeleteSelected, onSave,
  onRunWorkflow, onStopWorkflow, onRestoreVersion, onActivateVersion,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b bg-muted/30 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex items-center gap-2 shrink-0">
        {/* Add Node */}
        {!readOnly && (
          <Button size="sm" variant="outline"
            className="gap-1.5 size-8 px-0 sm:w-auto sm:px-3 shrink-0"
            onClick={onAddNodeOpen}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add Node</span>
          </Button>
        )}

        {/* Edit Selected (single node) */}
        {!readOnly && selectedNodes.length === 1 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline"
                  className="gap-1.5 size-8 px-0 sm:w-auto sm:px-3 shrink-0"
                  onClick={onEditSelected}>
                  <Pencil className="size-4" />
                  <span className="hidden sm:inline">Edit Node</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit selected node</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Delete Selected */}
        {!readOnly && (selectedNodes.length > 0 || selectedEdges.length > 0) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline"
                  className="gap-1.5 px-2 sm:px-3 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 shrink-0"
                  onClick={onDeleteSelected}>
                  <Trash2 className="size-4" />
                  <span className="hidden sm:inline">Delete</span>
                  <span className="text-xs">({selectedNodes.length + selectedEdges.length})</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete selected items</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* View Only badge */}
        {readOnly && (
          <Badge variant="outline"
            className="bg-blue-500/10 text-blue-700 border-blue-500/20 text-xs shrink-0">
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
          <Badge variant="outline"
            className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-xs ml-1 shrink-0">
            <span className="hidden sm:inline">Unsaved changes</span>
            <span className="sm:hidden">Unsaved</span>
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Run Workflow button */}
        {nodes.length > 0 && (
          <>
            {workflowRunning ? (
              <Button size="sm" variant="outline"
                className="gap-1.5 size-8 px-0 sm:w-auto sm:px-3 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 shrink-0"
                onClick={onStopWorkflow}>
                <Square className="size-3.5 fill-current" />
                <span className="hidden sm:inline">Stop</span>
              </Button>
            ) : (
              <Button size="sm" variant="outline"
                className="gap-1.5 size-8 px-0 sm:w-auto sm:px-3 text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 shrink-0"
                onClick={onRunWorkflow}>
                <Rocket className="size-4" />
                <span className="hidden sm:inline">Run</span>
              </Button>
            )}
          </>
        )}

        {/* Version History */}
        {versions.length > 0 && (
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 px-2 sm:px-3 shrink-0">
                <History className="size-4" />
                <span className="hidden sm:inline">History</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
                  {versions.length}
                </Badge>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-80 sm:w-96">
              <SheetHeader className="px-6">
                <SheetTitle>Version History</SheetTitle>
                <SheetDescription>Manage and restore previous workflow versions</SheetDescription>
              </SheetHeader>

              <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-120px)] px-6">
                {versions.map((v) => (
                  <div key={v.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium">v{v.version}</span>
                        {v.isActive && (
                          <Badge variant="outline"
                            className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] px-1.5">
                            <Check className="size-2.5 mr-0.5" />Active
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
                              <Button variant="ghost" size="icon"
                                className="size-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                                onClick={() => onActivateVersion(v.id)}
                                disabled={activateMutation.isPending}>
                                {activateMutation.isPending ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Power className="size-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Set as active version</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {/* Restore to editor */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon"
                              className="size-8 text-muted-foreground hover:text-primary"
                              onClick={() => onRestoreVersion(v)}>
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
          <Button size="sm" onClick={onSave}
            disabled={isPending || nodes.length === 0 || !isDirty}
            className="gap-1.5 size-8 px-0 sm:w-auto sm:px-3 shrink-0">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            <span className="hidden sm:inline">Save</span>
          </Button>
        )}
      </div>
    </div>
  );
}
