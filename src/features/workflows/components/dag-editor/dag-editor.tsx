import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import {
  ReactFlow, Controls, Background, MiniMap,
  useNodesState, useEdgesState, addEdge, reconnectEdge, MarkerType,
  type Connection, type Node, type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCreateVersion, useActivateVersion } from "../../hooks/use-workflow-mutations";
import type { DagDefinition, DagNode as DagNodeType } from "../../types";
import type { VersionDataDto } from "@/api/generated/models";
import type {
  DAGEditorProps, DagNodeData, NodeSettings, NodeRunResult,
  WorkflowRunResult, WorkflowNodeResult, ExecutionContext,
} from "./types";
import {
  nodeTypes, DEFAULT_CONFIGS, DEFAULT_NODE_SETTINGS,
  DEFAULT_EDGE_STYLE, VERTICAL_SPACING,
} from "./constants";
import { autoLayout, buildConditionalEdgeProps, generateNodeId } from "./utils/auto-layout";
import { executeNodeByType } from "./utils/execution-engine";
import { computeBackoffDelay, sleep } from "./utils/execution-engine";
import { EditorToolbar } from "./components/editor-toolbar";
import { AddNodeSheet } from "./components/add-node-sheet";
import { EditNodeSheet } from "./components/edit-node-sheet";
import { WorkflowRunSheet } from "./components/workflow-run-sheet";

