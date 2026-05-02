import { WorkflowList } from '@/features/workflows/WorkflowList'
import { WorkflowDAG } from '@/features/workflows/WorkflowDAG'

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Flowforge Dashboard</h1>
          <p className="text-muted-foreground">Manage and visualize your workflows.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Workflow List */}
          <div className="flex flex-col gap-8">
            <WorkflowList />
          </div>

          {/* Right Column: DAG Visualization */}
          <div className="flex flex-col gap-8">
            <WorkflowDAG />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
