import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DagNode } from "./dag-node";
import { AlertCircle, GitBranch } from "lucide-react";
import type { DagDefinition, NodeStatusMap } from "../types";

interface DAGViewerProps {
  /** The DAG definition from the backend */
  definition?: DagDefinition | null;
  /** Real-time node status map for coloring */
  nodeStatuses?: NodeStatusMap;
  /** Whether the graph is currently loading */
  isLoading?: boolean;
  /** Whether to allow editing (drag, connect) */
  editable?: boolean;
  /** Callback when the definition changes (for editor mode) */
  onDefinitionChange?: (definition: DagDefinition) => void;
  /** Height of the viewer container */
  height?: string;
}

const nodeTypes = {
  dagNode: DagNode,
};

/**
 * Auto-layout: positions nodes in a vertical top-to-bottom layout
 * using a simple topological ordering.
 */
function autoLayout(definition: DagDefinition): {
  nodes: Node[];
  edges: Edge[];
} {
  const { nodes: dagNodes, edges: dagEdges } = definition;

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
  const HORIZONTAL_SPACING = 200;
  const VERTICAL_SPACING = 120;

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

/** Apply real-time statuses to node data */
function applyStatuses(nodes: Node[], statuses: NodeStatusMap): Node[] {
  return nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      status: statuses[node.id] ?? "PENDING",
    },
  }));
}

export function DAGViewer({
  definition,
  nodeStatuses = {},
  isLoading = false,
  editable = false,
  onDefinitionChange,
  height = "100%",
}: DAGViewerProps) {
  const layout = useMemo(() => {
    if (!definition || !definition.nodes?.length) return null;
    try {
      return autoLayout(definition);
    } catch {
      return null;
    }
  }, [definition]);

  const initialNodes = useMemo(
    () =>
      layout
        ? applyStatuses(layout.nodes, nodeStatuses)
        : [],
    [layout, nodeStatuses],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    layout?.edges ?? [],
  );

  // Update node statuses when they change
  useMemo(() => {
    if (Object.keys(nodeStatuses).length > 0) {
      setNodes((nds) => applyStatuses(nds, nodeStatuses));
    }
  }, [nodeStatuses, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!editable) return;
      setEdges((eds) => addEdge({ ...params, animated: false }, eds));

      // Notify parent of definition change
      if (onDefinitionChange && definition) {
        const newEdge = {
          from: params.source ?? "",
          to: params.target ?? "",
        };
        onDefinitionChange({
          ...definition,
          edges: [...definition.edges, newEdge],
        });
      }
    },
    [editable, setEdges, onDefinitionChange, definition],
  );

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border bg-muted/30"
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm">Loading graph...</p>
        </div>
      </div>
    );
  }

  if (!definition || !definition.nodes?.length) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border bg-muted/30"
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <GitBranch className="size-8" />
          <p className="text-sm font-medium">No DAG definition</p>
          <p className="text-xs">
            This version has no graph to display.
          </p>
        </div>
      </div>
    );
  }

  if (!layout) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5"
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-2 text-destructive">
          <AlertCircle className="size-8" />
          <p className="text-sm font-medium">Invalid graph structure</p>
          <p className="text-xs text-muted-foreground">
            The workflow definition could not be rendered.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden" style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={editable ? onNodesChange : undefined}
        onEdgesChange={editable ? onEdgesChange : undefined}
        onConnect={editable ? onConnect : undefined}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable={editable}
        proOptions={{ hideAttribution: true }}
        className="bg-slate-50/50"
      >
        <Controls className="!shadow-md !border !rounded-lg" />
        <MiniMap
          nodeStrokeWidth={3}
          className="!shadow-md !border !rounded-lg"
          maskColor="rgba(0, 0, 0, 0.05)"
        />
        <Background gap={20} size={1} color="#e2e8f0" />
      </ReactFlow>
    </div>
  );
}
