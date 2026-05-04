import { useCallback, useState, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Plus,
  Save,
  Loader2,
  Trash2,
  Zap,
  Globe,
  Code,
  ArrowLeftRight,
  History,
  Check,
  RotateCcw,
  Pencil,
  Power,
  Eye,
} from "lucide-react";
import { DagNode } from "./dag-node";
import {
  useCreateVersion,
  useActivateVersion,
} from "../hooks/use-workflow-mutations";
import type { DagDefinition, DagNode as DagNodeType } from "../types";
import type { VersionDataDto } from "@/api/generated/models";

interface DAGEditorProps {
  workflowId: string;
  /** The initial DAG definition to load (from active version) */
  initialDefinition?: DagDefinition | null;
  /** List of all versions for the history panel */
  versions?: VersionDataDto[];
  /** Currently active version number */
  activeVersionNumber?: number;
  /** Callback after save succeeds */
  onSaveSuccess?: () => void;
  /** If true, DAG is view-only (no add/edit/delete/save) */
  readOnly?: boolean;
}

/** Data stored in each React Flow node */
interface DagNodeData {
  label: string;
  nodeType: string;
  config?: Record<string, unknown>;
  status?: string;
  [key: string]: unknown;
}

const nodeTypes = {
  dagNode: DagNode,
};

const NODE_TYPE_OPTIONS = [
  { value: "trigger", label: "Trigger", icon: Zap, description: "Start point" },
  {
    value: "http",
    label: "HTTP Request",
    icon: Globe,
    description: "API call",
  },
  { value: "script", label: "Script", icon: Code, description: "Run code" },
  {
    value: "transform",
    label: "Transform",
    icon: ArrowLeftRight,
    description: "Transform data",
  },
] as const;

const DEFAULT_EDGE_STYLE = {
  stroke: "#94a3b8",
  strokeWidth: 2,
};

const HORIZONTAL_SPACING = 200;
const VERTICAL_SPACING = 120;

let nodeCounter = 0;

/**
 * Auto-layout: positions nodes in a vertical top-to-bottom layout
 * using Kahn's topological ordering.
 */
