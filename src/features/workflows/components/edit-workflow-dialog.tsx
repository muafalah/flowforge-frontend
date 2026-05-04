import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, Pencil } from "lucide-react";
import { useUpdateWorkflow } from "../hooks/use-workflow-mutations";
import type { WorkflowDataDto } from "@/api/generated/models";

const editWorkflowSchema = z.object({
  name: z
    .string()
    .min(3, "Workflow name must be at least 3 characters")
    .max(100, "Workflow name must be at most 100 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .or(z.literal("")),
  access: z.enum(["EDITOR", "VIEWER"]),
});

type EditWorkflowFormValues = z.infer<typeof editWorkflowSchema>;

interface EditWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: WorkflowDataDto;
  organizationId: string;
}

export function EditWorkflowDialog({
  open,
  onOpenChange,
  workflow,
  organizationId,
}: EditWorkflowDialogProps) {
  const updateMutation = useUpdateWorkflow(workflow.id);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<EditWorkflowFormValues>({
    resolver: zodResolver(editWorkflowSchema),
    defaultValues: {
      name: workflow.name,
      description: String(workflow.description ?? ""),
      access: (workflow.access as "EDITOR" | "VIEWER") ?? "EDITOR",
    },
  });

  // Sync form when workflow data changes (e.g., after a successful update)
  useEffect(() => {
    if (open) {
      reset({
        name: workflow.name,
        description: String(workflow.description ?? ""),
        access: (workflow.access as "EDITOR" | "VIEWER") ?? "EDITOR",
      });
    }
  }, [open, workflow, reset]);

  const onSubmit = (values: EditWorkflowFormValues) => {
    updateMutation.mutate(
      {
        organizationId,
        workflowId: workflow.id,
        data: {
          name: values.name,
          description: (values.description || undefined) as unknown as
            | Record<string, unknown>
            | undefined,
          access: values.access,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Workflow</DialogTitle>
          <DialogDescription>
            Update the workflow details. Changes are saved immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-workflow-name">Name</Label>
            <Input
              id="edit-workflow-name"
              placeholder="e.g., Data Sync Pipeline"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-workflow-description">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="edit-workflow-description"
              placeholder="Describe what this workflow does..."
              rows={3}
              className="resize-none"
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Access</Label>
            <Controller
              control={control}
              name="access"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EDITOR">
                      <div className="flex items-center gap-2">
                        <Pencil className="size-3.5 text-muted-foreground" />
                        <span>Editor</span>
                        <span className="text-xs text-muted-foreground">
                          — Members can edit
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="VIEWER">
                      <div className="flex items-center gap-2">
                        <Eye className="size-3.5 text-muted-foreground" />
                        <span>Viewer</span>
                        <span className="text-xs text-muted-foreground">
                          — Members can only view
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Controls access for members. Owners and admins always have full
              access.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || !isDirty}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
