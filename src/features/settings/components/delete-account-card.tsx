import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/use-auth";
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
import { useUserControllerRemove } from "@/api/generated/users/users";
import type { AxiosError } from "axios";
import type { ErrorResponseDto } from "@/api/generated/models/errorResponseDto";

export function DeleteAccountCard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteMutation = useUserControllerRemove();

  const handleDeleteAccount = async () => {
    const userId = user?.id;
    if (!userId) return;

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: userId });
      toast.success("Account deleted successfully.");

      // Clear local auth state and navigate to login
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponseDto>;
      const message =
        axiosError.response?.data?.error?.message ||
        "Failed to delete account.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/50 bg-destructive/5 pb-0">
      <CardHeader>
        <CardTitle className="text-destructive">Delete Profile</CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data. Once you
          delete your account, there is no going back. Please be certain.
        </CardDescription>
      </CardHeader>
      <CardFooter className="border-t border-destructive/10 bg-destructive/5 px-6 py-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>
              {isDeleting ? "Deleting account..." : "Delete Account"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleDeleteAccount}
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
