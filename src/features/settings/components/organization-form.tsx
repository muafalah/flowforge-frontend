import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  organizationSchema,
  type OrganizationFormValues,
} from "../schemas/settings-schemas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useOrganizationControllerFindOne,
  useOrganizationControllerUpdate,
  getOrganizationControllerFindAllQueryKey,
  getOrganizationControllerFindOneQueryKey,
} from "@/api/generated/organizations/organizations";
import { useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { ErrorResponseDto } from "@/api/generated/models/errorResponseDto";
import { getSelectedOrganizationId } from "@/api/organization-store";

interface Organization {
  id: string;
  name: string;
}

export function OrganizationForm() {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedOrgId = getSelectedOrganizationId();

  const { data: orgData, isLoading } = useOrganizationControllerFindOne(
    selectedOrgId || "",
    {
      query: {
        enabled: !!selectedOrgId,
      },
    },
  );

  const updateMutation = useOrganizationControllerUpdate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    const org = (
      orgData as unknown as { data?: { organization?: Organization } }
    )?.data?.organization;

    if (org?.name) {
      reset({
        name: org.name,
      });
    }
  }, [orgData, reset]);

  const onSubmit = async (data: OrganizationFormValues) => {
    if (!selectedOrgId) return;
    setIsSubmitting(true);

    try {
      await updateMutation.mutateAsync({
        id: selectedOrgId,
        data: { name: data.name },
      });
      toast.success("Organization updated successfully!");

      // Invalidate relevant queries so the UI updates
      queryClient.invalidateQueries({
        queryKey: getOrganizationControllerFindOneQueryKey(selectedOrgId),
      });
      queryClient.invalidateQueries({
        queryKey: getOrganizationControllerFindAllQueryKey(),
      });

      reset(data);
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponseDto>;
      const message =
        axiosError.response?.data?.error?.message ||
        "Failed to update organization.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedOrgId) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>Update your organization information.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">
            Loading organization data...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                placeholder="Your organization name"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm font-medium text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={isSubmitting || !isDirty}
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
