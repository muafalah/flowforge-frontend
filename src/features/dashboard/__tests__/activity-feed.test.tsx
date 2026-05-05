import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityFeed } from "../components/activity-feed";
import type { ActivityFeedItem } from "../types/dashboard";

const mockItems: ActivityFeedItem[] = [
  {
    action: "run.triggered",
    targetType: "run",
    targetName: "Daily ETL",
    actorName: "John",
    timestamp: new Date().toISOString(),
  },
  {
    action: "run.completed",
    targetType: "run",
    targetName: "Data Sync",
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    action: "run.failed",
    targetType: "run",
    targetName: "Report Gen",
    actorName: "System",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

describe("ActivityFeed", () => {
  it("renders activity items", () => {
    render(
      <ActivityFeed 
        items={mockItems} 
        isLoading={false} 
        isConnected={true} 
        page={1}
        meta={{ total: 3, page: 1, limit: 10 }}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText(/John triggered Daily ETL/)).toBeInTheDocument();
    expect(screen.getByText(/Data Sync completed/)).toBeInTheDocument();
    expect(screen.getByText(/Report Gen failed/)).toBeInTheDocument();
  });

  it("shows Live indicator when connected", () => {
    render(
      <ActivityFeed 
        items={mockItems} 
        isLoading={false} 
        isConnected={true} 
        page={1}
        meta={{ total: 3, page: 1, limit: 10 }}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("shows Offline indicator when disconnected", () => {
    render(
      <ActivityFeed 
        items={mockItems} 
        isLoading={false} 
        isConnected={false} 
        page={1}
        meta={{ total: 3, page: 1, limit: 10 }}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("shows empty state when no items", () => {
    render(
      <ActivityFeed 
        items={[]} 
        isLoading={false} 
        isConnected={true} 
        page={1}
        meta={{ total: 0, page: 1, limit: 10 }}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });

  it("shows loading skeletons", () => {
    render(
      <ActivityFeed 
        items={[]} 
        isLoading={true} 
        isConnected={false} 
        page={1}
        meta={{ total: 0, page: 1, limit: 10 }}
        onPageChange={() => {}}
      />,
    );
    expect(screen.queryByText("No activity yet")).not.toBeInTheDocument();
  });

  it("displays relative time", () => {
    render(
      <ActivityFeed 
        items={mockItems} 
        isLoading={false} 
        isConnected={true} 
        page={1}
        meta={{ total: 3, page: 1, limit: 10 }}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("just now")).toBeInTheDocument();
    expect(screen.getByText("2m ago")).toBeInTheDocument();
    expect(screen.getByText("1h ago")).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(
      <ActivityFeed 
        items={mockItems} 
        isLoading={false} 
        isConnected={true} 
        page={1}
        meta={{ total: 3, page: 1, limit: 10 }}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("Live Activity")).toBeInTheDocument();
  });
});
