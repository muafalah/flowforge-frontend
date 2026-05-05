import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditNodeSheet } from "../components/dag-editor/components/edit-node-sheet";
import type { EditNodeSheetProps } from "../components/dag-editor/types";
import type { Node } from "@xyflow/react";

// Mock sub-components to simplify tests
vi.mock(
  "../components/dag-editor/components/node-config-fields",
  () => ({
    NodeConfigFields: () => <div data-testid="node-config-fields" />,
  }),
);

vi.mock(
  "../components/dag-editor/components/node-settings-fields",
  () => ({
    NodeSettingsFields: () => <div data-testid="node-settings-fields" />,
  }),
);

vi.mock(
  "../components/dag-editor/components/node-output-tab",
  () => ({
    NodeOutputTab: ({ onRun }: { onRun: () => void }) => (
      <div data-testid="node-output-tab">
        <button onClick={onRun}>Run Node</button>
      </div>
    ),
  }),
);

vi.mock(
  "../components/dag-editor/components/node-logs-tab",
  () => ({
    NodeLogsTab: () => <div data-testid="node-logs-tab" />,
  }),
);

const mockNode: Node = {
  id: "node-1",
  type: "default",
  position: { x: 0, y: 0 },
  data: {
    label: "HTTP Call",
    nodeType: "http_call",
  },
};

function createDefaultProps(
  overrides: Partial<EditNodeSheetProps> = {},
): EditNodeSheetProps {
  return {
    editingNode: mockNode,
    setEditingNode: vi.fn(),
    editNodeName: "HTTP Request",
    setEditNodeName: vi.fn(),
    editNodeDescription: "Makes an API call",
    setEditNodeDescription: vi.fn(),
    editNodeType: "http_call",
    setEditNodeType: vi.fn(),
    editNodeConfig: { method: "GET", url: "https://api.example.com" },
    setEditNodeConfig: vi.fn(),
    editNodeSettings: {
      onError: "fail",
      maxRetries: 3,
      backoffStrategy: "fixed",
      backoffDelayMs: 1000,
      timeoutOverrideMs: 0,
      enabled: false,
    },
    setEditNodeSettings: vi.fn(),
    onEditNode: vi.fn(),
    nodeRunResult: null,
    nodeRunning: false,
    onRunNode: vi.fn(),
    ...overrides,
  };
}

function renderSheet(overrides: Partial<EditNodeSheetProps> = {}) {
  const props = createDefaultProps(overrides);
  return { ...render(<EditNodeSheet {...props} />), props };
}

describe("EditNodeSheet", () => {
  describe("rendering", () => {
    it("should render when editingNode is set", () => {
      renderSheet();
      expect(screen.getByText("HTTP Request")).toBeInTheDocument();
    });

    it("should show default title when editNodeName is empty", () => {
      renderSheet({ editNodeName: "" });
      expect(screen.getByText("Edit Node")).toBeInTheDocument();
    });

    it("should not render when editingNode is null", () => {
      renderSheet({ editingNode: null });
      expect(screen.queryByText("Edit Node")).not.toBeInTheDocument();
    });

    it("should display the node type badge", () => {
      renderSheet();
      // "HTTP Call" appears in both the badge and the type selector
      const elements = screen.getAllByText("HTTP Call");
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it("should render description text", () => {
      renderSheet();
      expect(
        screen.getByText(
          "Configure, inspect output, or view logs for this node.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("tabs", () => {
    it("should render Config, Output, and Logs tabs", () => {
      renderSheet();
      expect(screen.getByRole("tab", { name: /config/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /output/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /logs/i })).toBeInTheDocument();
    });

    it("should show configuration fields by default", () => {
      renderSheet();
      // Name and Description inputs should be visible
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });
  });

  describe("form fields", () => {
    it("should render name input with current value", () => {
      renderSheet();
      const input = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(input.value).toBe("HTTP Request");
    });

    it("should call setEditNodeName on name change", async () => {
      const user = userEvent.setup();
      const { props } = renderSheet();

      const input = screen.getByLabelText(/name/i);
      await user.clear(input);
      await user.type(input, "New Name");

      expect(props.setEditNodeName).toHaveBeenCalled();
    });

    it("should render description textarea", () => {
      renderSheet();
      const textarea = screen.getByLabelText(
        /description/i,
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("Makes an API call");
    });

    it("should render NodeConfigFields sub-component", () => {
      renderSheet();
      expect(screen.getByTestId("node-config-fields")).toBeInTheDocument();
    });

    it("should render NodeSettingsFields sub-component", () => {
      renderSheet();
      expect(screen.getByTestId("node-settings-fields")).toBeInTheDocument();
    });
  });

  describe("footer actions", () => {
    it("should render Cancel and Apply Changes buttons", () => {
      renderSheet();
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /apply changes/i }),
      ).toBeInTheDocument();
    });

    it("should close sheet on Cancel click", async () => {
      const user = userEvent.setup();
      const { props } = renderSheet();

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(props.setEditingNode).toHaveBeenCalledWith(null);
    });

    it("should call onEditNode on Apply Changes click", async () => {
      const user = userEvent.setup();
      const { props } = renderSheet();

      await user.click(
        screen.getByRole("button", { name: /apply changes/i }),
      );
      expect(props.onEditNode).toHaveBeenCalledTimes(1);
    });

    it("should disable Apply Changes when name is empty", () => {
      renderSheet({ editNodeName: "" });
      const applyButton = screen.getByRole("button", {
        name: /apply changes/i,
      });
      expect(applyButton).toBeDisabled();
    });

    it("should disable Apply Changes when name is whitespace only", () => {
      renderSheet({ editNodeName: "   " });
      const applyButton = screen.getByRole("button", {
        name: /apply changes/i,
      });
      expect(applyButton).toBeDisabled();
    });
  });
});
