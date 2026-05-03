import { describe, it, expect, beforeEach } from "vitest";
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
} from "../token-store";

describe("token-store", () => {
  beforeEach(() => {
    clearTokens();
    localStorage.clear();
  });

  describe("access token (in-memory)", () => {
    it("should return null when no access token is set", () => {
      expect(getAccessToken()).toBeNull();
    });

    it("should store and retrieve access token", () => {
      setAccessToken("test-access-token");
      expect(getAccessToken()).toBe("test-access-token");
    });

    it("should allow setting access token to null", () => {
      setAccessToken("test-access-token");
      setAccessToken(null);
      expect(getAccessToken()).toBeNull();
    });
  });

  describe("refresh token (localStorage)", () => {
    it("should return null when no refresh token is set", () => {
      expect(getRefreshToken()).toBeNull();
    });

    it("should store and retrieve refresh token from localStorage", () => {
      setRefreshToken("test-refresh-token");
      expect(getRefreshToken()).toBe("test-refresh-token");
      expect(localStorage.getItem("refresh_token")).toBe("test-refresh-token");
    });
  });

  describe("clearTokens", () => {
    it("should clear both access and refresh tokens", () => {
      setAccessToken("test-access-token");
      setRefreshToken("test-refresh-token");

      clearTokens();

      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(localStorage.getItem("refresh_token")).toBeNull();
    });
  });
});