export function DAGEditor({
  workflowId, initialDefinition, versions = [],
  activeVersionNumber, onSaveSuccess, readOnly = false,
}: DAGEditorProps) {
  const { mutate, isPending, organizationId } = useCreateVersion(workflowId);
  const activateMutation = useActivateVersion(workflowId);

  const initialLayout = useMemo(() => {
    if (!initialDefinition || !initialDefinition.nodes?.length) return null;
    try { return autoLayout(initialDefinition); } catch { return null; }
  }, [initialDefinition]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialLayout?.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialLayout?.edges ?? []);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeDescription, setNewNodeDescription] = useState("");
  const [newNodeType, setNewNodeType] = useState("http_call");
  const [newNodeConfig, setNewNodeConfig] = useState<Record<string, unknown>>(() => ({ ...DEFAULT_CONFIGS["http_call"] }));
  const [newNodeSettings, setNewNodeSettings] = useState<NodeSettings>(() => ({ ...DEFAULT_NODE_SETTINGS }));
  const [isDirty, setIsDirty] = useState(false);

  // Sync nodes/edges when initialLayout arrives asynchronously (e.g. API data)
  // Only sync if the user hasn't made manual edits yet.
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (initialLayout && !isDirty) {
      setNodes(initialLayout.nodes);
      setEdges(initialLayout.edges);
      hasLoadedRef.current = true;
    }
  }, [initialLayout, isDirty, setNodes, setEdges]);

  // Workflow execution state
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [workflowRunResult, setWorkflowRunResult] = useState<WorkflowRunResult | null>(null);
  const [workflowRunSheetOpen, setWorkflowRunSheetOpen] = useState(false);
  const workflowRunAbortRef = useRef(false);

  // Edit node state
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editNodeName, setEditNodeName] = useState("");
  const [editNodeDescription, setEditNodeDescription] = useState("");
  const [editNodeType, setEditNodeType] = useState("");
  const [editNodeConfig, setEditNodeConfig] = useState<Record<string, unknown>>({});
  const [editNodeSettings, setEditNodeSettings] = useState<NodeSettings>(() => ({ ...DEFAULT_NODE_SETTINGS }));

  // Node execution state
  const [nodeRunResult, setNodeRunResult] = useState<NodeRunResult | null>(null);
  const [nodeRunning, setNodeRunning] = useState(false);

  const handleRunNode = useCallback(async () => {
    if (!editingNode || nodeRunning) return;
    const nodeId = editingNode.id;
    setNodeRunning(true);
    setNodeRunResult(null);
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: "RUNNING" } } : n));
    const result = await executeNodeByType(editNodeType, editNodeConfig);
    setNodeRunResult(result);
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: result.status } } : n));
    setNodeRunning(false);
  }, [editingNode, nodeRunning, editNodeType, editNodeConfig, setNodes]);

  const prevEditingNodeId = editingNode?.id;
  useMemo(() => {
    setNodeRunResult(null);
    setNodeRunning(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevEditingNodeId]);

  // Add Node run state
  const [addNodeRunResult, setAddNodeRunResult] = useState<NodeRunResult | null>(null);
  const [addNodeRunning, setAddNodeRunning] = useState(false);

  const handleRunNewNode = useCallback(async () => {
    if (addNodeRunning) return;
    setAddNodeRunning(true);
    setAddNodeRunResult(null);
    const startedAt = new Date().toISOString();
    const result = await executeNodeByType(newNodeType, newNodeConfig);
    setAddNodeRunResult({ ...result, startedAt });
    setAddNodeRunning(false);
  }, [addNodeRunning, newNodeType, newNodeConfig]);

  /** Run the entire workflow */
  const handleRunWorkflow = useCallback(async () => {
    if (workflowRunning || nodes.length === 0) return;
    workflowRunAbortRef.current = false;
    setWorkflowRunning(true);
    setWorkflowRunSheetOpen(true);

    const workflowStartTime = performance.now();
    const workflowStartedAt = new Date().toISOString();
    const nodeResults: WorkflowNodeResult[] = [];

    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: "PENDING" } })));
    setEdges((eds) => eds.map((e) => {
      const edgeData = e.data as Record<string, unknown> | undefined;
      const condition = edgeData?.condition as string | undefined;
      if (condition === "true" || condition === "false") {
        return { ...e, animated: false, ...buildConditionalEdgeProps(condition) };
      }
      return { ...e, animated: false, style: DEFAULT_EDGE_STYLE };
    }));

    // Topological sort
    const inDegree: Record<string, number> = {};
    const adjacency: Record<string, string[]> = {};
    nodes.forEach((n) => { inDegree[n.id] = 0; adjacency[n.id] = []; });
    edges.forEach((e) => {
      inDegree[e.target] = (inDegree[e.target] ?? 0) + 1;
      adjacency[e.source] = [...(adjacency[e.source] ?? []), e.target];
    });

    const queue = nodes.filter((n) => (inDegree[n.id] ?? 0) === 0).map((n) => n.id);
    const layers: string[][] = [];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const layer = [...queue]; layers.push(layer); queue.length = 0;
      for (const nodeId of layer) {
        visited.add(nodeId);
        for (const neighbor of adjacency[nodeId] ?? []) {
          inDegree[neighbor]--;
          if (inDegree[neighbor] === 0 && !visited.has(neighbor)) queue.push(neighbor);
        }
      }
    }
    const orphans = nodes.filter((n) => !visited.has(n.id)).map((n) => n.id);
    if (orphans.length > 0) layers.push(orphans);

    let hasFailure = false;
    const context: { variables: Record<string, unknown>; inputs: unknown[] } = { variables: {}, inputs: [] };
    const skippedByBranch = new Set<string>();

    const collectReachable = (startIds: string[]): Set<string> => {
      const reachable = new Set<string>();
      const q = [...startIds];
      while (q.length > 0) {
        const id = q.pop()!;
        if (reachable.has(id)) continue;
        reachable.add(id);
        for (const neighbor of adjacency[id] ?? []) q.push(neighbor);
      }
      return reachable;
    };

    for (const layer of layers) {
      if (workflowRunAbortRef.current) break;
      if (hasFailure) {
        for (const nodeId of layer) {
          const node = nodes.find((n) => n.id === nodeId);
          const data = node?.data as DagNodeData | undefined;
          nodeResults.push({
            nodeId, nodeName: String(data?.label ?? nodeId), nodeType: data?.nodeType ?? "unknown",
            status: "FAILED", durationMs: 0, output: { skipped: true, reason: "Previous node failed" },
            logs: [{ timestamp: new Date().toISOString(), level: "warn", message: "Skipped: previous node failed" }],
          });
          setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: "FAILED" } } : n));
        }
        continue;
      }

      const activeLayer = layer.filter((nodeId) => {
        if (!skippedByBranch.has(nodeId)) return true;
        const node = nodes.find((n) => n.id === nodeId);
        const data = node?.data as DagNodeData | undefined;
        nodeResults.push({
          nodeId, nodeName: String(data?.label ?? nodeId), nodeType: data?.nodeType ?? "unknown",
          status: "SKIPPED", durationMs: 0, output: { skipped: true, reason: "Conditional branch not taken" },
          logs: [{ timestamp: new Date().toISOString(), level: "warn", message: "Skipped: conditional branch not taken" }],
        });
        setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: "FAILED" } } : n));
        setEdges((eds) => eds.map((e) => {
          if (e.target === nodeId) {
            return { ...e, animated: false, style: { ...DEFAULT_EDGE_STYLE, stroke: "#94a3b8", opacity: 0.4 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" } };
          }
          return e;
        }));
        return false;
      });

      if (activeLayer.length === 0) continue;

      setEdges((eds) => eds.map((e) => {
        if (activeLayer.includes(e.target)) {
          return { ...e, animated: true, style: { ...DEFAULT_EDGE_STYLE, stroke: "#f59e0b", strokeWidth: 2.5 } };
        }
        return e;
      }));
      setNodes((nds) => nds.map((n) => activeLayer.includes(n.id) ? { ...n, data: { ...n.data, status: "RUNNING" } } : n));

      const layerResults = await Promise.all(activeLayer.map(async (nodeId) => {
        const node = nodes.find((n) => n.id === nodeId);
        const data = node?.data as DagNodeData | undefined;
        const nodeType = data?.nodeType ?? "unknown";
        const config = (data?.config as Record<string, unknown>) ?? {};
        const nodeSettings = data?.settings as NodeSettings | undefined;
        const incomingEdges = edges.filter((e) => e.target === nodeId);
        const inputs = incomingEdges.map((e) => { const pr = nodeResults.find((r) => r.nodeId === e.source); return pr?.output; });
        const executionContext: ExecutionContext = { variables: context.variables, inputs };
        const execConfig = { ...config };
        if (nodeSettings?.enabled && nodeSettings.timeoutOverrideMs > 0) execConfig.timeoutMs = nodeSettings.timeoutOverrideMs;

        let result = await executeNodeByType(nodeType, execConfig, executionContext);
        let retryCount = 0;

        if (result.status === "FAILED" && nodeSettings?.enabled && nodeSettings.onError === "retry") {
          const maxRetries = nodeSettings.maxRetries;
          while (retryCount < maxRetries && result.status === "FAILED") {
            if (workflowRunAbortRef.current) break;
            retryCount++;
            const delay = computeBackoffDelay(nodeSettings, retryCount);
            setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: "RUNNING" } } : n));
            await sleep(delay);
            result = await executeNodeByType(nodeType, execConfig, executionContext);
          }
        }

        let finalStatus: "SUCCESS" | "FAILED" | "SKIPPED" = result.status;
        const allLogs = [...result.logs];

        if (result.status === "FAILED" && nodeSettings?.enabled) {
          if (nodeSettings.onError === "skip") {
            finalStatus = "SKIPPED";
            allLogs.push({ timestamp: new Date().toISOString(), level: "warn", message: "Node failed but error strategy is SKIP — continuing workflow." });
          } else if (nodeSettings.onError === "retry" && retryCount > 0) {
            allLogs.push({ timestamp: new Date().toISOString(), level: "error", message: `Node failed after ${retryCount} retry attempt(s).` });
          }
        }
        if (retryCount > 0 && finalStatus === "SUCCESS") {
          allLogs.push({ timestamp: new Date().toISOString(), level: "info", message: `Node succeeded after ${retryCount} retry attempt(s).` });
        }

        if (nodeType === "set_variable" && result.status === "SUCCESS") {
          const out = result.output as { variableName: string; value: unknown };
          context.variables[out.variableName] = out.value;
        }

        if (nodeType === "conditional" && finalStatus === "SUCCESS") {
          const condOutput = result.output as { conditionMet: boolean; selectedBranch: string };
          const conditionMet = condOutput.conditionMet;
          const outEdges = edges.filter((e) => e.source === nodeId);
          const inactiveBranch = conditionMet ? "false" : "true";
          const inactiveTargets: string[] = [];
          const activeTargets: string[] = [];
          for (const e of outEdges) {
            const ed = e.data as Record<string, unknown> | undefined;
            const cond = ed?.condition as string | undefined;
            if (cond === inactiveBranch) inactiveTargets.push(e.target);
            else activeTargets.push(e.target);
          }
          if (inactiveTargets.length > 0) {
            const inactiveReachable = collectReachable(inactiveTargets);
            const activeReachable = collectReachable(activeTargets);
            for (const nId of inactiveReachable) { if (!activeReachable.has(nId)) skippedByBranch.add(nId); }
          }
          allLogs.push({ timestamp: new Date().toISOString(), level: "info", message: `Branching → ${conditionMet ? "True" : "False"} path selected` });
        }

        return { nodeId, nodeName: String(data?.label ?? nodeId), nodeType, status: finalStatus, durationMs: result.durationMs, output: result.output, logs: allLogs, retryCount: retryCount > 0 ? retryCount : undefined };
      }));

      for (const result of layerResults) {
        nodeResults.push(result);
        setNodes((nds) => nds.map((n) => n.id === result.nodeId ? { ...n, data: { ...n.data, status: result.status === "SKIPPED" ? "FAILED" : result.status } } : n));
        const edgeColor = result.status === "SUCCESS" ? "#10b981" : result.status === "SKIPPED" ? "#f59e0b" : "#ef4444";
        setEdges((eds) => eds.map((e) => {
          if (e.target === result.nodeId) return { ...e, animated: false, style: { ...DEFAULT_EDGE_STYLE, stroke: edgeColor, strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor } };
          return e;
        }));
        if (result.status === "FAILED") hasFailure = true;
      }
    }

    const totalDurationMs = Math.round(performance.now() - workflowStartTime);
    const overallStatus: WorkflowRunResult["status"] = workflowRunAbortRef.current ? "ABORTED" : hasFailure ? "FAILED" : "SUCCESS";
    setWorkflowRunResult({
      status: overallStatus, totalDurationMs, startedAt: workflowStartedAt, nodeResults,
      totalNodes: nodes.length, successCount: nodeResults.filter((r) => r.status === "SUCCESS").length,
      failedCount: nodeResults.filter((r) => r.status === "FAILED").length,
      skippedCount: nodeResults.filter((r) => r.status === "SKIPPED").length,
    });
    setWorkflowRunning(false);
  }, [workflowRunning, nodes, edges, setNodes, setEdges]);

  const handleStopWorkflow = useCallback(() => { workflowRunAbortRef.current = true; }, []);

  const handleNodesChange: typeof onNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    if (changes.some((c) => c.type !== "dimensions" && c.type !== "select")) setIsDirty(true);
  }, [onNodesChange]);

  const handleEdgesChange: typeof onEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);
    if (changes.some((c) => c.type !== "select")) setIsDirty(true);
  }, [onEdgesChange]);

  const onConnect = useCallback((params: Connection) => {
    const sourceNode = nodes.find((n) => n.id === params.source);
    const sourceData = sourceNode?.data as DagNodeData | undefined;
    if (sourceData?.nodeType === "conditional" && params.sourceHandle) {
      const condition = params.sourceHandle === "source-true" ? "true" : "false";
      setEdges((eds) => addEdge({ ...params, ...buildConditionalEdgeProps(condition) }, eds));
    } else {
      setEdges((eds) => addEdge(params, eds));
    }
    setIsDirty(true);
  }, [setEdges, nodes]);

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    setIsDirty(true);
  }, [setEdges]);

  const onSelectionChange = useCallback(({ nodes: sn, edges: se }: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodes(sn.map((n) => n.id));
    setSelectedEdges(se.map((e) => e.id));
  }, []);

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const data = node.data as DagNodeData;
    setEditingNode(node); setEditNodeName(String(data.label ?? ""));
    setEditNodeDescription(String(data.description ?? "")); setEditNodeType(data.nodeType);
    setEditNodeConfig({ ...(data.config as Record<string, unknown>) });
    setEditNodeSettings({ ...DEFAULT_NODE_SETTINGS, ...(data.settings ?? {}) });
  }, []);

  const handleEditNode = () => {
    if (!editingNode) return;
    const name = editNodeName.trim();
    if (!name) return;
    setNodes((nds) => nds.map((n) => {
      if (n.id !== editingNode.id) return n;
      return { ...n, data: { ...n.data, label: name, description: editNodeDescription.trim() || undefined, nodeType: editNodeType, config: editNodeConfig, settings: editNodeSettings.enabled ? editNodeSettings : undefined } };
    }));
    setIsDirty(true); setEditingNode(null);
  };

  const handleAddNode = () => {
    const name = newNodeName.trim();
    if (!name) return;
    const nodeId = generateNodeId();
    const dagNode: DagNodeType = { id: nodeId, name, description: newNodeDescription.trim() || undefined, type: newNodeType, config: { ...newNodeConfig } };
    const lastNode = nodes[nodes.length - 1];
    const position = lastNode ? { x: lastNode.position.x, y: lastNode.position.y + VERTICAL_SPACING } : { x: 0, y: 0 };
    const flowNode: Node = { id: dagNode.id, type: "dagNode", position, data: { label: dagNode.name, description: dagNode.description, nodeType: dagNode.type, config: dagNode.config, settings: newNodeSettings.enabled ? { ...newNodeSettings } : undefined, status: "PENDING" } };
    setNodes((nds) => [...nds, flowNode]); setIsDirty(true);
    setNewNodeName(""); setNewNodeDescription(""); setNewNodeType("http_call");
    setNewNodeConfig({ ...DEFAULT_CONFIGS["http_call"] }); setNewNodeSettings({ ...DEFAULT_NODE_SETTINGS });
    setAddNodeOpen(false);
  };

  const handleDeleteSelected = () => {
    setNodes((nds) => nds.filter((n) => !selectedNodes.includes(n.id)));
    setEdges((eds) => eds.filter((e) => !selectedEdges.includes(e.id) && !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target)));
    setSelectedNodes([]); setSelectedEdges([]); setIsDirty(true);
  };

  const handleRestoreVersion = (version: VersionDataDto) => {
    const def = version.definition as unknown as DagDefinition | null;
    if (!def || !def.nodes?.length) return;
    try { const layout = autoLayout(def); setNodes(layout.nodes); setEdges(layout.edges); setIsDirty(true); } catch { /* ignore */ }
  };

  const handleActivateVersion = (versionId: string) => {
    activateMutation.mutate({ organizationId, workflowId, versionId });
  };

  const handleSave = () => {
    if (nodes.length === 0) return;
    const definition: DagDefinition = {
      nodes: nodes.map((n) => {
        const data = n.data as DagNodeData;
        return { id: n.id, name: String(data.label ?? n.id), description: data.description ? String(data.description) : undefined, type: data.nodeType, config: data.settings?.enabled ? { ...data.config, __settings: data.settings } : data.config };
      }),
      edges: edges.map((e) => {
        const edgeData = e.data as Record<string, unknown> | undefined;
        const condition = edgeData?.condition as string | undefined;
        return { from: e.source, to: e.target, ...(condition ? { condition } : {}) };
      }),
    };
    mutate({ organizationId, workflowId, data: { definition: definition as unknown as import("@/api/generated/models").DagDefinitionDto } }, {
      onSuccess: (response) => {
        setIsDirty(false);
        const res = response as unknown as { data?: { version?: { id?: string } } };
        const newVersionId = res?.data?.version?.id;
        if (newVersionId) activateMutation.mutate({ organizationId, workflowId, versionId: newVersionId });
        onSaveSuccess?.();
      },
    });
  };

  const handleEditSelected = () => {
    const node = nodes.find((n) => n.id === selectedNodes[0]);
    if (node) {
      const data = node.data as DagNodeData;
      setEditingNode(node); setEditNodeName(String(data.label ?? ""));
      setEditNodeDescription(String(data.description ?? "")); setEditNodeType(data.nodeType);
      setEditNodeConfig({ ...(data.config as Record<string, unknown>) });
      setEditNodeSettings({ ...DEFAULT_NODE_SETTINGS, ...(data.settings ?? {}) });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar
        readOnly={readOnly} nodes={nodes} edges={edges}
        selectedNodes={selectedNodes} selectedEdges={selectedEdges}
        isDirty={isDirty} isPending={isPending}
        activeVersionNumber={activeVersionNumber} versions={versions}
        workflowRunning={workflowRunning} activateMutation={activateMutation}
        onAddNodeOpen={() => setAddNodeOpen(true)} onEditSelected={handleEditSelected}
        onDeleteSelected={handleDeleteSelected} onSave={handleSave}
        onRunWorkflow={handleRunWorkflow} onStopWorkflow={handleStopWorkflow}
        onRestoreVersion={handleRestoreVersion} onActivateVersion={handleActivateVersion}
      />

      {!readOnly && (
        <AddNodeSheet
          open={addNodeOpen} onOpenChange={setAddNodeOpen}
          newNodeName={newNodeName} setNewNodeName={setNewNodeName}
          newNodeDescription={newNodeDescription} setNewNodeDescription={setNewNodeDescription}
          newNodeType={newNodeType} setNewNodeType={setNewNodeType}
          newNodeConfig={newNodeConfig} setNewNodeConfig={setNewNodeConfig}
          newNodeSettings={newNodeSettings} setNewNodeSettings={setNewNodeSettings}
          onAddNode={handleAddNode}
          addNodeRunResult={addNodeRunResult} addNodeRunning={addNodeRunning}
          onRunNewNode={handleRunNewNode}
          setAddNodeRunResult={setAddNodeRunResult} setAddNodeRunning={setAddNodeRunning}
        />
      )}

      {/* React Flow Canvas */}
      <div className="flex-1 min-h-0 relative">
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={readOnly ? undefined : handleNodesChange}
          onEdgesChange={readOnly ? undefined : handleEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          onReconnect={readOnly ? undefined : onReconnect}
          onSelectionChange={readOnly ? undefined : onSelectionChange}
          onNodeDoubleClick={readOnly ? undefined : onNodeDoubleClick}
          nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.3 }}
          nodesDraggable={!readOnly} nodesConnectable={!readOnly}
          elementsSelectable={!readOnly} selectionOnDrag={!readOnly}
          proOptions={{ hideAttribution: true }} className="bg-slate-50/50"
          defaultEdgeOptions={{ animated: false, markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" }, style: DEFAULT_EDGE_STYLE }}
        >
          <Controls className="!shadow-md !border !rounded-lg" />
          <MiniMap nodeStrokeWidth={3} className="!shadow-md !border !rounded-lg" maskColor="rgba(0, 0, 0, 0.05)" />
          <Background gap={20} size={1} color="#e2e8f0" />
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-2 text-muted-foreground">
              <p className="text-sm font-medium">Start building your workflow</p>
              <p className="text-xs">Click <strong>&quot;Add Node&quot;</strong> to add steps, then drag between handles to connect them.</p>
            </div>
          </div>
        )}
      </div>

      <EditNodeSheet
        editingNode={editingNode} setEditingNode={setEditingNode}
        editNodeName={editNodeName} setEditNodeName={setEditNodeName}
        editNodeDescription={editNodeDescription} setEditNodeDescription={setEditNodeDescription}
        editNodeType={editNodeType} setEditNodeType={setEditNodeType}
        editNodeConfig={editNodeConfig} setEditNodeConfig={setEditNodeConfig}
        editNodeSettings={editNodeSettings} setEditNodeSettings={setEditNodeSettings}
        onEditNode={handleEditNode}
        nodeRunResult={nodeRunResult} nodeRunning={nodeRunning} onRunNode={handleRunNode}
      />

      <WorkflowRunSheet
        open={workflowRunSheetOpen} onOpenChange={setWorkflowRunSheetOpen}
        workflowRunning={workflowRunning} workflowRunResult={workflowRunResult}
        onStopWorkflow={handleStopWorkflow}
        onRunAgain={() => { setWorkflowRunResult(null); handleRunWorkflow(); }}
      />
    </div>
  );
}
