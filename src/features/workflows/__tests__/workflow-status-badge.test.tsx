import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkflowStatusBadge } from "../components/workflow-status-badge";

describe("WorkflowStatusBadge", () => {
  it("should render Active badge for ACTIVE status", () => {
    render(<WorkflowStatusBadge status="ACTIVE" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("should render Draft badge for DRAFT status", () => {
    render(<WorkflowStatusBadge status="DRAFT" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("should apply emerald color classes for ACTIVE", () => {
    const { container } = render(<WorkflowStatusBadge status="ACTIVE" />);
    const badge = container.firstElementChild;
    expect(badge?.className).toContain("emerald");
  });

  it("should apply amber color classes for DRAFT", () => {
    const { container } = render(<WorkflowStatusBadge status="DRAFT" />);
    const badge = container.firstElementChild;
    expect(badge?.className).toContain("amber");
  });

  it("should accept and apply additional className", () => {
    const { container } = render(
      <WorkflowStatusBadge status="ACTIVE" className="custom-class" />,
    );
    const badge = container.firstElementChild;
    expect(badge?.className).toContain("custom-class");
  });
});
