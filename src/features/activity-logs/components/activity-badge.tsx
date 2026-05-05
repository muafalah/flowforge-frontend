import { cn } from "@/lib/utils";

interface ActivityBadgeProps {
  action: string;
  className?: string;
}

const ACTION_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  // Members
  "member.added": {
    label: "Member Added",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-600 dark:text-blue-400",
  },
  "member.removed": {
    label: "Member Removed",
    bgClass: "bg-red-500/10",
    textClass: "text-red-600 dark:text-red-400",
  },
  "member.role_updated": {
    label: "Role Updated",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-600 dark:text-amber-400",
  },
  "ownership.transferred": {
    label: "Ownership Transferred",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-600 dark:text-purple-400",
  },
  // Organization
  "organization.updated": {
    label: "Org Updated",
    bgClass: "bg-teal-500/10",
    textClass: "text-teal-600 dark:text-teal-400",
  },
  "organization.deleted": {
    label: "Org Deleted",
    bgClass: "bg-red-500/10",
    textClass: "text-red-600 dark:text-red-400",
  },
  // Workflows
  "workflow.created": {
    label: "Workflow Created",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-600 dark:text-emerald-400",
  },
  "workflow.updated": {
    label: "Workflow Updated",
    bgClass: "bg-sky-500/10",
    textClass: "text-sky-600 dark:text-sky-400",
  },
  "workflow.deleted": {
    label: "Workflow Deleted",
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-600 dark:text-rose-400",
  },
  // Versions
  "version.created": {
    label: "Version Created",
    bgClass: "bg-indigo-500/10",
    textClass: "text-indigo-600 dark:text-indigo-400",
  },
  "version.activated": {
    label: "Version Activated",
    bgClass: "bg-violet-500/10",
    textClass: "text-violet-600 dark:text-violet-400",
  },
  // Runs
  "run.triggered": {
    label: "Run Triggered",
    bgClass: "bg-cyan-500/10",
    textClass: "text-cyan-600 dark:text-cyan-400",
  },
  "run.completed": {
    label: "Run Completed",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-600 dark:text-emerald-400",
  },
  "run.failed": {
    label: "Run Failed",
    bgClass: "bg-red-500/10",
    textClass: "text-red-600 dark:text-red-400",
  },
  "run.cancelled": {
    label: "Run Cancelled",
    bgClass: "bg-orange-500/10",
    textClass: "text-orange-600 dark:text-orange-400",
  },
};

const DEFAULT_CONFIG = {
  label: "Unknown",
  bgClass: "bg-gray-500/10",
  textClass: "text-gray-600 dark:text-gray-400",
};

export function ActivityBadge({ action, className }: ActivityBadgeProps) {
  const config = ACTION_CONFIG[action] ?? DEFAULT_CONFIG;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap",
        config.bgClass,
        config.textClass,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
