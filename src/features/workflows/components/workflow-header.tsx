import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, Loader2, Pencil } from "lucide-react";
import { EditWorkflowDialog } from "./edit-workflow-dialog";
import { useDeleteWorkflow } from "../hooks/use-workflow-mutations";
import type { WorkflowDataDto } from "@/api/generated/models";

interface WorkflowHeaderProps {
  workflow: WorkflowDataDto;
  organizationId: string;
  userRole: "OWNER" | "ADMIN" | "MEMBER";
}

export function WorkflowHeader({
  workflow,
  organizationId,
  userRole,
}: WorkflowHeaderProps) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteWorkflow();
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate({
      organizationId,
      workflowId: workflow.id,
    });
  };

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

          {(userRole === "OWNER" || userRole === "ADMIN") && (
            <div className="flex items-center gap-2">
              {/* Edit */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-4" />
                Edit
              </Button>

              {/* Delete */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete{" "}
                      <span className="font-medium text-foreground">
                        {workflow.name}
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
