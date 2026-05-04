import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { useOrganizationControllerCreate, useOrganizationControllerFindAll } from "@/api/generated/organizations/organizations";
import {
  createOrganizationSchema,
  type CreateOrganizationFormValues,
} from "../schemas/organization-schemas";
import { setSelectedOrganizationId, getSelectedOrganizationId } from "@/api/organization-store";
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
import { LogOut, Building2 } from "lucide-react";
import type { AxiosError } from "axios";
import type { ErrorResponseDto } from "@/api/generated/models/errorResponseDto";

export function CreateOrganizationPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createOrgMutation = useOrganizationControllerCreate();
  const { data, isLoading } = useOrganizationControllerFindAll();

  // The API response shape: { data: Organization[], meta: { ... } }
  const organizations = (data as unknown as { data: unknown[] })?.data ?? [];

  useEffect(() => {
    if (!isLoading && organizations.length > 0) {
      const selectedOrgId = getSelectedOrganizationId();
      if (selectedOrgId) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/select-organization", { replace: true });
      }
    }
  }, [isLoading, organizations.length, navigate]);

  const {
    register,
    handleSubmit,
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

      // Extract the created organization ID from the response
      // Backend response format: { data: { organization: { id: ... } } }
      const newOrgId = (
        response as unknown as { data?: { organization?: { id: string } } }
      )?.data?.organization?.id;
      
      if (newOrgId) {
        setSelectedOrganizationId(newOrgId);
      }

      toast.success("Organization created successfully!");
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

      {/* Main content — centered card */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Welcome message above the card */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Create your organization
            </h1>
            <p className="mt-2 text-muted-foreground">
              Welcome{user?.name ? `, ${user.name}` : ""}! To get started with
              FlowForge, you need to create an organization first.
            </p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Organization details</CardTitle>
              <CardDescription>
                Choose a name for your organization. You can always change it
                later.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <Button
                  id="create-org-submit"
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating…" : "Create organization"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t want to create an organization?{" "}
            <button
              type="button"
              onClick={handleLogout}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Log out
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
