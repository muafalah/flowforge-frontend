import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface ActivityLogToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  action: string;
  onActionChange: (value: string) => void;
  targetType: string;
  onTargetTypeChange: (value: string) => void;
}

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "member.added", label: "Member Added" },
  { value: "member.removed", label: "Member Removed" },
  { value: "member.role_updated", label: "Role Updated" },
  { value: "ownership.transferred", label: "Ownership Transferred" },
  { value: "organization.updated", label: "Org Updated" },
  { value: "organization.deleted", label: "Org Deleted" },
  { value: "workflow.created", label: "Workflow Created" },
  { value: "workflow.updated", label: "Workflow Updated" },
  { value: "workflow.deleted", label: "Workflow Deleted" },
  { value: "version.created", label: "Version Created" },
  { value: "version.activated", label: "Version Activated" },
  { value: "run.triggered", label: "Run Triggered" },
  { value: "run.completed", label: "Run Completed" },
  { value: "run.failed", label: "Run Failed" },
  { value: "run.cancelled", label: "Run Cancelled" },
];

const TARGET_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "member", label: "Member" },
  { value: "organization", label: "Organization" },
  { value: "workflow", label: "Workflow" },
  { value: "version", label: "Version" },
  { value: "run", label: "Run" },
];

export function ActivityLogToolbar({
  search,
  onSearchChange,
  action,
  onActionChange,
  targetType,
  onTargetTypeChange,
}: ActivityLogToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="activity-log-search"
          placeholder="Search by target name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Action filter */}
      <Select value={action || "all"} onValueChange={(val) => onActionChange(val === "all" ? "" : val)}>
        <SelectTrigger id="activity-log-action-filter" className="w-full sm:w-[180px]">
          <SelectValue placeholder="All Actions" />
        </SelectTrigger>
        <SelectContent>
          {ACTION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Target type filter */}
      <Select value={targetType || "all"} onValueChange={(val) => onTargetTypeChange(val === "all" ? "" : val)}>
        <SelectTrigger id="activity-log-type-filter" className="w-full sm:w-[160px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          {TARGET_TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
