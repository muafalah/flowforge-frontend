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
import { useTransferOwnershipControllerTransferOwnership } from "@/api/generated/organizations/organizations";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";
import { getSelectedOrganizationId } from "@/api/organization-store";
import { useNavigate } from "react-router-dom";

interface TransferOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  onSuccess?: () => void;
}

export function TransferOwnershipDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  onSuccess,
}: TransferOwnershipDialogProps) {
  const [isTransferring, setIsTransferring] = useState(false);
  const organizationId = getSelectedOrganizationId() ?? "";
  const transferOwnership = useTransferOwnershipControllerTransferOwnership();
  const navigate = useNavigate();

  const handleTransfer = async () => {
    if (!organizationId || !memberId) return;

    setIsTransferring(true);
    try {
      const response = await transferOwnership.mutateAsync({
        id: organizationId,
        data: { memberId },
      });

      if (response) {
        toast.success(`Ownership transferred to ${memberName} successfully`);
        onOpenChange(false);
        onSuccess?.();
        // Force a page reload or navigate to ensure role changes are reflected
        navigate(0);
      } else {
        toast.error("Failed to transfer ownership");
      }
    } catch (error) {
      console.error("Error transferring ownership:", error);
      toast.error("An unexpected error occurred during ownership transfer");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px] border-destructive/20 p-6 shadow-xl">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-center gap-3 text-destructive">
            <div className="rounded-full bg-destructive/10 p-2">
              <ShieldAlert className="size-5" />
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight">
              Transfer Ownership
            </AlertDialogTitle>
          </div>

          <AlertDialogDescription className="text-base text-muted-foreground leading-relaxed">
            Transferring ownership to{" "}
            <span className="font-semibold text-foreground">{memberName}</span>{" "}
            is a critical action that will:
            <ul className="mt-2 space-y-1 text-sm text-destructive">
              <li className="flex items-center gap-2">
                <div className="size-1 rounded-full bg-current" />
                Permanently downgrade your role to Admin
              </li>
              <li className="flex items-center gap-2">
                <div className="size-1 rounded-full bg-current" />
                Grant full control to the new owner
              </li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isTransferring}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              handleTransfer();
            }}
            disabled={isTransferring}
          >
            {isTransferring ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Confirm Transfer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
