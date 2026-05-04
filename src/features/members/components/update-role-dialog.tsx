import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMembershipControllerUpdateRole } from "@/api/generated/organization-members/organization-members";
import { toast } from "sonner";
import { Loader2, ShieldCheck, User, Check } from "lucide-react";
import { getSelectedOrganizationId } from "@/api/organization-store";
import { Label } from "@/components/ui/label";
import type { UpdateMemberRoleDtoRole } from "@/api/generated/models";
import { cn } from "@/lib/utils";

interface UpdateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  currentRole: UpdateMemberRoleDtoRole;
  onSuccess?: () => void;
}

export function UpdateRoleDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  currentRole,
  onSuccess,
}: UpdateRoleDialogProps) {
  const [role, setRole] = useState<UpdateMemberRoleDtoRole>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);
  const organizationId = getSelectedOrganizationId() ?? "";
  const updateRole = useMembershipControllerUpdateRole();

  const handleUpdate = async () => {
    if (!organizationId || !memberId) return;
    if (role === currentRole) {
      onOpenChange(false);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await updateRole.mutateAsync({
        id: organizationId,
        memberId,
        data: { role },
      });

      // The API client returns the data directly. If mutateAsync doesn't throw, it's a success.
      if (response) {
        toast.success(`Role for ${memberName} updated to ${role}`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error("Failed to update member role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("An unexpected error occurred while updating the role");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Member Role</DialogTitle>
          <DialogDescription>
            Change the organizational role for <strong>{memberName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-3">
            <Label>Select Role</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                disabled={isUpdating}
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all hover:bg-accent focus:outline-none focus:ring-1 focus:ring-primary",
                  role === "ADMIN"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-muted bg-transparent",
                  isUpdating && "opacity-50 cursor-not-allowed",
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <div
                    className={cn(
                      "rounded-lg p-2",
                      role === "ADMIN"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <ShieldCheck className="size-5" />
                  </div>
                  {role === "ADMIN" && (
                    <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold">Admin</div>
                  <div className="mt-1 text-xs text-muted-foreground leading-tight">
                    Can manage members and organization details.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("MEMBER")}
                disabled={isUpdating}
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all hover:bg-accent focus:outline-none focus:ring-1 focus:ring-primary",
                  role === "MEMBER"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-muted bg-transparent",
                  isUpdating && "opacity-50 cursor-not-allowed",
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <div
                    className={cn(
                      "rounded-lg p-2",
                      role === "MEMBER"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <User className="size-5" />
                  </div>
                  {role === "MEMBER" && (
                    <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold">Member</div>
                  <div className="mt-1 text-xs text-muted-foreground leading-tight">
                    Has basic access to the organization resources.
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isUpdating || role === currentRole}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
