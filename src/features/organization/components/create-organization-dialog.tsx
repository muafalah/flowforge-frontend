import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import type { AxiosError } from "axios";
import { useOrganizationControllerCreate } from "@/api/generated/organizations/organizations";
import {
  createOrganizationSchema,
  type CreateOrganizationFormValues,
} from "@/features/organization/schemas/organization-schemas";
import { setSelectedOrganizationId } from "@/api/organization-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ErrorResponseDto } from "@/api/generated/models/errorResponseDto";

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {

  const [isSubmitting, setIsSubmitting] = useState(false);
  const createOrgMutation = useOrganizationControllerCreate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (formData: CreateOrganizationFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await createOrgMutation.mutateAsync({
        data: { name: formData.name },
      });

      // The backend response wraps the data in { data: { organization: { id: ... } } }
      const newOrgId = (
        response as unknown as { data?: { organization?: { id: string } } }
      )?.data?.organization?.id;

      if (newOrgId) {
        setSelectedOrganizationId(newOrgId);
      }

      toast.success("Organization created successfully!");
      onOpenChange(false);
      reset();
      // Use window.location.assign to force a full page refresh and redirect to dashboard
      // This ensures all organization-context-dependent data is re-fetched
      window.location.assign("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponseDto>;
      const message =
        axiosError.response?.data?.error?.message ||
        "Failed to create organization. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Choose a name for your new organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              type="text"
              placeholder="e.g. Acme Corp"
              autoComplete="organization"
              autoFocus
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
