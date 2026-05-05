import { z } from "zod";

/**
 * Zod schemas for organization forms.
 * Constraints are aligned with backend CreateOrganizationDto.
 */

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(3, "Organization name must be at least 3 characters")
    .max(100, "Organization name must be at most 100 characters"),
});

export type CreateOrganizationFormValues = z.infer<typeof createOrganizationSchema>;
