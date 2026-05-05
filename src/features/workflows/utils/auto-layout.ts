import type { Node, Edge } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import type { DagDefinition } from "../types";

/**
 * Auto-layout: positions nodes in a vertical top-to-bottom layout
 * using a simple topological ordering (Kahn's algorithm).
 *
 * Shared between DAGViewer (full-size) and MiniDagPreview (dashboard).
 */
export function autoLayout(
  definition: DagDefinition,
  options: { horizontalSpacing?: number; verticalSpacing?: number } = {},
): { nodes: Node[]; edges: Edge[] } {
  const { nodes: dagNodes, edges: dagEdges } = definition;
  const HORIZONTAL_SPACING = options.horizontalSpacing ?? 200;
  const VERTICAL_SPACING = options.verticalSpacing ?? 120;

  // Build adjacency and in-degree maps
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

  // Topological sort (Kahn's algorithm) to determine layers
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

  // Add any orphan nodes not in the topological sort
  const orphans = dagNodes.filter((n) => !visited.has(n.id));
  if (orphans.length > 0) {
    layers.push(orphans.map((n) => n.id));
  }

  const nodeMap = new Map(dagNodes.map((n) => [n.id, n]));

  const flowNodes: Node[] = layers.flatMap((layer, layerIndex) =>
    layer.map((nodeId, nodeIndex) => {
      const dagNode = nodeMap.get(nodeId);
      const layerWidth = layer.length * HORIZONTAL_SPACING;
      const startX = -layerWidth / 2 + HORIZONTAL_SPACING / 2;

      return {
        id: nodeId,
        type: "dagNode",
        position: {
          x: startX + nodeIndex * HORIZONTAL_SPACING,
          y: layerIndex * VERTICAL_SPACING,
        },
        data: {
          label: dagNode?.name ?? dagNode?.id ?? nodeId,
          description: dagNode?.description,
          nodeType: dagNode?.type ?? "unknown",
          config: dagNode?.config,
        },
      };
    }),
  );

  const flowEdges: Edge[] = dagEdges.map((e) => ({
    id: `${e.from}-${e.to}`,
    source: e.from,
    target: e.to,
    animated: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#94a3b8",
    },
    style: { stroke: "#94a3b8", strokeWidth: 2 },
    label: e.condition ?? undefined,
    labelStyle: { fontSize: 10, fill: "#64748b" },
  }));

  return { nodes: flowNodes, edges: flowEdges };
}
