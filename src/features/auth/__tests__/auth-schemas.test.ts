import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "../schemas/auth-schemas";

describe("auth-schemas", () => {
  describe("loginSchema", () => {
    it("should pass with valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should fail when email is empty", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should fail with invalid email format", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should fail when password is empty", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("should pass with valid name, email, and password", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should fail when name is empty", () => {
      const result = registerSchema.safeParse({
        name: "",
        email: "john@example.com",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should fail when password is shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "short",
      });
      expect(result.success).toBe(false);
    });

    it("should fail when email is invalid", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "invalid",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });
  });
});
