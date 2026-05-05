import { useNavigate } from "react-router-dom";
import { Plus, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 text-xs"
        onClick={() => navigate("/workflows")}
      >
        <LayoutList className="size-3" />
        Workflows
      </Button>
      <Button
        id="create-workflow-button"
        className="h-8 gap-1 text-xs"
        onClick={() => navigate("/workflows")}
      >
        <Plus className="size-3" />
        New Workflow
      </Button>
    </div>
  );
}
