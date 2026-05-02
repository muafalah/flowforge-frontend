import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetWorkflows, type Workflow } from '@/api/generated/workflows/workflows';
import { wsService } from '@/services/websocket';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


// Simple mock badge component since we didn't install shadcn badge
const StatusBadge = ({ status }: { status: Workflow['status'] }) => {
  const colors = {
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
      {status.toUpperCase()}
    </span>
  );
};

export function WorkflowList() {
  const queryClient = useQueryClient();
  const { data: workflows, isLoading, isError, error } = useGetWorkflows();

  useEffect(() => {
    wsService.connect();

    const unsubscribe = wsService.listen('workflow:update', (updatedWorkflow: Workflow) => {
      // Invalidate or update React Query cache on WebSocket event
      queryClient.setQueryData(['workflows'], (old: Workflow[] | undefined) => {
        if (!old) return old;
        return old.map(wf => wf.id === updatedWorkflow.id ? updatedWorkflow : wf);
      });
    });

    return () => {
      unsubscribe();
      wsService.cleanup();
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6 text-red-600">
          Failed to load workflows: {error instanceof Error ? error.message : 'Unknown error'}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflows</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows?.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell className="font-medium">{workflow.id}</TableCell>
                <TableCell>{workflow.name}</TableCell>
                <TableCell>
                  <StatusBadge status={workflow.status} />
                </TableCell>
                <TableCell>{new Date(workflow.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {!workflows?.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No workflows found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
