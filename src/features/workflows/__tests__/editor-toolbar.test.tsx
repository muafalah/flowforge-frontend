import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorToolbar } from "../components/dag-editor/components/editor-toolbar";
import type { EditorToolbarProps } from "../components/dag-editor/types";

// Minimal mock for VersionDataDto
const mockVersion = {
  id: "v-1",
  version: 1,
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  creator: { id: "u-1", name: "Test User", email: "test@test.com" },
  definition: {},
};

function createDefaultProps(
  overrides: Partial<EditorToolbarProps> = {},
): EditorToolbarProps {
  return {
    readOnly: false,
    nodes: [
      { id: "n-1", type: "default", position: { x: 0, y: 0 }, data: {} },
    ] as EditorToolbarProps["nodes"],
    edges: [],
    selectedNodes: [],
    selectedEdges: [],
    isDirty: false,
    isPending: false,
    activeVersionNumber: 1,
    versions: [],
    workflowRunning: false,
    activateMutation: { isPending: false, mutate: vi.fn() },
    onAddNodeOpen: vi.fn(),
    onEditSelected: vi.fn(),
    onDeleteSelected: vi.fn(),
    onDuplicateSelected: vi.fn(),
    onSave: vi.fn(),
    onRunWorkflow: vi.fn(),
    onStopWorkflow: vi.fn(),
    onRestoreVersion: vi.fn(),
    onActivateVersion: vi.fn(),
    onAiGenerate: vi.fn(),
    ...overrides,
  };
}

function renderToolbar(overrides: Partial<EditorToolbarProps> = {}) {
  const props = createDefaultProps(overrides);
  return { ...render(<EditorToolbar {...props} />), props };
}

describe("EditorToolbar", () => {
  // ── Read-Only Mode ──

  describe("readOnly mode", () => {
    it("should show View Only badge when readOnly", () => {
      renderToolbar({ readOnly: true });
      expect(screen.getByText("View Only")).toBeInTheDocument();
    });

    it("should hide action buttons and Save when readOnly", () => {
      renderToolbar({ readOnly: true });
      expect(screen.queryByText("Save")).not.toBeInTheDocument();
    });
  });

  // ── Edit Mode Buttons ──

  describe("edit mode buttons", () => {
    it("should render action buttons in edit mode", () => {
      renderToolbar();
      // All toolbar buttons should be present
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should call onAddNodeOpen when Add button clicked", async () => {
      const user = userEvent.setup();
      const { props } = renderToolbar();

      // The Add button is the first button in the toolbar
      const buttons = screen.getAllByRole("button");
      // Add node is the first button
      await user.click(buttons[0]);
      expect(props.onAddNodeOpen).toHaveBeenCalledTimes(1);
    });

    it("should show selection count badge when items selected", () => {
      renderToolbar({
        selectedNodes: ["n-1", "n-2"],
        selectedEdges: ["e-1"],
      });
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  // ── Save Button ──

  describe("Save button", () => {
    it("should render Save button in edit mode", () => {
      renderToolbar();
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("should disable Save when not dirty", () => {
      renderToolbar({ isDirty: false });
      const saveButton = screen.getByText("Save").closest("button")!;
      expect(saveButton).toBeDisabled();
    });

    it("should disable Save when no nodes", () => {
      renderToolbar({
        isDirty: true,
        nodes: [] as EditorToolbarProps["nodes"],
      });
      const saveButton = screen.getByText("Save").closest("button")!;
      expect(saveButton).toBeDisabled();
    });

    it("should enable Save when dirty with nodes", () => {
      renderToolbar({ isDirty: true });
      const saveButton = screen.getByText("Save").closest("button")!;
      expect(saveButton).not.toBeDisabled();
    });

    it("should call onSave when clicked", async () => {
      const user = userEvent.setup();
      const { props } = renderToolbar({ isDirty: true });

      await user.click(screen.getByText("Save").closest("button")!);
      expect(props.onSave).toHaveBeenCalledTimes(1);
    });
  });

  // ── Run/Stop Buttons ──

  describe("Run/Stop workflow", () => {
    it("should show Test button when not running", () => {
      renderToolbar({ workflowRunning: false });
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("should show Stop button when running", () => {
      renderToolbar({ workflowRunning: true });
      expect(screen.getByText("Stop")).toBeInTheDocument();
    });

    it("should call onRunWorkflow when Test clicked", async () => {
      const user = userEvent.setup();
      const { props } = renderToolbar();

      await user.click(screen.getByText("Test").closest("button")!);
      expect(props.onRunWorkflow).toHaveBeenCalledTimes(1);
    });

    it("should call onStopWorkflow when Stop clicked", async () => {
      const user = userEvent.setup();
      const { props } = renderToolbar({ workflowRunning: true });

      await user.click(screen.getByText("Stop").closest("button")!);
      expect(props.onStopWorkflow).toHaveBeenCalledTimes(1);
    });

    it("should hide run/stop when no nodes", () => {
      renderToolbar({ nodes: [] as EditorToolbarProps["nodes"] });
      expect(screen.queryByText("Test")).not.toBeInTheDocument();
      expect(screen.queryByText("Stop")).not.toBeInTheDocument();
    });
  });

  // ── Version History ──

  describe("Version History", () => {
    it("should show Version button when versions exist", () => {
      renderToolbar({
        versions: [mockVersion] as EditorToolbarProps["versions"],
      });
      expect(screen.getByText("Versions")).toBeInTheDocument();
    });

    it("should hide Version button when no versions", () => {
      renderToolbar({ versions: [] });
      expect(screen.queryByText("Versions")).not.toBeInTheDocument();
    });

    it("should show version count badge", () => {
      renderToolbar({
        versions: [
          mockVersion,
          { ...mockVersion, id: "v-2", version: 2, isActive: false },
        ] as EditorToolbarProps["versions"],
      });
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("should open version sheet on click", async () => {
      const user = userEvent.setup();
      renderToolbar({
        versions: [mockVersion] as EditorToolbarProps["versions"],
      });

      await user.click(screen.getByText("Versions").closest("button")!);
      expect(
        await screen.findByText("Version History"),
      ).toBeInTheDocument();
    });
  });

  // ── Stats ──

  describe("Stats display", () => {
    it("should show node and edge counts", () => {
      renderToolbar({
        nodes: [
          { id: "n-1", type: "default", position: { x: 0, y: 0 }, data: {} },
          {
            id: "n-2",
            type: "default",
            position: { x: 100, y: 0 },
            data: {},
          },
        ] as EditorToolbarProps["nodes"],
        edges: [
          { id: "e-1", source: "n-1", target: "n-2" },
        ] as EditorToolbarProps["edges"],
      });
      expect(screen.getByText(/2 nodes/)).toBeInTheDocument();
      expect(screen.getByText(/1 edge/)).toBeInTheDocument();
    });

    it("should show Unsaved badge when dirty", () => {
      renderToolbar({ isDirty: true });
      expect(screen.getByText("Unsaved")).toBeInTheDocument();
    });

    it("should hide Unsaved badge when clean", () => {
      renderToolbar({ isDirty: false });
      expect(screen.queryByText("Unsaved")).not.toBeInTheDocument();
    });
  });
});
