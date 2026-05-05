import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivityLogTable } from "../components/activity-log-table";
import type { ActivityLogItemDto } from "@/api/generated/models";

const mockLogs: ActivityLogItemDto[] = [
  {
    id: "log-1",
    organizationId: "org-1",
    action: "member.added",
    targetType: "member",
    targetId: "m-1",
    targetName: "john@email.com",
    metadata: { role: "MEMBER" },
    actor: { id: "u-1", name: "Admin User", email: "admin@test.com" },
    createdAt: new Date().toISOString(),
  },
  {
    id: "log-2",
    organizationId: "org-1",
    action: "version.created",
    targetType: "version",
    targetId: "v-1",
    targetName: "v3",
    metadata: { workflowId: "wf-1", workflowName: "My Workflow" },
    actor: { id: "u-2", name: "Dev User", email: "dev@test.com" },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "log-3",
    organizationId: "org-1",
    action: "run.triggered",
    targetType: "run",
    targetId: "run-1",
    targetName: "Data Pipeline",
    metadata: { triggerType: "MANUAL", workflowId: "wf-2" },
    actor: { id: "u-1", name: "Admin User", email: "admin@test.com" },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

describe("ActivityLogTable", () => {
  it("should render all log entries", () => {
    render(
      <ActivityLogTable
        logs={mockLogs}
        isLoading={false}
        sortOrder="desc"
        onToggleSortOrder={() => {}}
      />,
    );

    // Check badges
    expect(screen.getByText("Member Added")).toBeInTheDocument();
    expect(screen.getByText("Version Created")).toBeInTheDocument();
    expect(screen.getByText("Run Triggered")).toBeInTheDocument();
  });

  it("should render Type column values", () => {
    render(
      <ActivityLogTable
        logs={mockLogs}
        isLoading={false}
        sortOrder="desc"
        onToggleSortOrder={() => {}}
      />,
    );

    expect(screen.getByText("Member")).toBeInTheDocument();
    expect(screen.getByText("Version")).toBeInTheDocument();
    expect(screen.getByText("Run")).toBeInTheDocument();
  });

  it("should render actor name and email", () => {
    render(
      <ActivityLogTable
        logs={mockLogs}
        isLoading={false}
        sortOrder="desc"
        onToggleSortOrder={() => {}}
      />,
    );

    // Actor names
    expect(screen.getAllByText("Admin User")).toHaveLength(2);
    expect(screen.getByText("Dev User")).toBeInTheDocument();

    // Actor emails
    expect(screen.getAllByText("admin@test.com")).toHaveLength(2);
    expect(screen.getByText("dev@test.com")).toBeInTheDocument();
  });

  it("should render descriptions for each action type", () => {
    render(
      <ActivityLogTable
        logs={mockLogs}
        isLoading={false}
        sortOrder="desc"
        onToggleSortOrder={() => {}}
      />,
    );

    expect(
      screen.getByText(/Admin User added john@email.com as member/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Dev User created v3 for workflow "My Workflow"/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Admin User triggered a run for "Data Pipeline"/),
    ).toBeInTheDocument();
  });

  it("should show empty state when no logs", () => {
    render(
      <ActivityLogTable
        logs={[]}
        isLoading={false}
        sortOrder="desc"
        onToggleSortOrder={() => {}}
      />,
    );

    expect(screen.getByText(/No activity logs found/)).toBeInTheDocument();
  });

  it("should show loading skeleton when loading", () => {
    render(
      <ActivityLogTable
        logs={[]}
        isLoading={true}
        sortOrder="desc"
        onToggleSortOrder={() => {}}
      />,
    );

    // Should not show empty state
    expect(
      screen.queryByText(/No activity logs found/),
    ).not.toBeInTheDocument();
  });

  it("should render table headers including Type", () => {
    render(
      <ActivityLogTable
        logs={mockLogs}
        isLoading={false}
        sortOrder="desc"
        onToggleSortOrder={() => {}}
      />,
    );

    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Actor")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
  });

  it("should call onToggleSortOrder when date header clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <ActivityLogTable
        logs={mockLogs}
        isLoading={false}
        sortOrder="desc"
        onToggleSortOrder={onToggle}
      />,
    );

    await user.click(screen.getByText("Date"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("should render avatar initials correctly", () => {
    render(
      <ActivityLogTable
        logs={mockLogs}
        isLoading={false}
        sortOrder="desc"
        onToggleSortOrder={() => {}}
      />,
    );

    // "Admin User" -> "AU", "Dev User" -> "DU"
    expect(screen.getAllByText("AU")).toHaveLength(2);
    expect(screen.getByText("DU")).toBeInTheDocument();
  });
});
