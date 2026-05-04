import { MarkerType, type Node, type Edge } from "@xyflow/react";
import type { DagDefinition } from "../../../types";
import type { DagNodeData, NodeSettings } from "../types";
import {
  DEFAULT_EDGE_STYLE,
  HORIZONTAL_SPACING,
  VERTICAL_SPACING,
  BRANCH_OFFSET,
} from "../constants";

// ---------------------------------------------------------------------------
// Conditional edge styling
// ---------------------------------------------------------------------------

/** Build styled edge props for a conditional branch edge */
export function buildConditionalEdgeProps(condition: string): Partial<Edge> {
  const isTrue = condition === "true";
  return {
    label: isTrue ? "True" : "False",
    labelStyle: {
      fill: isTrue ? "#059669" : "#dc2626",
      fontWeight: 600,
      fontSize: 10,
    },
    labelBgStyle: {
      fill: isTrue ? "#ecfdf5" : "#fef2f2",
      fillOpacity: 0.9,
    },
    labelBgPadding: [4, 2] as [number, number],
    style: {
      ...DEFAULT_EDGE_STYLE,
      stroke: isTrue ? "#10b981" : "#ef4444",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: isTrue ? "#10b981" : "#ef4444",
    },
    data: { condition },
  };
}

// ---------------------------------------------------------------------------
// Node ID generation
// ---------------------------------------------------------------------------

/** Generate a short unique ID */
export function generateNodeId(): string {
  return `nd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Auto-layout (Kahn's topological sort)
// ---------------------------------------------------------------------------

/**
 * Auto-layout: positions nodes in a vertical top-to-bottom layout
 * using Kahn's topological ordering.
 */
export function autoLayout(definition: DagDefinition): {
  nodes: Node[];
  edges: Edge[];
} {
  const { nodes: dagNodes, edges: dagEdges } = definition;

  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, string[]> = {};
  dagNodes.forEach((n) => {
    inDegree[n.id] = 0;
    adjacency[n.id] = [];
  });
  dagEdges.forEach((e) => {
    inDegree[e.to] = (inDegree[e.to] ?? 0) + 1;
    adjacency[e.from] = [...(adjacency[e.from] ?? []), e.to];
  });

  const queue = dagNodes
    .filter((n) => (inDegree[n.id] ?? 0) === 0)
    .map((n) => n.id);
  const layers: string[][] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const layer = [...queue];
    layers.push(layer);
    queue.length = 0;

    for (const nodeId of layer) {
      visited.add(nodeId);
      for (const neighbor of adjacency[nodeId] ?? []) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0 && !visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }

  const orphans = dagNodes.filter((n) => !visited.has(n.id));
  if (orphans.length > 0) {
    layers.push(orphans.map((n) => n.id));
  }

  const nodeMap = new Map(dagNodes.map((n) => [n.id, n]));

  // Build a map of conditional branch offsets:
  // Nodes reached via a "true" edge get a left offset, "false" get a right offset.
  const branchOffsets: Record<string, number> = {};
  for (const e of dagEdges) {
    if (e.condition === "true") {
      branchOffsets[e.to] = -BRANCH_OFFSET;
    } else if (e.condition === "false") {
      branchOffsets[e.to] = BRANCH_OFFSET;
    }
  }

  const flowNodes: Node[] = layers.flatMap((layer, layerIndex) =>
    layer.map((nodeId, nodeIndex) => {
      const dagNode = nodeMap.get(nodeId);
      const layerWidth = layer.length * HORIZONTAL_SPACING;
      const startX = -layerWidth / 2 + HORIZONTAL_SPACING / 2;

      const rawConfig = dagNode?.config as Record<string, unknown> | undefined;
      const savedSettings = rawConfig?.__settings as NodeSettings | undefined;
      const cleanConfig = rawConfig
        ? Object.fromEntries(
            Object.entries(rawConfig).filter(([k]) => k !== "__settings"),
          )
        : undefined;

      const baseX = startX + nodeIndex * HORIZONTAL_SPACING;
      const offsetX = branchOffsets[nodeId] ?? 0;

      return {
        id: nodeId,
        type: "dagNode",
        position: {
          x: baseX + offsetX,
          y: layerIndex * VERTICAL_SPACING,
        },
        data: {
          label: dagNode?.name ?? dagNode?.id ?? nodeId,
          description: dagNode?.description,
          nodeType: dagNode?.type ?? "unknown",
          config: cleanConfig,
          settings: savedSettings,
          status: "PENDING",
        } satisfies DagNodeData,
      };
    }),
  );

  const flowEdges: Edge[] = dagEdges.map((e) => {
    const base: Edge = {
      id: `${e.from}-${e.to}`,
      source: e.from,
      target: e.to,
      sourceHandle: e.condition ? `source-${e.condition}` : undefined,
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#94a3b8",
      },
      style: DEFAULT_EDGE_STYLE,
    };

    // Apply conditional styling
    if (e.condition === "true" || e.condition === "false") {
      return { ...base, ...buildConditionalEdgeProps(e.condition) };
    }
    return base;
  });

  return { nodes: flowNodes, edges: flowEdges };
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}
