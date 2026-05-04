import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkflowDataDtoStatus } from "@/api/generated/models";

interface WorkflowStatusBadgeProps {
  status: WorkflowDataDtoStatus;
  className?: string;
}

const statusConfig: Record<
  WorkflowDataDtoStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className:
      "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/15",
  },
  DRAFT: {
    label: "Draft",
    className:
      "bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/15",
  },
};

export function WorkflowStatusBadge({
  status,
  className,
}: WorkflowStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.DRAFT;
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium text-xs px-2.5 py-0.5 transition-colors",
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
