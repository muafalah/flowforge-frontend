import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  createWorkflowSchema,
  type CreateWorkflowFormValues,
} from "../schemas/create-workflow.schema";
import { useCreateWorkflow } from "../hooks/use-workflow-mutations";

interface CreateWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkflowDialog({
  open,
  onOpenChange,
}: CreateWorkflowDialogProps) {
  const { mutate, isPending, organizationId } = useCreateWorkflow();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateWorkflowFormValues>({
    resolver: zodResolver(createWorkflowSchema),
    defaultValues: {
      name: "",
      description: "",
      access: "EDITOR",
    },
  });

  const onSubmit = (values: CreateWorkflowFormValues) => {
    mutate(
      {
        organizationId,
        data: {
          name: values.name,
          ...(values.description ? { description: values.description } : {}),
          access: values.access,
        },
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create Workflow</DialogTitle>
          <DialogDescription>
            Create a new workflow for your organization. You can define the
            execution graph after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workflow-name">Name</Label>
            <Input
              id="workflow-name"
              placeholder="e.g., Data Sync Pipeline"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow-description">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="workflow-description"
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
                  <SelectTrigger className="w-full">
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
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Workflow
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
