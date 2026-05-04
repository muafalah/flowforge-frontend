import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { useOrganizationControllerFindAll } from "@/api/generated/organizations/organizations";
import { setSelectedOrganizationId, getSelectedOrganizationId } from "@/api/organization-store";
import { CreateOrganizationDialog } from "@/features/organization/components/create-organization-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Building2,
  ChevronRight,
  AlertCircle,
  Plus,
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  memberCount?: number;
  createdAt?: string;
}

export function SelectOrganizationPage() {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, logout } = useAuth();
  const { data, isLoading, isError } = useOrganizationControllerFindAll();

  // The API response shape: { data: Organization[], meta: { ... } }
  const organizations: Organization[] =
    (data as unknown as { data: Organization[] })?.data ?? [];

  useEffect(() => {
    if (!isLoading && !isError) {
      if (organizations.length === 0) {
        navigate("/create-organization", { replace: true });
      } else {
        const selectedOrgId = getSelectedOrganizationId();
        if (selectedOrgId) {
          navigate("/dashboard", { replace: true });
        }
      }
    }
  }, [isLoading, isError, organizations.length, navigate]);

  const handleSelect = (org: Organization) => {
    setSelectedOrganizationId(org.id);
    navigate("/dashboard", { replace: true });
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Top bar with user info and logout */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">
            FlowForge
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user?.email}
          </span>
          <Button
            id="logout-button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Select an organization
            </h1>
            <p className="mt-2 text-muted-foreground">
              Welcome back{user?.name ? `, ${user.name}` : ""}! Choose an
              organization to continue.
            </p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Your organizations</CardTitle>
              <CardDescription>
                Select the organization you want to work with.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              )}

              {/* Error state */}
              {isError && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive/60" />
                  <p className="text-sm text-muted-foreground">
                    Failed to load organizations. Please try again.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Organization list */}
              {!isLoading && !isError && organizations.length > 0 && (
                <ul className="space-y-2">
                  {organizations.map((org) => (
                    <li key={org.id}>
                      <button
                        id={`select-org-${org.id}`}
                        type="button"
                        onClick={() => handleSelect(org)}
                        className="group flex w-full items-center gap-3 rounded-lg border border-border/50 bg-card p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate font-medium">{org.name}</p>
                          {org?.memberCount && (
                            <span className="truncate text-xs capitalize">
                              {org.memberCount} Members
                            </span>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Empty state — should not normally occur since OrganizationGuard redirects to create-organization */}
              {!isLoading && !isError && organizations.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Building2 className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No organizations found.
                  </p>
                </div>
              )}

              <button
                type="button"
                className="mt-4 group flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setIsDialogOpen(true)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Create New Organization</p>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      </main>

      <CreateOrganizationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
