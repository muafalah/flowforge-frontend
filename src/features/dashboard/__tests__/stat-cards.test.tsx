import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCards } from "../components/stat-cards";
import type { DashboardStats } from "../types/dashboard";

// Mock recharts — it doesn't play well with jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <svg data-testid="area-chart">{children}</svg>
  ),
  Area: () => <rect data-testid="area" />,
}));

const mockStats: DashboardStats = {
  activeRuns: 3,
  totalRuns24h: 247,
  successCount24h: 234,
  failedCount24h: 13,
  successRate24h: 94.7,
  avgDurationMs24h: 12400,
  totalWorkflows: 8,
  hourlyRuns: Array.from({ length: 24 }, (_, i) => ({
    hour: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
    success: Math.floor(Math.random() * 10),
    failed: Math.floor(Math.random() * 2),
  })),
};

describe("StatCards", () => {
  it("renders loading skeletons when isLoading is true", () => {
    render(<StatCards stats={null} isLoading={true} />);
    // Should render 5 skeleton cards
    const cards = document.querySelectorAll("[data-slot='card']");
    expect(cards.length).toBe(5);
  });

  it("renders stat values when data is provided", () => {
    render(<StatCards stats={mockStats} isLoading={false} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("247")).toBeInTheDocument();
    expect(screen.getByText("94.7%")).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
    expect(screen.getByText("12.4s")).toBeInTheDocument();
  });

  it("renders all 5 card titles", () => {
    render(<StatCards stats={mockStats} isLoading={false} />);

    expect(screen.getByText("Active Runs")).toBeInTheDocument();
    expect(screen.getByText("Total Runs (24h)")).toBeInTheDocument();
    expect(screen.getByText("Success Rate")).toBeInTheDocument();
    expect(screen.getByText("Failed (24h)")).toBeInTheDocument();
    expect(screen.getByText("Avg Duration")).toBeInTheDocument();
  });

  it("shows pulse indicator when active runs > 0", () => {
    render(<StatCards stats={mockStats} isLoading={false} />);
    // The ping animation class should exist
    const pulseElements = document.querySelectorAll(".animate-ping");
    expect(pulseElements.length).toBe(1);
  });

  it("does not show pulse indicator when active runs = 0", () => {
    render(
      <StatCards
        stats={{ ...mockStats, activeRuns: 0 }}
        isLoading={false}
      />,
    );
    const pulseElements = document.querySelectorAll(".animate-ping");
    expect(pulseElements.length).toBe(0);
  });

  it("formats duration correctly for various values", () => {
    // Test milliseconds
    render(
      <StatCards
        stats={{ ...mockStats, avgDurationMs24h: 500 }}
        isLoading={false}
      />,
    );
    expect(screen.getByText("500ms")).toBeInTheDocument();
  });
});
