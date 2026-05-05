import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QuickActions } from "../components/quick-actions";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("QuickActions", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders Workflows button", () => {
    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>,
    );
    expect(screen.getByText("Workflows")).toBeInTheDocument();
  });

  it("renders New Workflow button", () => {
    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>,
    );
    expect(screen.getByText("New Workflow")).toBeInTheDocument();
  });

  it("has correct id on create button for testing", () => {
    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>,
    );
    const createBtn = document.getElementById("create-workflow-button");
    expect(createBtn).not.toBeNull();
  });
});
