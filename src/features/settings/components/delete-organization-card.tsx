import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useOrganizationControllerRemove } from "@/api/generated/organizations/organizations";
import {
  getSelectedOrganizationId,
  clearSelectedOrganizationId,
} from "@/api/organization-store";
import type { AxiosError } from "axios";
import type { ErrorResponseDto } from "@/api/generated/models/errorResponseDto";

export function DeleteOrganizationCard() {
  const [isDeleting, setIsDeleting] = useState(false);
  const selectedOrgId = getSelectedOrganizationId();
  const deleteMutation = useOrganizationControllerRemove();

  const handleDeleteOrganization = async () => {
    if (!selectedOrgId) return;

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: selectedOrgId });
      toast.success("Organization deleted successfully.");

      // Clear the active organization and refresh so guards can prompt again
      clearSelectedOrganizationId();
      window.location.assign("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponseDto>;
      const message =
        axiosError.response?.data?.error?.message ||
        "Failed to delete organization.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!selectedOrgId) {
    return null;
  }

  return (
    <Card className="border-destructive/50 bg-destructive/5 pb-0">
      <CardHeader>
        <CardTitle className="text-destructive">Delete Organization</CardTitle>
        <CardDescription>
          Permanently delete this organization and all associated data. Once you
          delete an organization, there is no going back. Please be certain.
        </CardDescription>
      </CardHeader>
      <CardFooter className="border-t border-destructive/10 bg-destructive/5 px-6 py-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>
              {isDeleting ? "Deleting organization..." : "Delete Organization"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                organization and remove its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleDeleteOrganization}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
