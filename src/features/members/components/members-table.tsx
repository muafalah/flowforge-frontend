import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  Trash2,
  UserCog,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RoleBadge } from "./role-badge";
import type { Member } from "../types";
import type {
  MembershipControllerFindAllSortBy,
  MembershipControllerFindAllSortOrder,
} from "@/api/generated/models";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RemoveMemberDialog } from "./remove-member-dialog";
import { UpdateRoleDialog } from "./update-role-dialog";
import { TransferOwnershipDialog } from "./transfer-ownership-dialog";

interface MembersTableProps {
  members: Member[];
  isLoading: boolean;
  sortBy: MembershipControllerFindAllSortBy;
  sortOrder: MembershipControllerFindAllSortOrder;
  onToggleSort: (field: MembershipControllerFindAllSortBy) => void;
  currentUserId?: string;
  currentUserRole?: "OWNER" | "ADMIN" | "MEMBER";
  refetch: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

function SortIcon({
  field,
  currentSort,
  currentOrder,
}: {
  field: MembershipControllerFindAllSortBy;
  currentSort: MembershipControllerFindAllSortBy;
  currentOrder: MembershipControllerFindAllSortOrder;
}) {
  if (field !== currentSort) {
    return <ArrowUpDown className="size-3.5 text-muted-foreground/50" />;
  }
  return currentOrder === "asc" ? (
    <ArrowUp className="size-3.5 text-primary" />
  ) : (
    <ArrowDown className="size-3.5 text-primary" />
  );
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <TableRow>
      <TableCell colSpan={4} className="h-40">
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="rounded-full bg-muted p-3">
            <Users className="size-6" />
          </div>
          <p className="text-sm font-medium">No members found</p>
          <p className="text-xs">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function MembersTable({
  members,
  isLoading,
  sortBy,
  sortOrder,
  onToggleSort,
  currentUserId,
  currentUserRole,
  refetch,
}: MembersTableProps) {
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [memberToUpdate, setMemberToUpdate] = useState<Member | null>(null);
  const [memberToTransfer, setMemberToTransfer] = useState<Member | null>(null);

  const isOwner = currentUserRole === "OWNER";
  const isAdmin = currentUserRole === "ADMIN";
  const isMember = currentUserRole === "MEMBER";

  const getCanRemove = (targetMember: Member) => {
    if (targetMember.user.id === currentUserId) return false;
    if (isOwner) return true;
    if (isAdmin) return targetMember.role === "MEMBER";
    return false;
  };

  const getCanUpdateRole = (targetMember: Member) => {
    if (targetMember.user.id === currentUserId) return false;
    return isOwner;
  };

  const getCanTransfer = (targetMember: Member) => {
    if (targetMember.user.id === currentUserId) return false;
    return isOwner && targetMember.role === "ADMIN";
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-foreground",
                  sortBy === "name"
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
                onClick={() => onToggleSort("name")}
                aria-label="Sort by name"
              >
                Member
                <SortIcon
                  field="name"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                />
              </button>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-foreground",
                    sortBy === "role"
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                  onClick={() => onToggleSort("role")}
                  aria-label="Sort by role"
                >
                  Role
                  <SortIcon
                    field="role"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                  />
                </button>
              </div>
            </TableHead>
            <TableHead>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-foreground",
                  sortBy === "createdAt"
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
                onClick={() => onToggleSort("createdAt")}
                aria-label="Sort by joined date"
              >
                Joined
                <SortIcon
                  field="createdAt"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                />
              </button>
            </TableHead>
            {!isMember && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton />
          ) : members.length === 0 ? (
            <EmptyState />
          ) : (
            members.map((member) => (
              <TableRow key={member.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9 transition-shadow group-hover:ring-2 group-hover:ring-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {getInitials(member.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {member.user.name}
                        {member.user.id === currentUserId && (
                          <span className="ml-1 text-xs text-muted-foreground font-light">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <RoleBadge role={member.role} />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(member.createdAt)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {getCanTransfer(member) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => setMemberToTransfer(member)}
                              aria-label={`Transfer ownership to ${member.user.name}`}
                            >
                              <Crown className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Transfer Ownership</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {getCanUpdateRole(member) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => setMemberToUpdate(member)}
                              aria-label={`Update role for ${member.user.name}`}
                            >
                              <UserCog className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Update Role</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {getCanRemove(member) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setMemberToRemove(member)}
                              aria-label={`Remove ${member.user.name}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove Member</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <RemoveMemberDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        memberId={memberToRemove?.id ?? ""}
        memberName={memberToRemove?.user.name ?? ""}
        memberEmail={memberToRemove?.user.email ?? ""}
        onSuccess={refetch}
      />

      {memberToUpdate && (
        <UpdateRoleDialog
          open={!!memberToUpdate}
          onOpenChange={(open) => !open && setMemberToUpdate(null)}
          memberId={memberToUpdate.id}
          memberName={memberToUpdate.user.name}
          currentRole={
            memberToUpdate.role as import("@/api/generated/models").UpdateMemberRoleDtoRole
          }
          onSuccess={refetch}
        />
      )}

      {memberToTransfer && (
        <TransferOwnershipDialog
          open={!!memberToTransfer}
          onOpenChange={(open) => !open && setMemberToTransfer(null)}
          memberId={memberToTransfer.id}
          memberName={memberToTransfer.user.name}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
