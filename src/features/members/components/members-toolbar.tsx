import { Filter, Search, UserPlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface MembersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  isLoadingMembership: boolean;
  canInvite: boolean;
  setIsInviteDialogOpen: (open: boolean) => void;
  roles: string[];
  onRolesChange: (roles: string[]) => void;
}

export function MembersToolbar({
  search,
  onSearchChange,
  isLoadingMembership,
  canInvite,
  setIsInviteDialogOpen,
  roles,
  onRolesChange,
}: MembersToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="members-search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Filter Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" id="filter-button" className="relative">
              <Filter className="size-4" />
              Filters
              {roles.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 px-1.5 min-w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {roles.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-80 sm:w-96">
            <SheetHeader className="px-6">
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Refine the list of members by applying filters.
              </SheetDescription>
            </SheetHeader>

            <div className="grid flex-1 auto-rows-min gap-4 px-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium leading-none">Role</h4>
                  {roles.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRolesChange([])}
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                    >
                      Reset
                    </Button>
                  )}
                </div>
                <div className="grid gap-3">
                  {["OWNER", "ADMIN", "MEMBER"].map((role) => {
                    const isChecked = roles.includes(role);
                    return (
                      <div
                        key={role}
                        className="flex items-center space-x-3 group"
                      >
                        <input
                          type="checkbox"
                          id={`role-${role}`}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onRolesChange([...roles, role]);
                            } else {
                              onRolesChange(roles.filter((r) => r !== role));
                            }
                          }}
                          className="size-4 rounded border-input bg-background text-primary ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 accent-primary"
                        />
                        <Label
                          htmlFor={`role-${role}`}
                          className="text-sm font-normal cursor-pointer group-hover:text-primary transition-colors"
                        >
                          <span className="capitalize">
                            {role.toLowerCase()}
                          </span>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <SheetFooter className="mt-auto px-6">
              <SheetClose asChild>
                <Button type="submit" variant="outline" className="w-full">
                  Show Results
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        {!isLoadingMembership && canInvite && (
          <Button
            id="invite-member-button"
            onClick={() => setIsInviteDialogOpen(true)}
          >
            <UserPlus className="size-4" />
            Invite Member
          </Button>
        )}
      </div>
    </div>
  );
}
