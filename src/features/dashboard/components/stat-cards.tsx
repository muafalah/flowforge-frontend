import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutGrid,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatSparkline } from "./stat-sparkline";
import type { DashboardStats } from "../types/dashboard";

interface StatCardsProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function StatCards({ stats, isLoading }: StatCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const sparklineData = (stats?.hourlyRuns ?? []).map((h) => ({
    hour: h.hour,
    value: h.success + h.failed,
  }));

  const successSparkline = (stats?.hourlyRuns ?? []).map((h) => ({
    hour: h.hour,
    value: h.success,
  }));

  const cards = [
    {
      title: "Active Runs",
      value: stats?.activeRuns ?? 0,
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      sparkline: null,
      pulse: (stats?.activeRuns ?? 0) > 0,
    },
    {
      title: "Total Runs (24h)",
      value: stats?.totalRuns24h ?? 0,
      icon: LayoutGrid,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      sparkline: sparklineData,
      sparklineColor: "#8b5cf6",
    },
    {
      title: "Success Rate",
      value: `${stats?.successRate24h ?? 0}%`,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      sparkline: successSparkline,
      sparklineColor: "#10b981",
    },
    {
      title: "Failed (24h)",
      value: stats?.failedCount24h ?? 0,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      sparkline: null,
    },
    {
      title: "Avg Duration",
      value: stats ? formatDuration(stats.avgDurationMs24h) : "-",
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      sparkline: null,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="relative overflow-hidden transition-shadow hover:shadow-md"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-1.5 ${card.bgColor}`}>
              <card.icon className={`size-3.5 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight">
                {card.value}
              </span>
              {"pulse" in card && card.pulse && (
                <span className="relative flex size-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-blue-500" />
                </span>
              )}
            </div>
            {card.sparkline && card.sparkline.length > 0 && (
              <div className="mt-2">
                <StatSparkline
                  data={card.sparkline}
                  color={"sparklineColor" in card ? (card.sparklineColor as string) : "#3b82f6"}
                  height={36}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
