import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  email: z.string().email("Invalid email address"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
