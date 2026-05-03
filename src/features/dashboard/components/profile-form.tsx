import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  profileSchema,
  type ProfileFormValues,
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
import { useUserControllerUpdate } from "@/api/generated/users/users";
import type { AxiosError } from "axios";
import type { ErrorResponseDto } from "@/api/generated/models/errorResponseDto";
import { useAuth } from "@/features/auth";

export function ProfileForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, updateUser } = useAuth();

  const updateMutation = useUserControllerUpdate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  // Update form values when data is loaded
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    const userId = user?.id;
    if (!userId) return;
    setIsSubmitting(true);

    try {
      await updateMutation.mutateAsync({
        id: userId,
        data: { name: data.name },
      });
      toast.success("Profile updated successfully!");
      if (user) {
        updateUser({ ...user, name: data.name });
      }
      // Reset the form with new values to clear the dirty state
      reset(data);
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponseDto>;
      const message =
        axiosError.response?.data?.error?.message ||
        "Failed to update profile.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm font-medium text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              disabled
              {...register("email")}
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-[0.8rem] text-muted-foreground">
              Email cannot be changed.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
