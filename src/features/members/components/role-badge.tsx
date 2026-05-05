import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: "OWNER" | "ADMIN" | "MEMBER";
}

const roleConfig: Record<
  string,
  { label: string; className: string }
> = {
  OWNER: {
    label: "Owner",
    className:
      "bg-amber-500/15 text-amber-700 border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  },
  ADMIN: {
    label: "Admin",
    className:
      "bg-blue-500/15 text-blue-700 border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  },
  MEMBER: {
    label: "Member",
    className:
      "bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  },
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = roleConfig[role] ?? roleConfig.MEMBER;

  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] font-semibold uppercase tracking-wider", config.className)}
    >
      {config.label}
    </Badge>
  );
}
