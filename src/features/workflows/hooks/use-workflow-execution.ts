import { useEffect, useState, useCallback, useRef } from "react";
import { socketService } from "@/services/socket";
import type {
  NodeStatusMap,
  NodeExecutionStatus,
  WorkflowRunUpdate,
} from "../types";

interface UseWorkflowExecutionOptions {
  /** If false, will not connect. Useful for conditional subscription. */
  enabled?: boolean;
}

interface UseWorkflowExecutionReturn {
  /** Map of nodeId → execution status */
  nodeStatuses: NodeStatusMap;
  /** Whether the WebSocket is currently connected */
  isConnected: boolean;
  /** Reset all node statuses back to PENDING */
  resetStatuses: (nodeIds: string[]) => void;
  /** Manually set a node's status (for simulation/testing) */
  setNodeStatus: (nodeId: string, status: NodeExecutionStatus) => void;
}

/**
 * Hook that subscribes to real-time workflow execution updates via Socket.io.
 * Maintains a map of node ID → execution status for DAG coloring.
 */
export function useWorkflowExecution(
  workflowId: string,
  options: UseWorkflowExecutionOptions = {},
): UseWorkflowExecutionReturn {
  const { enabled = true } = options;

  const [nodeStatuses, setNodeStatuses] = useState<NodeStatusMap>({});
  const [isConnected, setIsConnected] = useState(
    () => socketService.isConnected,
  );
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !workflowId) return;

    // Connect and join the workflow's room
    socketService.connect();
    socketService.joinRoom(`workflow-run-updates:${workflowId}`);

    // Track connection state
    const unsubConnect = socketService.on("connect", () => {
      setIsConnected(true);
    });

    const unsubDisconnect = socketService.on("disconnect", () => {
      setIsConnected(false);
    });

    // Listen for run updates
    const unsubUpdate = socketService.on<WorkflowRunUpdate>(
      "workflow-run-updates",
      (update) => {
        if (update.workflowId === workflowId) {
          setNodeStatuses((prev) => ({
            ...prev,
            [update.nodeId]: update.status,
          }));
        }
      },
    );

    unsubscribeRef.current = () => {
      unsubConnect();
      unsubDisconnect();
      unsubUpdate();
      socketService.leaveRoom(`workflow-run-updates:${workflowId}`);
    };

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [workflowId, enabled]);

  const resetStatuses = useCallback((nodeIds: string[]) => {
    const reset: NodeStatusMap = {};
    nodeIds.forEach((id) => {
      reset[id] = "PENDING";
    });
    setNodeStatuses(reset);
  }, []);

  const setNodeStatus = useCallback(
    (nodeId: string, status: NodeExecutionStatus) => {
      setNodeStatuses((prev) => ({ ...prev, [nodeId]: status }));
    },
    [],
  );

  return {
    nodeStatuses,
    isConnected,
    resetStatuses,
    setNodeStatus,
  };
}
