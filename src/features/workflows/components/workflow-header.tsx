import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EditWorkflowDialog } from "./edit-workflow-dialog";
import { RunPanel } from "./run-panel";
import { TriggersPanel } from "./triggers-panel";
import { useWorkflowRuns } from "../hooks/use-workflow-runs";
import type { WorkflowDataDto } from "@/api/generated/models";

interface WorkflowHeaderProps {
  workflow: WorkflowDataDto;
  organizationId: string;
  readOnly?: boolean;
}

export function WorkflowHeader({
  workflow,
  organizationId,
  readOnly,
}: WorkflowHeaderProps) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const { triggerRun, isTriggering } = useWorkflowRuns(workflow.id);

  const handleTrigger = useCallback(async () => {
    try {
      const run = await triggerRun();
      toast.success(`Run #${run.id.slice(0, 8)} triggered.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to trigger run.";
      toast.error(msg);
    }
  }, [triggerRun]);

  return (
    <>
      <div className="space-y-4">
        {/* Breadcrumb */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => navigate("/workflows")}
        >
          <ArrowLeft className="size-4" />
          Back to Workflows
        </Button>

        {/* Title + actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                {workflow.name}
              </h2>
            </div>
            {workflow.description ? (
              <p className="text-muted-foreground text-sm max-w-xl">
                {String(workflow.description)}
              </p>
            ) : (
              <p className="text-muted-foreground/50 italic text-sm max-w-xl">
                No description available
              </p>
            )}
          </div>

          {!readOnly && (
            <div className="flex items-center gap-2">
              {/* Run Now Button */}
              <Button
                size="sm"
                onClick={handleTrigger}
                disabled={isTriggering}
                className="gap-1.5 h-8 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                {isTriggering ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Rocket className="size-3.5" />
                )}
                Run
              </Button>

              {/* Run Panel */}
              <RunPanel workflowId={workflow.id} readOnly={false} />

              {/* Triggers Panel */}
              <TriggersPanel workflowId={workflow.id} readOnly={false} />
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <EditWorkflowDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        workflow={workflow}
        organizationId={organizationId}
      />
    </>
  );
}
