import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMembershipControllerRemoveMember } from "@/api/generated/organization-members/organization-members";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getSelectedOrganizationId } from "@/api/organization-store";

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  memberEmail: string;
  onSuccess?: () => void;
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  memberEmail,
  onSuccess,
}: RemoveMemberDialogProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const organizationId = getSelectedOrganizationId() ?? "";
  const removeMember = useMembershipControllerRemoveMember();

  const handleRemove = async () => {
    if (!organizationId || !memberId) return;

    setIsRemoving(true);
    try {
      const response = await removeMember.mutateAsync({
        id: organizationId,
        memberId,
      });

      if (response.status === 200) {
        toast.success(`Member ${memberName} removed successfully`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error("Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("An unexpected error occurred while removing the member");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{memberName}</strong> (
            {memberEmail}) from this organization? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleRemove();
            }}
            disabled={isRemoving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRemoving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Removing...
              </>
            ) : (
              "Remove Member"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
