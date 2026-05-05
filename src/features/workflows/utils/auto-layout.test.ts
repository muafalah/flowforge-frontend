import { describe, it, expect } from "vitest";
import { autoLayout } from "./auto-layout";
import type { DagDefinition } from "../types";

describe("autoLayout", () => {
  it("should layout a simple linear chain correctly", () => {
    const definition: DagDefinition = {
      nodes: [
        { id: "A", name: "Node A", type: "http" },
        { id: "B", name: "Node B", type: "script" },
        { id: "C", name: "Node C", type: "transform" },
      ],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
      ],
    };

    const result = autoLayout(definition);

    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(2);

    // Verify layers: A at top (y=0), B in middle, C at bottom
    const nodeMap = new Map(result.nodes.map((n) => [n.id, n]));
    expect(nodeMap.get("A")!.position.y).toBe(0);
    expect(nodeMap.get("B")!.position.y).toBe(120); // default verticalSpacing
    expect(nodeMap.get("C")!.position.y).toBe(240);
  });

  it("should layout a diamond graph correctly", () => {
    const definition: DagDefinition = {
      nodes: [
        { id: "start", name: "Start", type: "http" },
        { id: "left", name: "Left", type: "script" },
        { id: "right", name: "Right", type: "script" },
        { id: "end", name: "End", type: "transform" },
      ],
      edges: [
        { from: "start", to: "left" },
        { from: "start", to: "right" },
        { from: "left", to: "end" },
        { from: "right", to: "end" },
      ],
    };

    const result = autoLayout(definition);

    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(4);

    const nodeMap = new Map(result.nodes.map((n) => [n.id, n]));
    // start is layer 0
    expect(nodeMap.get("start")!.position.y).toBe(0);
    // left and right are layer 1
    expect(nodeMap.get("left")!.position.y).toBe(120);
    expect(nodeMap.get("right")!.position.y).toBe(120);
    // end is layer 2
    expect(nodeMap.get("end")!.position.y).toBe(240);
  });

  it("should handle orphan nodes", () => {
    const definition: DagDefinition = {
      nodes: [
        { id: "A", name: "A", type: "http" },
        { id: "B", name: "B", type: "script" },
        { id: "orphan", name: "Orphan", type: "transform" },
      ],
      edges: [
        { from: "A", to: "B" },
        // orphan has a cycle with itself via edges that keep it isolated
      ],
    };

    const result = autoLayout(definition);

    expect(result.nodes).toHaveLength(3);
    // Orphan node should still be present
    const ids = result.nodes.map((n) => n.id);
    expect(ids).toContain("orphan");
  });

  it("should handle empty definition", () => {
    const definition: DagDefinition = { nodes: [], edges: [] };

    const result = autoLayout(definition);

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it("should handle single node with no edges", () => {
    const definition: DagDefinition = {
      nodes: [{ id: "solo", name: "Solo", type: "http" }],
      edges: [],
    };

    const result = autoLayout(definition);

    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(0);
    expect(result.nodes[0].position.y).toBe(0);
  });

  it("should respect custom horizontal and vertical spacing", () => {
    const definition: DagDefinition = {
      nodes: [
        { id: "A", name: "A", type: "http" },
        { id: "B", name: "B", type: "script" },
      ],
      edges: [{ from: "A", to: "B" }],
    };

    const result = autoLayout(definition, {
      horizontalSpacing: 300,
      verticalSpacing: 200,
    });

    const nodeMap = new Map(result.nodes.map((n) => [n.id, n]));
    expect(nodeMap.get("A")!.position.y).toBe(0);
    expect(nodeMap.get("B")!.position.y).toBe(200);
  });

  it("should set correct node data from DAG definition", () => {
    const definition: DagDefinition = {
      nodes: [
        {
          id: "step1",
          name: "HTTP Call",
          type: "http",
          description: "Calls API",
          config: { url: "https://example.com" },
        },
      ],
      edges: [],
    };

    const result = autoLayout(definition);

    expect(result.nodes[0].data.label).toBe("HTTP Call");
    expect(result.nodes[0].data.description).toBe("Calls API");
    expect(result.nodes[0].data.nodeType).toBe("http");
    expect(result.nodes[0].data.config).toEqual({ url: "https://example.com" });
  });

  it("should create flow edges with correct properties", () => {
    const definition: DagDefinition = {
      nodes: [
        { id: "A", name: "A", type: "http" },
        { id: "B", name: "B", type: "script" },
      ],
      edges: [{ from: "A", to: "B", condition: "status === 200" }],
    };

    const result = autoLayout(definition);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].source).toBe("A");
    expect(result.edges[0].target).toBe("B");
    expect(result.edges[0].label).toBe("status === 200");
  });

  it("should center nodes horizontally within each layer", () => {
    const definition: DagDefinition = {
      nodes: [
        { id: "root", name: "Root", type: "http" },
        { id: "child1", name: "Child 1", type: "script" },
        { id: "child2", name: "Child 2", type: "script" },
      ],
      edges: [
        { from: "root", to: "child1" },
        { from: "root", to: "child2" },
      ],
    };

    const result = autoLayout(definition);
    const nodeMap = new Map(result.nodes.map((n) => [n.id, n]));

    // Root layer: 1 node → centered at x=0
    expect(nodeMap.get("root")!.position.x).toBe(0);

    // Children layer: 2 nodes → symmetrically placed
    const c1x = nodeMap.get("child1")!.position.x;
    const c2x = nodeMap.get("child2")!.position.x;
    expect(c1x).toBeLessThan(c2x);
    // Should be equidistant from center
    expect(Math.abs(c1x) === Math.abs(c2x)).toBe(true);
  });

  it("should use dagNode type for all generated nodes", () => {
    const definition: DagDefinition = {
      nodes: [
        { id: "A", name: "A", type: "http" },
        { id: "B", name: "B", type: "script" },
      ],
      edges: [{ from: "A", to: "B" }],
    };

    const result = autoLayout(definition);

    result.nodes.forEach((node) => {
      expect(node.type).toBe("dagNode");
    });
  });
});
