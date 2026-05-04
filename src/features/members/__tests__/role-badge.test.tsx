import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoleBadge } from "../components/role-badge";

describe("RoleBadge", () => {
  it("should render Owner badge with correct text and class", () => {
    render(<RoleBadge role="OWNER" />);
    const badge = screen.getByText("Owner");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-amber-700");
  });

  it("should render Admin badge with correct text and class", () => {
    render(<RoleBadge role="ADMIN" />);
    const badge = screen.getByText("Admin");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-blue-700");
  });

  it("should render Member badge with correct text and class", () => {
    render(<RoleBadge role="MEMBER" />);
    const badge = screen.getByText("Member");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-emerald-700");
  });

  it("should fallback to Member badge for unknown roles", () => {
    // @ts-expect-error Testing fallback behavior for invalid prop
    render(<RoleBadge role="UNKNOWN" />);
    const badge = screen.getByText("Member");
    expect(badge).toBeInTheDocument();
  });
});
