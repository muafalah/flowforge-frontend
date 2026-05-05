import { describe, it, expect } from "vitest";
import {
  createOrganizationSchema,
} from "../schemas/organization-schemas";

describe("createOrganizationSchema", () => {
  it("should accept a valid organization name", () => {
    const result = createOrganizationSchema.safeParse({ name: "Acme Corp" });
    expect(result.success).toBe(true);
  });

  it("should accept a name with exactly 3 characters", () => {
    const result = createOrganizationSchema.safeParse({ name: "ABC" });
    expect(result.success).toBe(true);
  });

  it("should accept a name with exactly 100 characters", () => {
    const result = createOrganizationSchema.safeParse({
      name: "A".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("should reject a name with fewer than 3 characters", () => {
    const result = createOrganizationSchema.safeParse({ name: "AB" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/at least 3/i);
    }
  });

  it("should reject a name with more than 100 characters", () => {
    const result = createOrganizationSchema.safeParse({
      name: "A".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/at most 100/i);
    }
  });

  it("should reject an empty name", () => {
    const result = createOrganizationSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("should reject missing name field", () => {
    const result = createOrganizationSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
