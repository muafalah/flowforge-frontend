import { useQuery } from '@tanstack/react-query';

export type Workflow = {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  createdAt: string;
};

// Mock function for Orval generated hook since we don't have the real OpenAPI spec
export const getWorkflows = async (): Promise<Workflow[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return [
    { id: '1', name: 'Data Pipeline A', status: 'completed', createdAt: new Date().toISOString() },
    { id: '2', name: 'ETL Job B', status: 'running', createdAt: new Date().toISOString() },
    { id: '3', name: 'Report Generation', status: 'failed', createdAt: new Date().toISOString() },
  ];
};

export const useGetWorkflows = () => {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: getWorkflows,
  });
};
