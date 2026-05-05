import { useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DagNode } from "@/features/workflows/components/dag-node";
import { autoLayout } from "@/features/workflows/utils/auto-layout";
import type { DagDefinition } from "@/features/workflows/types";
import { GitBranch } from "lucide-react";

const nodeTypes = { dagNode: DagNode };
const MAX_NODES = 25;

interface MiniDagPreviewProps {
  definition: unknown;
  height?: number;
}

function MiniDagContent({ definition, height = 120 }: MiniDagPreviewProps) {
  const dagDef = definition as DagDefinition | null;

  const layout = useMemo(() => {
    if (!dagDef?.nodes?.length) return null;

    // Performance safeguard: limit node count
    const limitedDef: DagDefinition =
      dagDef.nodes.length > MAX_NODES
        ? {
            nodes: dagDef.nodes.slice(0, MAX_NODES),
            edges: dagDef.edges.filter(
              (e) =>
                dagDef.nodes
                  .slice(0, MAX_NODES)
                  .some((n) => n.id === e.from) &&
                dagDef.nodes
                  .slice(0, MAX_NODES)
                  .some((n) => n.id === e.to),
            ),
          }
        : dagDef;

    try {
      return autoLayout(limitedDef, {
        horizontalSpacing: 140,
        verticalSpacing: 80,
      });
    } catch {
      return null;
    }
  }, [dagDef]);

  if (!dagDef?.nodes?.length || !layout) {
    return (
      <div
        className="flex items-center justify-center bg-muted/30 rounded-md"
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
          <GitBranch className="size-5" />
          <span className="text-[9px]">No DAG</span>
        </div>
      </div>
    );
  }

  // Strip descriptions for compact rendering
  const compactNodes: Node[] = layout.nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      description: undefined,
    },
  }));

  return (
    <div className="rounded-md overflow-hidden bg-slate-50/50" style={{ height }}>
      <ReactFlow
        nodes={compactNodes}
        edges={layout.edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
        className="pointer-events-none"
      />
    </div>
  );
}

export function MiniDagPreview(props: MiniDagPreviewProps) {
  return (
    <ReactFlowProvider>
      <MiniDagContent {...props} />
    </ReactFlowProvider>
  );
}