function autoLayout(definition: DagDefinition): {
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
          label: dagNode?.id ?? nodeId,
          nodeType: dagNode?.type ?? "unknown",
          config: dagNode?.config,
          status: "PENDING",
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
    style: DEFAULT_EDGE_STYLE,
  }));

  return { nodes: flowNodes, edges: flowEdges };
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function DAGEditor({
  workflowId,
  initialDefinition,
  versions = [],
  activeVersionNumber,
  onSaveSuccess,
  readOnly = false,
}: DAGEditorProps) {
  const { mutate, isPending, organizationId } = useCreateVersion(workflowId);
  const activateMutation = useActivateVersion(workflowId);

  // Compute initial layout from the active version's definition
  const initialLayout = useMemo(() => {
    if (!initialDefinition || !initialDefinition.nodes?.length) return null;
    try {
      return autoLayout(initialDefinition);
    } catch {
      return null;
    }
  }, [initialDefinition]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(
    initialLayout?.nodes ?? [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    initialLayout?.edges ?? [],
  );
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [newNodeId, setNewNodeId] = useState("");
  const [newNodeType, setNewNodeType] = useState("http");
  const [isDirty, setIsDirty] = useState(false);

  // Edit node state
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editNodeId, setEditNodeId] = useState("");
  const [editNodeType, setEditNodeType] = useState("");

  // Track changes — filter out internal React Flow changes (dimension
  // measurements, selection toggles) that don't represent user edits.
  const handleNodesChange: typeof onNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      const hasMeaningfulChange = changes.some(
        (c) => c.type !== "dimensions" && c.type !== "select",
      );
      if (hasMeaningfulChange) setIsDirty(true);
    },
    [onNodesChange],
  );

  const handleEdgesChange: typeof onEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      const hasMeaningfulChange = changes.some((c) => c.type !== "select");
      if (hasMeaningfulChange) setIsDirty(true);
    },
    [onEdgesChange],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      setIsDirty(true);
    },
    [setEdges],
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodesArr }: { nodes: Node[] }) => {
      setSelectedNodes(selectedNodesArr.map((n) => n.id));
    },
    [],
  );

  /** Open the edit dialog when double-clicking a node */
  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const data = node.data as DagNodeData;
      setEditingNode(node);
      setEditNodeId(node.id);
      setEditNodeType(data.nodeType);
    },
    [],
  );

  /** Apply edits to the node */
  const handleEditNode = () => {
    if (!editingNode) return;

    const newId = editNodeId.trim();
    if (!newId) return;

    const oldId = editingNode.id;
    const idChanged = newId !== oldId;

    // Check duplicate ID (only if changed)
    if (idChanged && nodes.some((n) => n.id === newId)) return;

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== oldId) return n;
        return {
          ...n,
          id: newId,
          data: {
            ...n.data,
            label: newId,
            nodeType: editNodeType,
          },
        };
      }),
    );

    // Update edges if ID changed
    if (idChanged) {
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          id:
            e.source === oldId || e.target === oldId
              ? `${e.source === oldId ? newId : e.source}-${e.target === oldId ? newId : e.target}`
              : e.id,
          source: e.source === oldId ? newId : e.source,
          target: e.target === oldId ? newId : e.target,
        })),
      );
    }

    setIsDirty(true);
    setEditingNode(null);
  };

  const handleAddNode = () => {
    const nodeId = newNodeId.trim() || `node_${++nodeCounter}`;

    if (nodes.some((n) => n.id === nodeId)) return;

    const dagNode: DagNodeType = {
      id: nodeId,
      type: newNodeType,
      config: {},
    };

    const lastNode = nodes[nodes.length - 1];
    const position = lastNode
      ? { x: lastNode.position.x, y: lastNode.position.y + VERTICAL_SPACING }
      : { x: 0, y: 0 };

    const flowNode: Node = {
      id: dagNode.id,
      type: "dagNode",
      position,
      data: {
        label: dagNode.id,
        nodeType: dagNode.type,
        config: dagNode.config,
        status: "PENDING",
      },
    };

    setNodes((nds) => [...nds, flowNode]);
    setIsDirty(true);
    setNewNodeId("");
    setNewNodeType("http");
    setAddNodeOpen(false);
  };

  const handleDeleteSelected = () => {
    setNodes((nds) => nds.filter((n) => !selectedNodes.includes(n.id)));
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !selectedNodes.includes(e.source) &&
          !selectedNodes.includes(e.target),
      ),
    );
    setSelectedNodes([]);
    setIsDirty(true);
  };

  /** Restore a specific version's DAG into the editor */
  const handleRestoreVersion = (version: VersionDataDto) => {
    const def = version.definition as unknown as DagDefinition | null;
    if (!def || !def.nodes?.length) return;

    try {
      const layout = autoLayout(def);
      setNodes(layout.nodes);
      setEdges(layout.edges);
      setIsDirty(true);
    } catch {
      // ignore invalid definitions
    }
  };

  /** Activate a specific version */
  const handleActivateVersion = (versionId: string) => {
    activateMutation.mutate({
      organizationId,
      workflowId,
      versionId,
    });
  };

  const handleSave = () => {
    if (nodes.length === 0) return;

    const definition: DagDefinition = {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: (n.data as DagNodeData).nodeType,
        config: (n.data as DagNodeData).config,
      })),
      edges: edges.map((e) => ({
        from: e.source,
        to: e.target,
      })),
    };

    mutate(
      {
        organizationId,
        workflowId,
        data: { definition },
      },
      {
        onSuccess: (response) => {
          setIsDirty(false);

          // Auto-activate the newly created version.
          // Backend returns { data: { version: { id } } }
          const res = response as unknown as {
            data?: { version?: { id?: string } };
          };
          const newVersionId = res?.data?.version?.id;
          if (newVersionId) {
            activateMutation.mutate({
              organizationId,
              workflowId,
              versionId: newVersionId,
            });
          }

          onSaveSuccess?.();
        },
      },
    );
  };

  // Reset node counter based on existing nodes
  useEffect(() => {
    const maxNum = nodes.reduce((max, n) => {
      const match = n.id.match(/^node_(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    if (maxNum > nodeCounter) nodeCounter = maxNum;
  }, [nodes]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          {/* Add Node — edit mode only */}
          {!readOnly && (
            <Popover open={addNodeOpen} onOpenChange={setAddNodeOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus className="size-4" />
                  Add Node
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Add Node</h4>
                    <p className="text-xs text-muted-foreground">
                      Add a new step to the workflow.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="node-id" className="text-xs">
                      Node ID
                    </Label>
                    <Input
                      id="node-id"
                      value={newNodeId}
                      onChange={(e) => setNewNodeId(e.target.value)}
                      placeholder={`node_${nodeCounter + 1}`}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Node Type</Label>
                    <Select value={newNodeType} onValueChange={setNewNodeType}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NODE_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <opt.icon className="size-3.5 text-muted-foreground" />
                              <span>{opt.label}</span>
                              <span className="text-xs text-muted-foreground">
                                — {opt.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleAddNode}
                    className="w-full"
                    disabled={
                      newNodeId.trim() !== "" &&
                      nodes.some((n) => n.id === newNodeId.trim())
                    }
                  >
                    <Plus className="size-4 mr-1" />
                    Add to Graph
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Edit Selected (single node) — edit mode only */}
          {!readOnly && selectedNodes.length === 1 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => {
                      const node = nodes.find((n) => n.id === selectedNodes[0]);
                      if (node) {
                        const data = node.data as DagNodeData;
                        setEditingNode(node);
                        setEditNodeId(node.id);
                        setEditNodeType(data.nodeType);
                      }
                    }}
                  >
                    <Pencil className="size-4" />
                    Edit Node
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit selected node</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Delete Selected — edit mode only */}
          {!readOnly && selectedNodes.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="size-4" />
                    Delete ({selectedNodes.length})
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Delete selected nodes and their connections
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* View Only badge */}
          {readOnly && (
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-700 border-blue-500/20 text-xs"
            >
              <Eye className="size-3 mr-1" />
              View Only
            </Badge>
          )}

          {/* Stats */}
          <span className="text-xs text-muted-foreground ml-2">
            {nodes.length} node{nodes.length !== 1 ? "s" : ""} · {edges.length}{" "}
            edge{edges.length !== 1 ? "s" : ""}
            {activeVersionNumber != null && (
              <span className="ml-2">· v{activeVersionNumber}</span>
            )}
          </span>

          {!readOnly && isDirty && (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-xs ml-1"
            >
              Unsaved changes
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Version History */}
          {versions.length > 0 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <History className="size-4" />
                  History
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 ml-0.5"
                  >
                    {versions.length}
                  </Badge>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-80 sm:w-96">
                <SheetHeader>
                  <SheetTitle>Version History</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)] px-4">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium">
                            v{v.version}
                          </span>
                          {v.isActive && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] px-1.5"
                            >
                              <Check className="size-2.5 mr-0.5" />
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {v.creator.name} · {formatDate(v.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Activate version — edit mode only */}
                        {!readOnly && !v.isActive && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                                  onClick={() => handleActivateVersion(v.id)}
                                  disabled={activateMutation.isPending}
                                >
                                  {activateMutation.isPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Power className="size-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Set as active version
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {/* Restore to editor — edit mode only */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-primary"
                                onClick={() => handleRestoreVersion(v)}
                              >
                                <RotateCcw className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Restore to editor</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Save — edit mode only */}
          {!readOnly && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending || nodes.length === 0 || !isDirty}
              className="gap-1.5"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save
            </Button>
          )}
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 min-h-0 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : handleNodesChange}
          onEdgesChange={readOnly ? undefined : handleEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          onSelectionChange={readOnly ? undefined : onSelectionChange}
          onNodeDoubleClick={readOnly ? undefined : onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
          selectionOnDrag={!readOnly}
          proOptions={{ hideAttribution: true }}
          className="bg-slate-50/50"
          defaultEdgeOptions={{
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#94a3b8",
            },
            style: DEFAULT_EDGE_STYLE,
          }}
        >
          <Controls className="!shadow-md !border !rounded-lg" />
          <MiniMap
            nodeStrokeWidth={3}
            className="!shadow-md !border !rounded-lg"
            maskColor="rgba(0, 0, 0, 0.05)"
          />
          <Background gap={20} size={1} color="#e2e8f0" />
        </ReactFlow>

        {/* Empty state hint */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-2 text-muted-foreground">
              <p className="text-sm font-medium">
                Start building your workflow
              </p>
              <p className="text-xs">
                Click <strong>&quot;Add Node&quot;</strong> to add steps, then
                drag between handles to connect them.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Node Dialog */}
      <Dialog
        open={!!editingNode}
        onOpenChange={(open) => !open && setEditingNode(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Node</DialogTitle>
            <DialogDescription>
              Change the ID or type of this node. Double-click any node to edit
              it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-node-id" className="text-sm">
                Node ID
              </Label>
              <Input
                id="edit-node-id"
                value={editNodeId}
                onChange={(e) => setEditNodeId(e.target.value)}
                className="h-9"
              />
              {editNodeId.trim() !== "" &&
                editNodeId.trim() !== editingNode?.id &&
                nodes.some((n) => n.id === editNodeId.trim()) && (
                  <p className="text-xs text-destructive">
                    A node with this ID already exists.
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Node Type</Label>
              <Select value={editNodeType} onValueChange={setEditNodeType}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NODE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="size-3.5 text-muted-foreground" />
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground">
                          — {opt.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNode(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditNode}
              disabled={
                !editNodeId.trim() ||
                (editNodeId.trim() !== editingNode?.id &&
                  nodes.some((n) => n.id === editNodeId.trim()))
              }
            >
              <Pencil className="size-4 mr-1.5" />
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
