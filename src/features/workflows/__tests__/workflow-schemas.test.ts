import { describe, it, expect } from "vitest";
import { createWorkflowSchema } from "../schemas/create-workflow.schema";

describe("createWorkflowSchema", () => {
  it("should validate a valid workflow input", () => {
    const result = createWorkflowSchema.safeParse({
      name: "My Workflow",
      description: "A test workflow",
      access: "EDITOR",
    });
    expect(result.success).toBe(true);
  });

  it("should validate without description", () => {
    const result = createWorkflowSchema.safeParse({
      name: "My Workflow",
      access: "VIEWER",
    });
    expect(result.success).toBe(true);
  });

  it("should allow empty string for description", () => {
    const result = createWorkflowSchema.safeParse({
      name: "My Workflow",
      description: "",
      access: "EDITOR",
    });
    expect(result.success).toBe(true);
  });

  it("should reject name shorter than 3 characters", () => {
    const result = createWorkflowSchema.safeParse({
      name: "AB",
      access: "EDITOR",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 3");
    }
  });

  it("should reject name longer than 100 characters", () => {
    const result = createWorkflowSchema.safeParse({
      name: "A".repeat(101),
      access: "EDITOR",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at most 100");
    }
  });

  it("should reject description longer than 500 characters", () => {
    const result = createWorkflowSchema.safeParse({
      name: "Valid Name",
      description: "A".repeat(501),
      access: "EDITOR",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at most 500");
    }
  });

  it("should reject invalid access value", () => {
    const result = createWorkflowSchema.safeParse({
      name: "Valid Name",
      access: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("should accept EDITOR access", () => {
    const result = createWorkflowSchema.safeParse({
      name: "Valid Name",
      access: "EDITOR",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.access).toBe("EDITOR");
    }
  });

  it("should accept VIEWER access", () => {
    const result = createWorkflowSchema.safeParse({
      name: "Valid Name",
      access: "VIEWER",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.access).toBe("VIEWER");
    }
  });

  it("should reject missing name", () => {
    const result = createWorkflowSchema.safeParse({
      access: "EDITOR",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing access", () => {
    const result = createWorkflowSchema.safeParse({
      name: "Valid Name",
    });
    expect(result.success).toBe(false);
  });
});
